import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Activity,
  BarChart3,
  Bot,
  Briefcase,
  Database,
  Layers,
  Megaphone,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { PACKAGE_CATALOG } from '../../contexts/entitlementConstants';
import type { CustomKpiDef } from '../../modules/settings-saas/saasSettingsTypes';

interface CustomKpiEvalResult {
  id: string;
  computed_value: number;
  target_value: number;
  attainment_pct?: number;
}

export const ModularPackageDashboardDeck: React.FC = () => {
  const { token, tenantSlug } = useAuth();
  const { packageCode, hasModule, terminology, educationAddon } = useEntitlement();
  const navigate = useNavigate();

  const [customKpis, setCustomKpis] = useState<CustomKpiDef[]>([]);
  const [kpiValues, setKpiValues] = useState<Record<string, CustomKpiEvalResult>>({});
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  const [moduleStats, setModuleStats] = useState<{
    databankAvailable?: number;
    pendingApprovals?: number;
    todayAttendance?: number;
    mktCampaigns?: number;
  }>({});

  const loadModularTelemetry = useCallback(async () => {
    try {
      const [kpisRes, dbRes, attRes, apprRes, campRes] = await Promise.all([
        apiRequest<CustomKpiDef[]>('/org-rbac/custom-kpis', { token, tenantSlug }).catch(() => []),
        hasModule('leads')
          ? apiRequest<{ stats?: { available?: number } }>('/leads/databank?limit=1', {
              token,
              tenantSlug,
            }).catch(() => null)
          : Promise.resolve(null),
        hasModule('erp_attendance')
          ? apiRequest<{ summary?: { company_today_checkins?: number } }>('/attendance/overview', {
              token,
              tenantSlug,
            }).catch(() => null)
          : Promise.resolve(null),
        hasModule('erp_approvals')
          ? apiRequest<{ summary?: { pending?: number } }>('/approvals/overview', {
              token,
              tenantSlug,
            }).catch(() => null)
          : Promise.resolve(null),
        hasModule('campaigns')
          ? apiRequest<Array<Record<string, unknown>>>('/campaigns', { token, tenantSlug }).catch(() => null)
          : Promise.resolve(null),
      ]);

      const activeKpis = Array.isArray(kpisRes) ? kpisRes.filter((k) => k.is_active) : [];
      setCustomKpis(activeKpis);
      setModuleStats({
        databankAvailable: dbRes?.stats?.available ?? 0,
        todayAttendance: attRes?.summary?.company_today_checkins ?? 0,
        pendingApprovals: apprRes?.summary?.pending ?? 0,
        mktCampaigns: Array.isArray(campRes) ? campRes.length : 0,
      });

      if (activeKpis.length > 0) {
        const evalPairs = await Promise.all(
          activeKpis.slice(0, 4).map(async (kpi) => {
            const ev = await apiRequest<CustomKpiEvalResult>(`/org-rbac/custom-kpis/${kpi.id}/evaluate`, {
              token,
              tenantSlug,
            }).catch(() => null);
            return ev ? [kpi.id, ev] : null;
          })
        );
        const mapped: Record<string, CustomKpiEvalResult> = {};
        for (const pair of evalPairs) {
          if (pair) mapped[pair[0] as string] = pair[1] as CustomKpiEvalResult;
        }
        setKpiValues(mapped);
      }
    } catch {
      // Keep modular telemetry non-blocking on dashboard
    }
  }, [token, tenantSlug, hasModule]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (active) await loadModularTelemetry();
    })();
    return () => {
      active = false;
    };
  }, [loadModularTelemetry]);

  const handleEvaluateKpi = async (kpiId: string) => {
    setEvaluatingId(kpiId);
    try {
      const res = await apiRequest<CustomKpiEvalResult>(`/org-rbac/custom-kpis/${kpiId}/evaluate`, {
        method: 'POST',
        token,
        tenantSlug,
      });
      if (res) {
        setKpiValues((prev) => ({ ...prev, [kpiId]: res }));
      }
      toast.success('Đã tính lại chỉ số KPI từ dữ liệu thực');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể đánh giá Custom KPI'));
    } finally {
      setEvaluatingId(null);
    }
  };

  const pkgMeta = PACKAGE_CATALOG[packageCode] || PACKAGE_CATALOG.domation_promax;

  const shortcutCards: Array<{
    key: string;
    show: boolean;
    title: string;
    metric: string;
    sub: string;
    to: string;
    icon: React.ReactNode;
  }> = [
    {
      key: 'crm_databank',
      show: hasModule('leads'),
      title: `Kho ${terminology.lead || 'Lead'} Chung (Databank)`,
      metric: String(moduleStats.databankAvailable ?? 0),
      sub: 'Hồ sơ sẵn sàng nhận chăm sóc',
      to: '/data?view=databank',
      icon: <Database size={18} color="#1E40FF" />,
    },
    {
      key: 'mkt_hub',
      show: hasModule('campaigns') || hasModule('audiences'),
      title: 'Chiến dịch Marketing & Tệp Data',
      metric: String(moduleStats.mktCampaigns ?? 0),
      sub: 'Chiến dịch Email / Zalo ZNS & Flows',
      to: hasModule('mkt_dashboard') ? '/marketing-dashboard' : '/marketing/campaigns',
      icon: <Megaphone size={18} color="#0284C7" />,
    },
    {
      key: 'growth_roas',
      show: hasModule('growth_attribution') || packageCode === 'growth_combo',
      title: 'Phễu Growth & ROAS Xuyên kênh',
      metric: 'Attribution',
      sub: 'Theo dõi Ads -> Deal & CAPI',
      to: '/growth-attribution',
      icon: <TrendingUp size={18} color="#059669" />,
    },
    {
      key: 'erp_ops',
      show: hasModule('erp_attendance') || hasModule('erp_approvals') || packageCode === 'domation_promax',
      title: 'Vận hành ERP • Chấm công & Duyệt',
      metric: `${moduleStats.todayAttendance ?? 0} / ${moduleStats.pendingApprovals ?? 0}`,
      sub: 'Check-in hôm nay / Chờ phê duyệt',
      to: hasModule('erp_attendance') ? '/erp/attendance' : '/erp/approvals',
      icon: <ShieldCheck size={18} color="#1E40FF" />,
    },
    {
      key: 'dom_agent',
      show: hasModule('dom_agent'),
      title: 'DOM Agent AI Council',
      metric: 'RAG Live',
      sub: 'Trợ lý nội bộ theo Chính sách Workspace',
      to: '/dom-agent',
      icon: <Bot size={18} color="#7C3AED" />,
    },
    {
      key: 'edu_addon',
      show: educationAddon && hasModule('education_addon'),
      title: 'Add-on Đào tạo & Học vụ',
      metric: 'LMS Active',
      sub: 'Lớp học, Thời khóa biểu & Sổ điểm',
      to: '/erp/education',
      icon: <Briefcase size={18} color="#D97706" />,
    },
  ].filter((c) => c.show);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
      {/* Active Package Bar */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #DBEAFE',
          borderRadius: 14,
          padding: '0.85rem 1.15rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#EFF6FF',
              color: '#1E40FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Layers size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0F172A' }}>
              Không gian {pkgMeta.name}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{pkgMeta.tagline}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => navigate('/settings?tab=data_cron_billing')}
            style={{
              padding: '6px 12px',
              borderRadius: 9,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#334155',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Cấu hình Gói & KPI
          </button>
        </div>
      </div>

      {/* Modular Package Shortcut Cards */}
      {shortcutCards.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {shortcutCards.map((card) => (
            <button
              key={card.key}
              type="button"
              onClick={() => navigate(card.to)}
              style={{
                textAlign: 'left',
                padding: '0.85rem 1rem',
                borderRadius: 13,
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569' }}>{card.title}</span>
                {card.icon}
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                {card.metric}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{card.sub}</div>
            </button>
          ))}
        </div>
      )}

      {/* Custom KPIs Live Strip */}
      {customKpis.length > 0 && (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: '0.9rem 1.15rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 800, color: '#0F172A' }}>
              <BarChart3 size={15} color="#1E40FF" /> Chỉ số Custom KPI Doanh nghiệp ({customKpis.length})
            </div>
            <button
              type="button"
              onClick={() => void loadModularTelemetry()}
              style={{ border: 'none', background: 'transparent', color: '#1E40FF', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <Activity size={12} /> Làm mới KPI
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.65rem' }}>
            {customKpis.slice(0, 6).map((kpi) => {
              const ev = kpiValues[kpi.id];
              const actual = ev?.computed_value ?? kpi.computed_value ?? 0;
              const target = ev?.target_value ?? kpi.target_value ?? 1;
              const pct = Math.min(100, Math.round((Number(actual) / Math.max(1, Number(target))) * 100));
              return (
                <div
                  key={kpi.id}
                  style={{
                    padding: '0.75rem 0.9rem',
                    borderRadius: 11,
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0F172A' }}>{kpi.name}</span>
                    <button
                      type="button"
                      disabled={evaluatingId === kpi.id}
                      onClick={() => void handleEvaluateKpi(kpi.id)}
                      title="Tính lại KPI"
                      style={{ border: 'none', background: 'transparent', color: '#1E40FF', cursor: 'pointer', padding: 2 }}
                    >
                      <RefreshCw size={12} className={evaluatingId === kpi.id ? 'spin' : ''} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E40FF', fontVariantNumeric: 'tabular-nums' }}>
                      {Number(actual).toLocaleString('vi-VN')} {kpi.unit}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                      Mục tiêu: {Number(target).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 5, borderRadius: 99, background: '#E2E8F0', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: kpi.color_hex || '#1E40FF' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
