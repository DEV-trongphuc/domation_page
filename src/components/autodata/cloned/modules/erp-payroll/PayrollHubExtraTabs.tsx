import React, { useMemo, useState } from 'react';
import { Award, Calculator, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Badge,
  Card,
  EmptyState,
  FormCard,
  Table,
  type TableColumn,
} from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { apiRequest, formatVnd, getErrorMessage } from '../../../autodataApi';
import {
  PAYROLL_SHARED_INPUT_STYLE,
  PAYROLL_SHARED_LABEL_STYLE,
  vndToVietnameseWords,
  type CommissionLedgerDto,
  type CommissionRuleDto,
  type PayrollConfigDto,
  type SimulationResultDto,
  type TaxBracketItem,
} from './payrollTypes';

export interface PayrollHubExtraTabsProps {
  mode: 'commissions_simulator' | 'config';
  targetMonth: string;
  token: string | null;
  tenantSlug: string;
  canCreate: boolean;
  canManageConfig: boolean;
  config: PayrollConfigDto | null;
  onConfigChange: (next: PayrollConfigDto) => void;
  commissionRules: CommissionRuleDto[];
  commissions: CommissionLedgerDto[];
  onReloadAll: () => Promise<void>;
}

export const PayrollHubExtraTabs: React.FC<PayrollHubExtraTabsProps> = ({
  mode,
  targetMonth,
  token,
  tenantSlug,
  canCreate,
  canManageConfig,
  config,
  onConfigChange,
  commissionRules,
  commissions,
  onReloadAll,
}) => {
  // Gross <-> Net Simulator State
  const [simMode, setSimMode] = useState<'gross_to_net' | 'net_to_gross'>('gross_to_net');
  const [simAmount, setSimAmount] = useState('30000000');
  const [simDependents, setSimDependents] = useState('1');
  const [simResident, setSimResident] = useState(true);
  const [simResult, setSimResult] = useState<SimulationResultDto | null>(null);
  const [simRunning, setSimRunning] = useState(false);

  // Commission Rule Modal State
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [ruleType, setRuleType] = useState<CommissionRuleDto['rule_type']>('percentage_revenue');
  const [rulePct, setRulePct] = useState('3');
  const [ruleFixed, setRuleFixed] = useState('500000');

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
        render: (c) => (
          <span style={{ fontWeight: 800, color: '#1E40FF' }}>
            {formatVnd(c.commission_amount_vnd)}
          </span>
        ),
      },
      {
        key: 'st',
        header: 'Trạng thái',
        render: (c) => <Badge tone="success">{c.status}</Badge>,
      },
    ],
    []
  );

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
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
      await onReloadAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể đồng bộ hoa hồng từ CRM.'));
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
      await onReloadAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu quy tắc hoa hồng.'));
    }
  };

  const applyTaxPreset = (preset: 'vn_7_brackets' | 'vn_5_brackets_2026') => {
    if (!config) return;
    if (preset === 'vn_7_brackets') {
      onConfigChange({
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
      onConfigChange({
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
      onConfigChange(saved);
      toast.success('Đã lưu tham số Thuế TNCN, BHXH & Giảm trừ gia cảnh của doanh nghiệp!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu cấu hình thuế & bảo hiểm.'));
    }
  };

  if (mode === 'commissions_simulator') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Simulator Two-Column Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '1.25rem',
          }}
        >
          <Card
            title="Bộ Chuyển Đổi Hai Chiều Gross ↔ Net"
            subtitle="Tính theo cấu hình BHXH & Biểu thuế lũy tiến hiện hành của doanh nghiệp"
          >
            <form
              onSubmit={handleRunSimulation}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}
            >
              <div>
                <label style={PAYROLL_SHARED_LABEL_STYLE}>Chiều quy đổi</label>
                <select
                  value={simMode}
                  onChange={(e) => setSimMode(e.target.value as 'gross_to_net' | 'net_to_gross')}
                  style={PAYROLL_SHARED_INPUT_STYLE}
                >
                  <option value="gross_to_net">Từ Lương GROSS → Tính thực lĩnh NET</option>
                  <option value="net_to_gross">Từ Lương NET mong muốn → Giải ngược lương GROSS</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 10 }}>
                <div>
                  <label style={PAYROLL_SHARED_LABEL_STYLE}>Mức lương đầu vào (VNĐ)</label>
                  <input
                    type="number"
                    min={0}
                    step={500000}
                    value={simAmount}
                    onChange={(e) => setSimAmount(e.target.value)}
                    style={PAYROLL_SHARED_INPUT_STYLE}
                  />
                </div>
                <div>
                  <label style={PAYROLL_SHARED_LABEL_STYLE}>Số người phụ thuộc</label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={simDependents}
                    onChange={(e) => setSimDependents(e.target.value)}
                    style={PAYROLL_SHARED_INPUT_STYLE}
                  />
                </div>
              </div>
              <div style={{ fontSize: '0.76rem', color: '#1E40FF' }}>
                Đầu vào bằng chữ: <strong>{vndToVietnameseWords(Number(simAmount || 0))}</strong>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.83rem', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={simResident}
                  onChange={(e) => setSimResident(e.target.checked)}
                />
                Cá nhân cư trú có HĐLĐ ≥ 3 tháng (Tính biểu thuế lũy tiến từng phần)
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
                <Calculator size={16} />
                {simRunning ? 'Đang giải phương trình thuế...' : 'Tính toán bóc tách Gross ↔ Net'}
              </button>
            </form>
          </Card>

          <Card title="Kết Quả Bóc Tách Thuế TNCN & Bảo Hiểm Chi Tiết">
            {!simResult ? (
              <EmptyState
                icon={<Calculator size={24} />}
                title="Bấm 'Tính toán bóc tách Gross ↔ Net' để xem kết quả"
                description="Hiển thị đầy đủ từng bậc thuế TNCN lũy tiến, mức trích BHXH/BHYT/BHTN và tổng chi phí người sử dụng lao động."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.84rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.55rem 0.85rem', borderRadius: 10, background: '#F8FAFF' }}>
                  <span>Lương GROSS:</span>
                  <strong style={{ color: '#1E40FF' }}>{formatVnd(simResult.gross_pay_vnd)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0.85rem' }}>
                  <span>Khấu trừ Bảo hiểm NLĐ (10.5%):</span>
                  <strong>-{formatVnd(simResult.emp_insurance_total_vnd)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0.85rem' }}>
                  <span>Giảm trừ gia cảnh:</span>
                  <strong>{formatVnd(simResult.family_deduction_vnd)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0.85rem' }}>
                  <span>Thu nhập tính thuế TNCN:</span>
                  <strong>{formatVnd(simResult.assessable_income_vnd)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0.85rem', color: '#D97706' }}>
                  <span>Thuế TNCN phải nộp:</span>
                  <strong>-{formatVnd(simResult.pit_tax_vnd)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.7rem 0.85rem', borderRadius: 12, background: 'rgba(16, 185, 129, 0.10)', color: '#059669', fontWeight: 800 }}>
                  <span>THỰC LĨNH (NET):</span>
                  <span>{formatVnd(simResult.net_pay_vnd)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.85rem', borderRadius: 10, background: '#F8F9FA', color: '#475569' }}>
                  <span>Tổng chi phí Doanh nghiệp (Gross + BH DN):</span>
                  <strong>{formatVnd(simResult.total_employer_cost_vnd)}</strong>
                </div>
                {simResult.pit_breakdown.map((b) => (
                  <div
                    key={b.bracket_index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.76rem',
                      color: '#64748B',
                      borderBottom: '1px dashed #E2E8F0',
                      padding: '3px 0',
                    }}
                  >
                    <span>
                      Bậc {b.bracket_index} ({Math.round(b.rate * 100)}% trên {formatVnd(b.taxable_slice_vnd)})
                    </span>
                    <strong>{formatVnd(b.tax_vnd)}</strong>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* CRM Commission Rules & Ledger */}
        <Card
          title={`Quy Tắc Trích Thưởng & Sổ Hoa Hồng CRM Kỳ ${targetMonth}`}
          subtitle="Tự động tính hoa hồng từ các Deal thắng CRM và cộng trực tiếp vào bảng lương tháng"
          actions={
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {canCreate && (
                <button
                  type="button"
                  onClick={() => void handleSyncWonLeadsCommission()}
                  className="btn secondary"
                  style={{ height: 40, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <RefreshCw size={14} /> Đồng bộ Deal thắng CRM ({targetMonth})
                </button>
              )}
              {canManageConfig && (
                <button
                  type="button"
                  onClick={() => setRuleModalOpen(true)}
                  style={{
                    height: 40,
                    padding: '0 1rem',
                    borderRadius: 10,
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
          }
        >
          {commissionRules.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '0.9rem',
                marginBottom: '1rem',
              }}
            >
              {commissionRules.map((r) => (
                <FormCard
                  key={r.id}
                  icon={<Award size={18} />}
                  title={r.name}
                  description={
                    r.rule_type === 'fixed_per_won_lead'
                      ? `Thưởng cố định ${formatVnd(r.fixed_amount_vnd)} / Deal chốt thành công`
                      : `Trích ${r.flat_rate_pct}% trên tổng doanh thu thực thu`
                  }
                  badge={<Badge tone="success">Đang áp dụng</Badge>}
                />
              ))}
            </div>
          )}

          <Table<CommissionLedgerDto>
            columns={commissionColumns}
            rows={commissions}
            rowKey={(c) => c.id}
            emptyTitle="Chưa có bút toán hoa hồng nào trong kỳ này"
            emptyDescription="Thiết lập quy tắc hoa hồng và bấm 'Đồng bộ Deal thắng CRM' để tự động ghi nhận."
          />
        </Card>

        <CustomModal
          isOpen={ruleModalOpen}
          onClose={() => setRuleModalOpen(false)}
          title="Thiết Lập Chính Sách Hoa Hồng Kinh Doanh"
          width={520}
        >
          <form onSubmit={handleCreateCommissionRule} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
            <div>
              <label style={PAYROLL_SHARED_LABEL_STYLE}>Tên chính sách hoa hồng *</label>
              <input
                type="text"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="VD: Hoa hồng 3% Doanh số chốt mới"
                style={PAYROLL_SHARED_INPUT_STYLE}
              />
            </div>
            <div>
              <label style={PAYROLL_SHARED_LABEL_STYLE}>Phương thức tính thưởng</label>
              <select
                value={ruleType}
                onChange={(e) => setRuleType(e.target.value as CommissionRuleDto['rule_type'])}
                style={PAYROLL_SHARED_INPUT_STYLE}
              >
                <option value="percentage_revenue">Tỷ lệ % trên doanh thu Deal thắng</option>
                <option value="fixed_per_won_lead">Số tiền cố định trên mỗi Deal chốt thành công</option>
              </select>
            </div>
            {ruleType === 'fixed_per_won_lead' ? (
              <div>
                <label style={PAYROLL_SHARED_LABEL_STYLE}>Mức thưởng cố định / Deal (VNĐ)</label>
                <input
                  type="number"
                  min={0}
                  step={100000}
                  value={ruleFixed}
                  onChange={(e) => setRuleFixed(e.target.value)}
                  style={PAYROLL_SHARED_INPUT_STYLE}
                />
              </div>
            ) : (
              <div>
                <label style={PAYROLL_SHARED_LABEL_STYLE}>Tỷ lệ hoa hồng (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.5"
                  value={rulePct}
                  onChange={(e) => setRulePct(e.target.value)}
                  style={PAYROLL_SHARED_INPUT_STYLE}
                />
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setRuleModalOpen(false)}
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
                Lưu quy tắc
              </button>
            </div>
          </form>
        </CustomModal>
      </div>
    );
  }

  /* ================= CONFIG TAB ================= */
  if (!config) {
    return (
      <EmptyState
        title="Đang khởi tạo cấu hình Thuế TNCN & Bảo hiểm của doanh nghiệp"
        description="Vui lòng làm mới trang hoặc kiểm tra phân quyền quản trị bảng lương."
      />
    );
  }

  return (
    <form onSubmit={handleSavePayrollConfig} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <Card
        title="Tham Số Bảo Hiểm Bắt Buộc, Giảm Trừ Gia Cảnh & Cơ Quan Thuế"
        subtitle="Cấu hình động 100% theo quy định pháp luật và chính sách riêng của từng doanh nghiệp"
        actions={
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => applyTaxPreset('vn_7_brackets')}
              className="btn secondary"
              style={{ height: 36, fontSize: '0.76rem' }}
            >
              Nạp chuẩn VN 7 bậc (11tr / 4,4tr)
            </button>
            <button
              type="button"
              onClick={() => applyTaxPreset('vn_5_brackets_2026')}
              className="btn secondary"
              style={{ height: 36, fontSize: '0.76rem', color: '#1E40FF' }}
            >
              Nạp chuẩn VN 5 bậc mới (15,5tr / 6,2tr)
            </button>
          </div>
        }
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '0.85rem',
          }}
        >
          <div>
            <label style={PAYROLL_SHARED_LABEL_STYLE}>Giảm trừ bản thân (VNĐ/tháng)</label>
            <input
              type="number"
              value={config.personal_deduction_vnd}
              onChange={(e) =>
                onConfigChange({ ...config, personal_deduction_vnd: Number(e.target.value || 0) })
              }
              style={PAYROLL_SHARED_INPUT_STYLE}
            />
          </div>
          <div>
            <label style={PAYROLL_SHARED_LABEL_STYLE}>Giảm trừ mỗi Người phụ thuộc (VNĐ)</label>
            <input
              type="number"
              value={config.dependent_deduction_vnd}
              onChange={(e) =>
                onConfigChange({ ...config, dependent_deduction_vnd: Number(e.target.value || 0) })
              }
              style={PAYROLL_SHARED_INPUT_STYLE}
            />
          </div>
          <div>
            <label style={PAYROLL_SHARED_LABEL_STYLE}>Trần miễn thuế Ăn trưa (VNĐ)</label>
            <input
              type="number"
              value={config.meal_allowance_exempt_cap_vnd}
              onChange={(e) =>
                onConfigChange({
                  ...config,
                  meal_allowance_exempt_cap_vnd: Number(e.target.value || 0),
                })
              }
              style={PAYROLL_SHARED_INPUT_STYLE}
            />
          </div>
          <div>
            <label style={PAYROLL_SHARED_LABEL_STYLE}>Trần lương đóng BHXH/BHYT (VNĐ)</label>
            <input
              type="number"
              value={config.bhxh_salary_cap_vnd}
              onChange={(e) =>
                onConfigChange({ ...config, bhxh_salary_cap_vnd: Number(e.target.value || 0) })
              }
              style={PAYROLL_SHARED_INPUT_STYLE}
            />
          </div>
          <div>
            <label style={PAYROLL_SHARED_LABEL_STYLE}>Tỷ lệ BHXH NLĐ (VD: 0.08 = 8%)</label>
            <input
              type="number"
              step="0.001"
              value={config.emp_bhxh_rate}
              onChange={(e) =>
                onConfigChange({ ...config, emp_bhxh_rate: Number(e.target.value || 0) })
              }
              style={PAYROLL_SHARED_INPUT_STYLE}
            />
          </div>
          <div>
            <label style={PAYROLL_SHARED_LABEL_STYLE}>Tỷ lệ BHYT NLĐ (VD: 0.015 = 1.5%)</label>
            <input
              type="number"
              step="0.001"
              value={config.emp_bhyt_rate}
              onChange={(e) =>
                onConfigChange({ ...config, emp_bhyt_rate: Number(e.target.value || 0) })
              }
              style={PAYROLL_SHARED_INPUT_STYLE}
            />
          </div>
          <div>
            <label style={PAYROLL_SHARED_LABEL_STYLE}>Tỷ lệ BHTN NLĐ (VD: 0.01 = 1%)</label>
            <input
              type="number"
              step="0.001"
              value={config.emp_bhtn_rate}
              onChange={(e) =>
                onConfigChange({ ...config, emp_bhtn_rate: Number(e.target.value || 0) })
              }
              style={PAYROLL_SHARED_INPUT_STYLE}
            />
          </div>
          <div>
            <label style={PAYROLL_SHARED_LABEL_STYLE}>Mã Cơ quan Thuế quản lý (HTKK)</label>
            <input
              type="text"
              value={config.tax_authority_code || ''}
              onChange={(e) => onConfigChange({ ...config, tax_authority_code: e.target.value })}
              placeholder="VD: 70100"
              style={PAYROLL_SHARED_INPUT_STYLE}
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
              onConfigChange({
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
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr 1fr auto',
                gap: 10,
                alignItems: 'center',
              }}
            >
              <Badge tone="primary">Bậc {idx + 1}</Badge>
              <input
                type="number"
                value={br.up_to ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? null : Number(e.target.value);
                  const next = config.pit_brackets.map((item, i) =>
                    i === idx ? { ...item, up_to: val } : item
                  );
                  onConfigChange({ ...config, pit_brackets: next });
                }}
                placeholder="Trần bậc (Để trống = Trên mức cuối)"
                style={PAYROLL_SHARED_INPUT_STYLE}
              />
              <input
                type="number"
                step="0.01"
                value={br.rate}
                onChange={(e) => {
                  const next = config.pit_brackets.map((item, i) =>
                    i === idx ? { ...item, rate: Number(e.target.value || 0) } : item
                  );
                  onConfigChange({ ...config, pit_brackets: next });
                }}
                placeholder="Thuế suất (VD: 0.05)"
                style={PAYROLL_SHARED_INPUT_STYLE}
              />
              <button
                type="button"
                onClick={() =>
                  onConfigChange({
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
  );
};
