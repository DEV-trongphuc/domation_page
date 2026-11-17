import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Building2,
  Copy,
  FileSignature,
  Laptop,
  Mail,
  Network,
  Phone,
  Save,
  Shield,
  User,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, PillTabs } from '../../components/ui/AutoDataLoadingModal';
import { DrawerSkeleton } from '../../components/ui/Skeleton';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import {
  DEFAULT_WEEKLY_SCHEDULE,
  EMPLOYMENT_STATUS_LABELS,
  extractWeeklyScheduleFromEmployee,
  normalizeEmployeeDossier,
  type HrAssetDto,
  type HrContractDto,
  type HrEmployeeDto,
  type HrEmployeeRbacSummary,
  type HrmOverviewDto,
} from './hrmTypes';
import {
  DossierOrgScheduleTab,
  DossierProfileLegalTab,
  type EmployeeDossierFormState,
} from './AccountDossierProfileOrgTabs';
import {
  DossierAssetsTab,
  DossierCompensationRbacTab,
  DossierContractsSignatureTab,
} from './AccountDossierContractAssetRbacTabs';
import { SignaturePadModal } from './HrmModals';

export type AccountDossierTabKey = 'profile_legal' | 'org_schedule' | 'contracts_sig' | 'assets' | 'compensation_rbac';

export interface AccountDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: HrEmployeeDto | null;
  employeeId?: string | null;
  account?: { id?: string | number | null } | HrEmployeeDto | null;
  org?: HrmOverviewDto['org'];
  onSaved?: () => void;
  onSaveSuccess?: () => void;
  readOnly?: boolean;
}

function buildFormStateFromEmployee(emp: HrEmployeeDto | null | undefined): EmployeeDossierFormState {
  const allowances = emp?.allowances_json || {};
  return {
    employee_code: emp?.employee_code || '',
    full_name: emp?.full_name || '',
    user_id: emp?.user_id || '',
    work_email: emp?.work_email || '',
    phone: emp?.phone || '',
    gender: emp?.gender || '',
    date_of_birth: emp?.date_of_birth ? String(emp.date_of_birth).slice(0, 10) : '',
    nationality: emp?.nationality || 'Việt Nam',
    id_card_number: emp?.id_card_number || '',
    tax_code: emp?.tax_code || '',
    dependents_count: String(emp?.dependents_count ?? 0),
    social_insurance_number: emp?.social_insurance_number || '',
    insurance_enrolled: emp?.insurance_enrolled ?? true,
    is_resident: emp?.is_resident ?? true,
    union_member: emp?.union_member ?? false,
    address: emp?.address || '',
    bank_name: emp?.bank_name || '',
    bank_account_number: emp?.bank_account_number || '',
    bank_account_holder: emp?.bank_account_holder || '',
    bank_branch: emp?.bank_branch || '',
    branch_id: emp?.branch_id || '',
    department_id: emp?.department_id || '',
    team_id: emp?.team_id || '',
    position_id: emp?.position_id || '',
    manager_user_id: emp?.manager_user_id || '',
    employment_status: emp?.employment_status || 'active',
    employment_type: emp?.employment_type || 'full_time',
    join_date: emp?.join_date ? String(emp.join_date).slice(0, 10) : new Date().toISOString().slice(0, 10),
    annual_leave_quota: String(emp?.annual_leave_quota ?? 12),
    annual_leave_used: String(emp?.annual_leave_used ?? 0),
    compensatory_leave_balance: String(emp?.compensatory_leave_balance ?? 0),
    base_salary_vnd: String(emp?.base_salary_vnd ?? 15_000_000),
    insurance_salary_vnd: String(emp?.insurance_salary_vnd ?? emp?.base_salary_vnd ?? 15_000_000),
    meal_allowance_vnd: String(allowances.meal ?? 730_000),
    responsibility_allowance_vnd: String(allowances.responsibility ?? 0),
    travel_allowance_vnd: String(allowances.travel ?? 0),
    phone_allowance_vnd: String(allowances.phone ?? 0),
    digital_signature_data_url: emp?.digital_signature_data_url || '',
    shift_schedule: emp ? extractWeeklyScheduleFromEmployee(emp) : DEFAULT_WEEKLY_SCHEDULE,
  };
}

