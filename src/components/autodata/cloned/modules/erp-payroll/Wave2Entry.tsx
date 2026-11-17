import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Award,
  Calculator,
  CheckCircle2,
  Download,
  FileCode2,
  FileSpreadsheet,
  Lock,
  Play,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Trash2,
  Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  AutoDataLoadingModal,
  Badge,
  Card,
  EmptyState,
  FormCard,
  PillTabs,
  Table,
  type TableColumn,
} from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import { apiRequest, formatVnd, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import type {
  CommissionLedgerDto,
  CommissionRuleDto,
  PayrollConfigDto,
  PayrollPeriodDto,
  PayrollSlipDto,
  SimulationResultDto,
  TaxBracketItem,
} from './payrollTypes';

type PayrollTabKey = 'periods' | 'simulator' | 'commissions' | 'config';

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  height: 44,
  padding: '0 0.85rem',
  borderRadius: 12,
  border: '1px solid #CBD5E1',
  background: '#FFFFFF',
  color: '#0F172A',
  fontSize: '0.86rem',
  outline: 'none',
};

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 700,
  color: '#334155',
  marginBottom: 6,
};

function triggerBrowserFileDownload(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const ErpPayrollWave2Entry: React.FC = () => {
  const { token, tenantSlug } = useAuth();
  const { can, scope, packageMeta } = useEntitlement();

  const canCreate = can('erp_payroll', 'create');
  const canEdit = can('erp_payroll', 'edit');
  const canApprove = can('erp_payroll', 'approve');
  const canExport = can('erp_payroll', 'export');
  const canManageConfig = can('erp_payroll', 'manage_config');
  const activeScope = scope('erp_payroll');

  const [activeTab, setActiveTab] = useState<PayrollTabKey>('periods');
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

  // Gross <-> Net Simulator State
  const [simMode, setSimMode] = useState<'gross_to_net' | 'net_to_gross'>('gross_to_net');
  const [simAmount, setSimAmount] = useState('30000000');
  const [simDependents, setSimDependents] = useState('1');
  const [simResident, setSimResident] = useState(true);
  const [simResult, setSimResult] = useState<SimulationResultDto | null>(null);
  const [simRunning, setSimRunning] = useState(false);

  // Commission Rule Modal
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [ruleType, setRuleType] = useState<CommissionRuleDto['rule_type']>('percentage_revenue');
  const [rulePct, setRulePct] = useState('3');
  const [ruleFixed, setRuleFixed] = useState('500000');

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
        // ignore
      }
    },
    [token, tenantSlug]
  );

  const loadAllPayroll = useCallback(async () => {
    try {
      const [cfgRes, perRes, rulesRes, commRes] = await Promise.all([
        apiRequest<PayrollConfigDto>('/payroll/config', { token, tenantSlug }).catch(() => null),
        apiRequest<PayrollPeriodDto[]>('/payroll/periods', { token, tenantSlug }).catch(() => []),
        apiRequest<CommissionRuleDto[]>('/payroll/commission-rules', { token, tenantSlug }).catch(() => []),
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

  const handleRunSimulation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSimRunning(true);
    try {
      const res = await apiRequest<SimulationResultDto>('/payroll/simulate', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          mode: simMode,
          amount_vnd: Number(simAmount || 0),
          dependents_count: Number(simDependents || 0),
          is_resident: simResident,
        },
      });
      setSimResult(res);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể chạy mô phỏng Gross - Net.'));
    } finally {
      setSimRunning(false);
    }
  };

  const handleCreateCommissionRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) {
      toast.error('Vui lòng nhập tên chính sách hoa hồng.');
      return;
    }
    try {
      await apiRequest('/payroll/commission-rules', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          name: ruleName.trim(),
          rule_type: ruleType,
          flat_rate_pct: Number(rulePct || 3),
          fixed_amount_vnd: Number(ruleFixed || 0),
        },
      });
      toast.success('Đã thêm quy tắc tính hoa hồng!');
      setRuleName('');
      setRuleModalOpen(false);
      await loadAllPayroll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu quy tắc hoa hồng.'));
    }
  };

  const handleSyncWonLeadsCommission = async () => {
    try {
      const res = await apiRequest<{ synced_count: number; message?: string }>(
        '/payroll/commissions/sync-won-leads',
        {
          method: 'POST',
          token,
          tenantSlug,
          body: { period_key: targetMonth },
        }
      );
      toast.success(
        res.synced_count > 0
          ? `Đã tự động trích hoa hồng từ ${res.synced_count} Deal thắng CRM!`
          : res.message || 'Tất cả Deal thắng trong kỳ đã được đồng bộ.'
      );
      await loadAllPayroll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể đồng bộ hoa hồng từ CRM.'));
    }
  };

  const handleSavePayrollConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    try {
      const saved = await apiRequest<PayrollConfigDto>('/payroll/config', {
        method: 'PUT',
        token,
        tenantSlug,
        body: config,
      });
      setConfig(saved);
      toast.success('Đã lưu tham số Thuế TNCN, BHXH & Giảm trừ gia cảnh của doanh nghiệp!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu cấu hình thuế & bảo hiểm.'));
    }
  };

  const applyTaxPreset = (preset: 'vn_7_brackets' | 'vn_5_brackets_2026') => {
    if (!config) return;
    if (preset === 'vn_7_brackets') {
      setConfig({
        ...config,
        personal_deduction_vnd: 11_000_000,
        dependent_deduction_vnd: 4_400_000,
        pit_brackets: [
          { up_to: 5_000_000, rate: 0.05 },
          { up_to: 10_000_000, rate: 0.1 },
          { up_to: 18_000_000, rate: 0.15 },
          { up_to: 32_000_000, rate: 0.2 },
          { up_to: 52_000_000, rate: 0.25 },
          { up_to: 80_000_000, rate: 0.3 },
          { up_to: null, rate: 0.35 },
        ],
      });
    } else {
      setConfig({
        ...config,
        personal_deduction_vnd: 15_500_000,
        dependent_deduction_vnd: 6_200_000,
        pit_brackets: [
          { up_to: 10_000_000, rate: 0.05 },
          { up_to: 30_000_000, rate: 0.1 },
          { up_to: 60_000_000, rate: 0.2 },
          { up_to: 100_000_000, rate: 0.3 },
          { up_to: null, rate: 0.35 },
        ],
      });
    }
  };

  const slipColumns = useMemo<ReadonlyArray<TableColumn<PayrollSlipDto>>>(
    () => [
      {
        key: 'emp',
        header: 'Nhân sự',
        render: (s) => (
          <div>
            <div style={{ fontWeight: 800, color: '#0F172A' }}>{s.employee_name || s.employee_code}</div>
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
        render: (s) => <span>-{formatVnd(s.emp_bhxh_vnd + s.emp_bhyt_vnd + s.emp_bhtn_vnd)}</span>,
      },
      {
        key: 'pit',
        header: 'Thuế TNCN',
        numeric: true,
        render: (s) => <span style={{ color: '#D97706', fontWeight: 700 }}>-{formatVnd(s.pit_tax_vnd)}</span>,
      },
      {
        key: 'net',
        header: 'Thực lĩnh (Net)',
        numeric: true,
        render: (s) => <span style={{ color: '#059669', fontWeight: 800 }}>{formatVnd(s.net_pay_vnd)}</span>,
      },
    ],
    []
  );

  const commissionColumns = useMemo<ReadonlyArray<TableColumn<CommissionLedgerDto>>>(
    () => [
      {
        key: 'staff',
        header: 'Nhân sự hưởng',
        render: (c) => <span style={{ fontWeight: 700 }}>{c.user_name || c.user_id}</span>,
      },
      {
        key: 'src',
        header: 'Nguồn doanh thu / Hợp đồng',
        render: (c) => <span>{c.source_title}</span>,
      },
      {
        key: 'rev',
        header: 'Doanh thu tính thưởng',
        numeric: true,
        render: (c) => <span>{formatVnd(c.revenue_base_vnd)}</span>,
      },
      {
        key: 'amt',
        header: 'Hoa hồng được nhận',
        numeric: true,
        render: (c) => <span style={{ fontWeight: 800, color: '#1E40FF' }}>{formatVnd(c.commission_amount_vnd)}</span>,
      },
      {
        key: 'st',
        header: 'Trạng thái',
        render: (c) => <Badge tone="success">{c.status}</Badge>,
      },
    ],
    []
  );

  if (loading) {
    return (
      <AutoDataLoadingModal
        inline
        isOpen
        message="Đang tải Động cơ Bảng lương, Thuế TNCN Lũy tiến & Kết xuất HTKK..."
        subMessage="Đồng bộ Công thức Thuế - Bảo hiểm tùy chỉnh theo doanh nghiệp"
      />
    );
  }

  return (
    <div style={{ background: '#F8F9FA', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <Card
        padding="1.3rem 1.5rem"
        style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
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
              <img src="/imgs/autodata/ICON.png" alt="Logo robot" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Bảng Lương Động, Hoa Hồng, Thuế TNCN & Kết Xuất XML HTKK
                </h1>
                <Badge tone="primary">{packageMeta.shortName}</Badge>
                <Badge tone="success" icon={<Lock size={11} />}>
                  Scope: {activeScope}
                </Badge>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '4px 0 0' }}>
                Tự động gom công GPS + Hoa hồng Deal thắng CRM, tính BHXH/Thuế lũy tiến tùy biến & xuất tờ khai 05/KK-TNCN
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <ScreenHelpButton screenKey="erp_payroll" />
            <input
              type="month"
              value={targetMonth}
              onChange={(e) => setTargetMonth(e.target.value)}
              style={{
                height: 44,
                padding: '0 0.85rem',
                borderRadius: 12,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.84rem',
              }}
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

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(205px, 1fr))', gap: '1rem' }}>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>QUỸ LƯƠNG GROSS KỲ HIỆN TẠI</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
            {formatVnd(activePeriod?.total_gross_vnd || 0)}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>
            {activePeriod?.employee_count || 0} phiếu lương • Công chuẩn {activePeriod?.standard_workdays || 22} ngày
          </div>
        </Card>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>THỰC LĨNH NET CHI TRẢ</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>
            {formatVnd(activePeriod?.total_net_vnd || 0)}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>
            Trạng thái kỳ: {activePeriod?.status || 'Chưa khởi tạo'}
          </div>
        </Card>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>THUẾ TNCN KHẤU TRỪ</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#D97706', marginTop: 4 }}>
            {formatVnd(activePeriod?.total_pit_tax_vnd || 0)}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>Sẵn sàng kết xuất XML 05/KK-TNCN</div>
        </Card>
        <Card padding="1.05rem 1.25rem">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>HOA HỒNG KPI / DEAL THẮNG</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#1E40FF', marginTop: 4 }}>
            {formatVnd(activePeriod?.total_commission_vnd || 0)}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>Tự động cộng vào thu nhập tháng</div>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <PillTabs<PayrollTabKey>
        activeKey={activeTab}
        onChange={setActiveTab}
        tabs={[
          { key: 'periods', label: 'Bảng lương & Kết xuất HTKK', icon: <Wallet size={15} />, count: slips.length },
          { key: 'simulator', label: 'Mô phỏng Gross ↔ Net', icon: <Calculator size={15} /> },
          { key: 'commissions', label: 'Quy tắc & Sổ Hoa hồng', icon: <Award size={15} />, count: commissions.length },
          { key: 'config', label: 'Tham số Thuế TNCN & BHXH', icon: <Settings size={15} /> },
        ]}
      />

      {/* Tab 1: Payroll Period & Payslips */}
      {activeTab === 'periods' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {periods.length > 0 && (
            <Card padding="0.95rem 1.25rem">
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Chọn kỳ lương:</span>
                  {periods.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => void loadPeriodSlips(p.id)}
                      style={{
                        height: 36,
                        padding: '0 0.9rem',
                        borderRadius: 10,
                        border: activePeriod?.id === p.id ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
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
                          style={{ height: 38, color: '#1E40FF', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                          <FileCode2 size={15} /> Xuất XML HTKK (05/KK-TNCN)
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleExportCsv()}
                          className="btn secondary"
                          style={{ height: 38, color: '#059669', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
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

      {/* Tab 2: Gross <-> Net Simulator */}
      {activeTab === 'simulator' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
          <Card
            title="Bộ Chuyển Đổi Hai Chiều Gross ↔ Net"
            subtitle="Tính chính xác theo cấu hình BHXH & Biểu thuế lũy tiến hiện hành của doanh nghiệp"
          >
            <form onSubmit={handleRunSimulation} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={LABEL_STYLE}>Chiều quy đổi</label>
                <select
                  value={simMode}
                  onChange={(e) => setSimMode(e.target.value as 'gross_to_net' | 'net_to_gross')}
                  style={INPUT_STYLE}
                >
                  <option value="gross_to_net">Từ Lương GROSS → Tính thực lĩnh NET</option>
                  <option value="net_to_gross">Từ Lương NET mong muốn → Tìm ngược lương GROSS</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={LABEL_STYLE}>Mức lương đầu vào (VNĐ)</label>
                  <input
                    type="number"
                    min={0}
                    step={500000}
                    value={simAmount}
                    onChange={(e) => setSimAmount(e.target.value)}
                    style={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Số người phụ thuộc</label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={simDependents}
                    onChange={(e) => setSimDependents(e.target.value)}
                    style={INPUT_STYLE}
                  />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', fontWeight: 600 }}>
                <input type="checkbox" checked={simResident} onChange={(e) => setSimResident(e.target.checked)} />
                Cá nhân cư trú có HĐLĐ từ 3 tháng trở lên (Tính biểu lũy tiến)
              </label>

              <button
                type="submit"
                disabled={simRunning}
                style={{
                  height: 44,
                  borderRadius: 12,
                  border: 'none',
                  background: '#1E40FF',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  cursor: 'pointer',
                }}
              >
                <Calculator size={16} /> {simRunning ? 'Đang giải phương trình thuế...' : 'Tính toán chi tiết ngay'}
              </button>
            </form>
          </Card>

          <Card title="Kết Quả Bóc Tách Thuế & Bảo Hiểm Chi Tiết">
            {!simResult ? (
              <EmptyState
                icon={<Calculator size={24} />}
                title="Bấm 'Tính toán chi tiết ngay' để xem bảng phân rã"
                description="Hiển thị đầy đủ từng bậc thuế TNCN lũy tiến, mức trích BHXH/BHYT/BHTN và tổng chi phí người sử dụng lao động."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.85rem', borderRadius: 10, background: '#F8FAFF' }}>
                  <span>Lương GROSS:</span>
                  <strong style={{ color: '#1E40FF' }}>{formatVnd(simResult.gross_pay_vnd)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.85rem' }}>
                  <span>Khấu trừ Bảo hiểm NLĐ (BHXH + BHYT + BHTN):</span>
                  <strong>-{formatVnd(simResult.emp_insurance_total_vnd)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.85rem' }}>
                  <span>Giảm trừ gia cảnh (Bản thân + NPT):</span>
                  <strong>{formatVnd(simResult.family_deduction_vnd)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.85rem' }}>
                  <span>Thu nhập tính thuế (Assessable Income):</span>
                  <strong>{formatVnd(simResult.assessable_income_vnd)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.85rem', color: '#D97706' }}>
                  <span>Thuế TNCN phải nộp:</span>
                  <strong>-{formatVnd(simResult.pit_tax_vnd)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0.85rem', borderRadius: 12, background: 'rgba(16, 185, 129, 0.10)', color: '#059669', fontSize: '0.96rem' }}>
                  <strong>Lương THỰC LĨNH (NET):</strong>
                  <strong>{formatVnd(simResult.net_pay_vnd)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.55rem 0.85rem', borderRadius: 10, background: '#F8F9FA', color: '#475569' }}>
                  <span>Tổng chi phí Doanh nghiệp bỏ ra (Gross + BH DN):</span>
                  <strong>{formatVnd(simResult.total_employer_cost_vnd)}</strong>
                </div>

                {simResult.pit_breakdown.length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748B', marginBottom: 6 }}>
                      CHI TIẾT TỪNG BẬC LŨY TIẾN:
                    </div>
                    {simResult.pit_breakdown.map((b) => (
                      <div
                        key={b.bracket_index}
                        style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '4px 0', borderBottom: '1px dashed #E2E8F0' }}
                      >
                        <span>
                          Bậc {b.bracket_index} ({Math.round(b.rate * 100)}%) trên phần {formatVnd(b.taxable_slice_vnd)}
                        </span>
                        <strong>{formatVnd(b.tax_vnd)}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab 3: Commission Rules Studio & Ledgers */}
      {activeTab === 'commissions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: '0.85rem', color: '#475569' }}>
              Thiết lập công thức trích thưởng theo % doanh thu chốt Deal hoặc bậc thang lũy tiến và đồng bộ thẳng vào Bảng lương.
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {canCreate && (
                <button
                  type="button"
                  onClick={() => void handleSyncWonLeadsCommission()}
                  className="btn secondary"
                  style={{ height: 44, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <RefreshCw size={14} /> Đồng bộ Deal thắng từ CRM ({targetMonth})
                </button>
              )}
              {canManageConfig && (
                <button
                  type="button"
                  onClick={() => setRuleModalOpen(true)}
                  style={{
                    height: 44,
                    padding: '0 1.2rem',
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
                  <Plus size={15} /> Thêm quy tắc hoa hồng
                </button>
              )}
            </div>
          </div>

          {commissionRules.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {commissionRules.map((r) => (
                <FormCard
                  key={r.id}
                  icon={<Award size={19} />}
                  title={r.name}
                  description={
                    r.rule_type === 'fixed_per_won_lead'
                      ? `Thưởng cố định ${formatVnd(r.fixed_amount_vnd)} / mỗi Deal chốt thành công`
                      : `Trích ${r.flat_rate_pct}% trên tổng doanh thu thực thu`
                  }
                  badge={<Badge tone="success">Đang áp dụng</Badge>}
                />
              ))}
            </div>
          )}

          <Card title={`Sổ Hoa hồng Kỳ ${targetMonth}`} padding="1rem 1.25rem">
            <Table<CommissionLedgerDto>
              columns={commissionColumns}
              rows={commissions}
              rowKey={(c) => c.id}
              emptyTitle="Chưa có bút toán hoa hồng nào trong kỳ này"
              emptyDescription="Tạo quy tắc hoa hồng và bấm 'Đồng bộ Deal thắng từ CRM' để tự động trích thưởng cho đội ngũ Kinh doanh."
            />
          </Card>
        </div>
      )}

      {/* Tab 4: Configurable Tax & Insurance Parameters */}
      {activeTab === 'config' && config && (
        <form onSubmit={handleSavePayrollConfig} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Card
            title="Tham Số Bảo Hiểm Bắt Buộc, Giảm Trừ Gia Cảnh & Cơ Quan Thuế"
            subtitle="Mọi doanh nghiệp ở bất kỳ năm tài chính / quốc gia nào đều có thể tùy chỉnh 100% không phụ thuộc code cứng"
            actions={
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => applyTaxPreset('vn_7_brackets')}
                  className="btn secondary"
                  style={{ height: 36, fontSize: '0.76rem' }}
                >
                  Nạp chuẩn VN 7 bậc (11tr / 4.4tr)
                </button>
                <button
                  type="button"
                  onClick={() => applyTaxPreset('vn_5_brackets_2026')}
                  className="btn secondary"
                  style={{ height: 36, fontSize: '0.76rem', color: '#1E40FF' }}
                >
                  Nạp chuẩn VN 5 bậc mới (15.5tr / 6.2tr)
                </button>
              </div>
            }
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
              <div>
                <label style={LABEL_STYLE}>Giảm trừ bản thân (VNĐ/tháng)</label>
                <input
                  type="number"
                  value={config.personal_deduction_vnd}
                  onChange={(e) => setConfig({ ...config, personal_deduction_vnd: Number(e.target.value || 0) })}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Giảm trừ mỗi Người phụ thuộc (VNĐ)</label>
                <input
                  type="number"
                  value={config.dependent_deduction_vnd}
                  onChange={(e) => setConfig({ ...config, dependent_deduction_vnd: Number(e.target.value || 0) })}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Trần miễn thuế Ăn trưa (VNĐ)</label>
                <input
                  type="number"
                  value={config.meal_allowance_exempt_cap_vnd}
                  onChange={(e) => setConfig({ ...config, meal_allowance_exempt_cap_vnd: Number(e.target.value || 0) })}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Trần lương đóng BHXH/BHYT (VNĐ)</label>
                <input
                  type="number"
                  value={config.bhxh_salary_cap_vnd}
                  onChange={(e) => setConfig({ ...config, bhxh_salary_cap_vnd: Number(e.target.value || 0) })}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Tỷ lệ BHXH NLĐ đóng (VD: 0.08 = 8%)</label>
                <input
                  type="number"
                  step="0.001"
                  value={config.emp_bhxh_rate}
                  onChange={(e) => setConfig({ ...config, emp_bhxh_rate: Number(e.target.value || 0) })}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Tỷ lệ BHYT NLĐ đóng (VD: 0.015 = 1.5%)</label>
                <input
                  type="number"
                  step="0.001"
                  value={config.emp_bhyt_rate}
                  onChange={(e) => setConfig({ ...config, emp_bhyt_rate: Number(e.target.value || 0) })}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Tỷ lệ BHTN NLĐ đóng (VD: 0.01 = 1%)</label>
                <input
                  type="number"
                  step="0.001"
                  value={config.emp_bhtn_rate}
                  onChange={(e) => setConfig({ ...config, emp_bhtn_rate: Number(e.target.value || 0) })}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Mã Cơ quan Thuế quản lý (HTKK)</label>
                <input
                  type="text"
                  value={config.tax_authority_code || ''}
                  onChange={(e) => setConfig({ ...config, tax_authority_code: e.target.value })}
                  placeholder="VD: 70100"
                  style={INPUT_STYLE}
                />
              </div>
            </div>
          </Card>

          <Card
            title="Biểu Thuế Lũy Tiến Từng Phần (Progressive PIT Brackets)"
            actions={
              <button
                type="button"
                onClick={() =>
                  setConfig({
                    ...config,
                    pit_brackets: [...config.pit_brackets, { up_to: null, rate: 0.35 }],
                  })
                }
                className="btn secondary"
                style={{ height: 36, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <Plus size={14} /> Thêm bậc thuế
              </button>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {config.pit_brackets.map((br: TaxBracketItem, idx: number) => (
                <div
                  key={idx}
                  style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr auto', gap: 10, alignItems: 'center' }}
                >
                  <Badge tone="primary">Bậc {idx + 1}</Badge>
                  <input
                    type="number"
                    value={br.up_to ?? ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? null : Number(e.target.value);
                      const next = config.pit_brackets.map((item, i) => (i === idx ? { ...item, up_to: val } : item));
                      setConfig({ ...config, pit_brackets: next });
                    }}
                    placeholder="Trần bậc (Để trống = Trên mức cuối)"
                    style={INPUT_STYLE}
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={br.rate}
                    onChange={(e) => {
                      const next = config.pit_brackets.map((item, i) =>
                        i === idx ? { ...item, rate: Number(e.target.value || 0) } : item
                      );
                      setConfig({ ...config, pit_brackets: next });
                    }}
                    placeholder="Thuế suất (VD: 0.05)"
                    style={INPUT_STYLE}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setConfig({
                        ...config,
                        pit_brackets: config.pit_brackets.filter((_, i) => i !== idx),
                      })
                    }
                    className="btn secondary"
                    style={{ height: 44, padding: '0 10px', color: '#DC2626' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            {canManageConfig && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <button
                  type="submit"
                  style={{
                    height: 44,
                    padding: '0 1.45rem',
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
                  <Save size={15} /> Lưu cấu hình Thuế & Bảo hiểm
                </button>
              </div>
            )}
          </Card>
        </form>
      )}

      {/* Payslip Detail & Adjustment Modal */}
      <CustomModal
        isOpen={Boolean(selectedSlip)}
        onClose={() => setSelectedSlip(null)}
        title={selectedSlip ? `Phiếu Lương Chi Tiết • ${selectedSlip.employee_name}` : ''}
        width={680}
      >
        {selectedSlip && (
          <form onSubmit={handleSaveSlipAdjustments} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
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
                Hoa hồng Deal & OT: <strong>{formatVnd(selectedSlip.commission_pay_vnd + selectedSlip.overtime_pay_vnd)}</strong>
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
                  <label style={LABEL_STYLE}>Thưởng bổ sung trong tháng (VNĐ)</label>
                  <input
                    type="number"
                    min={0}
                    step={500000}
                    value={slipBonusEdit}
                    onChange={(e) => setSlipBonusEdit(e.target.value)}
                    style={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Khấu trừ tạm ứng (VNĐ)</label>
                  <input
                    type="number"
                    min={0}
                    step={500000}
                    value={slipAdvanceEdit}
                    onChange={(e) => setSlipAdvanceEdit(e.target.value)}
                    style={INPUT_STYLE}
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
                justifyContent: 'space-between',
                fontSize: '1rem',
                fontWeight: 800,
              }}
            >
              <span>THỰC LĨNH CHUYỂN KHOẢN (NET):</span>
              <span>{formatVnd(selectedSlip.net_pay_vnd)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" onClick={() => setSelectedSlip(null)} className="btn secondary" style={{ height: 44, padding: '0 1.2rem' }}>
                Đóng
              </button>
              {canEdit && (
                <button
                  type="submit"
                  style={{
                    height: 44,
                    padding: '0 1.4rem',
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
                  <Download size={15} /> Lưu & Tính lại Phiếu lương
                </button>
              )}
            </div>
          </form>
        )}
      </CustomModal>

      {/* Commission Rule Create Modal */}
      <CustomModal isOpen={ruleModalOpen} onClose={() => setRuleModalOpen(false)} title="Thiết Lập Quy Tắc Hoa Hồng Kinh Doanh" width={540}>
        <form onSubmit={handleCreateCommissionRule} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
          <div>
            <label style={LABEL_STYLE}>Tên chính sách hoa hồng *</label>
            <input
              type="text"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              placeholder="Ví dụ: Hoa hồng Doanh số B2B 3%"
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Phương thức tính</label>
            <select
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value as CommissionRuleDto['rule_type'])}
              style={INPUT_STYLE}
            >
              <option value="percentage_revenue">Theo % Doanh thu thực thu</option>
              <option value="fixed_per_won_lead">Thưởng cố định mỗi Deal thắng</option>
            </select>
          </div>
          {ruleType === 'fixed_per_won_lead' ? (
            <div>
              <label style={LABEL_STYLE}>Số tiền thưởng / 1 Deal thắng (VNĐ)</label>
              <input type="number" min={0} step={100000} value={ruleFixed} onChange={(e) => setRuleFixed(e.target.value)} style={INPUT_STYLE} />
            </div>
          ) : (
            <div>
              <label style={LABEL_STYLE}>Tỷ lệ hoa hồng (%)</label>
              <input type="number" min={0} step="0.5" value={rulePct} onChange={(e) => setRulePct(e.target.value)} style={INPUT_STYLE} />
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" onClick={() => setRuleModalOpen(false)} className="btn secondary" style={{ height: 44, padding: '0 1.2rem' }}>
              Hủy
            </button>
            <button
              type="submit"
              style={{
                height: 44,
                padding: '0 1.4rem',
                borderRadius: 12,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Lưu quy tắc
            </button>
          </div>
        </form>
      </CustomModal>
    </div>
  );
};

export default ErpPayrollWave2Entry;
