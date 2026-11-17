import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Percent,
  Printer,
  Send,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card, EmptyState, PillTabs, Table, type TableColumn } from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { apiRequest, formatShortDate, formatVnd, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { HrmTimesheetSkeleton, SignatureCanvasPad } from './PayrollSkeleton';
import {
  PAYROLL_SHARED_INPUT_STYLE,
  PAYROLL_SHARED_LABEL_STYLE,
  buildPeriodSelectorOptions,
  buildSinglePayslipCsv,
  formatPayrollDocumentTitle,
  formatPayrollPeriodLabel,
  normalizeLegalEntity,
  normalizeMyPayslipsPayload,
  triggerBrowserFileDownload,
  vndToVietnameseWords,
  type ApprovalWorkflowLiteDto,
  type LegalEntityInfoDto,
  type PayrollSlipDto,
  type PersonalApprovalRequestDto,
} from './payrollTypes';

type MyPayslipSubTab = 'payslip' | 'leaves' | 'advances';

export interface MyPayslipsViewProps {
  embedded?: boolean;
}

const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: 'Nghỉ phép năm hưởng nguyên lương',
  sick: 'Nghỉ ốm / Điều trị y tế',
  comp_off: 'Nghỉ bù làm thêm giờ',
  unpaid: 'Nghỉ việc riêng không hưởng lương',
  special: 'Nghỉ chế độ (Thai sản / Hiếu / Hỷ)',
};

