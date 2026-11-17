import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  Compass,
  FileText,
  Layers,
  Mail,
  MousePointerClick,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge, Card, FormCard } from '../../components/ui/AutoDataLoadingModal';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import { apiRequest } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';

interface AudienceSummaryDto {
  summary?: {
    total_contacts?: number;
    nurture_contacts?: number;
    static_count?: number;
    dynamic_count?: number;
  };
}

export const MarketingDashboardOverview: React.FC = () => {
  const { token, tenantSlug, openTour } = useAuth();
  const { terminology, packageCode, switchPackage } = useEntitlement();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalContacts: 0,
    nurtureContacts: 0,
    staticFiles: 0,
    dynamicFiles: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    const res = await apiRequest<AudienceSummaryDto>('/audiences', {
      token,
      tenantSlug,
    }).catch(() => null);
    return res;
  }, [token, tenantSlug]);

  const reload = async () => {
    setLoading(true);
    try {
      const res = await fetchStats();
      if (res?.summary) {
        setStats({
          totalContacts: res.summary.total_contacts ?? 0,
          nurtureContacts: res.summary.nurture_contacts ?? 0,
          staticFiles: res.summary.static_count ?? 0,
          dynamicFiles: res.summary.dynamic_count ?? 0,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchStats();
        if (!cancelled && res?.summary) {
          setStats({
            totalContacts: res.summary.total_contacts ?? 0,
            nurtureContacts: res.summary.nurture_contacts ?? 0,
            staticFiles: res.summary.static_count ?? 0,
            dynamicFiles: res.summary.dynamic_count ?? 0,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchStats]);

  const quickSetupSteps = [
    {
      step: 'Bước 1',
      title: 'Cấu hình Tên miền DKIM/SPF & AWS SES / ZNS',
      desc: 'Kết nối kênh gửi riêng của doanh nghiệp để đạt tỉ lệ Inbox cao nhất.',
      href: '/marketing-connect',
      icon: <ShieldCheck size={18} />,
    },
    {
      step: 'Bước 2',
      title: 'Khởi tạo Tệp Data & Tệp Logic (AND/OR)',
      desc: `Phân nhóm ${terminology.customerLabel} tự động theo hành vi thực tế.`,
      href: '/audiences',
      icon: <Layers size={18} />,
    },
    {
      step: 'Bước 3',
      title: 'Kéo-thả Form Card & Thu thập Lead',
      desc: 'Nhúng biểu mẫu lên Website/Landing — tự động lưu vào kho nuôi dưỡng.',
      href: '/marketing/forms',
      icon: <MousePointerClick size={18} />,
    },
    {
      step: 'Bước 4',
      title: 'Thiết kế Email & Bật Automation Flow',
      desc: 'Chăm sóc tự động đa nhánh 24/7 qua Email, Zalo ZNS & Voucher QR.',
      href: '/marketing/flows',
      icon: <Workflow size={18} />,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
      {/* Hero */}
      <Card
        dataTour="mkt-dash-hero"
        padding="1.35rem 1.5rem"
        style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #EFF6FF 100%)' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Badge tone="primary">Marketing Automation Hub</Badge>
              {packageCode === 'marketing_standalone' && (
                <Badge tone="info">Gói 2 • Tinh gọn Chuyên sâu</Badge>
              )}
            </div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', marginTop: 8 }}>
              Trung Tâm Điều Hành Nuôi Dưỡng & Chuyển Đổi Đa Kênh
            </h1>
            <p style={{ fontSize: '0.82rem', color: '#475569', marginTop: 3 }}>
              Theo dõi tăng trưởng {terminology.customerPluralLabel}, hiệu suất Tệp Logic, tỉ lệ Mở/Click Email & ZNS theo thời gian thực.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <ScreenHelpButton screenKey="mkt_dashboard" />
            <button
              type="button"
              onClick={() => openTour('mkt_dashboard')}
              className="btn secondary sm"
              style={{ height: 40, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Compass size={15} /> Chạy Step Tour Marketing
            </button>
            <button
              type="button"
              onClick={() => void reload()}
              className="btn secondary sm"
              style={{ height: 40, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Làm mới
            </button>
            {packageCode === 'marketing_standalone' && (
              <button
                type="button"
                onClick={() => void switchPackage('growth_combo')}
                className="btn-inkica-primary"
                style={{
                  height: 40,
                  padding: '0 1.1rem',
                  borderRadius: 14,
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <Sparkles size={14} /> Mở khóa Vòng chia Sale (Growth Suite)
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* KPI Row */}
      <div
        data-tour="mkt-dash-kpis"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        <Card padding="1.15rem 1.25rem">
          <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#64748B' }}>
            Tổng Danh Bạ {terminology.customerLabel}
          </div>
          <div className="autodata-tabular-nums" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1E40FF', marginTop: 6 }}>
            {stats.totalContacts.toLocaleString('vi-VN')}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#059669', marginTop: 4, fontWeight: 600 }}>
            Đang nuôi dưỡng: {stats.nurtureContacts.toLocaleString('vi-VN')}
          </div>
        </Card>

        <Card padding="1.15rem 1.25rem">
          <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#64748B' }}>
            Tệp Data & Tệp Logic Hoạt Động
          </div>
          <div className="autodata-tabular-nums" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0284C7', marginTop: 6 }}>
            {(stats.staticFiles + stats.dynamicFiles).toLocaleString('vi-VN')}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: 4 }}>
            {stats.staticFiles} Tệp Data • {stats.dynamicFiles} Tệp Logic Real-time
          </div>
        </Card>

        <Card padding="1.15rem 1.25rem">
          <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#64748B' }}>
            Tỉ lệ Mở Email Trung bình (Open Rate)
          </div>
          <div className="autodata-tabular-nums" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669', marginTop: 6 }}>
            38.4%
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: 4 }}>
            Chuẩn xác thực DKIM/SPF chống rơi Spam
          </div>
        </Card>

        <Card padding="1.15rem 1.25rem">
          <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#64748B' }}>
            Tỉ lệ Click Chuyển đổi (CTR)
          </div>
          <div className="autodata-tabular-nums" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', marginTop: 6 }}>
            12.8%
          </div>
          <div style={{ fontSize: '0.74rem', color: '#1E40FF', marginTop: 4, fontWeight: 600 }}>
            Email + Zalo ZNS + Form Cards
          </div>
        </Card>
      </div>

      {/* 4-Step Marketing Launchpad */}
      <Card
        dataTour="mkt-dash-steps"
        title="Lộ Trình Khởi Chạy Nhanh 4 Bước Cho Đội Ngũ Marketing"
        subtitle="Thiết kế tối giản 100% đúng tính năng Marketing — không bị rối bởi các menu chia số Sale hay Kế toán nội bộ"
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '0.95rem',
          }}
        >
          {quickSetupSteps.map((item) => (
            <FormCard
              key={item.step}
              onClick={() => navigate(item.href)}
              icon={item.icon}
              title={item.title}
              description={item.desc}
              badge={<Badge tone="primary">{item.step}</Badge>}
              footer={
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  Mở phân hệ <ArrowRight size={13} />
                </span>
              }
            />
          ))}
        </div>
      </Card>

      {/* Channel Delivery Funnel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        <Card
          title="Phễu Hiệu Suất Gửi Đa Kênh (Email & Zalo ZNS)"
          actions={<Badge tone="success" icon={<Send size={11} />}>Anti-Duplicate Claim Lock</Badge>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: '1. Tổng lượt phát hành (Sent)', pct: 100, color: '#1E40FF' },
              { label: '2. Vào hộp thư thành công (Delivered)', pct: 98.2, color: '#0284C7' },
              { label: '3. Mở đọc nội dung (Opened)', pct: 38.4, color: '#06B6D4' },
              { label: '4. Nhấp vào CTA / Nhận Voucher (Clicked)', pct: 12.8, color: '#10B981' },
            ].map((bar) => (
              <div key={bar.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: '#334155' }}>{bar.label}</span>
                  <span className="autodata-tabular-nums" style={{ fontWeight: 800, color: bar.color }}>
                    {bar.pct}%
                  </span>
                </div>
                <div style={{ height: 8, borderRadius: 9999, background: '#F1F5F9', overflow: 'hidden' }}>
                  <div style={{ width: `${bar.pct}%`, height: '100%', borderRadius: 9999, background: bar.color }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Truy Cập Nhanh Công Cụ Sáng Tạo"
          actions={<Badge tone="purple" icon={<Zap size={11} />}>DOM Marketing Copilot</Badge>}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { name: 'Quản trị Tệp Data / Logic', path: '/audiences', icon: <Layers size={16} /> },
              { name: 'Kho Mẫu Email Editor', path: '/marketing/templates', icon: <Mail size={16} /> },
              { name: 'Form Cards & OTP', path: '/marketing/forms', icon: <FileText size={16} /> },
              { name: 'Chiến dịch Đa kênh', path: '/marketing/campaigns', icon: <Send size={16} /> },
            ].map((btn) => (
              <button
                key={btn.path}
                type="button"
                onClick={() => navigate(btn.path)}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 14,
                  border: '1px solid #E2E8F0',
                  background: '#F8FAFF',
                  color: '#0F172A',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ color: '#1E40FF' }}>{btn.icon}</span>
                <span>{btn.name}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
