import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileCode2,
  FileSpreadsheet,
  Landmark,
  Save,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge, Card, EmptyState, PillTabs } from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { apiRequest, formatVnd, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { AzJournalAndTaxTabs } from './AzJournalAndTaxTabs';
import { HrmTimesheetSkeleton } from './PayrollSkeleton';
import {
  calculateAzPayrollSheet,
  computeAzComplianceAlerts,
  exportAzBankUncExcel,
  exportAzPayrollAndBhxhExcel,
  hydrateAzWorkspaceFromApi,
  type AzAccountingRegime,
  type AzCalculatedRow,
  type AzEmployeePeriodAdjustment,
  type AzHydratedBundle,
  type AzPersistedWorkspaceState,
  type AzPitRegimeKey,
} from './accountingAzEngine';
import {
  PAYROLL_SHARED_INPUT_STYLE,
  PAYROLL_SHARED_LABEL_STYLE,
  type PayrollConfigDto,
  type PayrollPeriodDto,
  type PayrollSlipDto,
} from './payrollTypes';

type AzWorkspaceTabKey =
  | 'overview'
  | 'payroll_bhxh'
  | 'journal'
  | 'labor_book'
  | 'tax_xml';

export interface HrmAccountingAzWorkspaceProps {
  embedded?: boolean;
  initialPeriodKey?: string;
}

export const HrmAccountingAzWorkspace: React.FC<HrmAccountingAzWorkspaceProps> = ({
  embedded = false,
  initialPeriodKey,
}) => {
  const { token, tenantSlug, companyName, tenantSettings } = useAuth();
  const brandLogoUrl =
    typeof tenantSettings?.brand_logo_url === 'string' ? tenantSettings.brand_logo_url : '';

  const [clock] = useState(() => {
    const now = new Date();
    return {
      ym: now.toISOString().slice(0, 7),
      todayIso: now.toISOString().slice(0, 10),
    };
  });

  const [periodKey, setPeriodKey] = useState<string>(initialPeriodKey || clock.ym);
  const [activeTab, setActiveTab] = useState<AzWorkspaceTabKey>('overview');
  const [sheetSubView, setSheetSubView] = useState<'payroll' | 'bhxh' | 'unc'>('payroll');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [bundle, setBundle] = useState<AzHydratedBundle | null>(null);
  const [editingRow, setEditingRow] = useState<AzCalculatedRow | null>(null);
  const [adjDraft, setAdjDraft] = useState<AzEmployeePeriodAdjustment>({});

  const loadAzWorkspace = useCallback(
    async (targetPeriod: string) => {
      try {
        const [azRaw, cfgFallback, periodsFallback] = await Promise.all([
          apiRequest<unknown>(
            `/payroll/accounting-az?period_key=${encodeURIComponent(targetPeriod)}`,
            { token, tenantSlug }
          ).catch(() => null),
          apiRequest<PayrollConfigDto>('/payroll/config', { token, tenantSlug }).catch(() => null),
          apiRequest<PayrollPeriodDto[]>('/payroll/periods', { token, tenantSlug }).catch(() => []),
        ]);

        let fallbackSlips: PayrollSlipDto[] = [];
        const matchedPeriod = Array.isArray(periodsFallback)
          ? periodsFallback.find((p) => p.period_key === targetPeriod) || periodsFallback[0]
          : undefined;
        if (matchedPeriod && (!azRaw || typeof azRaw !== 'object')) {
          const detail = await apiRequest<{ slips?: PayrollSlipDto[] }>(
            `/payroll/periods/${matchedPeriod.id}`,
            { token, tenantSlug }
          ).catch(() => null);
          if (Array.isArray(detail?.slips)) {
            fallbackSlips = detail.slips;
          }
        }

        const hydrated = hydrateAzWorkspaceFromApi(
          azRaw,
          cfgFallback,
          fallbackSlips,
          companyName,
          brandLogoUrl,
          targetPeriod
        );
        setBundle(hydrated);
      } finally {
        setLoading(false);
      }
    },
    [token, tenantSlug, companyName, brandLogoUrl]
  );

  useEffect(() => {
    void loadAzWorkspace(periodKey);
  }, [loadAzWorkspace, periodKey]);

  const persistAzWorkspace = useCallback(
    async (nextState: AzPersistedWorkspaceState, showToastMessage?: string) => {
      setSaving(true);
      try {
        await apiRequest('/payroll/accounting-az', {
          method: 'PUT',
          token,
          tenantSlug,
          body: {
            period_key: periodKey,
            accounting_regime: nextState.accounting_regime,
            pit_regime: nextState.pit_regime,
            tax_rule_mode: nextState.pit_regime,
            sop_checklist: nextState.sop_checklist,
            adjustments: nextState.adjustments,
            workspace_state: nextState,
          },
        });
        if (showToastMessage) {
          toast.success(showToastMessage);
        }
      } catch (err) {
        if (showToastMessage) {
          toast.error(getErrorMessage(err, 'Không thể lưu trạng thái Kế toán A-Z lên máy chủ.'));
        }
      } finally {
        setSaving(false);
      }
    },
    [token, tenantSlug, periodKey]
  );

  const handlePatchWorkspace = useCallback(
    (patch: Partial<AzPersistedWorkspaceState>) => {
      setBundle((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          workspace_state: {
            ...prev.workspace_state,
            ...patch,
          },
        };
      });
    },
    []
  );

  const calculatedRows = useMemo(
    () => (bundle ? calculateAzPayrollSheet(bundle) : []),
    [bundle]
  );

  const complianceAlerts = useMemo(
    () => (bundle ? computeAzComplianceAlerts(bundle, clock.todayIso) : []),
    [bundle, clock.todayIso]
  );

  const totals = useMemo(() => {
    const gross = calculatedRows.reduce((s, r) => s + r.gross_pay_vnd, 0);
    const net = calculatedRows.reduce((s, r) => s + r.net_pay_vnd, 0);
    const empIns = calculatedRows.reduce((s, r) => s + r.emp_insurance_total_vnd, 0);
    const erIns = calculatedRows.reduce((s, r) => s + r.er_insurance_total_vnd, 0);
    const kpcd = calculatedRows.reduce((s, r) => s + r.er_kpcd_vnd, 0);
    const pit = calculatedRows.reduce((s, r) => s + r.pit_tax_vnd, 0);
    const employerCost = calculatedRows.reduce((s, r) => s + r.total_employer_cost_vnd, 0);
    return { gross, net, empIns, erIns, kpcd, pit, employerCost };
  }, [calculatedRows]);

  const chartData = useMemo(
    () => [
      { name: 'Thực lĩnh Net', value: totals.net },
      { name: 'BHXH/YT/TN NLĐ', value: totals.empIns },
      { name: 'BHXH & KPCĐ DN', value: totals.erIns + totals.kpcd },
      { name: 'Thuế TNCN', value: totals.pit },
    ],
    [totals]
  );

  const handleToggleSopStep = (stepId: string) => {
    if (!bundle) return;
    const nextChecklist = bundle.workspace_state.sop_checklist.map((st) =>
      st.id === stepId ? { ...st, done: !st.done } : st
    );
    const nextWs: AzPersistedWorkspaceState = {
      ...bundle.workspace_state,
      sop_checklist: nextChecklist,
    };
    setBundle({ ...bundle, workspace_state: nextWs });
    void persistAzWorkspace(nextWs);
  };

  const handleSaveEmployeeAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bundle || !editingRow) return;
    const matchedSlip = bundle.slips.find((s) => s.employee_id === editingRow.employee.id);
    if (matchedSlip) {
      await apiRequest(`/payroll/slips/${matchedSlip.id}`, {
        method: 'PATCH',
        token,
        tenantSlug,
        body: {
          actual_workdays: adjDraft.actual_workdays ?? editingRow.actual_workdays,
          overtime_hours: adjDraft.overtime_hours ?? editingRow.overtime_hours,
          bonus_vnd: adjDraft.bonus_vnd ?? editingRow.bonus_vnd,
          commission_pay_vnd: adjDraft.commission_pay_vnd ?? editingRow.commission_pay_vnd,
          advance_deduction_vnd:
            adjDraft.advance_deduction_vnd ?? editingRow.advance_deduction_vnd,
        },
      }).catch(() => null);
    }
    const nextWs: AzPersistedWorkspaceState = {
      ...bundle.workspace_state,
      adjustments: {
        ...bundle.workspace_state.adjustments,
        [editingRow.employee.id]: adjDraft,
      },
    };
    setBundle({ ...bundle, workspace_state: nextWs });
    setEditingRow(null);
    await persistAzWorkspace(
      nextWs,
      `Đã cập nhật & tính lại lương/thuế cho ${editingRow.employee.full_name}!`
    );
  };

  if (loading || !bundle) {
    return <HrmTimesheetSkeleton />;
  }

  const ws = bundle.workspace_state;
  const doneSopCount = ws.sop_checklist.filter((s) => s.done).length;

  return (
    <div style={{ background: '#F8F9FA', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      {/* Workspace Header */}
      <Card
        padding="1.25rem 1.5rem"
        style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)' }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                background: '#EEF2FF',
                border: '1px solid #DBEAFE',
                color: '#1E40FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Building2 size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: embedded ? '1.06rem' : '1.16rem', fontWeight: 800, color: '#0F172A' }}>
                  Không Gian Kế Toán Tiền Lương, Bảo Hiểm & Quyết Toán Thuế A-Z
                </h1>
                <Badge tone="primary">{ws.accounting_regime}</Badge>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 3 }}>
                Pháp nhân: <strong style={{ color: '#0F172A' }}>{bundle.legal_entity.legal_entity_name}</strong>
                {bundle.legal_entity.tax_code ? ` • MST: ${bundle.legal_entity.tax_code}` : ''}
                {bundle.legal_entity.tax_authority_code
                  ? ` • CQT: ${bundle.legal_entity.tax_authority_code}`
                  : ''}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="month"
              value={periodKey}
              onChange={(e) => setPeriodKey(e.target.value)}
              style={{ ...PAYROLL_SHARED_INPUT_STYLE, width: 155, fontWeight: 700 }}
            />

            <select
              value={ws.pit_regime}
              onChange={(e) =>
                handlePatchWorkspace({ pit_regime: e.target.value as AzPitRegimeKey })
              }
              style={{ ...PAYROLL_SHARED_INPUT_STYLE, width: 225, fontWeight: 700 }}
            >
              <option value="vn_7_brackets">Thuế TNCN 7 bậc (11tr / 4,4tr)</option>
              <option value="vn_5_brackets_2026">Thuế TNCN 5 bậc 2026 (15,5tr / 6,2tr)</option>
              <option value="tenant_config">Theo cấu hình Thuế của Doanh nghiệp</option>
            </select>

            <select
              value={ws.accounting_regime}
              onChange={(e) =>
                handlePatchWorkspace({ accounting_regime: e.target.value as AzAccountingRegime })
              }
              style={{ ...PAYROLL_SHARED_INPUT_STYLE, width: 140, fontWeight: 700 }}
            >
              <option value="TT200">Thông tư 200</option>
              <option value="TT133">Thông tư 133</option>
            </select>

            <button
              type="button"
              disabled={saving}
              onClick={() =>
                void persistAzWorkspace(ws, `Đã lưu cấu hình & điều chỉnh Kế toán A-Z kỳ ${periodKey}!`)
              }
              style={{
                height: 44,
                padding: '0 1.2rem',
                borderRadius: 12,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.84rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <Save size={15} /> {saving ? 'Đang lưu...' : 'Lưu Sổ Kế Toán'}
            </button>
          </div>
        </div>
      </Card>

      {/* 5 Sub-Tabs */}
      <PillTabs<AzWorkspaceTabKey>
        activeKey={activeTab}
        onChange={setActiveTab}
        tabs={[
          {
            key: 'overview',
            label: 'Tổng quan & Checklist SOP',
            icon: <ClipboardCheck size={15} />,
            count: complianceAlerts.length,
          },
          {
            key: 'payroll_bhxh',
            label: 'Bảng lương & Bảo hiểm BHXH',
            icon: <Wallet size={15} />,
            count: calculatedRows.length,
          },
          {
            key: 'journal',
            label: `Sổ Nhật ký Hạch toán ${ws.accounting_regime}`,
            icon: <BookOpen size={15} />,
          },
          {
            key: 'labor_book',
            label: 'Sổ Quản lý Lao động',
            icon: <Users size={15} />,
          },
          {
            key: 'tax_xml',
            label: 'Tờ khai 05/KK-TNCN & Quyết toán 05/QTT-TNCN (XML/Excel)',
            icon: <FileCode2 size={15} />,
          },
        ]}
      />

      {/* SUB-TAB 1: OVERVIEW & SOP CHECKLIST */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '1rem',
            }}
          >
            <Card padding="1.05rem 1.25rem">
              <div style={{ fontSize: '0.73rem', fontWeight: 800, color: '#64748B' }}>
                TỔNG CHI PHÍ NHÂN SỰ DOANH NGHIỆP
              </div>
              <div style={{ fontSize: '1.42rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
                {formatVnd(totals.employerCost)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                Quỹ Gross: {formatVnd(totals.gross)} • {calculatedRows.length} nhân sự
              </div>
            </Card>

            <Card padding="1.05rem 1.25rem">
              <div style={{ fontSize: '0.73rem', fontWeight: 800, color: '#64748B' }}>
                THỰC LĨNH CHUYỂN KHOẢN (TK 334 → 112)
              </div>
              <div style={{ fontSize: '1.42rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>
                {formatVnd(totals.net)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                Sẵn sàng kết xuất lô Ủy nhiệm chi UNC
              </div>
            </Card>

            <Card padding="1.05rem 1.25rem">
              <div style={{ fontSize: '0.73rem', fontWeight: 800, color: '#64748B' }}>
                PHẢI NỘP BHXH, BHYT, BHTN & KPCĐ
              </div>
              <div style={{ fontSize: '1.42rem', fontWeight: 800, color: '#1E40FF', marginTop: 4 }}>
                {formatVnd(totals.empIns + totals.erIns + totals.kpcd)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                NLĐ 10.5%: {formatVnd(totals.empIns)} • DN+KPCĐ: {formatVnd(totals.erIns + totals.kpcd)}
              </div>
            </Card>

            <Card padding="1.05rem 1.25rem">
              <div style={{ fontSize: '0.73rem', fontWeight: 800, color: '#64748B' }}>
                THUẾ TNCN PHẢI NỘP (TK 3335)
              </div>
              <div style={{ fontSize: '1.42rem', fontWeight: 800, color: '#D97706', marginTop: 4 }}>
                {formatVnd(totals.pit)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                Lên tờ khai 05/KK-TNCN & 05/QTT-TNCN
              </div>
            </Card>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '1.2rem',
            }}
          >
            {/* Interactive 7-Step SOP Checklist */}
            <Card
              title="Quy Trình Chuẩn SOP Đóng Kỳ Lương & Thuế Hàng Tháng"
              subtitle={`Hoàn thành ${doneSopCount}/${ws.sop_checklist.length} bước kiểm soát nội bộ`}
              actions={
                <Badge tone={doneSopCount === ws.sop_checklist.length ? 'success' : 'primary'}>
                  {Math.round((doneSopCount / Math.max(1, ws.sop_checklist.length)) * 100)}%
                </Badge>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ws.sop_checklist.map((step) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => handleToggleSopStep(step.id)}
                    style={{
                      textAlign: 'left',
                      padding: '0.75rem 0.95rem',
                      borderRadius: 12,
                      border: step.done ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
                      background: step.done ? '#ECFDF5' : '#F8FAFF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                    }}
                  >
                    <CheckCircle2
                      size={18}
                      color={step.done ? '#059669' : '#94A3B8'}
                      style={{ marginTop: 2, flexShrink: 0 }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: '0.83rem',
                          fontWeight: 700,
                          color: step.done ? '#065F46' : '#0F172A',
                        }}
                      >
                        {step.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                        {step.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Right Column: Compliance Alerts + Cost Structure Chart */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <Card
                title="Cảnh Báo Tuân Thủ Hồ Sơ Thuế, Ngân Hàng & Hợp Đồng"
                subtitle="Rà soát tự động hợp đồng hết hạn, thiếu MST cá nhân và thiếu tài khoản UNC"
              >
                {complianceAlerts.length === 0 ? (
                  <div
                    style={{
                      padding: '1rem',
                      borderRadius: 12,
                      background: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      color: '#065F46',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <ShieldCheck size={18} />
                    <span>100% hồ sơ nhân sự trong kỳ đã đầy đủ MST, tài khoản ngân hàng & hợp đồng!</span>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      maxHeight: 220,
                      overflowY: 'auto',
                    }}
                  >
                    {complianceAlerts.map((al) => (
                      <div
                        key={al.id}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 10,
                          background:
                            al.severity === 'danger'
                              ? '#FEF2F2'
                              : al.severity === 'warning'
                                ? '#FFFBEB'
                                : '#EFF6FF',
                          border:
                            al.severity === 'danger'
                              ? '1px solid #FECACA'
                              : al.severity === 'warning'
                                ? '1px solid #FDE68A'
                                : '1px solid #BFDBFE',
                          fontSize: '0.79rem',
                          color: '#0F172A',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <AlertTriangle
                          size={15}
                          color={
                            al.severity === 'danger'
                              ? '#DC2626'
                              : al.severity === 'warning'
                                ? '#D97706'
                                : '#1E40FF'
                          }
                          style={{ flexShrink: 0 }}
                        />
                        <span>
                          <strong>
                            {al.employee_name} ({al.employee_code}):
                          </strong>{' '}
                          {al.message}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card title="Cơ Cấu Phân Bổ Quỹ Lương & Nghĩa Vụ Phải Nộp">
                <div style={{ width: '100%', height: 205 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 12, left: 8, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
                      <YAxis
                        tickFormatter={(v: number) =>
                          v >= 1_000_000 ? `${Math.round(v / 1_000_000)}M` : String(v)
                        }
                        tick={{ fontSize: 11, fill: '#64748B' }}
                      />
                      <Tooltip formatter={(val) => formatVnd(Number(val || 0))} />
                      <Bar dataKey="value" fill="#1E40FF" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: PAYROLL SHEET, BHXH RECONCILIATION & BANK UNC */}
      {activeTab === 'payroll_bhxh' && (
        <Card
          title={`Bảng Lương Chi Tiết, Đối Soát BHXH & Lô Ủy Nhiệm Chi UNC Kỳ ${periodKey}`}
          subtitle="Bấm vào bất kỳ dòng nhân sự nào để điều chỉnh công thực tế, tăng ca OT, thưởng, hoa hồng hoặc khấu trừ tạm ứng"
          actions={
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  exportAzPayrollAndBhxhExcel(bundle.legal_entity, periodKey, calculatedRows);
                  toast.success('Đã xuất file Excel Bảng lương & Đối soát BHXH (2 sheets)!');
                }}
                style={{
                  height: 38,
                  padding: '0 0.95rem',
                  borderRadius: 10,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#059669',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <FileSpreadsheet size={15} /> Xuất Excel Lương + BHXH
              </button>

              <button
                type="button"
                onClick={() => {
                  exportAzBankUncExcel(periodKey, calculatedRows, ws.unc_transfer_note);
                  toast.success('Đã xuất danh sách chi lương Ngân hàng UNC (.xlsx)!');
                }}
                style={{
                  height: 38,
                  padding: '0 1rem',
                  borderRadius: 10,
                  border: 'none',
                  background: '#1E40FF',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <Landmark size={15} /> Xuất Lô UNC Ngân Hàng
              </button>
            </div>
          }
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
              marginBottom: '1rem',
            }}
          >
            <PillTabs<'payroll' | 'bhxh' | 'unc'>
              activeKey={sheetSubView}
              onChange={setSheetSubView}
              tabs={[
                { key: 'payroll', label: 'Bảng tính lương & Thuế TNCN' },
                { key: 'bhxh', label: 'Đối soát BHXH (8%/17.5%) • BHYT • BHTN • KPCĐ' },
                { key: 'unc', label: 'Danh sách chuyển khoản Ngân hàng (UNC)' },
              ]}
            />

            {sheetSubView === 'unc' && (
              <input
                type="text"
                value={ws.unc_transfer_note}
                onChange={(e) => handlePatchWorkspace({ unc_transfer_note: e.target.value })}
                placeholder="Nội dung chuyển khoản UNC..."
                style={{ ...PAYROLL_SHARED_INPUT_STYLE, width: 290, height: 38 }}
              />
            )}
          </div>

          {calculatedRows.length === 0 ? (
            <EmptyState
              title="Chưa có dữ liệu nhân sự tính lương trong kỳ này"
              description="Khởi tạo kỳ lương tại tab Bảng lương tháng hoặc đồng bộ hồ sơ nhân sự từ HRM."
            />
          ) : sheetSubView === 'payroll' ? (
            <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 14 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '9px 10px', textAlign: 'left' }}>Nhân sự</th>
                    <th style={{ padding: '9px 10px', textAlign: 'center' }}>Công</th>
                    <th style={{ padding: '9px 10px', textAlign: 'right' }}>Lương theo công</th>
                    <th style={{ padding: '9px 10px', textAlign: 'right' }}>PC + OT + Thưởng</th>
                    <th style={{ padding: '9px 10px', textAlign: 'right' }}>Tổng Gross</th>
                    <th style={{ padding: '9px 10px', textAlign: 'right' }}>BHXH NLĐ</th>
                    <th style={{ padding: '9px 10px', textAlign: 'left' }}>Phương pháp Thuế</th>
                    <th style={{ padding: '9px 10px', textAlign: 'right' }}>Thuế TNCN</th>
                    <th style={{ padding: '9px 10px', textAlign: 'right' }}>Thực lĩnh Net</th>
                  </tr>
                </thead>
                <tbody>
                  {calculatedRows.map((r) => (
                    <tr
                      key={r.employee.id}
                      onClick={() => {
                        setEditingRow(r);
                        setAdjDraft(
                          ws.adjustments[r.employee.id] || {
                            actual_workdays: r.actual_workdays,
                            overtime_hours: r.overtime_hours,
                            bonus_vnd: r.bonus_vnd,
                            commission_pay_vnd: r.commission_pay_vnd,
                            advance_deduction_vnd: r.advance_deduction_vnd,
                            dependents_override: r.dependents_count,
                          }
                        );
                      }}
                      style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }}
                    >
                      <td style={{ padding: '9px 10px' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{r.employee.full_name}</div>
                        <div style={{ fontSize: '0.73rem', color: '#64748B' }}>
                          {r.employee.employee_code}
                          {r.employee.department_name ? ` • ${r.employee.department_name}` : ''}
                        </div>
                      </td>
                      <td style={{ padding: '9px 10px', textAlign: 'center' }}>
                        <Badge tone="info">
                          {r.actual_workdays}/{r.standard_workdays}
                        </Badge>
                      </td>
                      <td style={{ padding: '9px 10px', textAlign: 'right' }}>
                        {formatVnd(r.prorated_base_pay_vnd)}
                      </td>
                      <td style={{ padding: '9px 10px', textAlign: 'right', color: '#1E40FF' }}>
                        {formatVnd(r.allowances_vnd + r.ot_pay_vnd + r.commission_pay_vnd + r.bonus_vnd)}
                      </td>
                      <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700 }}>
                        {formatVnd(r.gross_pay_vnd)}
                      </td>
                      <td style={{ padding: '9px 10px', textAlign: 'right' }}>
                        -{formatVnd(r.emp_insurance_total_vnd)}
                      </td>
                      <td style={{ padding: '9px 10px' }}>
                        <Badge tone="neutral">{r.tax_method_label}</Badge>
                      </td>
                      <td style={{ padding: '9px 10px', textAlign: 'right', color: '#D97706', fontWeight: 700 }}>
                        -{formatVnd(r.pit_tax_vnd)}
                      </td>
                      <td style={{ padding: '9px 10px', textAlign: 'right', color: '#059669', fontWeight: 800 }}>
                        {formatVnd(r.net_pay_vnd)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : sheetSubView === 'bhxh' ? (
            <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 14 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '9px 10px', textAlign: 'left' }}>Nhân sự</th>
                    <th style={{ padding: '9px 10px', textAlign: 'right' }}>Lương đóng BH</th>
                    <th style={{ padding: '9px 10px', textAlign: 'right' }}>BHXH NLĐ 8%</th>
                    <th style={{ padding: '9px 10px', textAlign: 'right' }}>BHYT NLĐ 1.5%</th>
                    <th style={{ padding: '9px 10px', textAlign: 'right' }}>BHTN NLĐ 1%</th>
                    <th style={{ padding: '9px 10px', textAlign: 'right' }}>BHXH DN 17.5%</th>
                    <th style={{ padding: '9px 10px', textAlign: 'right' }}>BHYT DN 3%</th>
                    <th style={{ padding: '9px 10px', textAlign: 'right' }}>BHTN DN 1%</th>
                    <th style={{ padding: '9px 10px', textAlign: 'right' }}>KPCĐ 2%</th>
                    <th style={{ padding: '9px 10px', textAlign: 'right' }}>Tổng trích nộp</th>
                  </tr>
                </thead>
                <tbody>
                  {calculatedRows.map((r) => (
                    <tr key={r.employee.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '9px 10px', fontWeight: 700 }}>{r.employee.full_name}</td>
                      <td style={{ padding: '9px 10px', textAlign: 'right' }}>{formatVnd(r.bhxh_base_vnd)}</td>
                      <td style={{ padding: '9px 10px', textAlign: 'right' }}>{formatVnd(r.emp_bhxh_vnd)}</td>
                      <td style={{ padding: '9px 10px', textAlign: 'right' }}>{formatVnd(r.emp_bhyt_vnd)}</td>
                      <td style={{ padding: '9px 10px', textAlign: 'right' }}>{formatVnd(r.emp_bhtn_vnd)}</td>
                      <td style={{ padding: '9px 10px', textAlign: 'right' }}>{formatVnd(r.er_bhxh_vnd)}</td>
                      <td style={{ padding: '9px 10px', textAlign: 'right' }}>{formatVnd(r.er_bhyt_vnd)}</td>
                      <td style={{ padding: '9px 10px', textAlign: 'right' }}>{formatVnd(r.er_bhtn_vnd)}</td>
                      <td style={{ padding: '9px 10px', textAlign: 'right' }}>{formatVnd(r.er_kpcd_vnd)}</td>
                      <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 800, color: '#1E40FF' }}>
                        {formatVnd(r.emp_insurance_total_vnd + r.er_insurance_total_vnd + r.er_kpcd_vnd)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 14 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '9px 10px', textAlign: 'left' }}>Người thụ hưởng</th>
                    <th style={{ padding: '9px 10px', textAlign: 'left' }}>Số tài khoản</th>
                    <th style={{ padding: '9px 10px', textAlign: 'left' }}>Ngân hàng</th>
                    <th style={{ padding: '9px 10px', textAlign: 'left' }}>Nội dung UNC</th>
                    <th style={{ padding: '9px 10px', textAlign: 'right' }}>Số tiền chuyển</th>
                  </tr>
                </thead>
                <tbody>
                  {calculatedRows.map((r) => (
                    <tr key={r.employee.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '9px 10px', fontWeight: 700 }}>{r.employee.full_name}</td>
                      <td style={{ padding: '9px 10px', fontFamily: 'monospace' }}>
                        {r.employee.bank_account_number || 'Chưa cập nhật'}
                      </td>
                      <td style={{ padding: '9px 10px' }}>{r.employee.bank_name || '—'}</td>
                      <td style={{ padding: '9px 10px', color: '#475569' }}>{ws.unc_transfer_note}</td>
                      <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                        {formatVnd(r.net_pay_vnd)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* SUB-TABS 3, 4, 5 */}
      {(activeTab === 'journal' || activeTab === 'labor_book' || activeTab === 'tax_xml') && (
        <AzJournalAndTaxTabs
          activeSubTab={activeTab}
          periodKey={periodKey}
          signDateIso={clock.todayIso}
          legalEntity={bundle.legal_entity}
          payrollConfig={bundle.payroll_config}
          calculatedRows={calculatedRows}
          workspaceState={ws}
          onPatchWorkspace={handlePatchWorkspace}
        />
      )}

      {/* Employee Adjustment Modal */}
      <CustomModal
        isOpen={Boolean(editingRow)}
        onClose={() => setEditingRow(null)}
        title={editingRow ? `Điều Chỉnh Biến Động Lương • ${editingRow.employee.full_name}` : ''}
        width={600}
      >
        {editingRow && (
          <form
            onSubmit={handleSaveEmployeeAdjustment}
            style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label style={PAYROLL_SHARED_LABEL_STYLE}>Ngày công thực tế</label>
                <input
                  type="number"
                  step="0.5"
                  min={0}
                  value={adjDraft.actual_workdays ?? editingRow.actual_workdays}
                  onChange={(e) =>
                    setAdjDraft({ ...adjDraft, actual_workdays: Number(e.target.value || 0) })
                  }
                  style={PAYROLL_SHARED_INPUT_STYLE}
                />
              </div>
              <div>
                <label style={PAYROLL_SHARED_LABEL_STYLE}>Giờ làm thêm (OT)</label>
                <input
                  type="number"
                  step="0.5"
                  min={0}
                  value={adjDraft.overtime_hours ?? editingRow.overtime_hours}
                  onChange={(e) =>
                    setAdjDraft({ ...adjDraft, overtime_hours: Number(e.target.value || 0) })
                  }
                  style={PAYROLL_SHARED_INPUT_STYLE}
                />
              </div>
              <div>
                <label style={PAYROLL_SHARED_LABEL_STYLE}>Số Người phụ thuộc</label>
                <input
                  type="number"
                  min={0}
                  value={adjDraft.dependents_override ?? editingRow.dependents_count}
                  onChange={(e) =>
                    setAdjDraft({ ...adjDraft, dependents_override: Number(e.target.value || 0) })
                  }
                  style={PAYROLL_SHARED_INPUT_STYLE}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label style={PAYROLL_SHARED_LABEL_STYLE}>Thưởng kỳ này (VNĐ)</label>
                <input
                  type="number"
                  step={500000}
                  min={0}
                  value={adjDraft.bonus_vnd ?? editingRow.bonus_vnd}
                  onChange={(e) =>
                    setAdjDraft({ ...adjDraft, bonus_vnd: Number(e.target.value || 0) })
                  }
                  style={PAYROLL_SHARED_INPUT_STYLE}
                />
              </div>
              <div>
                <label style={PAYROLL_SHARED_LABEL_STYLE}>Hoa hồng (VNĐ)</label>
                <input
                  type="number"
                  step={500000}
                  min={0}
                  value={adjDraft.commission_pay_vnd ?? editingRow.commission_pay_vnd}
                  onChange={(e) =>
                    setAdjDraft({ ...adjDraft, commission_pay_vnd: Number(e.target.value || 0) })
                  }
                  style={PAYROLL_SHARED_INPUT_STYLE}
                />
              </div>
              <div>
                <label style={PAYROLL_SHARED_LABEL_STYLE}>Trừ tạm ứng (VNĐ)</label>
                <input
                  type="number"
                  step={500000}
                  min={0}
                  value={adjDraft.advance_deduction_vnd ?? editingRow.advance_deduction_vnd}
                  onChange={(e) =>
                    setAdjDraft({
                      ...adjDraft,
                      advance_deduction_vnd: Number(e.target.value || 0),
                    })
                  }
                  style={PAYROLL_SHARED_INPUT_STYLE}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
              <button
                type="button"
                onClick={() => setEditingRow(null)}
                className="btn secondary"
                style={{ height: 44, padding: '0 1.2rem' }}
              >
                Hủy
              </button>
              <button
                type="submit"
                style={{
                  height: 44,
                  padding: '0 1.35rem',
                  borderRadius: 12,
                  border: 'none',
                  background: '#1E40FF',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Lưu & Tính lại Bút toán
              </button>
            </div>
          </form>
        )}
      </CustomModal>
    </div>
  );
};

export default HrmAccountingAzWorkspace;
