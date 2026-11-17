import React, { useState } from 'react';
import {
  Award,
  Building2,
  LocateFixed,
  MapPin,
  Network,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card, EmptyState, PillTabs } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import type {
  OrgBranch,
  OrgDepartment,
  OrgPosition,
  OrgRole,
  OrgTeam,
} from './saasSettingsTypes';

interface OrgStructureSettingsTabProps {
  branches: OrgBranch[];
  setBranches: React.Dispatch<React.SetStateAction<OrgBranch[]>>;
  departments: OrgDepartment[];
  setDepartments: React.Dispatch<React.SetStateAction<OrgDepartment[]>>;
  teams: OrgTeam[];
  setTeams: React.Dispatch<React.SetStateAction<OrgTeam[]>>;
  positions: OrgPosition[];
  setPositions: React.Dispatch<React.SetStateAction<OrgPosition[]>>;
  roles: OrgRole[];
}

type SubView = 'branches' | 'departments' | 'teams' | 'positions';

export const OrgStructureSettingsTab: React.FC<OrgStructureSettingsTabProps> = ({
  branches,
  setBranches,
  departments,
  setDepartments,
  teams,
  setTeams,
  positions,
  setPositions,
  roles,
}) => {
  const { token, tenantSlug } = useAuth();
  const [subView, setSubView] = useState<SubView>('branches');

  // Branch Form
  const [bName, setBName] = useState('');
  const [bLegal, setBLegal] = useState('');
  const [bTax, setBTax] = useState('');
  const [bRepName, setBRepName] = useState('');
  const [bRepTitle, setBRepTitle] = useState('Giám đốc');
  const [bAddress, setBAddress] = useState('');
  const [bLat, setBLat] = useState('');
  const [bLng, setBLng] = useState('');
  const [bRadius, setBRadius] = useState('150');
  const [bIpWhitelist, setBIpWhitelist] = useState('');
  const [bHq, setBHq] = useState(true);

  // Department Form
  const [dName, setDName] = useState('');
  const [dCode, setDCode] = useState('');
  const [dBranchId, setDBranchId] = useState('');
  const [dParentId, setDParentId] = useState('');
  const [dDefaultRoleId, setDDefaultRoleId] = useState('');

  // Team Form
  const [tName, setTName] = useState('');
  const [tDeptId, setTDeptId] = useState('');

  // Position Form
  const [pName, setPName] = useState('');
  const [pDeptId, setPDeptId] = useState('');
  const [pRank, setPRank] = useState('3');

  const handleDetectGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast.error('Trình duyệt không hỗ trợ định vị GPS.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBLat(pos.coords.latitude.toFixed(6));
        setBLng(pos.coords.longitude.toFixed(6));
        toast.success('Đã lấy tọa độ GPS văn phòng hiện tại!');
      },
      () => {
        toast.error('Vui lòng cấp quyền vị trí trên trình duyệt hoặc nhập tọa độ thủ công.');
      }
    );
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bName.trim()) return;
    const payload = {
      name: bName.trim(),
      legal_entity_name: bLegal.trim() || bName.trim(),
      tax_code: bTax.trim(),
      representative_name: bRepName.trim(),
      representative_title: bRepTitle.trim(),
      address: bAddress.trim(),
      gps_lat: bLat ? Number(bLat) : null,
      gps_lng: bLng ? Number(bLng) : null,
      gps_radius_meters: Number(bRadius || 150),
      branch_ip_whitelist: bIpWhitelist
        .split(/[\n,;]+/)
        .map((ip) => ip.trim())
        .filter(Boolean),
      is_headquarters: bHq,
    };

    try {
      const created = await apiRequest<OrgBranch>('/org-rbac/branches', {
        method: 'POST',
        token,
        tenantSlug,
        body: payload,
      });
      setBranches((prev) => [...prev, created]);
      setBName('');
      setBAddress('');
      setBIpWhitelist('');
      toast.success('Đã tạo Chi nhánh / Pháp nhân & lưu tọa độ GPS!');
      setBName('');
      setBLegal('');
      setBTax('');
      setBRepName('');
      setBAddress('');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo Chi nhánh / Pháp nhân.'));
    }
  };

  const handleDeleteBranch = async (id: string) => {
    const prevBranches = branches;
    setBranches((prev) => prev.filter((b) => b.id !== id));
    try {
      await apiRequest(`/org-rbac/branches/${id}`, { method: 'DELETE', token, tenantSlug });
      toast.success('Đã xóa Chi nhánh.');
    } catch (err) {
      setBranches(prevBranches);
      toast.error(getErrorMessage(err, 'Không thể xóa Chi nhánh.'));
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dName.trim()) return;
    const payload = {
      name: dName.trim(),
      code: dCode.trim() || undefined,
      branch_id: dBranchId || null,
      parent_department_id: dParentId || null,
      default_role_id: dDefaultRoleId || null,
    };
    try {
      const created = await apiRequest<OrgDepartment>('/org-rbac/departments', {
        method: 'POST',
        token,
        tenantSlug,
        body: payload,
      });
      setDepartments((prev) => [...prev, created]);
      toast.success('Đã thêm Phòng ban vào sơ đồ tổ chức!');
      setDName('');
      setDCode('');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể thêm Phòng ban.'));
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    const prevDepts = departments;
    setDepartments((prev) => prev.filter((d) => d.id !== id));
    try {
      await apiRequest(`/org-rbac/departments/${id}`, { method: 'DELETE', token, tenantSlug });
      toast.success('Đã xóa Phòng ban.');
    } catch (err) {
      setDepartments(prevDepts);
      toast.error(getErrorMessage(err, 'Không thể xóa Phòng ban.'));
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tName.trim()) return;
    const payload = {
      name: tName.trim(),
      department_id: tDeptId || null,
    };
    try {
      const created = await apiRequest<OrgTeam>('/org-rbac/teams', {
        method: 'POST',
        token,
        tenantSlug,
        body: payload,
      });
      setTeams((prev) => [...prev, created]);
      toast.success('Đã tạo Đội nhóm chuyên môn!');
      setTName('');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo Đội nhóm.'));
    }
  };

  const handleDeleteTeam = async (id: string) => {
    const prevTeams = teams;
    setTeams((prev) => prev.filter((t) => t.id !== id));
    try {
      await apiRequest(`/org-rbac/teams/${id}`, { method: 'DELETE', token, tenantSlug });
      toast.success('Đã xóa Đội nhóm.');
    } catch (err) {
      setTeams(prevTeams);
      toast.error(getErrorMessage(err, 'Không thể xóa Đội nhóm.'));
    }
  };

  const handleCreatePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim()) return;
    const payload = {
      name: pName.trim(),
      department_id: pDeptId || null,
      level_rank: Number(pRank || 1),
    };
    try {
      const created = await apiRequest<OrgPosition>('/org-rbac/positions', {
        method: 'POST',
        token,
        tenantSlug,
        body: payload,
      });
      setPositions((prev) => [...prev, created]);
      toast.success('Đã thêm Chức danh & Cấp bậc phê duyệt!');
      setPName('');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể thêm Chức danh.'));
    }
  };

  const handleDeletePosition = async (id: string) => {
    const prevPos = positions;
    setPositions((prev) => prev.filter((p) => p.id !== id));
    try {
      await apiRequest(`/org-rbac/positions/${id}`, { method: 'DELETE', token, tenantSlug });
      toast.success('Đã xóa Chức danh.');
    } catch (err) {
      setPositions(prevPos);
      toast.error(getErrorMessage(err, 'Không thể xóa Chức danh.'));
    }
  };

  return (
    <div data-tour="settings-org-root" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <PillTabs
          tabs={[
            { key: 'branches', label: 'Chi nhánh, Pháp nhân & GPS Văn phòng', icon: <Building2 size={15} />, count: branches.length },
            { key: 'departments', label: 'Phòng ban Đa cấp (Cha - Con)', icon: <Network size={15} />, count: departments.length },
            { key: 'teams', label: 'Đội nhóm / Tổ chuyên môn', icon: <Users size={15} />, count: teams.length },
            { key: 'positions', label: 'Chức danh & Cấp bậc (Level Rank)', icon: <Award size={15} />, count: positions.length },
          ]}
          activeKey={subView}
          onChange={setSubView}
        />
      </div>

      {subView === 'branches' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card
            title="Thêm Chi nhánh / Pháp nhân & Bán kính Chấm công GPS"
            subtitle="Tự động điền Pháp nhân Bên A trên Hợp đồng / Báo giá / AI OCR và kiểm tra bán kính chấm công GPS theo từng văn phòng (0% Hardcode)"
          >
            <form onSubmit={handleCreateBranch} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.8rem' }}>
                <div className="form-group">
                  <label className="form-label">Tên Chi nhánh / Văn phòng *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="VD: Trụ sở TP.HCM"
                    value={bName}
                    onChange={(e) => setBName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tên Pháp nhân trên Hợp đồng</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="CÔNG TY CỔ PHẦN ..."
                    value={bLegal}
                    onChange={(e) => setBLegal(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mã số thuế</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="031xxxxxxx"
                    value={bTax}
                    onChange={(e) => setBTax(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem' }}>
                <div className="form-group">
                  <label className="form-label">Người đại diện pháp luật</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Họ và tên người ký HĐ"
                    value={bRepName}
                    onChange={(e) => setBRepName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Chức danh đại diện</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Tổng Giám đốc"
                    value={bRepTitle}
                    onChange={(e) => setBRepTitle(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Địa chỉ văn phòng</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Số nhà, đường, quận/huyện..."
                    value={bAddress}
                    onChange={(e) => setBAddress(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.8rem', alignItems: 'end' }}>
                <div className="form-group">
                  <label className="form-label">Vĩ độ GPS (Latitude)</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    placeholder="10.776889"
                    value={bLat}
                    onChange={(e) => setBLat(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Kinh độ GPS (Longitude)</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    placeholder="106.700806"
                    value={bLng}
                    onChange={(e) => setBLng(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Bán kính hợp lệ (mét)</label>
                  <input
                    type="number"
                    min={20}
                    max={5000}
                    className="form-input"
                    value={bRadius}
                    onChange={(e) => setBRadius(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ minWidth: 220 }}>
                  <label className="form-label">IP Whitelist Văn phòng (phân cách bằng dấu phẩy)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="VD: 113.161.1.10, 10.10.0.0/24"
                    value={bIpWhitelist}
                    onChange={(e) => setBIpWhitelist(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={handleDetectGps}
                    className="btn secondary"
                    style={{ height: 44, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}
                  >
                    <LocateFixed size={15} color="#1E40FF" /> Lấy GPS
                  </button>
                  <button
                    type="submit"
                    className="btn-inkica-primary"
                    style={{
                      height: 44,
                      padding: '0 1.2rem',
                      borderRadius: 14,
                      border: 'none',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={15} /> Thêm Chi Nhánh
                  </button>
                </div>
              </div>

              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                <input
                  type="checkbox"
                  checked={bHq}
                  onChange={(e) => setBHq(e.target.checked)}
                />
                Đặt làm Trụ sở chính mặc định của doanh nghiệp
              </label>
            </form>
          </Card>

          {branches.length === 0 ? (
            <EmptyState
              icon={<Building2 size={24} />}
              title="Chưa khai báo Chi nhánh / Pháp nhân"
              description="Thêm ít nhất 1 trụ sở để kích hoạt thông tin pháp nhân Hợp đồng động và chấm công GPS."
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '0.9rem' }}>
              {branches.map((br) => (
                <Card
                  key={br.id}
                  title={br.name}
                  subtitle={br.legal_entity_name || 'Pháp nhân trực thuộc'}
                  actions={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {br.is_headquarters && <Badge tone="primary">Trụ sở chính</Badge>}
                      <button
                        type="button"
                        onClick={() => void handleDeleteBranch(br.id)}
                        style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  }
                >
                  <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div>MST: <strong>{br.tax_code || 'Chưa cập nhật'}</strong> • Đại diện: <strong>{br.representative_name || '—'}</strong></div>
                    <div>Địa chỉ: {br.address || '—'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#1E40FF', fontWeight: 600, marginTop: 4 }}>
                      <MapPin size={13} />
                      GPS: {br.gps_lat && br.gps_lng ? `${br.gps_lat}, ${br.gps_lng} (R=${br.gps_radius_meters || 150}m)` : 'Chưa gắn tọa độ'}
                    </div>
                    {Array.isArray(br.branch_ip_whitelist) && br.branch_ip_whitelist.length > 0 && (
                      <div style={{ fontSize: '0.74rem', color: '#059669', fontFamily: 'monospace' }}>
                        IP Wi-Fi Whitelist: {br.branch_ip_whitelist.join(', ')}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {subView === 'departments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card
            title="Cây Phòng Ban Đa Cấp (Không giới hạn cấp Cha - Con)"
            subtitle="Xóa bỏ hoàn toàn team_id cứng 1..5 — tự động gán Vai trò RBAC mặc định khi nhân sự gia nhập phòng"
          >
            <form
              onSubmit={handleCreateDepartment}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: '0.8rem', alignItems: 'end' }}
            >
              <div className="form-group">
                <label className="form-label">Tên Phòng ban *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="VD: Khối Kinh doanh B2B"
                  value={dName}
                  onChange={(e) => setDName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mã phòng</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="SALES_B2B"
                  value={dCode}
                  onChange={(e) => setDCode(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Thuộc Chi nhánh</label>
                <select className="form-input" value={dBranchId} onChange={(e) => setDBranchId(e.target.value)}>
                  <option value="">Toàn công ty</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Phòng ban Cấp trên</label>
                <select className="form-input" value={dParentId} onChange={(e) => setDParentId(e.target.value)}>
                  <option value="">— Cấp cao nhất (Root) —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Vai trò RBAC mặc định</label>
                <select className="form-input" value={dDefaultRoleId} onChange={(e) => setDDefaultRoleId(e.target.value)}>
                  <option value="">— Không gán sẵn —</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="btn-inkica-primary"
                style={{
                  height: 44,
                  padding: '0 1.15rem',
                  borderRadius: 14,
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                + Thêm Phòng Ban
              </button>
            </form>
          </Card>

          <Card padding="0">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Phòng ban</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Trực thuộc</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Vai trò mặc định</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Xóa</th>
                </tr>
              </thead>
              <tbody>
                {departments.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                      Chưa có phòng ban nào.
                    </td>
                  </tr>
                ) : (
                  departments.map((dept) => {
                    const parent = departments.find((p) => p.id === dept.parent_department_id);
                    const defRole = roles.find((r) => r.id === dept.default_role_id);
                    return (
                      <tr key={dept.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                          {parent ? `↳ ${dept.name}` : dept.name}
                          {dept.code && (
                            <span style={{ marginLeft: 8, fontSize: '0.72rem', color: '#64748B' }}>
                              ({dept.code})
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#475569' }}>
                          {parent ? `Khối: ${parent.name}` : 'Cấp 1 (Trực thuộc BGĐ)'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {defRole ? <Badge tone="info">{defRole.name}</Badge> : '—'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => void handleDeleteDepartment(dept.id)}
                            style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {subView === 'teams' && (
        <Card
          title="Đội Nhóm / Tổ Chuyên Môn (Teams)"
          subtitle="Phục vụ phạm vi dữ liệu Data Scope = Team và luồng duyệt Trưởng nhóm (team_leader)"
        >
          <form onSubmit={handleCreateTeam} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: '1rem' }}>
            <input
              type="text"
              required
              className="form-input"
              style={{ maxWidth: 280 }}
              placeholder="Tên Đội / Nhóm (VD: Team Telesale 01)"
              value={tName}
              onChange={(e) => setTName(e.target.value)}
            />
            <select
              className="form-input"
              style={{ maxWidth: 240 }}
              value={tDeptId}
              onChange={(e) => setTDeptId(e.target.value)}
            >
              <option value="">— Chọn Phòng ban —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="btn-inkica-primary"
              style={{ height: 44, padding: '0 1.2rem', borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
            >
              + Tạo Đội Nhóm
            </button>
          </form>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {teams.map((tm) => {
              const dept = departments.find((d) => d.id === tm.department_id);
              return (
                <div
                  key={tm.id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 14,
                    border: '1px solid #E2E8F0',
                    background: '#F8FAFF',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>{tm.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{dept ? dept.name : 'Độc lập'}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDeleteTeam(tm.id)}
                    style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
            {teams.length === 0 && (
              <div style={{ fontSize: '0.82rem', color: '#64748B' }}>Chưa có đội nhóm nào được tạo.</div>
            )}
          </div>
        </Card>
      )}

      {subView === 'positions' && (
        <Card
          title="Chức Danh & Cấp Bậc Tổ Chức (Level Rank 1 -> 10)"
          subtitle="Phục vụ tự động leo thang phê duyệt theo cấp bậc và định mức công tác phí / KPI"
        >
          <form onSubmit={handleCreatePosition} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: '1rem' }}>
            <input
              type="text"
              required
              className="form-input"
              style={{ maxWidth: 260 }}
              placeholder="Tên chức danh (VD: Trưởng phòng KD)"
              value={pName}
              onChange={(e) => setPName(e.target.value)}
            />
            <select
              className="form-input"
              style={{ maxWidth: 220 }}
              value={pDeptId}
              onChange={(e) => setPDeptId(e.target.value)}
            >
              <option value="">Áp dụng toàn công ty</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={10}
              className="form-input"
              style={{ width: 130 }}
              placeholder="Rank (1-10)"
              value={pRank}
              onChange={(e) => setPRank(e.target.value)}
            />
            <button
              type="submit"
              className="btn-inkica-primary"
              style={{ height: 44, padding: '0 1.2rem', borderRadius: 14, border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
            >
              + Thêm Chức Danh
            </button>
          </form>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
            {positions.map((pos) => (
              <div
                key={pos.id}
                style={{
                  padding: '10px 14px',
                  borderRadius: 14,
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{pos.name}</div>
                  <Badge tone="primary">Cấp bậc L{pos.level_rank}</Badge>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDeletePosition(pos.id)}
                  style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