const AccountDetailDrawerInner: React.FC<{
  onClose: () => void;
  initialEmployee: HrEmployeeDto | null;
  targetEmployeeId: string | null;
  org: HrmOverviewDto['org'] | undefined;
  onSaved?: () => void;
  readOnlyProp?: boolean;
}> = ({ onClose, initialEmployee, targetEmployeeId, org, onSaved, readOnlyProp = false }) => {
  const { token, tenantSlug } = useAuth();
  const { can, scope } = useEntitlement();

  const canCreate = can('erp_hrm_org', 'create');
  const canEdit = can('erp_hrm_org', 'edit');
  const activeScope = scope('erp_hrm_org');

  const [resolvedId, setResolvedId] = useState<string | null>(targetEmployeeId);
  const isCreateMode = !resolvedId;
  const effectiveReadOnly = readOnlyProp || (isCreateMode ? !canCreate : !canEdit);

  const [activeTab, setActiveTab] = useState<AccountDossierTabKey>('profile_legal');
  const [loadingDossier, setLoadingDossier] = useState<boolean>(() => Boolean(targetEmployeeId));
  const [saving, setSaving] = useState(false);

  const [employeeSnap, setEmployeeSnap] = useState<HrEmployeeDto | null>(initialEmployee);
  const [form, setForm] = useState<EmployeeDossierFormState>(() => buildFormStateFromEmployee(initialEmployee));
  const [contracts, setContracts] = useState<HrContractDto[]>([]);
  const [assets, setAssets] = useState<HrAssetDto[]>([]);
  const [rbacSummary, setRbacSummary] = useState<HrEmployeeRbacSummary | null>(null);
  const [sigPadOpen, setSigPadOpen] = useState(false);

  const fetchDossier = useCallback(
    async (empId: string) => {
      let rawDossier: unknown = null;
      try {
        rawDossier = await apiRequest<unknown>(`/hrm/employees/${empId}/dossier`, { token, tenantSlug });
      } catch {
        try {
          rawDossier = await apiRequest<unknown>(`/hrm/employees/${empId}`, { token, tenantSlug });
        } catch {
          rawDossier = null;
        }
      }

      const normalized = normalizeEmployeeDossier(rawDossier, initialEmployee);
      if (normalized) {
        setEmployeeSnap(normalized.employee);
        setForm(buildFormStateFromEmployee(normalized.employee));
        setContracts(normalized.contracts);
        setAssets(normalized.assets);
        setRbacSummary(normalized.rbac_summary);
      }
    },
    [initialEmployee, token, tenantSlug]
  );

  useEffect(() => {
    if (!resolvedId) return;
    let mounted = true;
    const run = async () => {
      try {
        await fetchDossier(resolvedId);
      } finally {
        if (mounted) setLoadingDossier(false);
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, [resolvedId, fetchDossier]);

  const handlePatchForm = useCallback((patch: Partial<EmployeeDossierFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSaveProfile = async () => {
    if (!form.full_name.trim()) {
      toast.error('Vui lòng nhập họ và tên đầy đủ của nhân sự.');
      setActiveTab('profile_legal');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        employee_code: form.employee_code.trim() || undefined,
        full_name: form.full_name.trim(),
        user_id: form.user_id || null,
        work_email: form.work_email.trim() || null,
        phone: form.phone.trim() || null,
        gender: form.gender || null,
        date_of_birth: form.date_of_birth || null,
        nationality: form.nationality.trim() || 'Việt Nam',
        id_card_number: form.id_card_number.trim() || null,
        tax_code: form.tax_code.trim() || null,
        dependents_count: Math.max(0, Number(form.dependents_count || 0)),
        social_insurance_number: form.social_insurance_number.trim() || null,
        insurance_enrolled: form.insurance_enrolled,
        is_resident: form.is_resident,
        union_member: form.union_member,
        address: form.address.trim() || null,
        bank_name: form.bank_name.trim() || null,
        bank_account_number: form.bank_account_number.trim() || null,
        bank_account_holder: form.bank_account_holder.trim() || null,
        bank_branch: form.bank_branch.trim() || null,
        branch_id: form.branch_id || null,
        department_id: form.department_id || null,
        team_id: form.team_id || null,
        position_id: form.position_id || null,
        manager_user_id: form.manager_user_id || null,
        employment_status: form.employment_status,
        employment_type: form.employment_type,
        join_date: form.join_date || null,
        annual_leave_quota: Math.max(0, Number(form.annual_leave_quota || 12)),
        annual_leave_used: Math.max(0, Number(form.annual_leave_used || 0)),
        compensatory_leave_balance: Math.max(0, Number(form.compensatory_leave_balance || 0)),
        base_salary_vnd: employeeSnap?.salary_masked ? undefined : Math.max(0, Number(form.base_salary_vnd || 0)),
        insurance_salary_vnd: employeeSnap?.salary_masked
          ? undefined
          : Math.max(0, Number(form.insurance_salary_vnd || 0)),
        allowances_json: employeeSnap?.salary_masked
          ? undefined
          : {
              ...(employeeSnap?.allowances_json || {}),
              meal: Math.max(0, Number(form.meal_allowance_vnd || 0)),
              responsibility: Math.max(0, Number(form.responsibility_allowance_vnd || 0)),
              travel: Math.max(0, Number(form.travel_allowance_vnd || 0)),
              phone: Math.max(0, Number(form.phone_allowance_vnd || 0)),
            },
        metadata: {
          ...(employeeSnap?.metadata || {}),
          shift_schedule: form.shift_schedule,
        },
      };

      if (resolvedId) {
        await apiRequest(`/hrm/employees/${resolvedId}`, {
          method: 'PUT',
          token,
          tenantSlug,
          body: payload,
        });
        toast.success('Đã lưu Hồ sơ Nhân sự 360° thành công!');
        await fetchDossier(resolvedId);
        onSaved?.();
      } else {
        const created = await apiRequest<HrEmployeeDto>('/hrm/employees', {
          method: 'POST',
          token,
          tenantSlug,
          body: payload,
        });
        toast.success('Đã tạo mới Hồ sơ Nhân sự 360°!');
        if (created?.id) {
          setResolvedId(created.id);
          setEmployeeSnap(created);
        }
        onSaved?.();
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu hồ sơ nhân sự 360°.'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMasterSignature = async (dataUrl: string) => {
    if (!resolvedId) return;
    await apiRequest(`/hrm/employees/${resolvedId}/signature`, {
      method: 'POST',
      token,
      tenantSlug,
      body: { digital_signature_data_url: dataUrl },
    });
    handlePatchForm({ digital_signature_data_url: dataUrl });
    toast.success('Đã lưu chữ ký số mẫu vào Hồ sơ Nhân sự!');
    onSaved?.();
  };

  const initials = (form.full_name || 'NS')
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');

  const branchLabel =
    org?.branches.find((b) => b.id === form.branch_id)?.name || employeeSnap?.branch_name || 'Trụ sở chính';
  const deptLabel =
    org?.departments.find((d) => d.id === form.department_id)?.name || employeeSnap?.department_name || 'Chưa phân phòng';
  const posLabel =
    org?.positions.find((p) => p.id === form.position_id)?.name || employeeSnap?.position_name || '';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9990,
        background: 'rgba(15, 23, 42, 0.42)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(940px, 96vw)',
          height: '100vh',
          background: '#FFFFFF',
          boxShadow: '-16px 0 48px rgba(15, 23, 42, 0.16)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Top Drawer Header */}
        <div
          style={{
            padding: '1.15rem 1.5rem',
            borderBottom: '1px solid #E2E8F0',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
            {employeeSnap?.avatar_url ? (
              <img
                src={employeeSnap.avatar_url}
                alt={form.full_name}
                style={{ width: 52, height: 52, borderRadius: 16, objectFit: 'cover', border: '2px solid #DBEAFE' }}
              />
            ) : (
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #1E40FF 0%, #0284C7 100%)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 6px 16px rgba(30, 64, 255, 0.24)',
                }}
              >
                {initials}
              </div>
            )}

            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: '#0F172A' }}>
                  {isCreateMode ? 'Thêm Hồ Sơ Nhân Sự 360° Mới' : form.full_name || 'Hồ Sơ Nhân Sự 360°'}
                </h2>
                {form.employee_code && <Badge tone="primary">{form.employee_code}</Badge>}
                <Badge
                  tone={
                    form.employment_status === 'active'
                      ? 'success'
                      : form.employment_status === 'probation'
                        ? 'warning'
                        : 'neutral'
                  }
                >
                  {EMPLOYMENT_STATUS_LABELS[form.employment_status] || form.employment_status}
                </Badge>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                <Badge tone="neutral" icon={<Building2 size={11} />}>
                  {branchLabel}
                </Badge>
                <Badge tone="info">{deptLabel}</Badge>
                {posLabel && <Badge tone="purple">{posLabel}</Badge>}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {form.phone && (
              <a
                href={`tel:${form.phone}`}
                className="btn secondary"
                title="Gọi điện nhanh"
                style={{ height: 40, padding: '0 10px', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
              >
                <Phone size={14} color="#1E40FF" />
              </a>
            )}
            {form.work_email && (
              <a
                href={`mailto:${form.work_email}`}
                className="btn secondary"
                title="Gửi Email"
                style={{ height: 40, padding: '0 10px', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
              >
                <Mail size={14} color="#1E40FF" />
              </a>
            )}
            {form.employee_code && (
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(form.employee_code);
                  toast.success(`Đã sao chép mã ${form.employee_code}`);
                }}
                className="btn secondary"
                title="Sao chép mã nhân sự"
                style={{ height: 40, padding: '0 10px', display: 'inline-flex', alignItems: 'center' }}
              >
                <Copy size={14} />
              </button>
            )}
            {!effectiveReadOnly && (
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSaveProfile()}
                style={{
                  height: 44,
                  padding: '0 1.25rem',
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
                  boxShadow: '0 6px 16px rgba(30, 64, 255, 0.24)',
                }}
              >
                <Save size={15} /> {saving ? 'Đang lưu...' : isCreateMode ? 'Tạo Hồ sơ 360°' : 'Lưu Hồ sơ'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="btn secondary"
              style={{ height: 40, width: 40, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* 5 Sub-Tabs Strip */}
        <div
          style={{
            padding: '0.75rem 1.5rem',
            borderBottom: '1px solid #E2E8F0',
            background: '#FFFFFF',
            overflowX: 'auto',
          }}
        >
          <PillTabs<AccountDossierTabKey>
            activeKey={activeTab}
            onChange={setActiveTab}
            tabs={[
              { key: 'profile_legal', label: 'Hồ sơ & Pháp lý', icon: <User size={14} /> },
              { key: 'org_schedule', label: 'Tổ chức & Lịch làm việc', icon: <Network size={14} /> },
              {
                key: 'contracts_sig',
                label: 'Hợp đồng & Chữ ký số',
                icon: <FileSignature size={14} />,
                count: contracts.length,
              },
              { key: 'assets', label: 'Tài sản bàn giao', icon: <Laptop size={14} />, count: assets.length },
              { key: 'compensation_rbac', label: 'Thu nhập & Phân quyền RBAC', icon: <Shield size={14} /> },
            ]}
          />
        </div>

        {/* Scrollable Body */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#F8F9FA', padding: '1.25rem 1.5rem' }}>
          {loadingDossier ? (
            <DrawerSkeleton />
          ) : (
            <>
              {activeTab === 'profile_legal' && (
                <DossierProfileLegalTab
                  form={form}
                  onPatch={handlePatchForm}
                  org={org}
                  readOnly={effectiveReadOnly}
                  isCreateMode={isCreateMode}
                  onOpenSignaturePad={() => setSigPadOpen(true)}
                />
              )}

              {activeTab === 'org_schedule' && (
                <DossierOrgScheduleTab
                  form={form}
                  onPatch={handlePatchForm}
                  org={org}
                  readOnly={effectiveReadOnly}
                />
              )}

              {activeTab === 'contracts_sig' &&
                (resolvedId ? (
                  <DossierContractsSignatureTab
                    employeeId={resolvedId}
                    defaultBaseSalaryVnd={Number(form.base_salary_vnd || 15_000_000)}
                    contracts={contracts}
                    canCreate={canCreate}
                    token={token}
                    tenantSlug={tenantSlug}
                    onRefreshDossier={async () => {
                      await fetchDossier(resolvedId);
                      onSaved?.();
                    }}
                  />
                ) : (
                  <div
                    style={{
                      padding: '2rem',
                      borderRadius: 16,
                      background: '#FFFFFF',
                      border: '1px dashed #CBD5E1',
                      textAlign: 'center',
                      color: '#475569',
                      fontSize: '0.86rem',
                    }}
                  >
                    Vui lòng bấm <strong>Tạo Hồ sơ 360°</strong> ở góc phải trên để khởi tạo mã nhân sự trước khi lập Hợp đồng Lao động.
                  </div>
                ))}

              {activeTab === 'assets' &&
                (resolvedId ? (
                  <DossierAssetsTab
                    employeeId={resolvedId}
                    assets={assets}
                    canEdit={canEdit || canCreate}
                    token={token}
                    tenantSlug={tenantSlug}
                    onRefreshDossier={async () => {
                      await fetchDossier(resolvedId);
                      onSaved?.();
                    }}
                  />
                ) : (
                  <div
                    style={{
                      padding: '2rem',
                      borderRadius: 16,
                      background: '#FFFFFF',
                      border: '1px dashed #CBD5E1',
                      textAlign: 'center',
                      color: '#475569',
                      fontSize: '0.86rem',
                    }}
                  >
                    Vui lòng bấm <strong>Tạo Hồ sơ 360°</strong> trước khi ghi nhận biên bản bàn giao thiết bị.
                  </div>
                ))}

              {activeTab === 'compensation_rbac' && (
                <DossierCompensationRbacTab
                  form={form}
                  onPatch={handlePatchForm}
                  salaryMasked={Boolean(employeeSnap?.salary_masked)}
                  readOnly={effectiveReadOnly}
                  rbacSummary={rbacSummary}
                  fallbackScope={activeScope}
                />
              )}
            </>
          )}
        </div>
      </div>

      <SignaturePadModal
        isOpen={sigPadOpen}
        onClose={() => setSigPadOpen(false)}
        targetTitle={form.full_name || 'Nhân sự'}
        onSaveSignature={handleSaveMasterSignature}
      />
    </div>
  );
};

export const AccountDetailDrawer: React.FC<AccountDetailDrawerProps> = ({
  isOpen,
  onClose,
  employee = null,
  employeeId = null,
  account = null,
  org,
  onSaved,
  onSaveSuccess,
  readOnly = false,
}) => {
  if (!isOpen || typeof document === 'undefined') return null;

  const accountIdStr = account && account.id ? String(account.id) : null;
  const targetId = employeeId || employee?.id || accountIdStr || null;
  const resetKey = targetId || 'create-new-employee';
  const combinedSaved = () => {
    onSaved?.();
    onSaveSuccess?.();
  };

  return createPortal(
    <AccountDetailDrawerInner
      key={resetKey}
      onClose={onClose}
      initialEmployee={employee}
      targetEmployeeId={targetId}
      org={org}
      onSaved={combinedSaved}
      readOnlyProp={readOnly}
    />,
    document.body
  );
};

export default AccountDetailDrawer;
