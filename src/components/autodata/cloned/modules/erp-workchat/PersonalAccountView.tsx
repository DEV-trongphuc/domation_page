import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit3,
  Eye,
  EyeOff,
  Key,
  Package,
  RotateCcw,
  Save,
  Search,
  Shield,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar } from '../../components/ui/Avatar';
import { Badge, Card, EmptyState, PillTabs } from '../../components/ui/AutoDataLoadingModal';
import { SettingsTwoColumnSkeleton, TableSkeleton } from '../../components/ui/Skeleton';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import { apiRequest, formatShortDate, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import type {
  AccountActivityLogRecord,
  HandoverAssetRecord,
  MyAccountProfileDto,
} from './workchatFeedTypes';

type AccountTabKey = 'profile' | 'assets' | 'security' | 'activity';

export interface PersonalAccountViewProps {
  embedded?: boolean;
}

export const PersonalAccountView: React.FC<PersonalAccountViewProps> = ({ embedded = false }) => {
  const { token, tenantSlug, user } = useAuth();

  const [activeTab, setActiveTab] = useState<AccountTabKey>('profile');
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const [profile, setProfile] = useState<MyAccountProfileDto>({
    full_name: user?.name || '',
    email: user?.email || user?.username || '',
    role: user?.role || '',
    phone: '',
    dob: '',
    gender: '',
    citizen_id: '',
    address: '',
    bank_name: '',
    bank_account: '',
    bio: '',
    avatar_url: user?.avatar || '',
    signature_url: '',
  });

  // HTML5 Canvas Digital Signature Pad
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [inkColor, setInkColor] = useState<'#1E40FF' | '#0F172A'>('#1E40FF');
  const [hasCanvasStrokes, setHasCanvasStrokes] = useState(false);

  // Handover Assets
  const [assets, setAssets] = useState<HandoverAssetRecord[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // Change Password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  // Activity Logs
  const [logs, setLogs] = useState<AccountActivityLogRecord[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [expandedLogIds, setExpandedLogIds] = useState<Record<string, boolean>>({});

  const fetchAccountProfile = useCallback(async () => {
    try {
      const data = await apiRequest<Partial<MyAccountProfileDto> & { profile?: Partial<MyAccountProfileDto> }>(
        '/workchat/my-account',
        { token, tenantSlug }
      );
      const src = data.profile || data;
      setProfile((prev) => ({
        ...prev,
        full_name: String(src.full_name || prev.full_name || user?.name || ''),
        email: String(src.email || prev.email || user?.email || ''),
        role: String(src.role || prev.role || user?.role || ''),
        phone: String(src.phone || ''),
        dob: src.dob ? String(src.dob).slice(0, 10) : '',
        gender: String(src.gender || ''),
        citizen_id: String(src.citizen_id || ''),
        address: String(src.address || ''),
        bank_name: String(src.bank_name || ''),
        bank_account: String(src.bank_account || ''),
        bio: String(src.bio || ''),
        avatar_url: String(src.avatar_url || prev.avatar_url || ''),
        signature_url: String(src.signature_url || ''),
        department_name: src.department_name ? String(src.department_name) : undefined,
        branch_name: src.branch_name ? String(src.branch_name) : undefined,
      }));
    } catch {
      // Fallback to authenticated session snapshot if endpoint is initializing
    }
  }, [token, tenantSlug, user?.name, user?.email, user?.role]);

  const fetchHandoverAssets = useCallback(async () => {
    try {
      const res = await apiRequest<
        HandoverAssetRecord[] | { items?: HandoverAssetRecord[]; rows?: HandoverAssetRecord[] }
      >('/hrm/assets', { token, tenantSlug });
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res?.rows)
            ? res.rows
            : [];
      setAssets(list);
    } catch {
      setAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  }, [token, tenantSlug]);

  const fetchActivityLogs = useCallback(async () => {
    try {
      const res = await apiRequest<
        AccountActivityLogRecord[] | { items?: AccountActivityLogRecord[] }
      >('/workchat/my-account/activity-logs', { token, tenantSlug });
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.items)
          ? res.items
          : [];
      setLogs(list);
    } catch {
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  }, [token, tenantSlug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.all([fetchAccountProfile(), fetchHandoverAssets(), fetchActivityLogs()]);
      if (!cancelled) {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchAccountProfile, fetchHandoverAssets, fetchActivityLogs]);

  const handleSelectTab = (nextTab: AccountTabKey) => {
    setActiveTab(nextTab);
    if (nextTab === 'assets') {
      setLoadingAssets(true);
      void fetchHandoverAssets();
    } else if (nextTab === 'activity') {
      setLoadingLogs(true);
      void fetchActivityLogs();
    }
  };

  // Canvas Drawing Helpers
  const getCanvasPoint = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    isDrawingRef.current = true;
    const pt = getCanvasPoint(e);
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = inkColor;
  };

  const drawMove = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    const pt = getCanvasPoint(e);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    setHasCanvasStrokes(true);
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearSignatureCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasCanvasStrokes(false);
  };

  const handleSaveProfile = async (overrideSignatureUrl?: string) => {
    if (!profile.full_name.trim()) {
      toast.error('Họ và tên không được để trống');
      return;
    }

    let finalSignature = overrideSignatureUrl ?? profile.signature_url;
    if (!overrideSignatureUrl && hasCanvasStrokes && canvasRef.current) {
      finalSignature = canvasRef.current.toDataURL('image/png');
    }

    setSavingProfile(true);
    try {
      await apiRequest('/workchat/my-account', {
        method: 'PUT',
        token,
        tenantSlug,
        body: {
          full_name: profile.full_name.trim(),
          phone: profile.phone.trim() || null,
          dob: profile.dob || null,
          gender: profile.gender || null,
          citizen_id: profile.citizen_id.trim() || null,
          address: profile.address.trim() || null,
          bank_name: profile.bank_name.trim() || null,
          bank_account: profile.bank_account.trim() || null,
          bio: profile.bio.trim() || null,
          avatar_url: profile.avatar_url.trim() || null,
          signature_url: finalSignature || null,
        },
      });
      setProfile((prev) => ({ ...prev, signature_url: finalSignature }));
      setHasCanvasStrokes(false);
      toast.success('Đã lưu hồ sơ cá nhân & chữ ký số!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu hồ sơ cá nhân'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAcknowledgeAsset = async (assetId: string) => {
    try {
      await apiRequest(`/hrm/assets/${assetId}`, {
        method: 'PATCH',
        token,
        tenantSlug,
        body: { acknowledged_by_employee: true },
      });
      setAssets((prev) =>
        prev.map((a) => (a.id === assetId ? { ...a, acknowledged_by_employee: true } : a))
      );
      toast.success('Đã xác nhận nhận bàn giao tài sản!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xác nhận tài sản bàn giao'));
    }
  };

  const passwordChecks = useMemo(() => {
    return {
      minLen: newPassword.length >= 8,
      hasLetter: /[A-Za-z]/.test(newPassword),
      hasDigit: /\d/.test(newPassword),
      matchesConfirm: Boolean(newPassword && newPassword === confirmPassword),
    };
  }, [newPassword, confirmPassword]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('Vui lòng điền đầy đủ mật khẩu hiện tại và mật khẩu mới');
      return;
    }
    if (!passwordChecks.minLen || !passwordChecks.hasLetter || !passwordChecks.hasDigit) {
      toast.error('Mật khẩu mới cần tối thiểu 8 ký tự, bao gồm chữ cái và chữ số');
      return;
    }
    if (!passwordChecks.matchesConfirm) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setChangingPw(true);
    try {
      await apiRequest('/workchat/my-account/change-password', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          old_password: oldPassword,
          new_password: newPassword,
        },
      });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Đã đổi mật khẩu bảo mật thành công!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể đổi mật khẩu'));
    } finally {
      setChangingPw(false);
    }
  };

  const filteredLogs = useMemo(() => {
    const kw = logSearch.trim().toLowerCase();
    if (!kw) return logs;
    return logs.filter((l) =>
      `${l.action} ${l.module_key || ''} ${l.entity_type || ''} ${l.ip_address || ''}`
        .toLowerCase()
        .includes(kw)
    );
  }, [logs, logSearch]);

  if (loading) {
    return <SettingsTwoColumnSkeleton />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {!embedded && (
        <Card
          padding="1.25rem 1.5rem"
          style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)' }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Avatar src={profile.avatar_url} name={profile.full_name || 'User'} size={52} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '1.16rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    {profile.full_name || 'Tài Khoản Cá Nhân'}
                  </h1>
                  <Badge tone="primary">{profile.role || user?.role || 'Thành viên'}</Badge>
                  {profile.signature_url && <Badge tone="success">✍️ Đã cấu hình Chữ ký số</Badge>}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 3 }}>
                  {profile.email}
                  {profile.department_name ? ` • ${profile.department_name}` : ''}
                  {profile.branch_name ? ` • ${profile.branch_name}` : ''}
                </div>
              </div>
            </div>
            <ScreenHelpButton screenKey="account" />
          </div>
        </Card>
      )}

      <PillTabs<AccountTabKey>
        activeKey={activeTab}
        onChange={handleSelectTab}
        tabs={[
          { key: 'profile', label: 'Hồ sơ cá nhân & Chữ ký số', icon: <User size={15} /> },
          { key: 'assets', label: 'Tài sản bàn giao', icon: <Package size={15} />, count: assets.length || undefined },
          { key: 'security', label: 'Bảo mật & Đổi mật khẩu', icon: <Key size={15} /> },
          { key: 'activity', label: 'Nhật ký hoạt động', icon: <Activity size={15} /> },
        ]}
      />

      {/* TAB 1: Profile & HTML5 Canvas Digital Signature */}
      {activeTab === 'profile' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '1.25rem',
            alignItems: 'start',
          }}
        >
          <Card title="Thông Tin Hồ Sơ Nhân Sự & Ngân Hàng Nhận Lương">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569' }}>Họ và tên *</label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
                  style={{ minHeight: 42, padding: '0 12px', borderRadius: 11, border: '1px solid #CBD5E1', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569' }}>Số điện thoại</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="09xx xxx xxx"
                  style={{ minHeight: 42, padding: '0 12px', borderRadius: 11, border: '1px solid #CBD5E1', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569' }}>Ngày sinh</label>
                <input
                  type="date"
                  value={profile.dob}
                  onChange={(e) => setProfile((p) => ({ ...p, dob: e.target.value }))}
                  style={{ minHeight: 42, padding: '0 12px', borderRadius: 11, border: '1px solid #CBD5E1', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569' }}>Số CCCD / Định danh</label>
                <input
                  type="text"
                  value={profile.citizen_id}
                  onChange={(e) => setProfile((p) => ({ ...p, citizen_id: e.target.value }))}
                  placeholder="079xxxxxxxxx"
                  style={{ minHeight: 42, padding: '0 12px', borderRadius: 11, border: '1px solid #CBD5E1', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569' }}>Ngân hàng thụ hưởng</label>
                <input
                  type="text"
                  value={profile.bank_name}
                  onChange={(e) => setProfile((p) => ({ ...p, bank_name: e.target.value }))}
                  placeholder="VD: Vietcombank, Techcombank..."
                  style={{ minHeight: 42, padding: '0 12px', borderRadius: 11, border: '1px solid #CBD5E1', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569' }}>Số tài khoản nhận lương</label>
                <input
                  type="text"
                  value={profile.bank_account}
                  onChange={(e) => setProfile((p) => ({ ...p, bank_account: e.target.value }))}
                  placeholder="Nhập số tài khoản..."
                  style={{ minHeight: 42, padding: '0 12px', borderRadius: 11, border: '1px solid #CBD5E1', fontSize: '0.84rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 12 }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569' }}>Địa chỉ liên hệ</label>
              <input
                type="text"
                value={profile.address}
                onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                style={{ minHeight: 42, padding: '0 12px', borderRadius: 11, border: '1px solid #CBD5E1', fontSize: '0.84rem' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 12 }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569' }}>Giới thiệu ngắn (Bio)</label>
              <textarea
                rows={2}
                value={profile.bio}
                onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                placeholder="Chuyên môn phụ trách, phương châm làm việc..."
                style={{ padding: '10px 12px', borderRadius: 11, border: '1px solid #CBD5E1', fontSize: '0.84rem' }}
              />
            </div>

            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                disabled={savingProfile}
                onClick={() => handleSaveProfile()}
                style={{
                  minHeight: 42,
                  padding: '0 20px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #1E40FF 0%, #0284C7 100%)',
                  color: '#FFFFFF',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(30, 64, 255, 0.24)',
                }}
              >
                <Save size={15} />
                <span>{savingProfile ? 'Đang lưu...' : 'Lưu Hồ Sơ Cá Nhân'}</span>
              </button>
            </div>
          </Card>

          {/* HTML5 Canvas Digital Signature Pad */}
          <Card
            title="Chữ Ký Số Điện Tử (HTML5 Signature Pad)"
            subtitle="Dùng để ký xác nhận Phiếu lương, Phiếu hợp tác & Tờ trình phê duyệt"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {profile.signature_url && (
                <div
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    background: '#F8FAFF',
                    border: '1px solid #DBEAFE',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1E40FF', marginBottom: 6 }}>
                    Chữ ký số hiện hành
                  </div>
                  <img
                    src={profile.signature_url}
                    alt="Chữ ký số cá nhân"
                    style={{ maxHeight: 84, maxWidth: '100%', objectFit: 'contain' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569' }}>
                  <Edit3 size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  Ký trực tiếp lên bảng vẽ dưới đây:
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setInkColor('#1E40FF')}
                    style={{
                      padding: '3px 9px',
                      borderRadius: 8,
                      border: inkColor === '#1E40FF' ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                      background: '#EEF2FF',
                      color: '#1E40FF',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Mực xanh Sapphire
                  </button>
                  <button
                    type="button"
                    onClick={() => setInkColor('#0F172A')}
                    style={{
                      padding: '3px 9px',
                      borderRadius: 8,
                      border: inkColor === '#0F172A' ? '1.5px solid #0F172A' : '1px solid #E2E8F0',
                      background: '#F1F5F9',
                      color: '#0F172A',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Mực đen
                  </button>
                </div>
              </div>

              <div
                style={{
                  borderRadius: 14,
                  border: '1.5px dashed #93C5FD',
                  background: '#FFFFFF',
                  overflow: 'hidden',
                }}
              >
                <canvas
                  ref={canvasRef}
                  width={480}
                  height={165}
                  onMouseDown={startDrawing}
                  onMouseMove={drawMove}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={drawMove}
                  onTouchEnd={stopDrawing}
                  style={{
                    width: '100%',
                    height: 165,
                    display: 'block',
                    cursor: 'crosshair',
                    touchAction: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <button
                  type="button"
                  onClick={clearSignatureCanvas}
                  style={{
                    minHeight: 38,
                    padding: '0 13px',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#475569',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    cursor: 'pointer',
                  }}
                >
                  <RotateCcw size={13} />
                  <span>Xóa vẽ lại</span>
                </button>

                <button
                  type="button"
                  disabled={!hasCanvasStrokes || savingProfile}
                  onClick={() => {
                    if (!canvasRef.current) return;
                    const dataUrl = canvasRef.current.toDataURL('image/png');
                    handleSaveProfile(dataUrl);
                  }}
                  style={{
                    minHeight: 38,
                    padding: '0 16px',
                    borderRadius: 10,
                    border: 'none',
                    background: hasCanvasStrokes
                      ? 'linear-gradient(135deg, #1E40FF 0%, #0284C7 100%)'
                      : '#CBD5E1',
                    color: '#FFFFFF',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: hasCanvasStrokes ? 'pointer' : 'not-allowed',
                  }}
                >
                  Lưu Chữ Ký Số
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: Handover Assets */}
      {activeTab === 'assets' && (
        <Card
          title="Danh Sách Tài Sản & Thiết Bị Được Bàn Giao"
          subtitle="Đồng bộ trực tiếp từ phân hệ Nhân sự HRM (/api/v1/hrm/assets)"
        >
          {loadingAssets ? (
            <TableSkeleton rows={4} cols={5} />
          ) : assets.length === 0 ? (
            <EmptyState
              icon={<Package size={24} />}
              title="Chưa có tài sản bàn giao"
              description="Thiết bị (Laptop, Điện thoại, Thẻ từ...) khi được phòng Nhân sự cấp phát sẽ hiển thị tại đây."
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                <thead>
                  <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#64748B' }}>Mã TS</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#64748B' }}>Tên thiết bị</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#64748B' }}>Serial / Phân loại</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#64748B' }}>Ngày bàn giao</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#64748B' }}>Trạng thái</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', color: '#64748B' }}>Xác nhận</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => (
                    <tr key={asset.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '11px 12px', fontWeight: 800, color: '#1E40FF' }}>
                        {asset.asset_code}
                      </td>
                      <td style={{ padding: '11px 12px', fontWeight: 700, color: '#0F172A' }}>
                        {asset.asset_name}
                      </td>
                      <td style={{ padding: '11px 12px', color: '#475569' }}>
                        {asset.serial_number || '—'} {asset.category ? `• ${asset.category}` : ''}
                      </td>
                      <td style={{ padding: '11px 12px', color: '#475569' }}>
                        {asset.assigned_at ? String(asset.assigned_at).slice(0, 10) : '—'}
                      </td>
                      <td style={{ padding: '11px 12px' }}>
                        <Badge tone={asset.status === 'assigned' ? 'success' : 'neutral'}>
                          {asset.status === 'assigned' ? 'Đang sử dụng' : asset.status}
                        </Badge>
                      </td>
                      <td style={{ padding: '11px 12px', textAlign: 'right' }}>
                        {asset.acknowledged_by_employee ? (
                          <Badge tone="primary">✓ Đã ký nhận</Badge>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAcknowledgeAsset(asset.id)}
                            style={{
                              height: 32,
                              padding: '0 12px',
                              borderRadius: 9,
                              border: 'none',
                              background: '#1E40FF',
                              color: '#FFFFFF',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Xác nhận nhận TS
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: Security & Change Password */}
      {activeTab === 'security' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          <Card title="Đổi Mật Khẩu Đăng Nhập">
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A' }}>
                  Mật khẩu hiện tại *
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showOldPw ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: 42,
                      padding: '0 40px 0 12px',
                      borderRadius: 11,
                      border: '1px solid #CBD5E1',
                      fontSize: '0.84rem',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPw((v) => !v)}
                    style={{ position: 'absolute', right: 10, border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}
                  >
                    {showOldPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A' }}>
                  Mật khẩu mới *
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: 42,
                      padding: '0 40px 0 12px',
                      borderRadius: 11,
                      border: '1px solid #CBD5E1',
                      fontSize: '0.84rem',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw((v) => !v)}
                    style={{ position: 'absolute', right: 10, border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}
                  >
                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A' }}>
                  Nhập lại mật khẩu mới *
                </label>
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    minHeight: 42,
                    padding: '0 12px',
                    borderRadius: 11,
                    border: '1px solid #CBD5E1',
                    fontSize: '0.84rem',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={changingPw}
                style={{
                  minHeight: 42,
                  padding: '0 20px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #1E40FF 0%, #0284C7 100%)',
                  color: '#FFFFFF',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  alignSelf: 'flex-start',
                }}
              >
                {changingPw ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu'}
              </button>
            </form>
          </Card>

          <Card title="Tiêu Chuẩn An Toàn Tài Khoản">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { ok: passwordChecks.minLen, text: 'Độ dài tối thiểu từ 8 ký tự trở lên' },
                { ok: passwordChecks.hasLetter, text: 'Bao gồm ký tự chữ cái (A-Z, a-z)' },
                { ok: passwordChecks.hasDigit, text: 'Bao gồm ít nhất 1 chữ số (0-9)' },
                { ok: passwordChecks.matchesConfirm, text: 'Mật khẩu xác nhận trùng khớp 100%' },
              ].map((rule, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '9px 12px',
                    borderRadius: 11,
                    background: rule.ok ? 'rgba(16, 185, 129, 0.08)' : '#F8F9FA',
                    color: rule.ok ? '#059669' : '#475569',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}
                >
                  <CheckCircle2 size={15} />
                  <span>{rule.text}</span>
                </div>
              ))}

              <div
                style={{
                  marginTop: 6,
                  padding: 12,
                  borderRadius: 12,
                  background: '#EFF6FF',
                  border: '1px solid #DBEAFE',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: '0.78rem',
                  color: '#1E40FF',
                }}
              >
                <Shield size={18} />
                <span>
                  Workspace <strong>{tenantSlug}</strong> được bảo vệ bởi cơ chế cô lập dữ liệu đa tầng RLS & mã hóa mật khẩu Bcrypt/Scrypt.
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: Activity Logs */}
      {activeTab === 'activity' && (
        <Card
          title="Nhật Ký Hoạt Động Cá Nhân (Audit Trail)"
          actions={
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '0 10px',
                height: 36,
                borderRadius: 10,
                background: '#F8F9FA',
                border: '1px solid #E2E8F0',
              }}
            >
              <Search size={14} color="#64748B" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Lọc thao tác, phân hệ..."
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.78rem' }}
              />
            </div>
          }
        >
          {loadingLogs ? (
            <TableSkeleton rows={5} cols={4} />
          ) : filteredLogs.length === 0 ? (
            <EmptyState
              icon={<Activity size={24} />}
              title="Chưa ghi nhận lịch sử thao tác"
              description="Các sự kiện đăng nhập, cập nhật hồ sơ, ký số và phê duyệt của bạn sẽ được lưu vết tại đây."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredLogs.map((log) => {
                const isExpanded = Boolean(expandedLogIds[log.id]);
                const hasMeta = log.metadata && Object.keys(log.metadata).length > 0;
                return (
                  <div
                    key={log.id}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 13,
                      border: '1px solid #E2E8F0',
                      background: '#FFFFFF',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Badge tone="primary">{log.module_key || 'system'}</Badge>
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>
                          {log.action}
                        </span>
                        {log.ip_address && (
                          <span style={{ fontSize: '0.73rem', color: '#64748B' }}>IP: {log.ip_address}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                          {formatShortDate(log.created_at)}
                        </span>
                        {hasMeta && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedLogIds((prev) => ({ ...prev, [log.id]: !isExpanded }))
                            }
                            style={{
                              border: '1px solid #E2E8F0',
                              background: '#F8FAFC',
                              borderRadius: 7,
                              padding: '3px 7px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                          >
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                        )}
                      </div>
                    </div>

                    {isExpanded && hasMeta && (
                      <pre
                        style={{
                          marginTop: 8,
                          padding: 10,
                          borderRadius: 9,
                          background: '#F8F9FA',
                          border: '1px solid #E2E8F0',
                          fontSize: '0.73rem',
                          color: '#334155',
                          overflowX: 'auto',
                        }}
                      >
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default PersonalAccountView;
