import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { withRouterFreezer } from '../components/RouterFreezer';
import { Users, Plus, Trash2, Mail, MessageCircle, Shield, UserX, Clock, X, Link2Off, User, Send, Check, RefreshCw, BarChart2, Calendar, Scale, Eye, CheckCircle, AlertTriangle, FileSpreadsheet, UserPlus, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Avatar } from '../components/ui/Avatar';
import { fetchAPI, normalizeConsultantStatsResponse } from '../utils/api';
import { TableRowSkeleton } from '../components/ui/Skeleton';
import { ToggleSwitch } from '../components/ui/ToggleSwitch';
import { CustomSelect } from '../components/ui/CustomSelect';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, LabelList
} from 'recharts';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: 'active' | 'inactive';
  telegram_id: string | null;
  zalo_chat_id: string | null;
  created_at: string;
}

const DEFAULT_SCHEDULE = {
  "1": { active: true, start: "08:00", end: "17:30" },
  "2": { active: true, start: "08:00", end: "17:30" },
  "3": { active: true, start: "08:00", end: "17:30" },
  "4": { active: true, start: "08:00", end: "17:30" },
  "5": { active: true, start: "08:00", end: "17:30" },
  "6": { active: true, start: "08:00", end: "17:30" },
  "7": { active: true, start: "08:00", end: "17:30" }
};

const dayNames: { [key: string]: string } = {
  "1": "Thứ 2",
  "2": "Thứ 3",
  "3": "Thứ 4",
  "4": "Thứ 5",
  "5": "Thứ 6",
  "6": "Thứ 7",
  "7": "Chủ Nhật"
};

const formatScheduleTooltip = (schedule: any, t: any): string => {
  if (!schedule) return '';
  return Object.entries(dayNames).map(([dayKey, dayLabel]) => {
    const config = schedule[dayKey];
    if (!config) return `${t(dayLabel)}: ${t('Không hoạt động')}`;
    if (!config.active) return `${t(dayLabel)}: ${t('Nghỉ')}`;
    return `${t(dayLabel)}: ${config.start} - ${config.end}`;
  }).join('\n');
};