export const MyPayslipsView: React.FC<MyPayslipsViewProps> = ({ embedded = false }) => {
  const { token, tenantSlug, companyName, tenantSettings, user } = useAuth();
  const brandLogoUrl =
    typeof tenantSettings?.brand_logo_url === 'string' ? tenantSettings.brand_logo_url : '';

  const [initialClock] = useState(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      ym: now.toISOString().slice(0, 7),
      todayIso: now.toISOString().slice(0, 10),
      todayVi: now.toLocaleDateString('vi-VN'),
    };
  });

  const [subTab, setSubTab] = useState<MyPayslipSubTab>('payslip');
  const [selectedYear, setSelectedYear] = useState<number>(initialClock.year);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(initialClock.ym);

  const [loading, setLoading] = useState(true);
  const [legalEntity, setLegalEntity] = useState<LegalEntityInfoDto>(() =>
    normalizeLegalEntity({}, companyName, brandLogoUrl)
  );
  const [yearSlips, setYearSlips] = useState<PayrollSlipDto[]>([]);
  const [currentSlip, setCurrentSlip] = useState<PayrollSlipDto | null>(null);

  // Digital Signature & Dispute States
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);

  // Leave & Advance Self-Service States
  const [workflows, setWorkflows] = useState<ApprovalWorkflowLiteDto[]>([]);
  const [myRequests, setMyRequests] = useState<PersonalApprovalRequestDto[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const [leaveType, setLeaveType] = useState('annual');
  const [leaveStart, setLeaveStart] = useState(initialClock.todayIso);
  const [leaveEnd, setLeaveEnd] = useState(initialClock.todayIso);
  const [leaveDays, setLeaveDays] = useState('1');
  const [leaveReason, setLeaveReason] = useState('');
  const [submittingLeave, setSubmittingLeave] = useState(false);

  const [advanceAmount, setAdvanceAmount] = useState('5000000');
  const [advancePayoutDate, setAdvancePayoutDate] = useState(initialClock.todayIso);
  const [advanceReason, setAdvanceReason] = useState('');
  const [submittingAdvance, setSubmittingAdvance] = useState(false);

  const periodItems = useMemo(() => buildPeriodSelectorOptions(selectedYear), [selectedYear]);
  const availableYears = useMemo(
    () => [initialClock.year + 1, initialClock.year, initialClock.year - 1, initialClock.year - 2],
    [initialClock.year]
  );

  const loadMyPayslips = useCallback(
    async (periodKey: string, yearNum: number) => {
      try {
        const [periodRaw, allRaw] = await Promise.all([
          apiRequest<unknown>(`/payroll/my-payslips?period_key=${encodeURIComponent(periodKey)}`, {
            token,
            tenantSlug,
          }).catch(() => null),
          apiRequest<unknown>(`/payroll/my-payslips?year=${yearNum}`, {
            token,
            tenantSlug,
          }).catch(() => null),
        ]);

        const normPeriod = normalizeMyPayslipsPayload(
          periodRaw,
          companyName,
          brandLogoUrl,
          periodKey
        );
        const normYear = normalizeMyPayslipsPayload(allRaw, companyName, brandLogoUrl, periodKey);

        const mergedEntity =
          normPeriod.legalEntity.tax_code || normPeriod.legalEntity.address
            ? normPeriod.legalEntity
            : normYear.legalEntity;
        setLegalEntity(mergedEntity);

        const slipMap = new Map<string, PayrollSlipDto>();
        for (const s of [...normYear.slips, ...normPeriod.slips]) {
          const key = s.period_key || s.id;
          if (key) slipMap.set(key, s);
        }
        const mergedSlips = Array.from(slipMap.values());
        setYearSlips(mergedSlips);

        const exact =
          normPeriod.currentSlip &&
          (!normPeriod.currentSlip.period_key || normPeriod.currentSlip.period_key === periodKey)
            ? normPeriod.currentSlip
            : mergedSlips.find((s) => s.period_key === periodKey) || null;
        setCurrentSlip(exact);
        setSignatureDataUrl(null);
      } finally {
        setLoading(false);
      }
    },
    [token, tenantSlug, companyName, brandLogoUrl]
  );

  const loadPersonalApprovals = useCallback(async () => {
    try {
      const [wfRes, reqRes] = await Promise.all([
        apiRequest<ApprovalWorkflowLiteDto[]>('/approvals/workflows', {
          token,
          tenantSlug,
        }).catch(() => []),
        apiRequest<PersonalApprovalRequestDto[]>('/approvals/requests?view=mine', {
          token,
          tenantSlug,
        }).catch(() => []),
      ]);
      setWorkflows(Array.isArray(wfRes) ? wfRes : []);
      setMyRequests(Array.isArray(reqRes) ? reqRes : []);
    } finally {
      setLoadingRequests(false);
    }
  }, [token, tenantSlug]);

  useEffect(() => {
    void loadMyPayslips(selectedPeriod, selectedYear);
  }, [loadMyPayslips, selectedPeriod, selectedYear]);

  useEffect(() => {
    if (subTab === 'leaves' || subTab === 'advances') {
      void loadPersonalApprovals();
    }
  }, [subTab, loadPersonalApprovals]);

  const ytdStats = useMemo(() => {
    const prefix = `${selectedYear}-`;
    const list = yearSlips.filter((s) => !s.period_key || s.period_key.startsWith(prefix));
    const totalNet = list.reduce((acc, s) => acc + s.net_pay_vnd, 0);
    const totalIns = list.reduce(
      (acc, s) => acc + s.emp_bhxh_vnd + s.emp_bhyt_vnd + s.emp_bhtn_vnd,
      0
    );
    const totalBonusComm = list.reduce(
      (acc, s) => acc + s.commission_pay_vnd + s.bonus_vnd + s.overtime_pay_vnd,
      0
    );
    const totalPit = list.reduce((acc, s) => acc + s.pit_tax_vnd, 0);
    return {
      totalNet,
      avgNet: list.length > 0 ? Math.round(totalNet / list.length) : 0,
      totalIns,
      totalBonusComm,
      totalPit,
      count: list.length,
    };
  }, [yearSlips, selectedYear]);

  const leaveRequests = useMemo(
    () => myRequests.filter((r) => r.category === 'leave'),
    [myRequests]
  );

  const advanceRequests = useMemo(
    () => myRequests.filter((r) => r.category === 'cash_advance'),
    [myRequests]
  );

  const resolveWorkflowId = (targetCategory: 'leave' | 'cash_advance'): string | null => {
    const active = workflows.filter((w) => w.is_active !== false);
    const matched = active.find((w) => w.category === targetCategory);
    if (matched) return matched.id;
    return active[0]?.id || workflows[0]?.id || null;
  };

  const handleSignPayslip = async () => {
    if (!currentSlip) return;
    if (!signatureDataUrl) {
      toast.error('Vui lòng ký điện tử vào khung chữ ký trước khi xác nhận!');
      return;
    }
    setSigning(true);
    try {
      await apiRequest(`/payroll/slips/${currentSlip.id}/sign`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          signature_data_url: signatureDataUrl,
          signature_url: signatureDataUrl,
          period_key: selectedPeriod,
        },
      });
      toast.success(`Đã ký số xác nhận phiếu lương ${formatPayrollPeriodLabel(selectedPeriod)}!`);
      await loadMyPayslips(selectedPeriod, selectedYear);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể ký xác nhận phiếu lương.'));
    } finally {
      setSigning(false);
    }
  };

  const handleDisputePayslip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSlip) return;
    if (!disputeReason.trim()) {
      toast.error('Vui lòng nhập nội dung thắc mắc hoặc điểm cần đối soát lại.');
      return;
    }
    setSubmittingDispute(true);
    try {
      await apiRequest(`/payroll/slips/${currentSlip.id}/dispute`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          reason: disputeReason.trim(),
          dispute_reason: disputeReason.trim(),
          note: disputeReason.trim(),
          period_key: selectedPeriod,
        },
      });
      toast.success('Đã gửi thắc mắc lương tới Phòng Nhân sự & Kế toán!');
      setDisputeReason('');
      setDisputeModalOpen(false);
      await loadMyPayslips(selectedPeriod, selectedYear);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi thắc mắc phiếu lương.'));
    } finally {
      setSubmittingDispute(false);
    }
  };

  const handleDownloadSlipCsv = () => {
    if (!currentSlip) return;
    const csv = buildSinglePayslipCsv(currentSlip, legalEntity, selectedPeriod);
    triggerBrowserFileDownload(
      `Phieu_luong_${currentSlip.employee_code || 'NV'}_${selectedPeriod}.csv`,
      csv,
      'text/csv;charset=utf-8'
    );
    toast.success('Đã tải xuống bảng chi tiết phiếu lương CSV!');
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStart || !leaveEnd || !leaveReason.trim()) {
      toast.error('Vui lòng chọn ngày nghỉ và nhập lý do bàn giao công việc.');
      return;
    }
    const wfId = resolveWorkflowId('leave');
    if (!wfId) {
      toast.error('Chưa tìm thấy quy trình duyệt nghỉ phép đang hoạt động.');
      return;
    }
    const daysNum = Math.max(0.5, Number(leaveDays || 1));
    setSubmittingLeave(true);
    try {
      await apiRequest('/approvals/requests', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          workflow_id: wfId,
          category: 'leave',
          title: `Đơn xin nghỉ phép (${daysNum} ngày): ${LEAVE_TYPE_LABELS[leaveType] || leaveType}`,
          description: leaveReason.trim(),
          start_date: leaveStart,
          end_date: leaveEnd,
          amount_vnd: 0,
          form_data: {
            leave_type: leaveType,
            leave_type_label: LEAVE_TYPE_LABELS[leaveType] || leaveType,
            total_days: daysNum,
            reason: leaveReason.trim(),
          },
        },
      });
      toast.success('Đã gửi đơn xin nghỉ phép vào luồng phê duyệt!');
      setLeaveReason('');
      await loadPersonalApprovals();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi đơn xin nghỉ phép.'));
    } finally {
      setSubmittingLeave(false);
    }
  };

  const handleSubmitAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Math.round(Number(advanceAmount || 0));
    if (amt <= 0 || !advanceReason.trim()) {
      toast.error('Vui lòng nhập số tiền tạm ứng hợp lệ và lý do đề nghị.');
      return;
    }
    const wfId = resolveWorkflowId('cash_advance');
    if (!wfId) {
      toast.error('Chưa tìm thấy quy trình duyệt tạm ứng lương đang hoạt động.');
      return;
    }
    setSubmittingAdvance(true);
    try {
      await apiRequest('/approvals/requests', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          workflow_id: wfId,
          category: 'cash_advance',
          title: `Đề nghị tạm ứng lương ${formatVnd(amt)}`,
          description: advanceReason.trim(),
          start_date: advancePayoutDate || null,
          amount_vnd: amt,
          form_data: {
            payout_date: advancePayoutDate,
            reason: advanceReason.trim(),
          },
        },
      });
      toast.success('Đã gửi đề nghị tạm ứng lương tới cấp phê duyệt!');
      setAdvanceReason('');
      await loadPersonalApprovals();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi đề nghị tạm ứng lương.'));
    } finally {
      setSubmittingAdvance(false);
    }
  };

  const approvalColumns = useMemo<ReadonlyArray<TableColumn<PersonalApprovalRequestDto>>>(
    () => [
      {
        key: 'title',
        header: 'Nội dung đề xuất',
        render: (r) => (
          <div>
            <div style={{ fontWeight: 700, color: '#0F172A' }}>{r.title}</div>
            <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>
              {r.description || '—'}
            </div>
          </div>
        ),
      },
      {
        key: 'meta',
        header: 'Thời gian / Số tiền',
        render: (r) =>
          r.category === 'cash_advance' ? (
            <span style={{ fontWeight: 800, color: '#1E40FF' }}>{formatVnd(r.amount_vnd)}</span>
          ) : (
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
              {r.start_date || '—'} → {r.end_date || '—'} (
              {String(r.form_data?.total_days ?? 1)} ngày)
            </span>
          ),
      },
      {
        key: 'steps',
        header: 'Tiến độ duyệt',
        render: (r) => (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {r.step_logs.length === 0 ? (
              <Badge tone="neutral">{r.workflow_name || 'Tự động'}</Badge>
            ) : (
              r.step_logs.map((st) => (
                <Badge
                  key={st.id}
                  tone={
                    st.status === 'approved'
                      ? 'success'
                      : st.status === 'rejected'
                        ? 'danger'
                        : 'warning'
                  }
                >
                  B{st.step_order}: {st.assigned_user_name || st.step_name}
                </Badge>
              ))
            )}
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Trạng thái',
        render: (r) => (
          <Badge
            tone={
              r.status === 'approved'
                ? 'success'
                : r.status === 'rejected' || r.status === 'returned'
                  ? 'danger'
                  : 'warning'
            }
          >
            {r.status === 'approved'
              ? 'Đã phê duyệt'
              : r.status === 'rejected'
                ? 'Từ chối'
                : r.status === 'returned'
                  ? 'Yêu cầu bổ sung'
                  : 'Đang chờ duyệt'}
          </Badge>
        ),
      },
      {
        key: 'created',
        header: 'Ngày gửi',
        render: (r) => (
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
            {formatShortDate(r.created_at)}
          </span>
        ),
      },
    ],
    []
  );

  if (loading) {
    return <HrmTimesheetSkeleton />;
  }

  return (
    <div style={{ background: '#F8F9FA', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      {!embedded && (
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
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, color: '#0F172A' }}>
                  Cổng Thu Nhập Cá Nhân, Ký Số Phiếu Lương & Tự Phục Vụ HRM
                </h1>
                <Badge tone="primary">{user?.name || 'Nhân sự'}</Badge>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                Tra cứu bảng lương 12 tháng + Thưởng T13/Giữa năm/Cuối năm, ký nhận điện tử, đối soát lương, xin phép & tạm ứng.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <select
                value={selectedYear}
                onChange={(e) => {
                  const yr = Number(e.target.value);
                  setSelectedYear(yr);
                  const suffix = selectedPeriod.split('-')[1] || '01';
                  setSelectedPeriod(`${yr}-${suffix}`);
                }}
                style={{ ...PAYROLL_SHARED_INPUT_STYLE, width: 120, fontWeight: 700 }}
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    Năm {yr}
                  </option>
                ))}
              </select>

              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                style={{ ...PAYROLL_SHARED_INPUT_STYLE, width: 215, fontWeight: 700 }}
              >
                {periodItems.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      )}

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <PillTabs<MyPayslipSubTab>
          activeKey={subTab}
          onChange={setSubTab}
          tabs={[
            { key: 'payslip', label: 'Phiếu lương của tôi', icon: <FileText size={15} /> },
            {
              key: 'leaves',
              label: 'Đơn nghỉ phép của tôi',
              icon: <Calendar size={15} />,
              count: leaveRequests.length,
            },
            {
              key: 'advances',
              label: 'Đề nghị tạm ứng lương',
              icon: <Wallet size={15} />,
              count: advanceRequests.length,
            },
          ]}
        />

        {embedded && subTab === 'payslip' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select
              value={selectedYear}
              onChange={(e) => {
                const yr = Number(e.target.value);
                setSelectedYear(yr);
                const suffix = selectedPeriod.split('-')[1] || '01';
                setSelectedPeriod(`${yr}-${suffix}`);
              }}
              style={{ ...PAYROLL_SHARED_INPUT_STYLE, width: 112, height: 40, fontWeight: 700 }}
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Năm {yr}
                </option>
              ))}
            </select>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              style={{ ...PAYROLL_SHARED_INPUT_STYLE, width: 205, height: 40, fontWeight: 700 }}
            >
              {periodItems.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* SUB-TAB 1: PHIẾU LƯƠNG CỦA TÔI */}
      {subTab === 'payslip' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(205px, 1fr))',
              gap: '1rem',
            }}
          >
            <Card padding="1rem 1.2rem">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.73rem', fontWeight: 800, color: '#64748B' }}>
                  TỔNG THỰC NHẬN NĂM {selectedYear}
                </span>
                <Wallet size={16} color="#059669" />
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', marginTop: 6 }}>
                {formatVnd(ytdStats.totalNet)}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 4 }}>
                Bình quân: <strong>{formatVnd(ytdStats.avgNet)}</strong> / kỳ ({ytdStats.count} kỳ)
              </div>
            </Card>

            <Card padding="1rem 1.2rem">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.73rem', fontWeight: 800, color: '#64748B' }}>
                  BẢO HIỂM TÍCH LŨY (NLĐ)
                </span>
                <ShieldCheck size={16} color="#1E40FF" />
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginTop: 6 }}>
                {formatVnd(ytdStats.totalIns)}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 4 }}>
                BHXH 8% • BHYT 1.5% • BHTN 1%
              </div>
            </Card>

            <Card padding="1rem 1.2rem">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.73rem', fontWeight: 800, color: '#64748B' }}>
                  HOA HỒNG, THƯỞNG & OT
                </span>
                <Award size={16} color="#0284C7" />
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1E40FF', marginTop: 6 }}>
                {formatVnd(ytdStats.totalBonusComm)}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 4 }}>
                Tổng thưởng KPI, hoa hồng & tăng ca
              </div>
            </Card>

            <Card padding="1rem 1.2rem">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.73rem', fontWeight: 800, color: '#64748B' }}>
                  THUẾ TNCN TẠM KHẤU TRỪ
                </span>
                <Percent size={16} color="#D97706" />
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D97706', marginTop: 6 }}>
                {formatVnd(ytdStats.totalPit)}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 4 }}>
                Đối chiếu quyết toán 05/QTT-TNCN
              </div>
            </Card>
          </div>

          {/* 12 Months + 13 + MID + YEND Selector Grid */}
          <Card
            title={`Kỳ Lương & Thưởng Năm ${selectedYear}`}
            subtitle="Chọn tháng hoặc kỳ thưởng đặc biệt (Lương tháng 13, Thưởng giữa năm, Thưởng cuối năm)"
            padding="1.15rem 1.35rem"
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(128px, 1fr))',
                gap: 10,
              }}
            >
              {periodItems.map((item) => {
                const matched = yearSlips.find((s) => s.period_key === item.value);
                const isSelected = selectedPeriod === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setSelectedPeriod(item.value)}
                    style={{
                      padding: '10px 10px',
                      borderRadius: 12,
                      border: isSelected
                        ? '2px solid #1E40FF'
                        : item.isSpecial
                          ? '1px dashed #93C5FD'
                          : '1px solid #E2E8F0',
                      background: isSelected ? '#EEF2FF' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'all 0.16s ease',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: isSelected ? '#1E40FF' : '#334155',
                      }}
                    >
                      {item.shortLabel}
                    </span>
                    {matched ? (
                      <>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#059669' }}>
                          {formatVnd(matched.net_pay_vnd)}
                        </span>
                        <Badge
                          tone={
                            matched.confirmation_status === 'signed'
                              ? 'success'
                              : matched.confirmation_status === 'disputed'
                                ? 'danger'
                                : 'warning'
                          }
                        >
                          {matched.confirmation_status === 'signed'
                            ? 'Đã ký'
                            : matched.confirmation_status === 'disputed'
                              ? 'Đang thắc mắc'
                              : 'Chờ ký'}
                        </Badge>
                      </>
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Chưa phát sinh</span>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Payslip Document & Signature Sheet */}
          {!currentSlip ? (
            <EmptyState
              icon={<FileText size={24} />}
              title={`Chưa có phiếu lương cho kỳ ${formatPayrollPeriodLabel(selectedPeriod)}`}
              description="Khi bộ phận Nhân sự & Kế toán tổng hợp và phát hành bảng lương cho kỳ này, phiếu lương cá nhân của bạn sẽ hiển thị đầy đủ tại đây."
            />
          ) : (
            <Card padding="1.5rem">
              <style>{`
                @media print {
                  body * { visibility: hidden !important; }
                  #domation-my-payslip-sheet, #domation-my-payslip-sheet * { visibility: visible !important; }
                  #domation-my-payslip-sheet { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; padding: 14mm !important; box-shadow: none !important; border: none !important; }
                  .no-print-payslip { display: none !important; }
                }
              `}</style>

              <div
                className="no-print-payslip"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  marginBottom: '1.1rem',
                  paddingBottom: '0.9rem',
                  borderBottom: '1px solid #F1F5F9',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Badge
                    tone={
                      currentSlip.confirmation_status === 'signed'
                        ? 'success'
                        : currentSlip.confirmation_status === 'disputed'
                          ? 'danger'
                          : 'warning'
                    }
                    icon={<ShieldCheck size={13} />}
                  >
                    {currentSlip.confirmation_status === 'signed'
                      ? `Đã ký số xác nhận ${currentSlip.signed_at ? `(${formatShortDate(currentSlip.signed_at)})` : ''}`
                      : currentSlip.confirmation_status === 'disputed'
                        ? 'Đang chờ Kế toán phản hồi thắc mắc'
                        : 'Chờ nhân sự kiểm tra & ký xác nhận'}
                  </Badge>
                  <Badge tone={currentSlip.payment_status === 'paid' ? 'success' : 'info'}>
                    {currentSlip.payment_status === 'paid' ? 'Đã chi trả UNC' : 'Chờ chi lương'}
                  </Badge>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setDisputeModalOpen(true)}
                    style={{
                      height: 40,
                      padding: '0 0.95rem',
                      borderRadius: 10,
                      border: '1px solid #FDE68A',
                      background: '#FFFBEB',
                      color: '#B45309',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer',
                    }}
                  >
                    <AlertCircle size={15} /> Thắc mắc lương
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadSlipCsv}
                    style={{
                      height: 40,
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
                    <FileSpreadsheet size={15} /> Tải CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                      height: 40,
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
                    <Printer size={15} /> In / Xuất PDF
                  </button>
                </div>
              </div>

              <div
                id="domation-my-payslip-sheet"
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: 16,
                  padding: '1.4rem',
                  background: '#FFFFFF',
                }}
              >
                {/* Dynamic Legal Entity Header */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 12,
                    borderBottom: '2px solid #1E40FF',
                    paddingBottom: '0.9rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: '#EEF2FF',
                        border: '1px solid #DBEAFE',
                        color: '#1E40FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {legalEntity.logo_url ? (
                        <img
                          src={legalEntity.logo_url}
                          alt="Logo"
                          style={{ width: 32, height: 32, objectFit: 'contain' }}
                        />
                      ) : (
                        <Building2 size={22} />
                      )}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '0.92rem',
                          fontWeight: 800,
                          color: '#0F172A',
                          textTransform: 'uppercase',
                        }}
                      >
                        {legalEntity.legal_entity_name}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: 2 }}>
                        MST: <strong>{legalEntity.tax_code || 'Chưa cập nhật'}</strong>
                        {legalEntity.address ? ` • Địa chỉ: ${legalEntity.address}` : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748B' }}>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>
                      Mã phiếu: PL-{currentSlip.id.slice(0, 8).toUpperCase()}
                    </div>
                    <div>Ngày xuất: {initialClock.todayVi}</div>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800, color: '#0F172A' }}>
                    {formatPayrollDocumentTitle(selectedPeriod)}
                  </h2>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1E40FF', marginTop: 3 }}>
                    Kỳ thanh toán: {formatPayrollPeriodLabel(selectedPeriod)}
                  </div>
                </div>

                {/* Employee Metadata Box */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                    gap: '0.6rem 1.2rem',
                    padding: '0.85rem 1rem',
                    borderRadius: 12,
                    background: '#F8FAFF',
                    border: '1px solid #DBEAFE',
                    fontSize: '0.82rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div>
                    Họ và tên: <strong>{currentSlip.employee_name || user?.name || '—'}</strong>
                  </div>
                  <div>
                    Mã nhân sự: <strong>{currentSlip.employee_code || '—'}</strong>
                  </div>
                  <div>
                    Phòng ban: <strong>{currentSlip.department_name || '—'}</strong>
                  </div>
                  <div>
                    Ngày công hưởng lương:{' '}
                    <strong>
                      {currentSlip.actual_workdays}/{currentSlip.standard_workdays} công
                    </strong>
                  </div>
                  <div>
                    MST cá nhân: <strong>{currentSlip.tax_code || '—'}</strong>
                  </div>
                  <div>
                    Tài khoản nhận:{' '}
                    <strong>
                      {currentSlip.bank_account_number
                        ? `${currentSlip.bank_account_number} (${currentSlip.bank_name || ''})`
                        : '—'}
                    </strong>
                  </div>
                </div>

                {/* Earnings vs Deductions Two-Column Breakdown */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  {/* Earnings */}
                  <div
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: 12,
                      padding: '0.95rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      fontSize: '0.82rem',
                    }}
                  >
                    <div style={{ fontWeight: 800, color: '#1E40FF', fontSize: '0.8rem' }}>
                      I. CÁC KHOẢN THU NHẬP (EARNINGS)
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Lương cơ bản hợp đồng:</span>
                      <span>{formatVnd(currentSlip.base_salary_vnd)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>
                        Lương thực tế theo công ({currentSlip.actual_workdays}/
                        {currentSlip.standard_workdays}):
                      </span>
                      <strong>{formatVnd(currentSlip.prorated_base_pay_vnd)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Phụ cấp định kỳ (Miễn thuế {formatVnd(currentSlip.tax_exempt_vnd)}):</span>
                      <strong>{formatVnd(currentSlip.allowances_vnd)}</strong>
                    </div>
                    {currentSlip.breakdown?.allowance_lines?.map((al) => (
                      <div
                        key={al.key}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          paddingLeft: 12,
                          fontSize: '0.76rem',
                          color: '#64748B',
                        }}
                      >
                        <span>• {al.name}</span>
                        <span>{formatVnd(al.amount_vnd)}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Lương làm thêm giờ ({currentSlip.overtime_hours} giờ):</span>
                      <strong>{formatVnd(currentSlip.overtime_pay_vnd)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Hoa hồng kinh doanh CRM:</span>
                      <strong style={{ color: '#1E40FF' }}>
                        {formatVnd(currentSlip.commission_pay_vnd)}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Thưởng hiệu suất / Chuyên cần:</span>
                      <strong>{formatVnd(currentSlip.bonus_vnd)}</strong>
                    </div>
                    <div
                      style={{
                        marginTop: 'auto',
                        paddingTop: 8,
                        borderTop: '1px dashed #CBD5E1',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontWeight: 800,
                        color: '#1E40FF',
                      }}
                    >
                      <span>TỔNG THU NHẬP GROSS:</span>
                      <span>{formatVnd(currentSlip.gross_pay_vnd)}</span>
                    </div>
                  </div>

                  {/* Deductions & Progressive PIT */}
                  <div
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: 12,
                      padding: '0.95rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      fontSize: '0.82rem',
                    }}
                  >
                    <div style={{ fontWeight: 800, color: '#D97706', fontSize: '0.8rem' }}>
                      II. KHẤU TRỪ BẢO HIỂM & THUẾ TNCN LŨY TIẾN
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>BHXH bắt buộc NLĐ (8%):</span>
                      <strong>-{formatVnd(currentSlip.emp_bhxh_vnd)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>BHYT bắt buộc NLĐ (1.5%):</span>
                      <strong>-{formatVnd(currentSlip.emp_bhyt_vnd)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>BHTN bắt buộc NLĐ (1%):</span>
                      <strong>-{formatVnd(currentSlip.emp_bhtn_vnd)}</strong>
                    </div>
                    {currentSlip.emp_union_vnd > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Đoàn phí công đoàn:</span>
                        <strong>-{formatVnd(currentSlip.emp_union_vnd)}</strong>
                      </div>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.76rem',
                        color: '#64748B',
                      }}
                    >
                      <span>Giảm trừ gia cảnh ({currentSlip.dependents_count} NPT):</span>
                      <span>{formatVnd(currentSlip.family_deduction_vnd)}</span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.76rem',
                        color: '#64748B',
                      }}
                    >
                      <span>Thu nhập tính thuế TNCN:</span>
                      <span>{formatVnd(currentSlip.assessable_income_vnd)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#D97706' }}>
                      <span>Thuế TNCN khấu trừ:</span>
                      <strong>-{formatVnd(currentSlip.pit_tax_vnd)}</strong>
                    </div>
                    {currentSlip.breakdown?.pit_breakdown?.map((sl) => (
                      <div
                        key={sl.bracket_index}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          paddingLeft: 12,
                          fontSize: '0.74rem',
                          color: '#64748B',
                        }}
                      >
                        <span>
                          • Bậc {sl.bracket_index} ({Math.round(sl.rate * 100)}% trên{' '}
                          {formatVnd(sl.taxable_slice_vnd)})
                        </span>
                        <span>{formatVnd(sl.tax_vnd)}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Khấu trừ tạm ứng lương:</span>
                      <strong>-{formatVnd(currentSlip.advance_deduction_vnd)}</strong>
                    </div>
                    {currentSlip.other_deduction_vnd > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Khấu trừ khác:</span>
                        <strong>-{formatVnd(currentSlip.other_deduction_vnd)}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Net Pay Highlight + Vietnamese Words */}
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '1rem 1.2rem',
                    borderRadius: 14,
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#065F46' }}>
                      THỰC LĨNH CHUYỂN KHOẢN (NET PAY)
                    </div>
                    <div
                      style={{
                        fontSize: '0.78rem',
                        fontStyle: 'italic',
                        color: '#047857',
                        marginTop: 2,
                      }}
                    >
                      Bằng chữ: <strong>{vndToVietnameseWords(currentSlip.net_pay_vnd)}</strong>
                    </div>
                  </div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#059669' }}>
                    {formatVnd(currentSlip.net_pay_vnd)}
                  </div>
                </div>

                {/* Dispute Banner */}
                {currentSlip.dispute_reason && (
                  <div
                    style={{
                      marginTop: '0.9rem',
                      padding: '0.75rem 1rem',
                      borderRadius: 12,
                      background: '#FFFBEB',
                      border: '1px solid #FDE68A',
                      color: '#92400E',
                      fontSize: '0.82rem',
                    }}
                  >
                    <strong>Nội dung thắc mắc đã gửi:</strong> {currentSlip.dispute_reason}
                  </div>
                )}

                {/* Signed Signature Preview */}
                {currentSlip.confirmation_status === 'signed' && currentSlip.signature_data_url && (
                  <div
                    style={{
                      marginTop: '1.15rem',
                      display: 'flex',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <div style={{ textAlign: 'center', padding: '0.5rem 1rem' }}>
                      <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                        Người lao động ký số xác nhận
                      </div>
                      <img
                        src={currentSlip.signature_data_url}
                        alt="Chữ ký xác nhận"
                        style={{
                          height: 58,
                          maxWidth: 190,
                          objectFit: 'contain',
                          margin: '6px auto',
                          display: 'block',
                          borderBottom: '1px solid #CBD5E1',
                        }}
                      />
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A' }}>
                        {currentSlip.employee_name || user?.name}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* HTML5 Canvas Digital Signature Box (When Unsigned) */}
              {currentSlip.confirmation_status !== 'signed' && (
                <div
                  className="no-print-payslip"
                  style={{
                    marginTop: '1.15rem',
                    padding: '1.1rem',
                    borderRadius: 16,
                    background: '#F8FAFF',
                    border: '1px solid #DBEAFE',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <SignatureCanvasPad
                    label="Ký số xác nhận đã đối chiếu & đồng ý với bảng lương kỳ này"
                    disabled={signing}
                    onSignatureChange={setSignatureDataUrl}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button
                      type="button"
                      disabled={signing}
                      onClick={() => void handleSignPayslip()}
                      style={{
                        height: 44,
                        padding: '0 1.35rem',
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
                      }}
                    >
                      <CheckCircle2 size={16} />
                      {signing ? 'Đang lưu chữ ký số...' : 'Xác nhận & Ký nhận Phiếu lương'}
                    </button>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* SUB-TAB 2: ĐƠN NGHỈ PHÉP CỦA TÔI */}
      {subTab === 'leaves' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '1.25rem',
            alignItems: 'start',
          }}
        >
          <Card
            title="Đăng Ký Nghỉ Phép Nhanh"
            subtitle="Tự động định tuyến tới Quản lý trực tiếp & Phòng Nhân sự"
          >
            <form
              onSubmit={handleSubmitLeave}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
            >
              <div>
                <label style={PAYROLL_SHARED_LABEL_STYLE}>Hình thức nghỉ phép</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  style={PAYROLL_SHARED_INPUT_STYLE}
                >
                  {Object.entries(LEAVE_TYPE_LABELS).map(([k, lbl]) => (
                    <option key={k} value={k}>
                      {lbl}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.8fr', gap: 10 }}>
                <div>
                  <label style={PAYROLL_SHARED_LABEL_STYLE}>Từ ngày</label>
                  <input
                    type="date"
                    value={leaveStart}
                    onChange={(e) => setLeaveStart(e.target.value)}
                    style={PAYROLL_SHARED_INPUT_STYLE}
                  />
                </div>
                <div>
                  <label style={PAYROLL_SHARED_LABEL_STYLE}>Đến ngày</label>
                  <input
                    type="date"
                    value={leaveEnd}
                    onChange={(e) => setLeaveEnd(e.target.value)}
                    style={PAYROLL_SHARED_INPUT_STYLE}
                  />
                </div>
                <div>
                  <label style={PAYROLL_SHARED_LABEL_STYLE}>Số ngày</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={leaveDays}
                    onChange={(e) => setLeaveDays(e.target.value)}
                    style={PAYROLL_SHARED_INPUT_STYLE}
                  />
                </div>
              </div>

              <div>
                <label style={PAYROLL_SHARED_LABEL_STYLE}>Lý do nghỉ & phương án bàn giao</label>
                <textarea
                  rows={3}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Nhập lý do xin nghỉ và người nhận bàn giao công việc..."
                  style={{
                    ...PAYROLL_SHARED_INPUT_STYLE,
                    height: 'auto',
                    padding: '0.7rem 0.85rem',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submittingLeave}
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
                <Send size={15} />
                {submittingLeave ? 'Đang gửi tờ trình...' : 'Gửi đơn xin nghỉ phép'}
              </button>
            </form>
          </Card>

          <Card
            title="Lịch Sử Đơn Nghỉ Phép Cá Nhân"
            subtitle="Theo dõi trạng thái phê duyệt trực tuyến theo thời gian thực"
          >
            <Table<PersonalApprovalRequestDto>
              columns={approvalColumns}
              rows={leaveRequests}
              loading={loadingRequests}
              rowKey={(r) => r.id}
              emptyTitle="Bạn chưa gửi đơn xin nghỉ phép nào"
              emptyDescription="Sử dụng biểu mẫu bên trái để tạo đơn nghỉ phép năm, nghỉ bù hoặc chế độ."
            />
          </Card>
        </div>
      )}

      {/* SUB-TAB 3: ĐỀ NGHỊ TẠM ỨNG LƯƠNG */}
      {subTab === 'advances' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '1.25rem',
            alignItems: 'start',
          }}
        >
          <Card
            title="Đề Nghị Tạm Ứng Lương"
            subtitle="Khoản tạm ứng sau khi được duyệt sẽ tự động đối trừ vào kỳ lương tiếp theo"
          >
            <form
              onSubmit={handleSubmitAdvance}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 10 }}>
                <div>
                  <label style={PAYROLL_SHARED_LABEL_STYLE}>Số tiền đề nghị tạm ứng (VNĐ)</label>
                  <input
                    type="number"
                    min={500000}
                    step={500000}
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(e.target.value)}
                    style={PAYROLL_SHARED_INPUT_STYLE}
                  />
                </div>
                <div>
                  <label style={PAYROLL_SHARED_LABEL_STYLE}>Ngày cần giải ngân</label>
                  <input
                    type="date"
                    value={advancePayoutDate}
                    onChange={(e) => setAdvancePayoutDate(e.target.value)}
                    style={PAYROLL_SHARED_INPUT_STYLE}
                  />
                </div>
              </div>

              <div
                style={{
                  padding: '0.55rem 0.85rem',
                  borderRadius: 10,
                  background: '#F8FAFF',
                  border: '1px solid #DBEAFE',
                  fontSize: '0.78rem',
                  color: '#1E40FF',
                }}
              >
                Bằng chữ: <strong>{vndToVietnameseWords(Number(advanceAmount || 0))}</strong>
              </div>

              <div>
                <label style={PAYROLL_SHARED_LABEL_STYLE}>Lý do tạm ứng</label>
                <textarea
                  rows={3}
                  value={advanceReason}
                  onChange={(e) => setAdvanceReason(e.target.value)}
                  placeholder="Nhập mục đích tạm ứng lương hoặc công tác phí..."
                  style={{
                    ...PAYROLL_SHARED_INPUT_STYLE,
                    height: 'auto',
                    padding: '0.7rem 0.85rem',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submittingAdvance}
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
                <Download size={15} />
                {submittingAdvance ? 'Đang khởi tạo đề nghị...' : 'Gửi đề nghị tạm ứng lương'}
              </button>
            </form>
          </Card>

          <Card
            title="Lịch Sử Tạm Ứng Cá Nhân"
            subtitle="Danh sách các đề nghị tạm ứng lương và tiến độ phê duyệt"
          >
            <Table<PersonalApprovalRequestDto>
              columns={approvalColumns}
              rows={advanceRequests}
              loading={loadingRequests}
              rowKey={(r) => r.id}
              emptyTitle="Chưa có đề nghị tạm ứng lương"
              emptyDescription="Mọi phiếu đề nghị tạm ứng lương đã gửi sẽ được lưu vết minh bạch tại đây."
            />
          </Card>
        </div>
      )}

      {/* Payslip Dispute Modal */}
      <CustomModal
        isOpen={disputeModalOpen}
        onClose={() => setDisputeModalOpen(false)}
        title={`Thắc mắc / Đối soát Phiếu lương ${formatPayrollPeriodLabel(selectedPeriod)}`}
        width={520}
      >
        <form
          onSubmit={handleDisputePayslip}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}
        >
          <div style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
            Ghi rõ khoản mục cần Phòng Nhân sự & Kế toán kiểm tra lại (ngày công, giờ tăng ca, hoa hồng Deal, người phụ thuộc hoặc khấu trừ tạm ứng).
          </div>
          <div>
            <label style={PAYROLL_SHARED_LABEL_STYLE}>Nội dung cần kiểm tra / điều chỉnh *</label>
            <textarea
              rows={4}
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="VD: Ngày 14/10 em đi công tác khách hàng có đơn duyệt nhưng chưa cộng 1.0 công..."
              style={{
                ...PAYROLL_SHARED_INPUT_STYLE,
                height: 'auto',
                padding: '0.75rem 0.85rem',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              onClick={() => setDisputeModalOpen(false)}
              className="btn secondary"
              style={{ height: 44, padding: '0 1.15rem' }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submittingDispute}
              style={{
                height: 44,
                padding: '0 1.25rem',
                borderRadius: 12,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {submittingDispute ? 'Đang gửi...' : 'Gửi yêu cầu đối soát'}
            </button>
          </div>
        </form>
      </CustomModal>
    </div>
  );
};

export default MyPayslipsView;
