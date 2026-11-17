import React, { useMemo, useState } from 'react';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Maximize2,
  Minimize2,
  Search,
  UserCheck,
  Users,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Badge, Card, EmptyState } from '../../components/ui/AutoDataLoadingModal';
import {
  EMPLOYMENT_STATUS_LABELS,
  type HrEmployeeDto,
  type HrmOverviewDto,
  type OrgDepartmentNode,
} from './hrmTypes';

export interface OrgChartTreeViewProps {
  companyName: string;
  org: HrmOverviewDto['org'] | undefined;
  employees: HrEmployeeDto[];
  onSelectEmployee: (emp: HrEmployeeDto) => void;
}

interface BuiltDeptNode {
  dept: OrgDepartmentNode;
  managerName: string | null;
  managerEmp: HrEmployeeDto | null;
  directEmployees: HrEmployeeDto[];
  children: BuiltDeptNode[];
  totalHeadcount: number;
}

export const OrgChartTreeView: React.FC<OrgChartTreeViewProps> = ({
  companyName,
  org,
  employees,
  onSelectEmployee,
}) => {
  const [search, setSearch] = useState('');
  const [zoomPct, setZoomPct] = useState<75 | 100 | 125>(100);
  const [collapsedIds, setCollapsedIds] = useState<Record<string, boolean>>({});

  const empByUserId = useMemo(() => {
    const map = new Map<string, HrEmployeeDto>();
    for (const emp of employees) {
      if (emp.user_id) map.set(emp.user_id, emp);
    }
    return map;
  }, [employees]);

  const userNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of org?.users || []) {
      map.set(u.id, u.full_name);
    }
    return map;
  }, [org?.users]);

  const treeData = useMemo(() => {
    const branches = org?.branches || [];
    const depts = org?.departments || [];

    const buildDeptSubtree = (dept: OrgDepartmentNode): BuiltDeptNode => {
      const childDepts = depts.filter((d) => d.parent_department_id === dept.id);
      const builtChildren = childDepts.map(buildDeptSubtree);
      const directEmployees = employees.filter((e) => e.department_id === dept.id);
      const childHeadcount = builtChildren.reduce((acc, c) => acc + c.totalHeadcount, 0);
      const mgrUserId = dept.manager_user_id || null;
      const managerEmp = mgrUserId ? empByUserId.get(mgrUserId) || null : null;
      const managerName = managerEmp?.full_name || (mgrUserId ? userNameById.get(mgrUserId) || null : null);

      return {
        dept,
        managerName,
        managerEmp,
        directEmployees,
        children: builtChildren,
        totalHeadcount: directEmployees.length + childHeadcount,
      };
    };

    const rootDepts = depts.filter(
      (d) => !d.parent_department_id || !depts.some((p) => p.id === d.parent_department_id)
    );

    const branchNodes = branches.map((b) => {
      const branchRootDepts = rootDepts.filter((d) => d.branch_id === b.id);
      const deptTrees = branchRootDepts.map(buildDeptSubtree);
      const unassignedInBranch = employees.filter(
        (e) => e.branch_id === b.id && (!e.department_id || !depts.some((d) => d.id === e.department_id))
      );
      const headcount =
        deptTrees.reduce((sum, dt) => sum + dt.totalHeadcount, 0) + unassignedInBranch.length;
      const mgrId = b.manager_user_id || null;
      const managerEmp = mgrId ? empByUserId.get(mgrId) || null : null;
      const managerName = managerEmp?.full_name || (mgrId ? userNameById.get(mgrId) || null : null);

      return {
        branch: b,
        managerName,
        managerEmp,
        deptTrees,
        unassignedEmployees: unassignedInBranch,
        headcount,
      };
    });

    // Global root departments without branch_id (or pointing to unlisted branch)
    const orphanRootDepts = rootDepts
      .filter((d) => !d.branch_id || !branches.some((b) => b.id === d.branch_id))
      .map(buildDeptSubtree);

    const globalUnassignedEmployees = employees.filter(
      (e) =>
        (!e.branch_id || !branches.some((b) => b.id === e.branch_id)) &&
        (!e.department_id || !depts.some((d) => d.id === e.department_id))
    );

    return {
      branchNodes,
      orphanRootDepts,
      globalUnassignedEmployees,
    };
  }, [org?.branches, org?.departments, employees, empByUserId, userNameById]);

  const normQuery = search.trim().toLowerCase();

  const matchesQuery = (text?: string | null): boolean => {
    if (!normQuery || !text) return false;
    return text.toLowerCase().includes(normQuery);
  };

  const toggleNode = (nodeKey: string) => {
    setCollapsedIds((prev) => ({ ...prev, [nodeKey]: !prev[nodeKey] }));
  };

  const expandAll = () => setCollapsedIds({});
  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    for (const b of org?.branches || []) next[`branch:${b.id}`] = true;
    for (const d of org?.departments || []) next[`dept:${d.id}`] = true;
    setCollapsedIds(next);
  };

  const renderEmployeeChip = (emp: HrEmployeeDto) => {
    const highlighted =
      matchesQuery(emp.full_name) || matchesQuery(emp.employee_code) || matchesQuery(emp.position_name);
    return (
      <button
        key={emp.id}
        type="button"
        onClick={() => onSelectEmployee(emp)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '0.5rem 0.85rem',
          borderRadius: 12,
          border: highlighted ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
          background: highlighted ? '#EEF2FF' : '#FFFFFF',
          boxShadow: highlighted ? '0 4px 14px rgba(30, 64, 255, 0.18)' : '0 1px 3px rgba(15, 23, 42, 0.04)',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 999,
            background: 'rgba(30, 64, 255, 0.12)',
            color: '#1E40FF',
            fontSize: '0.72rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {emp.full_name
            .trim()
            .split(/\s+/)
            .slice(-2)
            .map((w) => w.charAt(0).toUpperCase())
            .join('')}
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>{emp.full_name}</div>
          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
            <span style={{ color: '#1E40FF', fontWeight: 700 }}>{emp.employee_code}</span>
            {emp.position_name ? ` • ${emp.position_name}` : ''} •{' '}
            {EMPLOYMENT_STATUS_LABELS[emp.employment_status] || emp.employment_status}
          </div>
        </div>
      </button>
    );
  };

  const renderDeptNode = (node: BuiltDeptNode, depth = 0): React.ReactNode => {
    const key = `dept:${node.dept.id}`;
    const isCollapsed = normQuery ? false : Boolean(collapsedIds[key]);
    const deptHighlighted = matchesQuery(node.dept.name) || matchesQuery(node.dept.code);

    return (
      <div
        key={node.dept.id}
        style={{
          marginLeft: depth > 0 ? 22 : 0,
          paddingLeft: depth > 0 ? 14 : 0,
          borderLeft: depth > 0 ? '2px solid #DBEAFE' : 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div
          style={{
            padding: '0.8rem 1rem',
            borderRadius: 14,
            background: deptHighlighted ? '#EEF2FF' : '#F8FAFF',
            border: deptHighlighted ? '1.5px solid #1E40FF' : '1px solid #DBEAFE',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => toggleNode(key)}
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </button>
            <FolderTree size={15} color="#1E40FF" />
            <span style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0F172A' }}>{node.dept.name}</span>
            <Badge tone="neutral">{node.dept.code}</Badge>
            <Badge tone="primary" icon={<Users size={11} />}>
              {node.totalHeadcount} nhân sự
            </Badge>
          </div>

          {node.managerName && (
            <button
              type="button"
              onClick={() => {
                if (node.managerEmp) onSelectEmployee(node.managerEmp);
              }}
              style={{
                border: 'none',
                background: 'transparent',
                padding: 0,
                cursor: node.managerEmp ? 'pointer' : 'default',
              }}
            >
              <Badge tone="info" icon={<UserCheck size={11} />}>
                Trưởng bộ phận: {node.managerName}
              </Badge>
            </button>
          )}
        </div>

        {!isCollapsed && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 12 }}>
            {node.directEmployees.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {node.directEmployees.map(renderEmployeeChip)}
              </div>
            )}
            {node.children.map((child) => renderDeptNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card
      title="Sơ Đồ Tổ Chức Trực Quan Đa Cấp (Interactive Org Chart 360°)"
      subtitle="Bấm vào bất kỳ Nhân sự hoặc Trưởng phòng/Chi nhánh nào để mở Ngăn kéo Hồ sơ 360°"
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={expandAll}
            className="btn secondary"
            style={{ height: 36, padding: '0 10px', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <Maximize2 size={13} /> Mở rộng
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="btn secondary"
            style={{ height: 36, padding: '0 10px', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <Minimize2 size={13} /> Thu gọn
          </button>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              padding: 3,
              borderRadius: 10,
              background: '#F1F5F9',
              border: '1px solid #E2E8F0',
            }}
          >
            {([75, 100, 125] as const).map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setZoomPct(z)}
                style={{
                  height: 30,
                  padding: '0 8px',
                  borderRadius: 8,
                  border: 'none',
                  background: zoomPct === z ? '#1E40FF' : 'transparent',
                  color: zoomPct === z ? '#FFFFFF' : '#475569',
                  fontSize: '0.73rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                {z === 75 ? <ZoomOut size={11} /> : z === 125 ? <ZoomIn size={11} /> : null}
                {z}%
              </button>
            ))}
          </div>
        </div>
      }
      padding="1.15rem 1.35rem"
    >
      <div style={{ marginBottom: '1rem', maxWidth: 380, position: 'relative' }}>
        <Search size={15} color="#64748B" style={{ position: 'absolute', left: 12, top: 14 }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm nhanh chi nhánh, phòng ban, nhân sự trên cây..."
          style={{
            width: '100%',
            height: 44,
            padding: '0 0.9rem 0 2.25rem',
            borderRadius: 12,
            border: '1px solid #CBD5E1',
            background: '#FFFFFF',
            fontSize: '0.84rem',
          }}
        />
      </div>

      {employees.length === 0 && (org?.branches?.length || 0) === 0 && (org?.departments?.length || 0) === 0 ? (
        <EmptyState
          icon={<Building2 size={24} />}
          title="Chưa có dữ liệu Sơ đồ Tổ chức"
          description="Đồng bộ tài khoản sang Hồ sơ Nhân sự 360° hoặc khởi tạo Chi nhánh & Phòng ban trong Cài đặt Tổ chức."
        />
      ) : (
        <div
          style={{
            overflowX: 'auto',
            padding: '0.5rem 0',
          }}
        >
          <div
            style={{
              zoom: zoomPct / 100,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* Root Company Node */}
            <div
              style={{
                padding: '1rem 1.25rem',
                borderRadius: 18,
                background: 'linear-gradient(135deg, #1E40FF 0%, #0284C7 100%)',
                color: '#FFFFFF',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                boxShadow: '0 10px 26px rgba(30, 64, 255, 0.22)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Building2 size={22} />
                <div>
                  <div style={{ fontSize: '0.72rem', opacity: 0.85, fontWeight: 700, textTransform: 'uppercase' }}>
                    Tổ chức / Doanh nghiệp chủ quản
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>{companyName || 'DOMATION Enterprise'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: 999,
                    background: 'rgba(255, 255, 255, 0.18)',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                  }}
                >
                  {(org?.branches || []).length} Chi nhánh
                </span>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: 999,
                    background: 'rgba(255, 255, 255, 0.18)',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                  }}
                >
                  {(org?.departments || []).length} Phòng ban
                </span>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: 999,
                    background: '#FFFFFF',
                    color: '#1E40FF',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                  }}
                >
                  {employees.length} Nhân sự 360°
                </span>
              </div>
            </div>

            {/* Branch Subtrees */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingLeft: 16, borderLeft: '2px solid #CBD5E1' }}>
              {treeData.branchNodes.map((bNode) => {
                const bKey = `branch:${bNode.branch.id}`;
                const isCollapsed = normQuery ? false : Boolean(collapsedIds[bKey]);
                const branchHighlighted = matchesQuery(bNode.branch.name) || matchesQuery(bNode.branch.code);

                return (
                  <div
                    key={bNode.branch.id}
                    style={{
                      padding: '1rem 1.15rem',
                      borderRadius: 16,
                      background: '#FFFFFF',
                      border: branchHighlighted ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => toggleNode(bKey)}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            border: '1px solid #CBD5E1',
                            background: '#F8F9FA',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          {isCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                        </button>
                        <Building2 size={16} color="#1E40FF" />
                        <span style={{ fontWeight: 800, fontSize: '0.94rem', color: '#0F172A' }}>
                          {bNode.branch.name}
                        </span>
                        <Badge tone="primary">{bNode.branch.code}</Badge>
                        <Badge tone="success">{bNode.headcount} nhân sự</Badge>
                      </div>

                      {bNode.managerName && (
                        <button
                          type="button"
                          onClick={() => {
                            if (bNode.managerEmp) onSelectEmployee(bNode.managerEmp);
                          }}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            padding: 0,
                            cursor: bNode.managerEmp ? 'pointer' : 'default',
                          }}
                        >
                          <Badge tone="info" icon={<UserCheck size={11} />}>
                            Giám đốc Chi nhánh: {bNode.managerName}
                          </Badge>
                        </button>
                      )}
                    </div>

                    {!isCollapsed && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 10 }}>
                        {bNode.deptTrees.map((dt) => renderDeptNode(dt, 0))}
                        {bNode.unassignedEmployees.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {bNode.unassignedEmployees.map(renderEmployeeChip)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {treeData.orphanRootDepts.map((dt) => renderDeptNode(dt, 0))}

              {treeData.globalUnassignedEmployees.length > 0 && (
                <div
                  style={{
                    padding: '0.95rem 1.15rem',
                    borderRadius: 16,
                    background: '#FFFFFF',
                    border: '1px dashed #CBD5E1',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Users size={15} color="#64748B" />
                    <span style={{ fontWeight: 700, fontSize: '0.86rem', color: '#334155' }}>
                      Nhân sự trực thuộc Khối Văn phòng Chung ({treeData.globalUnassignedEmployees.length})
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {treeData.globalUnassignedEmployees.map(renderEmployeeChip)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default OrgChartTreeView;