const ConsultantsInner = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    const handleThemeChange = () => {
      const nextTheme = (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
      setTheme(nextTheme);
    };
    window.addEventListener('theme-change', handleThemeChange);
    return () => window.removeEventListener('theme-change', handleThemeChange);
  }, []);

  const [users, setUsers] = useState<any[]>([]);

  // --- GOOGLE SHEETS AGENT INVITATION STATE ---
  const [sheetModalOpen, setSheetModalOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetTab, setSheetTab] = useState('DATA TỔNG HỢP SALE');
  const [availableRounds, setAvailableRounds] = useState<any[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [scannedAgents, setScannedAgents] = useState<any[]>([]);
  const [scanDone, setScanDone] = useState(false);

  useEffect(() => {
    fetchAPI('get_rounds').then(res => {
      if (res?.success && Array.isArray(res.data)) {
        setAvailableRounds(res.data);
        const active = res.data.find((r: any) => Number(r.is_active) === 1);
        if (active) setSelectedRoundId(String(active.id));
      }
    }).catch(() => {});
  }, []);

  const handleScanSheet = async () => {
    if (!sheetUrl.trim()) {
      return toast.error(t('Vui lòng nhập đường dẫn Google Trang tính'));
    }
    setIsScanning(true);
    setScanDone(false);
    try {
      const res = await fetchAPI('scan_consultants_from_sheet', {
        method: 'POST',
        body: JSON.stringify({ sheet_url: sheetUrl.trim(), sheet_tab: sheetTab.trim() })
      });
      if (res.success && res.data) {
        setScannedAgents(res.data.agents || []);
        setScanDone(true);
        if ((res.data.agents || []).length === 0) {
          toast(t('Không tìm thấy thông tin Đại lý nào trong trang tính đã chọn.'), { icon: 'ℹ️' });
        } else {
          toast.success(t(`Đã quét thấy ${(res.data.agents || []).length} Đại lý trong trang tính!`));
        }
      } else {
        toast.error(res.message || t('Lỗi khi quét Google Sheets'));
      }
    } catch (err: any) {
      toast.error(t('Lỗi kết nối: ') + err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleInviteAgents = async () => {
    const toInvite = scannedAgents.filter(a => a.selected && a.email && a.email.trim());
    if (toInvite.length === 0) {
      return toast.error(t('Vui lòng chọn ít nhất 1 Đại lý có Email để gửi lời mời kích hoạt'));
    }
    setIsInviting(true);
    try {
      const res = await fetchAPI('invite_consultants_from_sheet', {
        method: 'POST',
        body: JSON.stringify({ agents: toInvite, round_id: selectedRoundId })
      });
      if (res.success) {
        toast.success(res.message || t(`Đã gửi email kích hoạt Zalo Bot thành công cho ${res.invited_count} Đại lý!`));
        setSheetModalOpen(false);
        setScannedAgents([]);
        setScanDone(false);
        fetchUsers();
      } else {
        toast.error(res.message || t('Lỗi khi mời Đại lý'));
      }
    } catch (err: any) {
      toast.error(t('Lỗi kết nối: ') + err.message);
    } finally {
      setIsInviting(false);
    }
  };
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [unlinkId, setUnlinkId] = useState<number | null>(null);
  const [unlinkConfirmOpen, setUnlinkConfirmOpen] = useState(false);

  // Quick message state
  const [quickMessageOpen, setQuickMessageOpen] = useState(false);
  const [quickMessageTarget, setQuickMessageTarget] = useState<any>(null);
  const [quickMessageText, setQuickMessageText] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  // Consultant stats state
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [statsConsultant, setStatsConsultant] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsData, setStatsData] = useState<any>(null);
  const [statsDateMode, setStatsDateMode] = useState<string>('this_month');
  const [statsStartDate, setStatsStartDate] = useState<string>('');
  const [statsEndDate, setStatsEndDate] = useState<string>('');

  const [scheduleMode, setScheduleMode] = useState<'daily' | 'custom'>('daily');
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    status: string;
    leave_start: string;
    leave_end: string;
    zalo_chat_id: string;
    work_start_time: string;
    work_end_time: string;
    work_schedule: any;
    avatar: string;
  }>({
    name: '',
    email: '',
    status: 'active',
    leave_start: '',
    leave_end: '',
    zalo_chat_id: '',
    work_start_time: '00:00',
    work_end_time: '23:59',
    work_schedule: null,
    avatar: ''
  });

  const handleDayChange = (dayKey: string, field: 'active' | 'start' | 'end', value: any) => {
    setFormData(prev => {
      const currentSchedule = prev.work_schedule || DEFAULT_SCHEDULE;
      const updatedDayConfig = {
        ...currentSchedule[dayKey],
        [field]: value
      };
      return {
        ...prev,
        work_schedule: {
          ...currentSchedule,
          [dayKey]: updatedDayConfig
        }
      };
    });
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const json = await fetchAPI('get_consultants');
      if (json && json.success) setUsers(Array.isArray(json?.data) ? json.data : []);
    } catch (e: any) {
      toast.error(t('Không thể tải dữ liệu: ') + e.message);
    }
    setLoading(false);
  };

  const handleToggleVacation = async (id: number) => {
    try {
      const json = await fetchAPI('toggle_consultant_vacation', {
        method: 'POST',
        body: JSON.stringify({ id })
      });
      if (json.success) {
        toast.success(t('Đã thay đổi trạng thái Tạm ngưng'));
        setUsers(prev => prev.map(u => u.id === id ? { ...u, vacation_mode: json.vacation_mode } : u));
      } else {
        toast.error(json.message || t('Lỗi thay đổi trạng thái'));
      }
    } catch (err: any) {
      toast.error(t('Lỗi kết nối: ') + err.message);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setScheduleMode('daily');
    setFormData({
      name: '',
      email: '',
      status: 'active',
      leave_start: '',
      leave_end: '',
      zalo_chat_id: '',
      work_start_time: '00:00',
      work_end_time: '23:59',
      work_schedule: null,
      avatar: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    const hasCustomSchedule = !!user.work_schedule;
    setScheduleMode(hasCustomSchedule ? 'custom' : 'daily');
    setFormData({
      name: user.name,
      email: user.email,
      status: user.status,
      leave_start: user.leave_start || '',
      leave_end: user.leave_end || '',
      zalo_chat_id: user.zalo_chat_id || '',
      work_start_time: user.work_start_time || '00:00',
      work_end_time: user.work_end_time || '23:59',
      work_schedule: user.work_schedule || null,
      avatar: user.avatar || ''
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return toast.error(t('Vui lòng điền đầy đủ thông tin'));
    if (isSaving) return;

    setIsSaving(true);
    try {
      const action = editingUser ? 'edit_consultant' : 'add_consultant';
      const payload = {
        ...formData,
        id: editingUser?.id,
        work_schedule: scheduleMode === 'custom' ? formData.work_schedule : null
      };
      const json = await fetchAPI(action, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (json.success) {
        toast.success(editingUser ? t('Cập nhật thành công!') : t('Thêm mới thành công!'));
        fetchUsers();
        setModalOpen(false);
      } else {
        toast.error(json.message || t('Lỗi khi lưu'));
      }
    } catch (e: any) { toast.error(t('Lỗi: ') + e.message); }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId || isDeleting) return;
    setIsDeleting(true);
    try {
      const json = await fetchAPI(`delete_consultant&id=${deleteId}`);
      if (json.success) {
        toast.success(t('Đã xóa thành công!'));
        fetchUsers();
      } else {
        toast.error(json.message || t('Lỗi khi xóa'));
      }
    } catch (e: any) { toast.error(t('Lỗi: ') + e.message); }
    setIsDeleting(false);
    setConfirmDeleteOpen(false);
  };

  const confirmUnlinkZalo = (id: number) => {
    setUnlinkId(id);
    setUnlinkConfirmOpen(true);
  };

  const handleUnlinkZalo = async () => {
    if (!unlinkId) return;
    try {
      const json = await fetchAPI('unlink_zalo', {
        method: 'POST',
        body: JSON.stringify({ id: unlinkId, type: 'consultant' })
      });
      if (json.success) {
        toast.success(t('Đã hủy liên kết Zalo thành công!'));
        fetchUsers();
        setFormData(prev => ({ ...prev, zalo_chat_id: '' }));
        setEditingUser((prev: any) => prev ? { ...prev, zalo_chat_id: null } : null);
      } else {
        toast.error(json.message || t('Lỗi khi hủy liên kết'));
      }
    } catch (e: any) {
      toast.error(t('Lỗi: ') + e.message);
    }
    setUnlinkConfirmOpen(false);
    setUnlinkId(null);
  };
  const [zaloRemindingId, setZaloRemindingId] = useState<number | null>(null);
  const [zaloRemindedId, setZaloRemindedId] = useState<number | null>(null);

  // Co-Managers (Người phụ trách thêm của Đại lý) on Admin UI
  const [expandedAgencyIds, setExpandedAgencyIds] = useState<Record<number, boolean>>({});
  const [quickAddMgrAgency, setQuickAddMgrAgency] = useState<any | null>(null);
  const [newMgrName, setNewMgrName] = useState('');
  const [newMgrEmail, setNewMgrEmail] = useState('');
  const [newMgrPhone, setNewMgrPhone] = useState('');
  const [addingMgr, setAddingMgr] = useState(false);
  const [mgrActionId, setMgrActionId] = useState<number | null>(null);

  const toggleExpandAgency = (agencyId: number) => {
    setExpandedAgencyIds(prev => ({ ...prev, [agencyId]: !prev[agencyId] }));
  };

  const openQuickAddCoManager = (agency: any) => {
    const mgrCount = Array.isArray(agency.managers) ? agency.managers.length : 0;
    if (mgrCount >= 3) {
      toast.error('Đại lý này đã đạt tối đa 3 người phụ trách.');
      return;
    }
    setQuickAddMgrAgency(agency);
    setNewMgrName('');
    setNewMgrEmail('');
    setNewMgrPhone('');
  };

  const handleQuickAddCoManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddMgrAgency) return;
    const cleanName = newMgrName.trim();
    const cleanEmail = newMgrEmail.trim().toLowerCase();
    const cleanPhone = newMgrPhone.trim();
    if (!cleanName) {
      toast.error('Vui lòng nhập Họ và tên người phụ trách');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      toast.error('Vui lòng nhập địa chỉ Email (Gmail) hợp lệ');
      return;
    }
    setAddingMgr(true);
    try {
      const res = await fetchAPI('add_consultant_manager', {
        method: 'POST',
        body: JSON.stringify({
          consultant_id: quickAddMgrAgency.id,
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone
        })
      });
      if (res.success) {
        toast.success(res.message || `Đã thêm người phụ trách cho ${quickAddMgrAgency.name}!`);
        const agencyId = Number(quickAddMgrAgency.id);
        setExpandedAgencyIds(prev => ({ ...prev, [agencyId]: true }));
        setQuickAddMgrAgency(null);
        setNewMgrName('');
        setNewMgrEmail('');
        setNewMgrPhone('');
        if (Array.isArray(res.managers)) {
          setUsers(prev => prev.map(u => String(u.id) === String(agencyId) ? { ...u, managers: res.managers } : u));
        } else {
          fetchUsers();
        }
      } else {
        toast.error(res.message || 'Không thể thêm người phụ trách');
      }
    } catch (err: any) {
      toast.error('Lỗi kết nối: ' + err.message);
    } finally {
      setAddingMgr(false);
    }
  };

  const handleDeleteCoManagerAdmin = async (agencyId: number, mgr: any) => {
    if (!window.confirm(`Xóa người phụ trách "${mgr.name}" (${mgr.email})?`)) return;
    setMgrActionId(mgr.id);
    try {
      const res = await fetchAPI('delete_consultant_manager', {
        method: 'POST',
        body: JSON.stringify({ id: mgr.id })
      });
      if (res.success) {
        toast.success('Đã xóa người phụ trách!');
        if (Array.isArray(res.managers)) {
          setUsers(prev => prev.map(u => String(u.id) === String(agencyId) ? { ...u, managers: res.managers } : u));
        } else {
          fetchUsers();
        }
      } else {
        toast.error(res.message || 'Lỗi khi xóa');
      }
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setMgrActionId(null);
    }
  };

  const handleUnlinkCoManagerZaloAdmin = async (agencyId: number, mgr: any) => {
    if (!window.confirm(`Hủy liên kết Zalo của "${mgr.name}" để kết nối Zalo khác?`)) return;
    setMgrActionId(mgr.id);
    try {
      const res = await fetchAPI('unlink_consultant_manager_zalo', {
        method: 'POST',
        body: JSON.stringify({ id: mgr.id })
      });
      if (res.success) {
        toast.success('Đã hủy liên kết Zalo của người phụ trách!');
        if (Array.isArray(res.managers)) {
          setUsers(prev => prev.map(u => String(u.id) === String(agencyId) ? { ...u, managers: res.managers } : u));
        } else {
          fetchUsers();
        }
      } else {
        toast.error(res.message || 'Lỗi khi hủy liên kết');
      }
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setMgrActionId(null);
    }
  };

  const handleResendCoManagerEmailAdmin = async (mgr: any) => {
    setMgrActionId(mgr.id);
    try {
      const res = await fetchAPI('resend_zalo_verify_manager', {
        method: 'POST',
        body: JSON.stringify({ id: mgr.id })
      });
      if (res.success) {
        toast.success(res.message || `Đã gửi lại email hướng dẫn cho ${mgr.email}`);
      } else {
        toast.error(res.message || 'Không thể gửi email');
      }
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setMgrActionId(null);
    }
  };

  const copyCoManagerGuideAdmin = (agencyName: string, mgr: any) => {
    const portalLink = `${window.location.origin}/data/sale-portal`;
    const botLink = 'https://zalo.me/1115377476391692060';
    const code = `P${mgr.id}`;
    const text = `[HƯỚNG DẪN TRUY CẬP CỔNG ĐẠI LÝ & NHẬN LEAD - DOMATION AUTO DATA]\n`
      + `• Đại lý: ${agencyName}\n`
      + `• Người phụ trách: ${mgr.name}\n`
      + `• Gmail đăng nhập: ${mgr.email}\n\n`
      + `1. Truy cập Cổng Đại Lý (Xem & đánh giá chất lượng Lead):\n`
      + `👉 Link: ${portalLink}\n`
      + `(Chọn Đăng nhập bằng Google với Gmail: ${mgr.email})\n\n`
      + `2. Liên kết Zalo Bot để nhận thông báo Lead mới tức thì:\n`
      + `👉 Bước 1 - Mở Zalo Bot: ${botLink}\n`
      + `👉 Bước 2 - Nhắn tin cho Bot mã: ${code} (hoặc nhắn email ${mgr.email})`;
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép hướng dẫn! Bạn có thể dán gửi qua Zalo ngay.');
  };

  const handleResendZaloVerify = async (consId: number) => {
    setZaloRemindingId(consId);
    try {
      const json = await fetchAPI('resend_zalo_verify_consultant', {
        method: 'POST',
        body: JSON.stringify({ id: consId })
      });
      if (json.success) {
        toast.success(t('Đã gửi lại email nhắc xác thực Zalo.'));
        setZaloRemindedId(consId);
        setTimeout(() => setZaloRemindedId(null), 5000);
      } else {
        toast.error(json.message || t('Lỗi khi gửi email'));
      }
    } catch (e: any) {
      toast.error(t('Lỗi: ') + e.message);
    }
    setZaloRemindingId(null);
  };

  const handleSendQuickMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMessageText.trim() || !quickMessageTarget) return;
    setIsSendingMsg(true);
    try {
      const res = await fetchAPI('send_quick_zalo_message', {
        method: 'POST',
        body: JSON.stringify({ consultant_id: quickMessageTarget.id, message: quickMessageText })
      });
      if (res.success) {
        toast.success(res.message || t('Đã gửi tin nhắn thành công!'));
        setQuickMessageOpen(false);
        setQuickMessageText('');
      } else {
        toast.error(res.message || t('Lỗi khi gửi tin'));
      }
    } catch (e: any) {
      toast.error(t('Lỗi: ') + e.message);
    }
    setIsSendingMsg(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('Vui lòng chọn file hình ảnh hợp lệ.'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('Kích thước ảnh không được vượt quá 5MB.'));
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);

      const oldAvatar = formData.avatar || '';
      const query = `upload_avatar&old_avatar=${encodeURIComponent(oldAvatar)}`;
      const res = await fetchAPI(query, {
        method: 'POST',
        body: fd
      });

      if (res.success && res.url) {
        setFormData(prev => ({ ...prev, avatar: res.url }));
        toast.success(t('Tải ảnh đại diện lên thành công!'));
      } else {
        toast.error(res.message || t('Lỗi khi tải ảnh lên'));
      }
    } catch (err: any) {
      toast.error(t('Lỗi kết nối: ') + err.message);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const fetchConsultantStats = async (consId: number, mode: string, start?: string, end?: string) => {
    setStatsLoading(true);
    try {
      let query = `get_consultant_stats&consultant_id=${consId}&date_mode=${mode}`;
      if (mode === 'custom' && start && end) {
        query += `&start_date=${start}&end_date=${end}`;
      }
      const json = await fetchAPI(query);
      if (json && json.success) {
        setStatsData(normalizeConsultantStatsResponse(json));
      } else {
        toast.error(json.message || t('Lỗi khi tải báo cáo thống kê'));
      }
    } catch (e: any) {
      toast.error(t('Lỗi kết nối: ') + e.message);
    }
    setStatsLoading(false);
  };

  useEffect(() => {
    if (statsModalOpen && statsConsultant) {
      if (statsDateMode !== 'custom' || (statsStartDate && statsEndDate)) {
        fetchConsultantStats(statsConsultant.id, statsDateMode, statsStartDate, statsEndDate);
      }
    }
  }, [statsModalOpen, statsConsultant, statsDateMode, statsStartDate, statsEndDate]);

  const activeCount = users.filter(u => u.status === 'active').length;
  const leaveCount = users.filter(u => u.status === 'leave').length;
  const inactiveCount = users.filter(u => u.status === 'inactive').length;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('Quản lý Đại lý')}</h1>
          <p className="page-subtitle">
            {t('Danh sách nhân sự tiếp nhận và xử lý data từ hệ thống')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setSheetModalOpen(true)} 
            className="btn secondary responsive-btn-full" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6, 
              borderColor: 'var(--color-primary)', 
              color: 'var(--color-primary)',
              background: 'transparent',
              fontWeight: 600
            }}
          >
            <FileSpreadsheet size={16} /> {t('Mời từ Google Sheets')}
          </button>
          <button onClick={openAddModal} className="btn primary responsive-btn-full">
            <Plus size={16} /> {t('Thêm Đại lý')}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="responsive-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card hover-lift">
          <div className="stat-label">{t('Tổng Đại lý')}</div>
          <div className="stat-value">{users.length}</div>
        </div>
        <div className="stat-card hover-lift">
          <div className="stat-label" style={{ color: 'var(--color-success)' }}>{t('Đang nhận Data')}</div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>{activeCount}</div>
        </div>
        <div className="stat-card hover-lift">
          <div className="stat-label" style={{ color: 'var(--color-warning)' }}>{t('Đang nghỉ phép')}</div>
          <div className="stat-value" style={{ color: 'var(--color-warning)' }}>{leaveCount}</div>
        </div>
        <div className="stat-card hover-lift">
          <div className="stat-label" style={{ color: 'var(--color-danger)' }}>{t('Ngừng hoạt động')}</div>
          <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{inactiveCount}</div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap mobile-card-table" style={{ border: 'none', borderRadius: 0 }}>
          <table className="mobile-table-compact">
            <thead>
              <tr>
                <th>{t('Tên Đại lý')}</th>
                <th>{t('Email')}</th>
                <th>{t('Zalo Bot')}</th>
                <th>{t('Trạng thái')}</th>
                <th style={{ textAlign: 'right' }}>{t('Thao tác')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => <TableRowSkeleton key={i} cols={4} />)
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                        <Users size={32} color="var(--color-text-muted)" />
                      </div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.5rem' }}>{t('Chưa có Tư vấn viên')}</h3>
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', maxWidth: 400, margin: '0 auto 1.5rem' }}>{t('Thêm tư vấn viên đầu tiên để bắt đầu chia số tự động.')}</p>
                      <button className="btn primary" onClick={openAddModal}><Plus size={18} /> {t('Thêm Tư vấn viên')}</button>
                    </div>
                  </td>
                </tr>
              ) : users.map((u) => {
                const mgrList = Array.isArray(u.managers) ? u.managers : [];
                const mgrCount = mgrList.length;
                const isExpanded = Boolean(expandedAgencyIds[u.id]);

                return (
                  <React.Fragment key={u.id}>
                    <tr
                      className="group table-row-hover"
                      style={{ cursor: 'pointer', background: isExpanded ? 'rgba(30, 64, 255, 0.04)' : undefined }}
                      onClick={() => openEditModal(u)}
                      title={t("Nhấp để chỉnh sửa thông tin")}
                    >
                      <td data-label={t('Tên Đại lý')}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <Avatar
                            src={u.avatar}
                            name={u.name}
                            size={32}
                            style={{
                              filter: (u.status === 'inactive' || u.status === 'leave' || Number(u.vacation_mode) === 1) ? 'grayscale(1)' : 'none',
                              opacity: (u.status === 'inactive' || u.status === 'leave' || Number(u.vacation_mode) === 1) ? 0.5 : 1
                            }}
                          />
                          <div>
                            <div
                              style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)', transition: 'color 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary)'}
                              onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text)'}
                            >
                              {u.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 3, flexWrap: 'wrap' }}>
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const sid = String(u.id).slice(0, 8).toUpperCase();
                                  navigator.clipboard?.writeText(sid);
                                  toast.success(`Đã copy ID #${sid}`);
                                }}
                                title={`Copy mã ID đầy đủ / kết nối Zalo (#${String(u.id).slice(0, 8).toUpperCase()})`}
                                style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500, fontFamily: 'monospace', cursor: 'pointer' }}
                              >
                                ID: #{String(u.id).slice(0, 8).toUpperCase()}
                              </span>
                              <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--color-text-muted)' }} />
                              {u.work_schedule ? (
                                <span
                                  style={{
                                    fontSize: '0.75rem',
                                    color: '#0ea5e9',
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    cursor: 'help',
                                    borderBottom: '1px dotted #0ea5e9'
                                  }}
                                  title={formatScheduleTooltip(u.work_schedule, t)}
                                >
                                  <Clock size={12} /> {t('Lịch tuần')}
                                </span>
                              ) : (
                                (u.work_start_time === '00:00' && u.work_end_time === '23:59') || (!u.work_start_time && !u.work_end_time) ? (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }} title={t("Nhận data 24/24")}>
                                    <Clock size={12} /> 24/24
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }} title={`${t('Nhận data từ')} ${u.work_start_time} ${t('đến')} ${u.work_end_time}`}>
                                    <Clock size={12} /> {u.work_start_time} - {u.work_end_time}
                                  </span>
                                )
                              )}

                              <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--color-text-muted)' }} />

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpandAgency(u.id);
                                }}
                                title="Bấm để sổ xem / ẩn danh sách Người phụ trách thêm"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '2px 8px',
                                  borderRadius: 999,
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  border: mgrCount > 0 ? '1px solid rgba(30, 64, 255, 0.4)' : '1px solid var(--color-border)',
                                  background: mgrCount > 0 ? 'rgba(30, 64, 255, 0.12)' : 'var(--color-bg)',
                                  color: mgrCount > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                  cursor: 'pointer'
                                }}
                              >
                                <Users size={11} />
                                <span>Phụ trách ({mgrCount}/3)</span>
                                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                              </button>

                              {mgrCount < 3 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openQuickAddCoManager(u);
                                  }}
                                  title="Thêm nhanh người phụ trách cho đại lý này"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    padding: '2px 7px',
                                    borderRadius: 999,
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    border: '1px dashed rgba(30, 64, 255, 0.55)',
                                    background: 'transparent',
                                    color: 'var(--color-primary)',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Plus size={11} />
                                  <span>Thêm</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td data-label={t('Email')} style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <img src="https://www.gstatic.com/images/branding/product/1x/gmail_2020q4_32dp.png" alt="Gmail" style={{ width: 16, height: 16, objectFit: 'contain', flexShrink: 0 }} />
                          <span>{u.email}</span>
                        </div>
                      </td>
                      <td data-label={t('Zalo Bot')}>
                        {u.zalo_chat_id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              padding: '4px 10px', borderRadius: 20,
                              background: '#e5f0ff', color: '#0068ff', fontSize: '0.75rem', fontWeight: 600
                            }}>
                              <img src="https://stc-zpl.zdn.vn/favicon.ico" alt="Zalo" style={{ width: 14, height: 14, borderRadius: '2px' }} /> {t('Đã liên kết')}
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              padding: '4px 10px', borderRadius: 20,
                              background: 'var(--color-bg)', color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 500
                            }}>
                              {t('Chưa liên kết')}
                            </span>
                            {u.email && (
                              zaloRemindedId === u.id ? (
                                <span style={{ fontSize: '0.7rem', padding: '2px 6px', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                                  <Check size={12} /> {t('Đã nhắc')}
                                </span>
                              ) : (
                                <button onClick={(e) => { e.stopPropagation(); handleResendZaloVerify(u.id); }} className="btn ghost" style={{ fontSize: '0.7rem', padding: '2px 6px', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }} title={t("Gửi email nhắc xác thực Zalo")} disabled={zaloRemindingId === u.id}>
                                  {zaloRemindingId === u.id ? <RefreshCw size={12} className="spin" /> : <Send size={12} />} {zaloRemindingId === u.id ? t('Đang gửi...') : t('Nhắc')}
                                </button>
                              )
                            )}
                          </div>
                        )}
                      </td>
                      <td data-label={t('Trạng thái')} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {u.status === 'active' ? (
                            Number(u.vacation_mode) ? (
                              <span className="badge warning" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', background: 'var(--color-warning-light)', color: 'var(--color-warning)' }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                                {t('Tạm ngưng')}
                              </span>
                            ) : (
                              <span className="badge success" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                                {t('Đang nhận Data')}
                              </span>
                            )
                          ) : u.status === 'leave' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <span className="badge warning" style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning)', display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}>
                                <Clock size={12} /> {t('Nghỉ phép')}
                              </span>
                              {(u.leave_start || u.leave_end) && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                  {u.leave_start ? new Date(u.leave_start).toLocaleDateString('vi-VN') : '...'} - {u.leave_end ? new Date(u.leave_end).toLocaleDateString('vi-VN') : '...'}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="badge danger" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}>
                              <UserX size={12} /> {t('Ngừng HĐ')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="col-actions" data-label={t('Thao tác')} style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        <div className="row-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem', opacity: 0, transition: 'opacity 0.15s' }}>
                          <button
                            onClick={() => openQuickAddCoManager(u)}
                            className="btn ghost sm"
                            style={{ width: 32, height: 32, padding: 0, borderRadius: 8, color: 'var(--color-primary)' }}
                            title={t("Thêm nhanh người phụ trách")}
                          >
                            <UserPlus size={14} />
                          </button>
                          <button
                            onClick={() => {
                              navigate(`/sale-portal?sale_id=${u.id}`);
                            }}
                            className="btn ghost sm"
                            style={{ width: 32, height: 32, padding: 0, borderRadius: 8, color: 'var(--color-success)' }}
                            title={t("Xem giao diện Portal")}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setStatsConsultant(u);
                              setStatsDateMode('this_month');
                              setStatsStartDate('');
                              setStatsEndDate('');
                              setStatsModalOpen(true);
                            }}
                            className="btn ghost sm"
                            style={{ width: 32, height: 32, padding: 0, borderRadius: 8, color: 'var(--color-primary)' }}
                            title={t("Thống kê hiệu suất")}
                          >
                            <BarChart2 size={14} />
                          </button>
                          <button onClick={() => { setDeleteId(u.id); setConfirmDeleteOpen(true); }} className="btn ghost sm" style={{ width: 32, height: 32, padding: 0, borderRadius: 8, color: 'var(--color-danger)' }} title={t("Xóa nhân sự")}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr key={`mgrs-${u.id}`} style={{ background: 'rgba(30, 64, 255, 0.035)' }}>
                        <td colSpan={5} style={{ padding: '0.75rem 1.25rem 1rem 3.25rem', borderTop: '1px dashed var(--color-border-light)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Users size={14} color="var(--color-primary)" />
                                <span>Người phụ trách & nhận thông báo cùng {u.name} ({mgrCount}/3)</span>
                              </div>
                              {mgrCount < 3 && (
                                <button
                                  type="button"
                                  onClick={() => openQuickAddCoManager(u)}
                                  className="btn sm primary"
                                  style={{ height: 28, padding: '0 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                                >
                                  <UserPlus size={13} />
                                  <span>Thêm người phụ trách ({mgrCount}/3)</span>
                                </button>
                              )}
                            </div>

                            {mgrCount > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {mgrList.map((mgr: any) => {
                                  const isBusy = mgrActionId === mgr.id;
                                  const isLinked = Boolean(mgr.zalo_chat_id);
                                  const verifyCode = `P${mgr.id}`;
                                  return (
                                    <div
                                      key={mgr.id}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: '10px',
                                        padding: '8px 12px',
                                        borderRadius: '10px',
                                        background: 'var(--color-surface)',
                                        border: '1px solid var(--color-border-light)'
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 220 }}>
                                        <Avatar name={mgr.name} size={28} />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                          <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--color-text)' }}>
                                            {mgr.name}
                                          </span>
                                          <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                                            Gmail: <strong>{mgr.email}</strong>
                                            {mgr.phone ? ` • SĐT: ${mgr.phone}` : ''}
                                          </span>
                                        </div>
                                      </div>

                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <span
                                          onClick={() => {
                                            navigator.clipboard.writeText(verifyCode);
                                            toast.success(`Đã sao chép mã Zalo: ${verifyCode}`);
                                          }}
                                          title="Bấm để sao chép mã liên kết Zalo Bot"
                                          style={{
                                            fontSize: '0.72rem',
                                            padding: '3px 8px',
                                            borderRadius: '6px',
                                            background: 'var(--color-bg)',
                                            border: '1px solid var(--color-border-light)',
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 4
                                          }}
                                        >
                                          Mã Zalo: <strong style={{ color: 'var(--color-primary)', fontFamily: 'monospace' }}>{verifyCode}</strong>
                                          <Copy size={11} />
                                        </span>

                                        {isLinked ? (
                                          <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 5,
                                            padding: '3px 9px', borderRadius: 20,
                                            background: '#e5f0ff', color: '#0068ff', fontSize: '0.72rem', fontWeight: 600
                                          }}>
                                            <img src="https://stc-zpl.zdn.vn/favicon.ico" alt="Zalo" style={{ width: 12, height: 12, borderRadius: '2px' }} />
                                            Đã liên kết Zalo
                                          </span>
                                        ) : (
                                          <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 5,
                                            padding: '3px 9px', borderRadius: 20,
                                            background: 'var(--color-bg)', color: 'var(--color-text-muted)', fontSize: '0.72rem', fontWeight: 500
                                          }}>
                                            Chưa liên kết Zalo
                                          </span>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() => copyCoManagerGuideAdmin(u.name, mgr)}
                                          disabled={isBusy}
                                          className="btn ghost sm"
                                          style={{ fontSize: '0.72rem', padding: '3px 8px', height: 26, display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid var(--color-border)' }}
                                          title="Copy hướng dẫn đăng nhập & liên kết Zalo"
                                        >
                                          <Copy size={11} /> Copy HD
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleResendCoManagerEmailAdmin(mgr)}
                                          disabled={isBusy}
                                          className="btn ghost sm"
                                          style={{ fontSize: '0.72rem', padding: '3px 8px', height: 26, color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                          title="Gửi lại email hướng dẫn"
                                        >
                                          <Send size={11} /> Nhắc mail
                                        </button>

                                        {isLinked && (
                                          <button
                                            type="button"
                                            onClick={() => handleUnlinkCoManagerZaloAdmin(u.id, mgr)}
                                            disabled={isBusy}
                                            className="btn ghost sm"
                                            style={{ fontSize: '0.72rem', padding: '3px 8px', height: 26, color: '#d97706', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                            title="Hủy liên kết Zalo cũ"
                                          >
                                            <Link2Off size={11} /> Đổi Zalo
                                          </button>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() => handleDeleteCoManagerAdmin(u.id, mgr)}
                                          disabled={isBusy}
                                          className="btn ghost sm"
                                          style={{ fontSize: '0.72rem', padding: '3px 8px', height: 26, color: 'var(--color-danger)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                          title="Xóa người phụ trách"
                                        >
                                          <Trash2 size={11} /> Xóa
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                Chưa có người phụ trách thêm cho đại lý này.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUICK ADD CO-MANAGER MODAL FOR ADMIN */}
      {quickAddMgrAgency && typeof document !== 'undefined' && createPortal(
        <div className="overlay-backdrop" onClick={() => setQuickAddMgrAgency(null)}>
          <div
            className="card"
            style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', animation: 'modalSpring 0.35s cubic-bezier(0.34, 1.18, 0.64, 1) both' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.15rem 1.25rem', borderBottom: '1px solid var(--color-border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(30, 64, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                    Thêm người phụ trách — {quickAddMgrAgency.name}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                    Cấp quyền đăng nhập Cổng Đại Lý & nhận đồng thời 100% thông báo Lead mới (tối đa 3 người)
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setQuickAddMgrAgency(null)} style={{ color: 'var(--color-text-muted)', padding: 4, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleQuickAddCoManager} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Họ và tên người phụ trách <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: Đức Hoạt GĐKD"
                  value={newMgrName}
                  onChange={e => setNewMgrName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Email đăng nhập & nhận thông báo (Gmail) <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="VD: hoathd.hopnhatland@gmail.com"
                  value={newMgrEmail}
                  onChange={e => setNewMgrEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Số điện thoại (Tùy chọn)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: 0867100818"
                  value={newMgrPhone}
                  onChange={e => setNewMgrPhone(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.625rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border-light)' }}>
                <button type="button" className="btn secondary" onClick={() => setQuickAddMgrAgency(null)} disabled={addingMgr}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn primary" disabled={addingMgr} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <UserPlus size={16} />
                  <span>{addingMgr ? 'Đang thêm...' : 'Thêm người phụ trách'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

            {/* GOOGLE SHEETS AGENT INVITATION MODAL */}
      {sheetModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="overlay-backdrop" onClick={() => setSheetModalOpen(false)}>
          <div
            className="card"
            style={{ width: '100%', maxWidth: 780, maxHeight: '92vh', display: 'flex', flexDirection: 'column', animation: 'modalSpring 0.4s cubic-bezier(0.34, 1.18, 0.64, 1) both' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', borderBottom: '1px solid var(--color-border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(30, 64, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                  <FileSpreadsheet size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
                    {t('Mời Đại lý bằng Google Sheets')}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                    {t('Tự động quét danh sách, thêm vào vòng phân bổ và gửi Email kích hoạt Zalo Bot')}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setSheetModalOpen(false)} style={{ color: 'var(--color-text-muted)', padding: 4, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(30, 64, 255, 0.08)', border: '1px solid rgba(30, 64, 255, 0.25)', borderRadius: 10, padding: '0.875rem 1rem', fontSize: '0.8125rem', color: 'var(--color-text)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>✉️</span>
                <div>
                  <strong>{t('Người gửi Email kích hoạt:')}</strong> <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>admin@domation.net</span> (DOMATION AutoData Đà Nẵng).<br />
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{t('Mỗi Đại lý sẽ nhận được mã ID riêng và đường dẫn xác thực Zalo Bot để nhận thông báo Lead 1-1 riêng tư, không đẩy vào nhóm.')}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.875rem' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>{t('Đường dẫn Google Trang tính (URL)')}</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={sheetUrl}
                    onChange={e => setSheetUrl(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>{t('Tên Trang tính (Sheet Tab)')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="DATA TỔNG HỢP SALE"
                    value={sheetTab}
                    onChange={e => setSheetTab(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>{t('Gán vào Vòng phân bổ')}</label>
                  <select
                    className="form-input"
                    value={selectedRoundId}
                    onChange={e => setSelectedRoundId(String(e.target.value))}
                  >
                    {availableRounds.map(r => (
                      <option key={r.id} value={r.id}>{r.round_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleScanSheet}
                  disabled={isScanning}
                  className="btn secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
                >
                  {isScanning ? <RefreshCw size={14} className="spin" /> : <Eye size={14} />}
                  {isScanning ? t('Đang quét dữ liệu...') : t('Quét danh sách Đại lý')}
                </button>
              </div>

              {scanDone && (
                <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{t('Kết quả quét:')}</span>
                      <span className="badge info">{scannedAgents.length} {t('Đại lý')}</span>
                    </div>
                    {scannedAgents.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn ghost sm"
                          onClick={() => setScannedAgents(prev => [...prev, { name: '', email: '', phone: '', exists: false, consultant_id: null, zalo_linked: false, selected: true }])}
                          style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}
                        >
                          + {t('Thêm Đại lý')}
                        </button>
                        <button
                          type="button"
                          className="btn ghost sm"
                          onClick={() => setScannedAgents(prev => prev.map(a => ({ ...a, selected: true })))}
                          style={{ fontSize: '0.75rem' }}
                        >
                          {t('Chọn tất cả')}
                        </button>
                        <button
                          type="button"
                          className="btn ghost sm"
                          onClick={() => setScannedAgents(prev => prev.map(a => ({ ...a, selected: false })))}
                          style={{ fontSize: '0.75rem' }}
                        >
                          {t('Bỏ chọn')}
                        </button>
                      </div>
                    )}
                  </div>

                  {scannedAgents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                      {t('Không tìm thấy Đại lý nào trong trang tính. Vui lòng kiểm tra lại liên kết hoặc tên Tab.')}
                    </div>
                  ) : (
                    <div className="table-wrap" style={{ maxHeight: 260, overflowY: 'auto' }}>
                      <table>
                        <thead>
                          <tr>
                            <th style={{ width: 40, textAlign: 'center' }}>#</th>
                            <th>{t('Tên Đại lý')}</th>
                            <th>{t('Email nhận thư kích hoạt (bắt buộc)')}</th>
                            <th>{t('Số ĐT')}</th>
                            <th style={{ textAlign: 'right' }}>{t('Trạng thái')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scannedAgents.map((ag, idx) => (
                            <tr key={idx} style={{ opacity: ag.selected ? 1 : 0.6 }}>
                              <td style={{ textAlign: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(ag.selected)}
                                  onChange={e => {
                                    const val = e.target.checked;
                                    setScannedAgents(prev => prev.map((item, i) => i === idx ? { ...item, selected: val } : item));
                                  }}
                                />
                              </td>
                              <td style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                                {ag.name ? ag.name : (
                                  <input
                                    type="text"
                                    className="form-input"
                                    style={{ padding: '4px 8px', fontSize: '0.8125rem', height: 'auto', minWidth: 120 }}
                                    placeholder={t('Nhập tên đại lý...')}
                                    value={ag.name || ''}
                                    onChange={e => {
                                      const val = e.target.value;
                                      setScannedAgents(prev => prev.map((item, i) => i === idx ? { ...item, name: val } : item));
                                    }}
                                  />
                                )}
                              </td>
                              <td>
                                <input
                                  type="email"
                                  className="form-input"
                                  style={{ padding: '4px 8px', fontSize: '0.8125rem', height: 'auto', minWidth: 200 }}
                                  placeholder="Nhập email đại lý..."
                                  value={ag.email || ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setScannedAgents(prev => prev.map((item, i) => i === idx ? { ...item, email: val } : item));
                                  }}
                                />
                              </td>
                              <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                                {ag.phone || '—'}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                {ag.exists ? (
                                  <span className="badge" style={{ background: 'var(--color-bg)', color: 'var(--color-text-muted)' }}>
                                    {t('Đã có tài khoản')}
                                  </span>
                                ) : (
                                  <span className="badge success" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#16a34a' }}>
                                    {t('Mới — Sẵn sàng mời')}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ padding: '1rem 1.25rem', background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn outline" onClick={() => setSheetModalOpen(false)}>
                {t('Hủy')}
              </button>
              <button
                type="button"
                className="btn primary"
                disabled={isInviting || scannedAgents.filter(a => a.selected && a.email && a.email.trim()).length === 0}
                onClick={handleInviteAgents}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
              >
                {isInviting ? <RefreshCw size={14} className="spin" /> : <Send size={14} />}
                {isInviting 
                  ? t('Đang gửi Email kích hoạt...') 
                  : t(`Xác nhận Mời & Gửi Email (${scannedAgents.filter(a => a.selected && a.email && a.email.trim()).length})`)}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL */}
      {modalOpen && typeof document !== 'undefined' && createPortal(
        <div className="overlay-backdrop" onClick={() => setModalOpen(false)}>
          <div
            className="card"
            style={{ width: '100%', maxWidth: 800, maxHeight: '95vh', display: 'flex', flexDirection: 'column', animation: 'modalSpring 0.4s cubic-bezier(0.34, 1.18, 0.64, 1) both' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', borderBottom: '1px solid var(--color-border-light)' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                {editingUser ? t('Cập nhật Tư vấn viên') : t('Thêm Đại lý mới')}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} style={{ color: 'var(--color-text-muted)', padding: 4, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

                  {/* Cột 1: Thông tin cá nhân & Trạng thái */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Avatar Upload */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--color-bg)', borderRadius: 12, border: '1px solid var(--color-border-light)' }}>
                      <div style={{ position: 'relative' }}>
                        <Avatar src={formData.avatar} name={formData.name || 'Sale'} size={64} />
                        {isUploadingAvatar && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <RefreshCw size={16} className="spin" />
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)' }}>
                          {t('Ảnh đại diện TVV')}
                        </label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="btn outline sm"
                            style={{ fontSize: '0.75rem', padding: '4px 8px', height: 'auto', background: 'var(--color-surface)' }}
                            disabled={isUploadingAvatar}
                          >
                            {t('Tải ảnh lên')}
                          </button>
                          {formData.avatar && (
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, avatar: '' })}
                              className="btn outline sm"
                              style={{ fontSize: '0.75rem', padding: '4px 8px', height: 'auto', color: 'var(--color-danger)', borderColor: 'var(--color-danger-light)', background: 'var(--color-surface)' }}
                            >
                              {t('Xóa ảnh')}
                            </button>
                          )}
                        </div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleAvatarUpload}
                          accept="image/*"
                          style={{ display: 'none' }}
                        />
                        <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                          {t('Định dạng JPG, PNG, WEBP (tối đa 5MB)')}
                        </span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><User size={14} /> {t('Họ và Tên')} <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                      <input
                        className="form-input"
                        placeholder={t('VD: Nguyễn Văn A')}
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                        autoFocus
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={14} /> {t('Email')} <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="VD: email@domain.com"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Shield size={14} /> {t('Trạng thái')}</label>
                      <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--color-bg)', padding: '4px', borderRadius: 'var(--radius-lg)' }}>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, status: 'active' })}
                          style={{
                            flex: 1, padding: '0.5rem 0.25rem', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.75rem',
                            background: formData.status === 'active' ? (theme === 'dark' ? 'var(--color-surface)' : 'white') : 'transparent',
                            color: formData.status === 'active' ? 'var(--color-success)' : 'var(--color-text-muted)',
                            boxShadow: formData.status === 'active' ? 'var(--shadow-sm)' : 'none',
                            transition: 'all 0.2s', border: 'none', cursor: 'pointer'
                          }}
                        >{t('Đang nhận Data')}</button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, status: 'leave' })}
                          style={{
                            flex: 1, padding: '0.5rem 0.25rem', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.75rem',
                            background: formData.status === 'leave' ? (theme === 'dark' ? 'var(--color-surface)' : 'white') : 'transparent',
                            color: formData.status === 'leave' ? 'var(--color-warning)' : 'var(--color-text-muted)',
                            boxShadow: formData.status === 'leave' ? 'var(--shadow-sm)' : 'none',
                            transition: 'all 0.2s', border: 'none', cursor: 'pointer'
                          }}
                        >{t('Nghỉ phép')}</button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, status: 'inactive' })}
                          style={{
                            flex: 1, padding: '0.5rem 0.25rem', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.75rem',
                            background: formData.status === 'inactive' ? (theme === 'dark' ? 'var(--color-surface)' : 'white') : 'transparent',
                            color: formData.status === 'inactive' ? 'var(--color-danger)' : 'var(--color-text-muted)',
                            boxShadow: formData.status === 'inactive' ? 'var(--shadow-sm)' : 'none',
                            transition: 'all 0.2s', border: 'none', cursor: 'pointer'
                          }}
                        >{t('Ngừng HĐ')}</button>
                      </div>
                    </div>

                    {formData.status === 'leave' && (
                      <div className="responsive-grid-1-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'var(--color-warning-light)', padding: '0.75rem', borderRadius: 12, border: '1px solid var(--color-border)', animation: 'slideUp 0.15s ease-out' }}>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 4 }}>{t('Từ ngày')}</label>
                          <input
                            type="date"
                            className="form-input"
                            style={{ padding: '6px 10px', fontSize: '0.8125rem' }}
                            value={formData.leave_start}
                            onChange={e => setFormData({ ...formData, leave_start: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 4 }}>{t('Đến ngày')}</label>
                          <input
                            type="date"
                            className="form-input"
                            style={{ padding: '6px 10px', fontSize: '0.8125rem' }}
                            value={formData.leave_end}
                            onChange={e => setFormData({ ...formData, leave_end: e.target.value })}
                          />
                        </div>
                        <p style={{ gridColumn: 'span 2', fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 4, marginBottom: 0, lineHeight: '1.3' }}>
                          {t('Lưu ý: Trong thời gian nghỉ phép, Sale sẽ tạm ngưng nhận khách hàng mới. Khách hàng cũ đăng ký lại VẪN sẽ được tự động chuyển và gửi tin nhắn Nhắc trùng cho Sale này.')}
                        </p>
                      </div>
                    )}

                    {editingUser && formData.zalo_chat_id && (
                      <div className="form-group" style={{ padding: '0.75rem 1rem', background: 'var(--color-bg)', borderRadius: 12, border: '1px solid var(--color-border-light)', marginTop: '1.25rem' }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)' }}>
                          <Send size={14} color="var(--color-primary)" /> {t('Tương tác nhanh với Đại lý')}
                        </label>
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: 8 }}>
                          <button
                            type="button"
                            onClick={() => { setQuickMessageTarget(editingUser); setQuickMessageOpen(true); }}
                            className="btn outline"
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.75rem', padding: '8px 12px', height: 'auto', borderColor: 'var(--color-primary)', color: 'var(--color-primary)', background: 'var(--color-surface)' }}
                            onMouseEnter={e => { e.currentTarget.style.background = theme === 'dark' ? 'var(--color-bg)' : '#e5f0ff' }}
                            onMouseLeave={e => { e.currentTarget.style.background = theme === 'dark' ? 'var(--color-surface)' : 'white' }}
                          >
                            <MessageCircle size={14} /> {t('Nhắn tin nhanh')}
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmUnlinkZalo(editingUser.id)}
                            className="btn outline"
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.75rem', padding: '8px 12px', height: 'auto', borderColor: 'var(--color-warning)', color: 'var(--color-warning)', background: 'var(--color-surface)' }}
                            onMouseEnter={e => { e.currentTarget.style.background = theme === 'dark' ? 'rgba(245, 158, 11, 0.15)' : 'var(--color-warning-light)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = theme === 'dark' ? 'var(--color-surface)' : 'white' }}
                          >
                            <Link2Off size={14} /> {t('Hủy liên kết Zalo')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cột 2: Cấu hình ca làm việc & Liên kết Zalo */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={14} /> {t('Giờ làm việc của Đại lý')}
                      </label>

                      {/* Segmented Control for Schedule Mode */}
                      <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-bg)', padding: '4px', borderRadius: 'var(--radius-lg)', marginBottom: '0.75rem' }}>
                        <button
                          type="button"
                          onClick={() => setScheduleMode('daily')}
                          style={{
                            flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.75rem',
                            background: scheduleMode === 'daily' ? (theme === 'dark' ? 'var(--color-surface)' : 'white') : 'transparent',
                            color: scheduleMode === 'daily' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            boxShadow: scheduleMode === 'daily' ? 'var(--shadow-sm)' : 'none',
                            transition: 'all 0.2s', border: 'none', cursor: 'pointer'
                          }}
                        >{t('Cố định hàng ngày')}</button>
                        <button
                          type="button"
                          onClick={() => {
                            setScheduleMode('custom');
                            if (!formData.work_schedule) {
                              setFormData(prev => ({ ...prev, work_schedule: DEFAULT_SCHEDULE }));
                            }
                          }}
                          style={{
                            flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.75rem',
                            background: scheduleMode === 'custom' ? (theme === 'dark' ? 'var(--color-surface)' : 'white') : 'transparent',
                            color: scheduleMode === 'custom' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            boxShadow: scheduleMode === 'custom' ? 'var(--shadow-sm)' : 'none',
                            transition: 'all 0.2s', border: 'none', cursor: 'pointer'
                          }}
                        >{t('Tùy chỉnh (Thứ 2 - CN)')}</button>
                      </div>

                      {scheduleMode === 'daily' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--color-bg)', padding: '12px', borderRadius: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                              type="checkbox"
                              id="work_24h"
                              checked={(formData.work_start_time === '00:00' && formData.work_end_time === '23:59') || (!formData.work_start_time && !formData.work_end_time)}
                              onChange={e => {
                                if (e.target.checked) {
                                  setFormData({ ...formData, work_start_time: '00:00', work_end_time: '23:59', work_schedule: null });
                                } else {
                                  setFormData({ ...formData, work_start_time: '08:00', work_end_time: '22:00', work_schedule: null });
                                }
                              }}
                              style={{ width: 16, height: 16, cursor: 'pointer' }}
                            />
                            <label htmlFor="work_24h" style={{ fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', color: 'var(--color-text)' }}>
                              {t('Hoạt động 24/24 (Mặc định)')}
                            </label>
                          </div>

                          {!((formData.work_start_time === '00:00' && formData.work_end_time === '23:59') || (!formData.work_start_time && !formData.work_end_time)) && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 4, animation: 'slideUp 0.15s ease-out' }}>
                              <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>{t('Từ')}</label>
                                <input
                                  type="time"
                                  className="form-input"
                                  style={{ padding: '6px 10px', fontSize: '0.875rem', width: '100%' }}
                                  value={formData.work_start_time}
                                  onChange={e => setFormData({ ...formData, work_start_time: e.target.value })}
                                />
                              </div>
                              <div style={{ alignSelf: 'flex-end', paddingBottom: 10, color: 'var(--color-text-muted)' }}>-</div>
                              <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>{t('Đến')}</label>
                                <input
                                  type="time"
                                  className="form-input"
                                  style={{ padding: '6px 10px', fontSize: '0.875rem', width: '100%' }}
                                  value={formData.work_end_time}
                                  onChange={e => setFormData({ ...formData, work_end_time: e.target.value })}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        // Weekly Schedule Custom Configuration
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--color-bg)', padding: '12px', borderRadius: 12, maxHeight: '180px', overflowY: 'auto' }}>
                          {Object.entries(dayNames).map(([dayKey, dayLabel]) => {
                            const schedule = formData.work_schedule || DEFAULT_SCHEDULE;
                            const dayConfig = schedule[dayKey] || { active: true, start: '08:00', end: '17:30' };

                            return (
                              <div key={dayKey} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '6px 0', borderBottom: theme === 'dark' ? '1px solid var(--color-border)' : '1px solid var(--color-border-light)' }}>
                                <div style={{ width: '60px', fontWeight: 600, fontSize: '0.75rem' }}>
                                  {t(dayLabel)}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <ToggleSwitch
                                    checked={dayConfig.active}
                                    onChange={checked => handleDayChange(dayKey, 'active', checked)}
                                    small
                                  />
                                  <span style={{ fontSize: '0.7rem', fontWeight: 600, minWidth: '24px', color: dayConfig.active ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                                    {dayConfig.active ? t('Bật') : t('Nghỉ')}
                                  </span>
                                </div>

                                {dayConfig.active && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto', animation: 'slideUp 0.1s ease-out' }}>
                                    <input
                                      type="time"
                                      value={dayConfig.start}
                                      onChange={e => handleDayChange(dayKey, 'start', e.target.value)}
                                      style={{ padding: '2px 4px', fontSize: '0.7rem', borderRadius: 4, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
                                    />
                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>-</span>
                                    <input
                                      type="time"
                                      value={dayConfig.end}
                                      onChange={e => handleDayChange(dayKey, 'end', e.target.value)}
                                      style={{ padding: '2px 4px', fontSize: '0.7rem', borderRadius: 4, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 6, lineHeight: '1.3' }}>
                        {t('Ngoài ca làm việc, data sẽ được hệ thống tạm giữ lại và tự động bàn giao khi Sale bắt đầu ca kế tiếp.')}
                      </p>
                    </div>

                    {editingUser && formData.status === 'active' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-bg)', padding: '0.75rem 1rem', borderRadius: 10, border: '1px solid var(--color-border)', marginBottom: '1rem' }}>
                        <div style={{ flex: 1, paddingRight: '0.5rem' }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text)' }}>{t('Nhận data')}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2, lineHeight: '1.3' }}>
                            {t('Khi tắt (nghỉ nhanh): Dừng nhận khách hàng mới. Khách hàng cũ đăng ký lại VẪN sẽ tự động chuyển và gửi tin nhắn Nhắc trùng cho Sale.')}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                          <ToggleSwitch
                            checked={!Boolean(Number(editingUser.vacation_mode))}
                            onChange={async () => {
                              await handleToggleVacation(editingUser.id);
                              setEditingUser((prev: any) => prev ? { ...prev, vacation_mode: 1 - Number(prev.vacation_mode) } : null);
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="form-group" style={{ padding: '0.75rem 1rem', background: 'var(--color-info-light)', borderRadius: 12, border: '1px solid var(--color-border)' }}>
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, color: theme === 'dark' ? '#60a5fa' : '#0068ff', fontSize: '0.8125rem' }}>
                        <img src="https://stc-zpl.zdn.vn/favicon.ico" alt="Zalo" style={{ width: 14, height: 14, borderRadius: '2px' }} /> {t('Zalo Chat ID (Tự động cấp)')} <span style={{ color: 'var(--color-text-muted)', fontWeight: 400, fontSize: '0.75rem' }}>{t('(chỉ có thể hủy liên kết)')}</span>
                      </label>
                      <input
                        className="form-input"
                        placeholder={t('Chưa liên kết Zalo')}
                        value={formData.zalo_chat_id}
                        disabled
                        style={{ fontSize: '0.8125rem', padding: '6px 10px', cursor: 'not-allowed', backgroundColor: 'var(--color-border-light)' }}
                      />
                      <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 6, lineHeight: '1.3' }}>
                        {t('Hệ thống tự điền khi Sale xác thực Zalo. Admin có thể hủy liên kết nếu cần.')}
                      </p>
                    </div>


                  </div>

                </div>
              </div>

              <div style={{ padding: '1.25rem', background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderBottomLeftRadius: 'var(--radius-xl)', borderBottomRightRadius: 'var(--radius-xl)' }}>
                <button type="button" className="btn outline" onClick={() => setModalOpen(false)}>{t('Hủy bỏ')}</button>
                <button type="submit" className="btn primary" disabled={isSaving}>
                  {isSaving ? t('Đang lưu...') : (editingUser ? t('Cập nhật') : t('Thêm mới'))}
                </button>
              </div>
            </form>
          </div>
        </div>, document.body
      )}

      {/* Inline style for modal animation */}
      <style>{`
        @keyframes slideUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          60% {
            transform: translateY(-6px);
          }
          85% {
            transform: translateY(2px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Quick Message Modal */}
      {quickMessageOpen && quickMessageTarget && typeof document !== 'undefined' && createPortal(
        <div className="overlay-backdrop" onClick={() => setQuickMessageOpen(false)}>
          <div className="card" style={{ width: '100%', maxWidth: 400, maxHeight: '90vh', display: 'flex', flexDirection: 'column', animation: 'modalSpring 0.4s cubic-bezier(0.34, 1.18, 0.64, 1) both' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', borderBottom: '1px solid var(--color-border-light)' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageCircle size={20} fill="#0068ff" color="white" />
                {t('Nhắn tin cho')} {quickMessageTarget.name}
              </h3>
              <button type="button" onClick={() => setQuickMessageOpen(false)} style={{ color: 'var(--color-text-muted)', padding: 4, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSendQuickMessage} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ padding: '1.25rem', overflowY: 'auto' }}>
                <div className="form-group">
                  <label className="form-label">{t('Nội dung tin nhắn')} <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                  <textarea
                    className="form-input"
                    placeholder={t('Nhập nội dung cần thông báo cho Sale...')}
                    value={quickMessageText}
                    onChange={e => setQuickMessageText(e.target.value)}
                    required
                    autoFocus
                    style={{ minHeight: 100, resize: 'vertical' }}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 8 }}>{t('Tin nhắn sẽ được tự động gửi qua Zalo Bot (nếu có) và Email với tiêu đề [ TIN NHẮN TỪ QUẢN TRỊ VIÊN ]')}</p>
                </div>
              </div>
              <div style={{ padding: '1.25rem', background: theme === 'dark' ? 'var(--color-surface)' : 'var(--color-bg)', borderTop: theme === 'dark' ? '1px solid var(--color-border)' : '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderBottomLeftRadius: 'var(--radius-xl)', borderBottomRightRadius: 'var(--radius-xl)' }}>
                <button type="button" className="btn ghost" onClick={() => setQuickMessageOpen(false)}>{t('Hủy')}</button>
                <button type="submit" className="btn primary" disabled={isSendingMsg} style={{ background: '#0068ff', borderColor: '#0068ff' }}>
                  {isSendingMsg ? t('Đang gửi...') : t('Gửi tin nhắn')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
      {/* Statistics Modal */}
      {statsModalOpen && statsConsultant && typeof document !== 'undefined' && createPortal(
        <div className="overlay-backdrop" onClick={() => setStatsModalOpen(false)}>
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 900,
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              animation: 'modalSpring 0.4s cubic-bezier(0.34, 1.18, 0.64, 1) both'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="stats-header-container" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                <Avatar
                  src={statsConsultant.avatar}
                  name={statsConsultant.name}
                  size={44}
                  style={{
                    filter: (statsConsultant.status === 'inactive' || statsConsultant.status === 'leave' || Number(statsConsultant.vacation_mode) === 1) ? 'grayscale(1)' : 'none',
                    opacity: (statsConsultant.status === 'inactive' || statsConsultant.status === 'leave' || Number(statsConsultant.vacation_mode) === 1) ? 0.5 : 1
                  }}
                />
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text)' }}>{t('Báo cáo hiệu suất Đại lý')}</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    <strong>{statsConsultant.name}</strong> • ID: #{String(statsConsultant.id).slice(0, 8).toUpperCase()} • <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', verticalAlign: 'middle' }}><img src="https://www.gstatic.com/images/branding/product/1x/gmail_2020q4_32dp.png" alt="Gmail" style={{ width: 14, height: 14, objectFit: 'contain', flexShrink: 0 }} /> {statsConsultant.email}</span>
                  </p>
                </div>
              </div>

              {/* Timeframe Filter Dropdown in Header */}
              <div className="stats-header-filters">
                <Calendar size={18} color="var(--color-text-light)" style={{ display: 'flex', alignItems: 'center' }} />
                <div style={{ position: 'relative', zIndex: 100 }}>
                  <CustomSelect
                    options={[
                      { value: 'this_month', label: t('Tháng này') },
                      { value: 'today', label: t('Hôm nay') },
                      { value: 'yesterday', label: t('Hôm qua') },
                      { value: '7_days', label: t('7 ngày qua') },
                      { value: '30_days', label: t('30 ngày qua') },
                      { value: 'last_month', label: t('Tháng trước') },
                      { value: 'all', label: t('Tất cả thời gian') },
                      { value: 'custom', label: t('Tự chọn ngày...') }
                    ]}
                    value={statsDateMode}
                    onChange={val => setStatsDateMode(String(val))}
                    width={180}
                  />
                </div>

                {statsDateMode === 'custom' && (
                  <div className="stats-custom-dates" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', animation: 'slideUp 0.15s ease-out', flexShrink: 0 }}>
                    <input
                      type="date"
                      className="form-input"
                      style={{ padding: '4px 10px', fontSize: '0.8125rem', height: 32, width: 130 }}
                      value={statsStartDate}
                      onChange={e => setStatsStartDate(e.target.value)}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{t('đến')}</span>
                    <input
                      type="date"
                      className="form-input"
                      style={{ padding: '4px 10px', fontSize: '0.8125rem', height: 32, width: 130 }}
                      value={statsEndDate}
                      onChange={e => setStatsEndDate(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
              {statsLoading && !statsData ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', gap: '1rem' }}>
                  <RefreshCw size={32} className="spin" color="var(--color-primary)" />
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{t('Đang tải báo cáo...')}</span>
                </div>
              ) : !statsData ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>
                  {t('Không có dữ liệu thống kê.')}
                </div>
              ) : (
                <>
                  {/* Subtle Loading overlay if reloading in background */}
                  {statsLoading && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--color-primary-light)', zIndex: 10, overflow: 'hidden' }}>
                      <div style={{ width: '30%', height: '100%', background: 'var(--color-primary)', borderRadius: 'inherit', animation: 'loadingBar 1.5s infinite ease-in-out' }} />
                    </div>
                  )}
                  <style>{`
                    @keyframes loadingBar {
                      0% { transform: translateX(-100%); }
                      100% { transform: translateX(330%); }
                    }
                  `}</style>

                  {/* Visual Breakdown explanation */}
                  <div style={{
                    background: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid var(--color-border-light)',
                    borderRadius: 12,
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text)' }}>
                        {t('Tổng data hệ thống tiếp nhận cho Đại lý này:')} <strong style={{ fontSize: '1.05rem', color: 'var(--color-text)' }}>{statsData.summary?.total ?? 0}</strong> lead
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                        * {t('Các nhóm độc lập hoàn toàn, không cộng dồn/chồng chéo')}
                      </span>
                    </div>

                    {/* Stacked Percentage Bar */}
                    <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', background: 'var(--color-border-light)', position: 'relative' }}>
                      {(statsData.summary?.successful ?? 0) > 0 && (
                        <div
                          style={{
                            width: `${((statsData.summary?.successful ?? 0) / Math.max(1, statsData.summary?.total ?? 0)) * 100}%`,
                            background: 'linear-gradient(90deg, #3B82F6, #1E40FF)',
                            transition: 'width 0.3s ease'
                          }}
                          title={`${t('Thành công')}: ${statsData.summary?.successful ?? 0}`}
                        />
                      )}
                      {(statsData.summary?.reminder || 0) > 0 && (
                        <div
                          style={{
                            width: `${((statsData.summary?.reminder || 0) / Math.max(1, statsData.summary?.total ?? 0)) * 100}%`,
                            background: 'linear-gradient(90deg, #fcd34d, #f59e0b)',
                            transition: 'width 0.3s ease'
                          }}
                          title={`${t('Nhắc lại')}: ${statsData.summary?.reminder || 0}`}
                        />
                      )}
                      {(statsData.summary?.error || 0) > 0 && (
                        <div
                          style={{
                            width: `${((statsData.summary?.error || 0) / Math.max(1, statsData.summary?.total ?? 0)) * 100}%`,
                            background: 'linear-gradient(90deg, #fca5a5, #ef4444)',
                            transition: 'width 0.3s ease'
                          }}
                          title={`${t('Lỗi')}: ${statsData.summary?.error || 0}`}
                        />
                      )}
                    </div>

                    {/* Legend explaining the numbers */}
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', marginTop: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)' }} />
                        <span style={{ color: 'var(--color-text-muted)' }}>
                          {t('Thành công (Bàn giao thực tế)')}: <strong style={{ color: 'var(--color-primary)' }}>{statsData.summary?.successful ?? 0}</strong> ({(statsData.summary?.total ?? 0) > 0 ? Math.round(((statsData.summary?.successful ?? 0) / (statsData.summary?.total ?? 1)) * 100) : 0}%)
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--color-warning)' }} />
                        <span style={{ color: 'var(--color-text-muted)' }}>
                          {t('Nhắc lại (Khách cũ gọi lại)')}: <strong style={{ color: 'var(--color-warning)' }}>{statsData.summary?.reminder || 0}</strong> ({(statsData.summary?.total ?? 0) > 0 ? Math.round(((statsData.summary?.reminder || 0) / (statsData.summary?.total ?? 1)) * 100) : 0}%)
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--color-danger)' }} />
                        <span style={{ color: 'var(--color-text-muted)' }}>
                          {t('Lỗi / Trùng (Đã lọc bỏ)')}: <strong style={{ color: 'var(--color-danger)' }}>{statsData.summary?.error || 0}</strong> ({(statsData.summary?.total ?? 0) > 0 ? Math.round(((statsData.summary?.error || 0) / (statsData.summary?.total ?? 1)) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* KPI Cards Row (4 Columns) */}
                  <div className="responsive-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                    <div className="stat-card hover-lift" style={{ display: 'flex', flexDirection: 'column', padding: '1rem', minHeight: '120px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span className="stat-label" style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('Thành công')}</span>
                        <div className="stat-icon" style={{ color: 'var(--color-primary)', opacity: 0.8 }}><CheckCircle size={18} /></div>
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div className="stat-value" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text)' }}>
                          {statsData.summary?.successful ?? 0}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: 4, fontWeight: 500 }}>{t('Data gán mới thành công')}</div>
                        <div style={{ fontSize: '0.625rem', color: 'var(--color-primary)', fontWeight: 600, marginTop: 2 }}>{t('(Không bao gồm Nhắc lại & Lỗi)')}</div>
                      </div>
                    </div>

                    <div className="stat-card hover-lift" style={{ display: 'flex', flexDirection: 'column', padding: '1rem', minHeight: '120px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span className="stat-label" style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('Nhắc lại')}</span>
                        <div className="stat-icon" style={{ color: 'var(--color-warning)', opacity: 0.8 }}><Clock size={18} /></div>
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div className="stat-value" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text)' }}>
                          {statsData.summary?.reminder || 0}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: 4, fontWeight: 500 }}>{t('Yêu cầu gọi lại')}</div>
                        <div style={{ fontSize: '0.625rem', color: 'var(--color-warning)', fontWeight: 600, marginTop: 2 }}>{t('(Tính riêng biệt, không cộng dồn)')}</div>
                      </div>
                    </div>

                    <div className="stat-card hover-lift" style={{ display: 'flex', flexDirection: 'column', padding: '1rem', minHeight: '120px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span className="stat-label" style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('Lỗi')}</span>
                        <div className="stat-icon" style={{ color: 'var(--color-danger)', opacity: 0.8 }}><AlertTriangle size={18} /></div>
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div className="stat-value" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text)' }}>
                          {statsData.summary?.error || 0}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: 4, fontWeight: 500 }}>{t('Trùng lặp / Lỗi chia')}</div>
                        <div style={{ fontSize: '0.625rem', color: 'var(--color-danger)', fontWeight: 600, marginTop: 2 }}>{t('(Đã loại bỏ khỏi Thành công)')}</div>
                      </div>
                    </div>

                    <div className="stat-card hover-lift" style={{ display: 'flex', flexDirection: 'column', padding: '1rem', minHeight: '120px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span className="stat-label" style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('Tỷ lệ')}</span>
                        <div className="stat-icon" style={{ color: 'var(--color-success)', opacity: 0.8 }}><BarChart2 size={18} /></div>
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div className="stat-value" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text)' }}>
                          {(statsData.summary?.system_total_successful ?? 0) > 0
                            ? Math.round(((statsData.summary?.successful ?? 0) / (statsData.summary?.system_total_successful ?? 1)) * 100)
                            : 0}%
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: 4, fontWeight: 500 }}>{t('Thành công / Tổng của tất cả Đại lý')}</div>
                      </div>
                    </div>
                  </div>

                  {/* Row 1: Daily trend bar chart (Full Width) */}
                  <div className="card" style={{ padding: '1rem 1.25rem', background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', width: '100%' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-text)' }}>{t('Lưu lượng nhận Data theo Ngày')}</h4>
                    {statsData.by_date && statsData.by_date.length > 0 ? (
                      <div style={{ height: 180, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={statsData.by_date} margin={{ left: -10, right: 5, top: 20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="statsDateGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#D8B467" stopOpacity={1} />
                                <stop offset="100%" stopColor="#1E40FF" stopOpacity={0.8} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, (max: number) => (max < 5 ? 5 : Math.ceil(max * 1.15))]} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} width={30} />
                            <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontSize: '0.75rem', borderRadius: 8 }} />
                            <Bar dataKey="count" fill="url(#statsDateGradient)" radius={[4, 4, 0, 0]} maxBarSize={30} name={t("Data thành công")}>
                              <LabelList dataKey="count" position="top" style={{ fill: 'var(--color-text)', fontSize: 10, fontWeight: 700 }} offset={6} />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                        {t('Không có dữ liệu phân bổ theo ngày')}
                      </div>
                    )}
                  </div>

                  {/* Row 2: Status Ratio (Donut) & Rounds Breakdown */}
                  <div className="responsive-grid-1-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    {/* Donut chart for status ratio */}
                    <div className="card" style={{ padding: '1rem 1.25rem', background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-text)' }}>{t('Tỷ lệ Trạng thái Data')}</h4>
                      {(() => {
                        const totalCount = statsData.summary?.total ?? 0;
                        const statusChartData = [
                          { name: t('Thành công'), value: statsData.summary?.successful ?? 0, color: '#1E40FF' },
                          { name: t('Nhắc lại'), value: statsData.summary?.reminder ?? 0, color: '#f59e0b' },
                          { name: t('Lỗi'), value: statsData.summary?.error ?? 0, color: '#ef4444' }
                        ].filter(item => item.value > 0);

                        return totalCount > 0 && statusChartData.length > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', justifyContent: 'center' }}>
                            <div style={{ width: 140, height: 140, flexShrink: 0 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={statusChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={35}
                                    outerRadius={55}
                                    paddingAngle={4}
                                    dataKey="value"
                                  >
                                    {statusChartData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontSize: '0.75rem', borderRadius: 8 }} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.75rem' }}>
                              {statusChartData.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                                  <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                                    {item.name}: <strong style={{ fontSize: '0.8125rem' }}>{item.value}</strong> ({Math.round(item.value / totalCount * 100)}%)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.75rem', padding: '2rem 0' }}>
                            {t('Không có dữ liệu lưu lượng')}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Rounds breakdown chart */}
                    <div className="card" style={{ padding: '1rem 1.25rem', background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-text)' }}>{t('Phân bổ theo Vòng (Round)')}</h4>
                      {(statsData?.rounds || []).length > 0 ? (
                        <div style={{ height: 160, width: '100%' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statsData?.rounds || []} layout="vertical" margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border-light)" />
                              <XAxis type="number" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                              <YAxis dataKey="round_name" type="category" width={90} tick={{ fontSize: 9, fontWeight: 600 }} axisLine={false} tickLine={false} />
                              <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontSize: '0.75rem', borderRadius: 8 }} />
                              <Bar dataKey="successful_count" stackId="a" fill="#1E40FF" radius={[0, 0, 0, 0]} barSize={12} name={t("Thành công")} />
                              <Bar dataKey="reminder_count" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} barSize={12} name={t("Nhắc lại")} />
                              <Bar dataKey="error_count" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={12} name={t("Lỗi")} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.75rem', padding: '2rem 0' }}>
                          {t('Không có dữ liệu chia số theo vòng')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 3: Marketing Sources & Tickets Reports */}
                  <div className="responsive-grid-1-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    {/* Source breakdown list */}
                    <div className="card" style={{ padding: '1rem 1.25rem', background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-text)' }}>{t('Tỷ lệ Nguồn Data (Chi tiết)')}</h4>
                      {statsData.by_source && statsData.by_source.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 110, overflowY: 'auto', paddingRight: 4 }}>
                          {statsData.by_source.map((src: any, idx: number) => {
                            const succCount = statsData.summary?.successful ?? 0;
                            const sourcePercent = succCount > 0
                              ? Math.round((src.count / succCount) * 100)
                              : 0;
                            return (
                              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                  <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{src.source}</span>
                                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{src.count} {t('data')} ({sourcePercent}%)</span>
                                </div>
                                <div style={{ width: '100%', height: 4, background: 'var(--color-border-light)', borderRadius: 2 }}>
                                  <div style={{ width: `${sourcePercent}%`, height: '100%', background: '#1E40FF', borderRadius: 2 }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.75rem', padding: '1.5rem 0' }}>
                          {t('Không có dữ liệu nguồn data')}
                        </div>
                      )}
                    </div>

                    {/* Tickets Reports statistics */}
                    <div className="card" style={{ padding: '1rem 1.25rem', background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-text)' }}>{t('Thống kê Ticket báo lỗi Data')}</h4>
                      {statsData.tickets ? (
                        <>
                          <div className="responsive-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                            <div style={{ background: 'var(--color-bg)', padding: '6px', borderRadius: 8, border: '1px solid var(--color-border-light)' }}>
                              <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>{t('GỬI ĐI')}</div>
                              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-text)', marginTop: 2 }}>{statsData.tickets?.total || 0}</div>
                            </div>
                            <div style={{ background: 'var(--color-success-light)', padding: '6px', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                              <div style={{ fontSize: '0.6rem', color: 'var(--color-success)', fontWeight: 700 }}>{t('ĐÃ BÙ')}</div>
                              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-success)', marginTop: 2 }}>{statsData.tickets?.approved || 0}</div>
                            </div>
                            <div style={{ background: 'var(--color-warning-light)', padding: '6px', borderRadius: 8, border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                              <div style={{ fontSize: '0.6rem', color: 'var(--color-warning)', fontWeight: 700 }}>{t('ĐANG CHỜ')}</div>
                              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-warning)', marginTop: 2 }}>{statsData.tickets?.pending || 0}</div>
                            </div>
                            <div style={{ background: 'var(--color-danger-light)', padding: '6px', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                              <div style={{ fontSize: '0.6rem', color: 'var(--color-danger)', fontWeight: 700 }}>{t('TỪ CHỐI')}</div>
                              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-danger)', marginTop: 2 }}>{statsData.tickets?.rejected || 0}</div>
                            </div>
                          </div>
                          <div style={{ marginTop: '10px', fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', fontWeight: 500 }}>
                            {t('Tổng nhận bù:')} <strong style={{ color: '#7e22ce' }}>{(statsData.tickets?.approved || 0) + (statsData.active_compensation || 0) + (statsData.blacklist_compensation || 0)}</strong> {t('data')} (Ticket: {statsData.tickets?.approved || 0}, Blacklist: {statsData.blacklist_compensation || 0}, {t('Chủ động')}: {statsData.active_compensation || 0})
                          </div>
                          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
                            <button
                              onClick={() => {
                                setStatsModalOpen(false);
                                navigate(`/fair-share?open_comp_id=${statsConsultant.id}&date_mode=${statsDateMode}`);
                              }}
                              className="btn outline sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', padding: '6px 12px', height: 'auto', borderRadius: 8 }}
                            >
                              <Scale size={13} /> {t('Xem chi tiết data bù')}
                            </button>
                          </div>
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.75rem', padding: '1rem 0' }}>
                          {t('Không có dữ liệu ticket')}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '1rem 1.25rem', background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', borderBottomLeftRadius: 'var(--radius-xl)', borderBottomRightRadius: 'var(--radius-xl)' }}>
              <button type="button" className="btn primary sm" onClick={() => setStatsModalOpen(false)}>{t('Đóng')}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <ConfirmModal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title={t("Cảnh báo Xóa Đại lý")}
        message={t("Bạn có chắc chắn muốn xóa tư vấn viên này không? CHÚ Ý: Nếu TVV này đã từng nhận Data, việc xóa sẽ làm hỏng báo cáo thống kê. Thay vào đó, bạn nên chuyển trạng thái của TVV sang 'Ngừng hoạt động' hoặc 'Nghỉ phép'.")}
        confirmText={t("Xóa vĩnh viễn")}
      />

      <ConfirmModal
        isOpen={unlinkConfirmOpen}
        onClose={() => setUnlinkConfirmOpen(false)}
        onConfirm={handleUnlinkZalo}
        title={t("Hủy liên kết Zalo Bot")}
        message={t("Bạn có chắc chắn muốn hủy liên kết Zalo của tư vấn viên này không? Hệ thống sẽ ngừng gửi data và mọi thông báo qua Zalo cho tài khoản này ngay lập tức.")}
        confirmText={t("Hủy liên kết")}
      />
    </div>
  );
};

export const Consultants = withRouterFreezer(ConsultantsInner, '/consultants');
