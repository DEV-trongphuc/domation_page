import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BookOpen,
  Calculator,
  CheckCircle2,
  FileCode2,
  FileSpreadsheet,
  FileText,
  Handshake,
  Lock,
  Play,
  Save,
  Settings,
  Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card, PillTabs, Table, type TableColumn } from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import { apiRequest, formatVnd, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { CooperationSlipsView } from './CooperationSlipsView';
import { HrmAccountingAzWorkspace } from './HrmAccountingAzWorkspace';
import { MyPayslipsView } from './MyPayslipsView';
import { PayrollHubExtraTabs } from './PayrollHubExtraTabs';
import { HrmTimesheetSkeleton } from './PayrollSkeleton';
import {
  PAYROLL_SHARED_INPUT_STYLE,
  PAYROLL_SHARED_LABEL_STYLE,
  triggerBrowserFileDownload,
  vndToVietnameseWords,
  type CommissionLedgerDto,
  type CommissionRuleDto,
  type PayrollConfigDto,
  type PayrollPeriodDto,
  type PayrollSlipDto,
} from './payrollTypes';

type PayrollHubTabKey =
  | 'periods'
  | 'my_payslips'
  | 'cooperation_slips'
  | 'accounting_az'
  | 'commissions_simulator'
  | 'config';

const PayrollHubContainer: React.FC = () => {
  const { token, tenantSlug } = useAuth();
  const { can, scope, packageMeta } = useEntitlement();

  const canCreate = can('erp_payroll', 'create');
  const canEdit = can('erp_payroll', 'edit');
  const canApprove = can('erp_payroll', 'approve');
  const canExport = can('erp_payroll', 'export');
  const canManageConfig = can('erp_payroll', 'manage_config');
  const activeScope = scope('erp_payroll');

  const [activeTab, setActiveTab] = useState<PayrollHubTabKey>('periods');
  const [loading, setLoading] = useState(true);
  const [targetMonth, setTargetMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const [config, setConfig] = useState<PayrollConfigDto | null>(null);
  const [periods, setPeriods] = useState<PayrollPeriodDto[]>([]);
  const [activePeriod, setActivePeriod] = useState<PayrollPeriodDto | null>(null);
  const [slips, setSlips] = useState<PayrollSlipDto[]>([]);
  const [commissionRules, setCommissionRules] = useState<CommissionRuleDto[]>([]);
  const [commissions, setCommissions] = useState<CommissionLedgerDto[]>([]);

  const [generating, setGenerating] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<PayrollSlipDto | null>(null);
  const [slipBonusEdit, setSlipBonusEdit] = useState('0');
  const [slipAdvanceEdit, setSlipAdvanceEdit] = useState('0');

  const loadPeriodSlips = useCallback(
    async (periodId: string) => {
      try {
        const detail = await apiRequest<{ period: PayrollPeriodDto; slips: PayrollSlipDto[] }>(
          `/payroll/periods/${periodId}`,
          { token, tenantSlug }
        );
        setActivePeriod(detail.period);
        setSlips(Array.isArray(detail.slips) ? detail.slips : []);
      } catch {
        // ignore silent load error
      }
    },
    [token, tenantSlug]
  );

  const loadAllPayroll = useCallback(async () => {
    try {
      const [cfgRes, perRes, rulesRes, commRes] = await Promise.all([
        apiRequest<PayrollConfigDto>('/payroll/config', { token, tenantSlug }).catch(() => null),
        apiRequest<PayrollPeriodDto[]>('/payroll/periods', { token, tenantSlug }).catch(() => []),
        apiRequest<CommissionRuleDto[]>('/payroll/commission-rules', {
          token,
          tenantSlug,
        }).catch(() => []),
        apiRequest<CommissionLedgerDto[]>(`/payroll/commissions?period_key=${targetMonth}`, {
          token,
          tenantSlug,
        }).catch(() => []),
      ]);
      if (cfgRes) setConfig(cfgRes);
      const periodList = Array.isArray(perRes) ? perRes : [];
      setPeriods(periodList);
      setCommissionRules(Array.isArray(rulesRes) ? rulesRes : []);
      setCommissions(Array.isArray(commRes) ? commRes : []);

      if (periodList.length > 0) {
        const matched = periodList.find((p) => p.period_key === targetMonth) || periodList[0];
        await loadPeriodSlips(matched.id);
      } else {
        setActivePeriod(null);
        setSlips([]);
      }
    } finally {
      setLoading(false);
    }
  }, [token, tenantSlug, targetMonth, loadPeriodSlips]);

  useEffect(() => {
    void loadAllPayroll();
  }, [loadAllPayroll]);

  const handleGeneratePayroll = async () => {
    setGenerating(true);
    try {
      const res = await apiRequest<{ period: PayrollPeriodDto; slips: PayrollSlipDto[] }>(
        '/payroll/periods/generate',
        {
          method: 'POST',
          token,
          tenantSlug,
          body: { period_key: targetMonth },
        }
      );
      setActivePeriod(res.period);
      setSlips(res.slips || []);
      toast.success(`Đã tổng hợp & tính thuế TNCN kỳ lương ${targetMonth}!`);
      await loadAllPayroll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tổng hợp kỳ lương.'));
    } finally {
      setGenerating(false);
    }
  };

  const handleExportHtkkXml = async () => {
    if (!activePeriod) return;
    try {
      const res = await apiRequest<{ filename: string; xml_content: string }>(
        `/payroll/periods/${activePeriod.id}/export-htkk-xml`,
        { token, tenantSlug }
      );
      triggerBrowserFileDownload(res.filename, res.xml_content, 'application/xml;charset=utf-8');
      toast.success(`Đã kết xuất tờ khai HTKK ${res.filename}!`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể kết xuất tệp XML HTKK.'));
    }
  };

  const handleExportCsv = async () => {
    if (!activePeriod) return;
    try {
      const res = await apiRequest<{ filename: string; csv_content: string }>(
        `/payroll/periods/${activePeriod.id}/export-csv`,
        { token, tenantSlug }
      );
      triggerBrowserFileDownload(res.filename, res.csv_content, 'text/csv;charset=utf-8');
      toast.success(`Đã xuất bảng lương ${res.filename}!`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xuất bảng lương CSV.'));
    }
  };

  const handleApproveOrLockPeriod = async (nextStatus: 'approved' | 'paid' | 'locked') => {
    if (!activePeriod) return;
    try {
      await apiRequest(`/payroll/periods/${activePeriod.id}`, {
        method: 'PATCH',
        token,
        tenantSlug,
        body: { status: nextStatus },
      });
      toast.success('Đã cập nhật trạng thái kỳ lương!');
      await loadAllPayroll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể cập nhật trạng thái kỳ lương.'));
    }
  };

  const handleSaveSlipAdjustments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlip) return;
    try {
      await apiRequest(`/payroll/slips/${selectedSlip.id}`, {
        method: 'PATCH',
        token,
        tenantSlug,
        body: {
          bonus_vnd: Number(slipBonusEdit || 0),
          advance_deduction_vnd: Number(slipAdvanceEdit || 0),
        },
      });
      toast.success('Đã tính lại phiếu lương & thuế TNCN!');
      setSelectedSlip(null);
      if (activePeriod) {
        await loadPeriodSlips(activePeriod.id);
      }
      await loadAllPayroll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể cập nhật phiếu lương.'));
    }
  };

  const slipColumns = useMemo<ReadonlyArray<TableColumn<PayrollSlipDto>>>(
    () => [
      {
        key: 'emp',
        header: 'Nhân sự',
        render: (s) => (
          <div>
            <div style={{ fontWeight: 800, color: '#0F172A' }}>
              {s.employee_name || s.employee_code}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
              <span style={{ color: '#1E40FF', fontWeight: 700 }}>{s.employee_code}</span>
              {s.department_name ? ` • ${s.department_name}` : ''}
            </div>
          </div>
        ),
      },
      {
        key: 'days',
        header: 'Ngày công',
        align: 'center',
        render: (s) => (
          <Badge tone="info">
            {s.actual_workdays}/{s.standard_workdays} công
          </Badge>
        ),
      },
      {
        key: 'gross',
        header: 'Tổng Gross',
        numeric: true,
        render: (s) => <span style={{ fontWeight: 700 }}>{formatVnd(s.gross_pay_vnd)}</span>,
      },
      {
        key: 'comm',
        header: 'Hoa hồng / OT',
        numeric: true,
        render: (s) => (
          <span style={{ color: '#0284C7', fontWeight: 700 }}>
            {formatVnd(s.commission_pay_vnd + s.overtime_pay_vnd)}
          </span>
        ),
      },
      {
        key: 'ins',
        header: 'BHXH NLĐ',
        numeric: true,
        render: (s) => (
          <span>-{formatVnd(s.emp_bhxh_vnd + s.emp_bhyt_vnd + s.emp_bhtn_vnd)}</span>
        ),
      },
      {
        key: 'pit',
        header: 'Thuế TNCN',
        numeric: true,
        render: (s) => (
          <span style={{ color: '#D97706', fontWeight: 700 }}>-{formatVnd(s.pit_tax_vnd)}</span>
        ),
      },
      {
        key: 'net',
        header: 'Thực lĩnh (Net)',
        numeric: true,
        render: (s) => (
          <span style={{ color: '#059669', fontWeight: 800 }}>{formatVnd(s.net_pay_vnd)}</span>
        ),
      },
    ],
    []
  );

  if (loading) {
    return <HrmTimesheetSkeleton />;
  }

  return (
    <div style={{ background: '#F8F9FA', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <Card
        padding="1.3rem 1.5rem"
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
                width: 48,
                height: 48,
                borderRadius: 16,
                background: '#FFFFFF',
                border: '1px solid #DBEAFE',
                boxShadow: '0 6px 18px rgba(30, 64, 255, 0.12)',
                padding: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src="/imgs/autodata/ICON.png"
                alt="Logo robot"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Trung Tâm Bảng Lương Tự Động, Hoa Hồng Đa Sale & Kế Toán Thuế A-Z
                </h1>
                <Badge tone="primary">{packageMeta.shortName}</Badge>
                <Badge tone="success" icon={<Lock size={11} />}>
                  Scope: {activeScope}
                </Badge>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '4px 0 0' }}>
                Tự động gom công GPS + Hoa hồng CRM, ký số phiếu lương, đối soát phiếu hợp tác & hạch toán TT200/TT133 + XML HTKK
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <ScreenHelpButton screenKey="erp_payroll" />
            <input
              type="month"
              value={targetMonth}
              onChange={(e) => setTargetMonth(e.target.value)}
              style={{ ...PAYROLL_SHARED_INPUT_STYLE, width: 165, fontWeight: 700 }}
            />
            {canCreate && (
              <button
                type="button"
                disabled={generating}
                onClick={() => void handleGeneratePayroll()}
                style={{
                  height: 44,
                  padding: '0 1.25rem',
                  borderRadius: 12,
                  border: 'none',
                  background: '#1E40FF',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  cursor: 'pointer',
                  boxShadow: '0 6px 18px rgba(30, 64, 255, 0.24)',
                }}
              >
                <Play size={15} /> {generating ? 'Đang tính lương...' : `Tổng hợp Lương ${targetMonth}`}
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Unified 6-Tab Navigation */}
      <PillTabs<PayrollHubTabKey>
        activeKey={activeTab}
        onChange={setActiveTab}
        tabs={[
          { key: 'periods', label: 'Bảng lương tháng', icon: <Wallet size={15} />, count: slips.length },
          { key: 'my_payslips', label: 'Phiếu lương của tôi', icon: <FileText size={15} /> },
          { key: 'cooperation_slips', label: 'Phiếu hợp tác Hoa hồng', icon: <Handshake size={15} /> },
          { key: 'accounting_az', label: 'Kế toán Lương & Thuế A-Z', icon: <BookOpen size={15} /> },
          {
            key: 'commissions_simulator',
            label: 'Hoa hồng & Mô phỏng Gross↔Net',
            icon: <Calculator size={15} />,
            count: commissions.length,
          },
          { key: 'config', label: 'Cấu hình Thuế & BHXH', icon: <Settings size={15} /> },
        ]}
      />

      {/* Tab 1: Monthly Payroll Periods */}
      {activeTab === 'periods' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(205px, 1fr))',
              gap: '1rem',
            }}
          >
            <Card padding="1.05rem 1.25rem">
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>
                QUỸ LƯƠNG GROSS KỲ HIỆN TẠI
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
                {formatVnd(activePeriod?.total_gross_vnd || 0)}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>
                {activePeriod?.employee_count || 0} phiếu lương • Công chuẩn{' '}
                {activePeriod?.standard_workdays || 22} ngày
              </div>
            </Card>
            <Card padding="1.05rem 1.25rem">
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>
                THỰC LĨNH NET CHI TRẢ
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>
                {formatVnd(activePeriod?.total_net_vnd || 0)}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>
                Trạng thái kỳ: {activePeriod?.status || 'Chưa khởi tạo'}
              </div>
            </Card>
            <Card padding="1.05rem 1.25rem">
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>
                THUẾ TNCN KHẤU TRỪ
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#D97706', marginTop: 4 }}>
                {formatVnd(activePeriod?.total_pit_tax_vnd || 0)}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>
                Sẵn sàng kết xuất XML 05/KK-TNCN
              </div>
            </Card>
            <Card padding="1.05rem 1.25rem">
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>
                HOA HỒNG KPI / DEAL THẮNG
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#1E40FF', marginTop: 4 }}>
                {formatVnd(activePeriod?.total_commission_vnd || 0)}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>
                Tự động cộng vào thu nhập tháng
              </div>
            </Card>
          </div>

          {periods.length > 0 && (
            <Card padding="0.95rem 1.25rem">
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>
                    Chọn kỳ lương:
                  </span>
                  {periods.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => void loadPeriodSlips(p.id)}
                      style={{
                        height: 36,
                        padding: '0 0.9rem',
                        borderRadius: 10,
                        border:
                          activePeriod?.id === p.id ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                        background: activePeriod?.id === p.id ? '#EEF2FF' : '#FFFFFF',
                        color: activePeriod?.id === p.id ? '#1E40FF' : '#334155',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      {p.period_key} ({p.status})
                    </button>
                  ))}
                </div>

                {activePeriod && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {canExport && (
                      <>
                        <button
                          type="button"
                          onClick={() => void handleExportHtkkXml()}
                          className="btn secondary"
                          style={{
                            height: 38,
                            color: '#1E40FF',
                            fontSize: '0.8rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <FileCode2 size={15} /> Xuất XML HTKK (05/KK-TNCN)
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleExportCsv()}
                          className="btn secondary"
                          style={{
                            height: 38,
                            color: '#059669',
                            fontSize: '0.8rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <FileSpreadsheet size={15} /> Xuất Excel CSV
                        </button>
                      </>
                    )}
                    {canApprove && activePeriod.status !== 'locked' && (
                      <button
                        type="button"
                        onClick={() => void handleApproveOrLockPeriod('approved')}
                        style={{
                          height: 38,
                          padding: '0 1rem',
                          borderRadius: 10,
                          border: 'none',
                          background: '#059669',
                          color: '#FFFFFF',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          cursor: 'pointer',
                        }}
                      >
                        <CheckCircle2 size={14} /> Duyệt chốt bảng lương
                      </button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}

          <Table<PayrollSlipDto>
            columns={slipColumns}
            rows={slips}
            rowKey={(s) => s.id}
            onRowClick={(s) => {
              setSelectedSlip(s);
              setSlipBonusEdit(String(s.bonus_vnd || 0));
              setSlipAdvanceEdit(String(s.advance_deduction_vnd || 0));
            }}
            emptyTitle="Chưa có phiếu lương cho kỳ này"
            emptyDescription="Đảm bảo đã có Hồ sơ Nhân sự 360°, sau đó bấm 'Tổng hợp Lương' ở góc phải để tính tự động."
          />
        </div>
      )}

      {/* Tab 2: Self-Service My Payslips */}
      {activeTab === 'my_payslips' && <MyPayslipsView embedded />}

      {/* Tab 3: Multi-Sale Cooperation Slips */}
      {activeTab === 'cooperation_slips' && <CooperationSlipsView embedded />}

      {/* Tab 4: Accounting A-Z Workspace */}
      {activeTab === 'accounting_az' && (
        <HrmAccountingAzWorkspace embedded initialPeriodKey={targetMonth} />
      )}

      {/* Tabs 5 & 6: Commissions + Simulator + Tax/BHXH Config */}
      {(activeTab === 'commissions_simulator' || activeTab === 'config') && (
        <PayrollHubExtraTabs
          mode={activeTab}
          targetMonth={targetMonth}
          token={token}
          tenantSlug={tenantSlug}
          canCreate={canCreate}
          canManageConfig={canManageConfig}
          config={config}
          onConfigChange={setConfig}
          commissionRules={commissionRules}
          commissions={commissions}
          onReloadAll={loadAllPayroll}
        />
      )}

      {/* Payslip Detail & Adjustment Modal */}
      <CustomModal
        isOpen={Boolean(selectedSlip)}
        onClose={() => setSelectedSlip(null)}
        title={selectedSlip ? `Phiếu Lương Chi Tiết • ${selectedSlip.employee_name}` : ''}
        width={680}
      >
        {selectedSlip && (
          <form
            onSubmit={handleSaveSlipAdjustments}
            style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.84rem' }}>
              <div style={{ padding: '0.65rem 0.85rem', borderRadius: 12, background: '#F8F9FA' }}>
                Lương theo ngày công ({selectedSlip.actual_workdays}/{selectedSlip.standard_workdays}):{' '}
                <strong>{formatVnd(selectedSlip.prorated_base_pay_vnd)}</strong>
              </div>
              <div style={{ padding: '0.65rem 0.85rem', borderRadius: 12, background: '#F8F9FA' }}>
                Phụ cấp & Miễn thuế: <strong>{formatVnd(selectedSlip.allowances_vnd)}</strong> (Miễn:{' '}
                {formatVnd(selectedSlip.tax_exempt_vnd)})
              </div>
              <div style={{ padding: '0.65rem 0.85rem', borderRadius: 12, background: '#F8F9FA' }}>
                Hoa hồng Deal & OT:{' '}
                <strong>{formatVnd(selectedSlip.commission_pay_vnd + selectedSlip.overtime_pay_vnd)}</strong>
              </div>
              <div style={{ padding: '0.65rem 0.85rem', borderRadius: 12, background: '#EEF2FF', color: '#1E40FF' }}>
                Tổng thu nhập GROSS: <strong>{formatVnd(selectedSlip.gross_pay_vnd)}</strong>
              </div>
              <div style={{ padding: '0.65rem 0.85rem', borderRadius: 12, background: '#F8F9FA' }}>
                BHXH 8% / BHYT 1.5% / BHTN 1%:{' '}
                <strong>
                  -{formatVnd(selectedSlip.emp_bhxh_vnd + selectedSlip.emp_bhyt_vnd + selectedSlip.emp_bhtn_vnd)}
                </strong>
              </div>
              <div style={{ padding: '0.65rem 0.85rem', borderRadius: 12, background: '#F8F9FA', color: '#D97706' }}>
                Thuế TNCN lũy tiến: <strong>-{formatVnd(selectedSlip.pit_tax_vnd)}</strong>
              </div>
            </div>

            {canEdit && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={PAYROLL_SHARED_LABEL_STYLE}>Thưởng bổ sung trong tháng (VNĐ)</label>
                  <input
                    type="number"
                    min={0}
                    step={500000}
                    value={slipBonusEdit}
                    onChange={(e) => setSlipBonusEdit(e.target.value)}
                    style={PAYROLL_SHARED_INPUT_STYLE}
                  />
                </div>
                <div>
                  <label style={PAYROLL_SHARED_LABEL_STYLE}>Khấu trừ tạm ứng (VNĐ)</label>
                  <input
                    type="number"
                    min={0}
                    step={500000}
                    value={slipAdvanceEdit}
                    onChange={(e) => setSlipAdvanceEdit(e.target.value)}
                    style={PAYROLL_SHARED_INPUT_STYLE}
                  />
                </div>
              </div>
            )}

            <div
              style={{
                padding: '0.9rem 1.1rem',
                borderRadius: 14,
                background: 'rgba(16, 185, 129, 0.10)',
                color: '#059669',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '1rem',
                  fontWeight: 800,
                }}
              >
                <span>THỰC LĨNH CHUYỂN KHOẢN (NET):</span>
                <span>{formatVnd(selectedSlip.net_pay_vnd)}</span>
              </div>
              <div style={{ fontSize: '0.78rem', fontStyle: 'italic' }}>
                Bằng chữ: {vndToVietnameseWords(selectedSlip.net_pay_vnd)}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setSelectedSlip(null)}
                className="btn secondary"
                style={{ height: 44, padding: '0 1.2rem' }}
              >
                Đóng
              </button>
              {canEdit && (
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
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  <Save size={15} /> Lưu & Tính lại Thuế
                </button>
              )}
            </div>
          </form>
        )}
      </CustomModal>
    </div>
  );
};

export const ErpPayrollWave2Entry: React.FC = () => {
  const { pathname } = useLocation();
  const cleanPath = (pathname || '').replace(/\/+$/, '') || '/';

  if (cleanPath === '/my-payslips' || cleanPath.endsWith('/my-payslips')) {
    return <MyPayslipsView />;
  }
  if (cleanPath === '/cooperation-slips' || cleanPath.endsWith('/cooperation-slips')) {
    return <CooperationSlipsView />;
  }
  if (cleanPath === '/accounting-az' || cleanPath.endsWith('/accounting-az')) {
    return <HrmAccountingAzWorkspace />;
  }
  return <PayrollHubContainer />;
};

export const Wave2Entry = ErpPayrollWave2Entry;

export default ErpPayrollWave2Entry;
