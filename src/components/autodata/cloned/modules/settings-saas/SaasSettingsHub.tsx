import React, { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { AutoDataLoadingModal } from '../../components/ui/AutoDataLoadingModal';
import {
  makeDefaultActionsMap,
  type OrgBranch,
  type OrgDepartment,
  type OrgPosition,
  type OrgRbacBootstrapPayload,
  type OrgRole,
  type OrgTeam,
  type PermissionMatrixEntry,
  type PipelineQuickTab,
  type PolicyDocumentItem,
  type StageTransitionRule,
  type UserPermissionOverride,
} from './saasSettingsTypes';
import { OrgStructureSettingsTab } from './OrgStructureSettingsTab';
import { RbacMatrixSettingsTab } from './RbacMatrixSettingsTab';
import { TerminologySettingsTab } from './TerminologySettingsTab';
import { PipelineRulesSettingsTab } from './PipelineRulesSettingsTab';
import { PolicyDocumentsSettingsTab } from './PolicyDocumentsSettingsTab';

export type SaasEngineTabKey =
  | 'org_structure'
  | 'rbac_matrix'
  | 'terminology'
  | 'pipeline_rules'
  | 'policy_docs';

const DEFAULT_ROLES: OrgRole[] = [
  { id: 'role_director', name: 'Giám đốc Điều hành', role_key: 'director', default_data_scope: 'company', is_system: true },
  { id: 'role_sales_mgr', name: 'Trưởng phòng Kinh doanh', role_key: 'sales_manager', default_data_scope: 'department' },
  { id: 'role_mkt_lead', name: 'Trưởng nhóm Marketing', role_key: 'marketing_lead', default_data_scope: 'department' },
  { id: 'role_sales_rep', name: 'Chuyên viên Tư vấn / Sale', role_key: 'sales_rep', default_data_scope: 'own' },
];

const DEFAULT_QUICK_TABS: PipelineQuickTab[] = [
  { id: 'tab_all', key: 'all', label: 'Tất cả Hồ sơ', filter_type: 'all', enabled: true },
  { id: 'tab_new', key: 'uncontacted', label: 'Mới tiếp nhận', filter_type: 'uncontacted', enabled: true },
  { id: 'tab_qual', key: 'qualified', label: 'Đạt chuẩn tư vấn', filter_type: 'qualified', enabled: true },
  { id: 'tab_won', key: 'won', label: 'Đã chốt giao dịch', filter_type: 'won', enabled: true },
];

function normalizePermMap(
  raw:
    | Record<string, PermissionMatrixEntry[]>
    | Array<PermissionMatrixEntry & { role_id?: string; department_id?: string }>
    | undefined,
  idField: 'role_id' | 'department_id'
): Record<string, PermissionMatrixEntry[]> {
  if (!raw) return {};
  if (Array.isArray(raw)) {
    const out: Record<string, PermissionMatrixEntry[]> = {};
    for (const item of raw) {
      const targetId = item[idField];
      if (!targetId) continue;
      if (!out[targetId]) out[targetId] = [];
      out[targetId].push({
        module_key: item.module_key,
        data_scope: item.data_scope,
        actions: { ...makeDefaultActionsMap(false), ...(item.actions || {}) },
      });
    }
    return out;
  }
  return raw;
}

export const SaasSettingsHub: React.FC<{ activeEngineTab: SaasEngineTabKey }> = ({
  activeEngineTab,
}) => {
  const { token, tenantSlug, companyName } = useAuth();
  const [loading, setLoading] = useState(true);

  const [branches, setBranches] = useState<OrgBranch[]>([]);
  const [departments, setDepartments] = useState<OrgDepartment[]>([]);
  const [teams, setTeams] = useState<OrgTeam[]>([]);
  const [positions, setPositions] = useState<OrgPosition[]>([]);
  const [roles, setRoles] = useState<OrgRole[]>(DEFAULT_ROLES);
  const [rolePermissionsMap, setRolePermissionsMap] = useState<Record<string, PermissionMatrixEntry[]>>({});
  const [deptPermissionsMap, setDeptPermissionsMap] = useState<Record<string, PermissionMatrixEntry[]>>({});
  const [userOverrides, setUserOverrides] = useState<UserPermissionOverride[]>([]);
  const [stageRules, setStageRules] = useState<StageTransitionRule[]>([]);
  const [pipelineTabs, setPipelineTabs] = useState<PipelineQuickTab[]>(DEFAULT_QUICK_TABS);
  const [policies, setPolicies] = useState<PolicyDocumentItem[]>([]);

  const fetchOrgRbac = useCallback(async () => {
    return apiRequest<OrgRbacBootstrapPayload>('/org-rbac/bootstrap', {
      token,
      tenantSlug,
    }).catch(() => null);
  }, [token, tenantSlug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchOrgRbac();
        if (cancelled) return;
        if (res) {
          setBranches(
            res.branches && res.branches.length > 0
              ? res.branches
              : [
                  {
                    id: 'br_hq',
                    name: `Trụ sở chính ${companyName || ''}`.trim(),
                    legal_entity_name: companyName || 'Doanh nghiệp Workspace',
                    gps_radius_meters: 150,
                    is_headquarters: true,
                  },
                ]
          );
          if (res.departments) setDepartments(res.departments);
          if (res.teams) setTeams(res.teams);
          if (res.positions) setPositions(res.positions);
          if (res.roles && res.roles.length > 0) setRoles(res.roles);
          setRolePermissionsMap(normalizePermMap(res.role_permissions, 'role_id'));
          setDeptPermissionsMap(normalizePermMap(res.department_permissions, 'department_id'));
          if (res.user_overrides) setUserOverrides(res.user_overrides);
          if (res.stage_rules) setStageRules(res.stage_rules);
          if (res.pipeline_tabs && res.pipeline_tabs.length > 0) setPipelineTabs(res.pipeline_tabs);
          if (res.policies) setPolicies(res.policies);
        } else {
          setBranches([
            {
              id: 'br_hq',
              name: `Trụ sở chính ${companyName || ''}`.trim(),
              legal_entity_name: companyName || 'Doanh nghiệp Workspace',
              gps_radius_meters: 150,
              is_headquarters: true,
            },
          ]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchOrgRbac, companyName]);

  if (loading) {
    return (
      <AutoDataLoadingModal
        inline
        isOpen
        message="Đang tải cấu hình Zero-Hardcode SaaS của doanh nghiệp..."
        subMessage=""
      />
    );
  }

  switch (activeEngineTab) {
    case 'org_structure':
      return (
        <OrgStructureSettingsTab
          branches={branches}
          setBranches={setBranches}
          departments={departments}
          setDepartments={setDepartments}
          teams={teams}
          setTeams={setTeams}
          positions={positions}
          setPositions={setPositions}
          roles={roles}
        />
      );
    case 'rbac_matrix':
      return (
        <RbacMatrixSettingsTab
          roles={roles}
          setRoles={setRoles}
          departments={departments}
          rolePermissionsMap={rolePermissionsMap}
          setRolePermissionsMap={setRolePermissionsMap}
          deptPermissionsMap={deptPermissionsMap}
          setDeptPermissionsMap={setDeptPermissionsMap}
          userOverrides={userOverrides}
          setUserOverrides={setUserOverrides}
        />
      );
    case 'terminology':
      return <TerminologySettingsTab />;
    case 'pipeline_rules':
      return (
        <PipelineRulesSettingsTab
          stageRules={stageRules}
          setStageRules={setStageRules}
          pipelineTabs={pipelineTabs}
          setPipelineTabs={setPipelineTabs}
          roles={roles}
        />
      );
    case 'policy_docs':
      return (
        <PolicyDocumentsSettingsTab
          policies={policies}
          setPolicies={setPolicies}
          branches={branches}
        />
      );
  }
};
