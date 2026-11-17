import React, { useState, useEffect } from 'react';
import { CustomModal } from './ui/CustomModal';
import { Skeleton } from './ui/Skeleton';
import { fetchAPI } from '../utils/api';
import {
  ExternalLink, RefreshCw, Smartphone, Monitor, Copy, Check,
  Megaphone, Layers, FolderKanban, Eye, MousePointerClick,
  DollarSign, FileText, BarChart3, Target, Clock, MapPin,
  Users, Play, Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import toast from 'react-hot-toast';

interface AdPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  adId: string | null;
  initialAdName?: string | null;
  initialThumb?: string | null;
  leadName?: string | null;
}

export const AdPreviewModal: React.FC<AdPreviewModalProps> = ({
  isOpen,
  onClose,
  adId,
  initialAdName,
  initialThumb,
  leadName
}) => {
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<'MOBILE_FEED_STANDARD' | 'DESKTOP_FEED_STANDARD'>('MOBILE_FEED_STANDARD');
  const [adData, setAdData] = useState<any>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdowns' | 'targeting'>('overview');
  const [ageViewMode, setAgeViewMode] = useState<'gender' | 'age_only'>('gender');

  const loadAdPreview = async (targetAdId: string, targetFormat: string, forceRefresh = false) => {
    setLoading(true);
    try {
      const res = await fetchAPI(
        `get_ad_preview_iframe&ad_id=${encodeURIComponent(targetAdId)}&format=${targetFormat}${forceRefresh ? '&refresh=1' : ''}`
      );
      if (res.success && res.data) {
        setAdData(res.data);
      } else {
        toast.error(res.message || 'Không thể tải bản xem trước bài quảng cáo');
      }
    } catch (err) {
      console.error('Error loading ad preview:', err);
      toast.error('Lỗi kết nối khi tải bài quảng cáo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && adId) {
      setActiveTab('overview');
      loadAdPreview(adId, format, false);
    } else if (!isOpen) {
      setAdData(null);
    }
  }, [isOpen, adId, format]);

  if (!isOpen || !adId) return null;

  const displayTitle = adData?.ad_name || initialAdName || `Bài Quảng Cáo #${adId}`;
  const displayThumb = adData?.image_url || adData?.thumbnail_url || initialThumb || '';

  const formatVND = (num: number) => {
    if (!num || isNaN(num)) return '0 ₫';
    return Math.round(num).toLocaleString('vi-VN') + ' ₫';
  };

  const formatCompactVND = (val: number) => {
    if (!val || val <= 0) return '0 ₫';
    if (val >= 1_000_000) {
      const tr = val / 1_000_000;
      return `${tr >= 10 ? tr.toFixed(1) : tr.toFixed(2).replace(/\.?0+$/, '')}Tr`;
    }
    if (val >= 1_000) return `${Math.round(val / 1_000)}k`;
    return `${Math.round(val)} ₫`;
  };

  const deep = adData?.deep_insights || {};
  const byHour: any[] = deep.by_hour || [];
  const sched = deep.schedule_intelligence || null;
  const byAgeGender: any[] = deep.by_age_gender || [];
  const byRegion: any[] = deep.by_region || [];
  const byPlatform: any[] = deep.by_platform || [];
  const byDevice: any[] = deep.by_device || [];
  const targeting = deep.targeting_summary || null;
  const videoFunnel = deep.video_funnel || null;
  const engageMix = deep.engagement_mix || null;

  const maxAgeSpend = Math.max(1, ...byAgeGender.map((a) => a.spend || 0));
  const maxRegSpend = Math.max(1, ...byRegion.map((r) => r.spend || 0));

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={leadName ? `Bài Quảng Cáo Chuyển Đổi — Lead: ${leadName}` : `Chi Tiết Bài Quảng Cáo: ${displayTitle}`}
      width="1120px"
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(340px, 430px) 1fr',
          gap: '1.15rem',
          alignItems: 'start'
        }}
        className="responsive-ad-preview-grid"
      >
        <style>{`
          @media (max-width: 900px) {
            .responsive-ad-preview-grid {
              grid-template-columns: 1fr !important;
            }
          }
          .ad-iframe-wrapper iframe {
            max-width: 100% !important;
            border-radius: 12px;
            background: #ffffff;
          }
        `}</style>

        {/* Left Column: Live Facebook Ad Preview Iframe */}
        <div
          style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: '14px',
            padding: '0.9rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.7rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', background: 'var(--color-surface)', padding: '3px', borderRadius: '9px', border: '1px solid var(--color-border)' }}>
              <button
                type="button"
                onClick={() => setFormat('MOBILE_FEED_STANDARD')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 10px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: format === 'MOBILE_FEED_STANDARD' ? 'linear-gradient(135deg, #60A5FA 0%, #1E40FF 100%)' : 'transparent',
                  color: format === 'MOBILE_FEED_STANDARD' ? '#ffffff' : 'var(--color-text-muted)'
                }}
              >
                <Smartphone size={13} /> Mobile
              </button>
              <button
                type="button"
                onClick={() => setFormat('DESKTOP_FEED_STANDARD')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 10px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: format === 'DESKTOP_FEED_STANDARD' ? 'linear-gradient(135deg, #60A5FA 0%, #1E40FF 100%)' : 'transparent',
                  color: format === 'DESKTOP_FEED_STANDARD' ? '#ffffff' : 'var(--color-text-muted)'
                }}
              >
                <Monitor size={13} /> Desktop
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => loadAdPreview(adId, format, true)}
                title="Làm mới từ Meta"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 9px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  fontSize: '0.73rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={12} className={loading ? 'spin' : ''} /> Làm mới
              </button>
              {adData?.post_url && (
                <a
                  href={adData.post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 9px',
                    borderRadius: '8px',
                    background: '#1877F2',
                    color: '#ffffff',
                    fontSize: '0.73rem',
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  <ExternalLink size={12} /> Bài gốc FB
                </a>
              )}
            </div>
          </div>

          <div
            className="ad-iframe-wrapper"
            style={{
              minHeight: '450px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--color-surface)',
              borderRadius: '11px',
              border: '1px solid var(--color-border-light)',
              padding: '8px',
              overflow: 'auto'
            }}
          >
            {loading && !adData ? (
              <div style={{ width: '100%', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Skeleton width={40} height={40} borderRadius={20} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <Skeleton width="65%" height={13} />
                    <Skeleton width="40%" height={10} />
                  </div>
                </div>
                <Skeleton width="100%" height={14} />
                <Skeleton width="85%" height={14} />
                <Skeleton width="100%" height={300} borderRadius={12} />
                <Skeleton width="100%" height={36} borderRadius={8} />
              </div>
            ) : adData?.iframe_html ? (
              <div
                style={{ display: 'flex', justifyContent: 'center', width: '100%' }}
                dangerouslySetInnerHTML={{ __html: adData.iframe_html }}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '1.5rem', textAlign: 'center' }}>
                {displayThumb && (
                  <img
                    src={displayThumb}
                    alt={displayTitle}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                    style={{ maxWidth: '100%', maxHeight: '320px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--color-border)' }}
                  />
                )}
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {adData?.preview_error
                    ? `Meta API: ${adData.preview_error}`
                    : 'Không tìm thấy Iframe trực tiếp cho mã quảng cáo này (hiển thị ảnh bài viết lưu trữ).'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: 3-Tab Deep Inspection Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', minWidth: 0 }}>
          {/* Tab Switcher */}
          <div style={{
            display: 'flex',
            gap: 6,
            background: 'var(--color-bg)',
            padding: 4,
            borderRadius: 11,
            border: '1px solid var(--color-border)',
            flexWrap: 'wrap'
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              style={{
                flex: 1,
                padding: '7px 10px',
                borderRadius: 8,
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: activeTab === 'overview' ? 'linear-gradient(135deg, #1E40FF 0%, #1E3A8A 100%)' : 'transparent',
                color: activeTab === 'overview' ? '#fff' : 'var(--color-text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5
              }}
            >
              <FileText size={13} /> Tổng quan & Nội dung
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('breakdowns')}
              style={{
                flex: 1,
                padding: '7px 10px',
                borderRadius: 8,
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: activeTab === 'breakdowns' ? 'linear-gradient(135deg, #1E40FF 0%, #1E3A8A 100%)' : 'transparent',
                color: activeTab === 'breakdowns' ? '#fff' : 'var(--color-text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5
              }}
            >
              <BarChart3 size={13} /> Phân tích sâu (Giờ / Tuổi / Vùng)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('targeting')}
              style={{
                flex: 1,
                padding: '7px 10px',
                borderRadius: 8,
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: activeTab === 'targeting' ? 'linear-gradient(135deg, #1E40FF 0%, #1E3A8A 100%)' : 'transparent',
                color: activeTab === 'targeting' ? '#fff' : 'var(--color-text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5
              }}
            >
              <Target size={13} /> Targeting & Phễu Video
            </button>
          </div>

          {loading && !adData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '1rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <Skeleton width={58} height={58} borderRadius={11} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <Skeleton width={160} height={16} borderRadius={999} />
                    <Skeleton width="85%" height={18} />
                    <Skeleton width={140} height={14} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingTop: 8 }}>
                  <Skeleton width="100%" height={46} borderRadius={9} />
                  <Skeleton width="100%" height={46} borderRadius={9} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
                <Skeleton width="100%" height={74} borderRadius={11} />
                <Skeleton width="100%" height={74} borderRadius={11} />
                <Skeleton width="100%" height={74} borderRadius={11} />
                <Skeleton width="100%" height={74} borderRadius={11} />
              </div>
              <Skeleton width="100%" height={140} borderRadius={14} />
            </div>
          ) : activeTab === 'overview' && (
            <>
              {/* Ad Identity Card */}
              <div style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '14px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.8rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  {displayThumb ? (
                    <img
                      src={displayThumb}
                      alt={displayTitle}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                      style={{
                        width: 58,
                        height: 58,
                        borderRadius: '11px',
                        objectFit: 'cover',
                        border: '1.5px solid rgba(30, 64, 255, 0.35)',
                        flexShrink: 0
                      }}
                    />
                  ) : (
                    <div style={{
                      width: 58,
                      height: 58,
                      borderRadius: '11px',
                      background: 'rgba(30, 64, 255, 0.12)',
                      color: '#1E40FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Megaphone size={24} />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <span style={{
                        fontSize: '0.66rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: 'rgba(30, 64, 255, 0.14)',
                        color: '#1E40FF'
                      }}>
                        Goal: {adData?.goal_group || 'Lead Form'} ({adData?.optimization_goal || 'LEAD_GENERATION'})
                      </span>
                      {adData?.status && (
                        <span style={{
                          fontSize: '0.66rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: adData.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(148, 163, 184, 0.15)',
                          color: adData.status === 'ACTIVE' ? '#059669' : 'var(--color-text-muted)'
                        }}>
                          {adData.status}
                        </span>
                      )}
                      {(adData?.daily_budget > 0 || adData?.lifetime_budget > 0) && (
                        <span style={{
                          fontSize: '0.66rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: 'rgba(37, 99, 235, 0.1)',
                          color: '#2563eb'
                        }}>
                          Ngân sách: {adData.daily_budget > 0 ? `${formatCompactVND(adData.daily_budget)}/ngày` : `${formatCompactVND(adData.lifetime_budget)} trọn đời`}
                        </span>
                      )}
                    </div>

                    <h4 style={{ margin: '0 0 6px 0', fontSize: '0.94rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.35 }}>
                      {displayTitle}
                    </h4>

                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.73rem', color: 'var(--color-text-muted)', background: 'var(--color-bg)', padding: '2px 8px', borderRadius: '6px', border: '1px solid var(--color-border-light)' }}>
                      <span>Ad ID: <strong style={{ fontFamily: 'monospace', color: 'var(--color-text)' }}>{adId}</strong></span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(adId);
                          setCopiedId(true);
                          setTimeout(() => setCopiedId(false), 1500);
                          toast.success('Đã sao chép ID Quảng cáo');
                        }}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 2, color: '#1E40FF', display: 'inline-flex' }}
                        title="Sao chép Ad ID"
                      >
                        {copiedId ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Campaign & Adset Hierarchy */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.6rem',
                  paddingTop: '0.7rem',
                  borderTop: '1px dashed var(--color-border-light)'
                }}>
                  <div style={{ background: 'var(--color-bg)', padding: '7px 10px', borderRadius: '9px', border: '1px solid var(--color-border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.67rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                      <FolderKanban size={11} style={{ color: '#1E40FF' }} /> Chiến dịch (Campaign)
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text)', wordBreak: 'break-word' }}>
                      {adData?.campaign_name || 'Chưa xác định'}
                    </div>
                  </div>

                  <div style={{ background: 'var(--color-bg)', padding: '7px 10px', borderRadius: '9px', border: '1px solid var(--color-border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.67rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                      <Layers size={11} style={{ color: '#8B5CF6' }} /> Nhóm QC (Ad Set)
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text)', wordBreak: 'break-word' }}>
                      {adData?.adset_name || 'Chưa xác định'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Meta Insights 4-Card Strip */}
              {adData && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
                  <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '11px', padding: '0.7rem 0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.67rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      <DollarSign size={12} style={{ color: '#10B981' }} /> Chi tiêu (Ngày có Lead)
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#059669', marginTop: '3px' }}>
                      {formatVND(adData.spend)}
                    </div>
                    <div style={{ fontSize: '0.67rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      Tổng chi Meta: {formatVND(adData.total_meta_spend || adData.spend)} • CPM: {formatCompactVND(adData.cpm)}
                    </div>
                  </div>

                  <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '11px', padding: '0.7rem 0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.67rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      <Users size={12} style={{ color: '#1E40FF' }} /> Kết quả Meta & Tần suất
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '3px' }}>
                      {adData.meta_leads || adData.meta_results || 0} <span style={{ fontSize: '0.73rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>kết quả Meta</span>
                    </div>
                    <div style={{ fontSize: '0.67rem', color: (adData.frequency || 0) > 3.5 ? '#dc2626' : 'var(--color-text-muted)', marginTop: '2px', fontWeight: (adData.frequency || 0) > 3.5 ? 700 : 500 }}>
                      Frequency: {Number(adData.frequency || 0).toFixed(2)} {(adData.frequency || 0) > 3.5 ? '(Tần suất cao)' : ''}
                    </div>
                  </div>

                  <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '11px', padding: '0.7rem 0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.67rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      <Eye size={12} style={{ color: '#3B82F6' }} /> Hiển thị / Reach
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '3px' }}>
                      {(adData.impressions || 0).toLocaleString('vi-VN')}
                    </div>
                    <div style={{ fontSize: '0.67rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      Reach: {(adData.reach || 0).toLocaleString('vi-VN')} người
                    </div>
                  </div>

                  <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '11px', padding: '0.7rem 0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.67rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      <MousePointerClick size={12} style={{ color: '#F59E0B' }} /> Lượt nhấp (CTR)
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '3px' }}>
                      {(adData.clicks || 0).toLocaleString('vi-VN')} <span style={{ fontSize: '0.74rem', color: '#D97706' }}>({Number(adData.ctr || 0).toFixed(2)}%)</span>
                    </div>
                    <div style={{ fontSize: '0.67rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      CPC: {formatVND(adData.cpc)}
                    </div>
                  </div>
                </div>
              )}

              {/* Ad Post Content / Copy */}
              {adData?.creative_body && (
                <div style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '14px',
                  padding: '0.9rem 1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', fontWeight: 800, color: 'var(--color-text)', textTransform: 'uppercase' }}>
                      <FileText size={13} style={{ color: '#1E40FF' }} /> Nội dung bài viết (Ad Copy)
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(adData.creative_body);
                        toast.success('Đã sao chép nội dung bài quảng cáo');
                      }}
                      style={{
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg)',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        color: 'var(--color-text-muted)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Copy size={11} /> Sao chép
                    </button>
                  </div>
                  <div style={{
                    maxHeight: '210px',
                    overflowY: 'auto',
                    fontSize: '0.79rem',
                    lineHeight: 1.55,
                    color: 'var(--color-text)',
                    whiteSpace: 'pre-wrap',
                    background: 'var(--color-bg)',
                    padding: '0.7rem 0.85rem',
                    borderRadius: '9px',
                    border: '1px solid var(--color-border-light)'
                  }}>
                    {adData.creative_body}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'breakdowns' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '560px', overflowY: 'auto', paddingRight: 4 }}>
              {/* 1. Schedule Intelligence & Hourly Distribution */}
              <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 13, padding: '0.85rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={14} color="#1E40FF" /> PHÂN BỔ KHUNG GIỜ & SCHEDULE INTELLIGENCE
                  </div>
                </div>

                {sched && (sched.best_hours?.length > 0 || sched.worst_hour) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                    <div style={{ background: 'rgba(22, 163, 74, 0.08)', border: '1px solid rgba(22, 163, 74, 0.25)', borderRadius: 9, padding: '6px 9px' }}>
                      <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase' }}>
                        Khung Giờ Vàng (Hiệu quả nhất)
                      </div>
                      <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text)', marginTop: 2 }}>
                        {(sched.best_hours || []).map((bh: any) => `${bh.label} (${bh.results} KQ • ${formatCompactVND(bh.cpr)})`).join(' • ') || 'Chưa đủ dữ liệu'}
                      </div>
                    </div>
                    {sched.worst_hour && (
                      <div style={{ background: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.22)', borderRadius: 9, padding: '6px 9px' }}>
                        <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase' }}>
                          Khung Giờ Chi Phí Cao / Ít KQ
                        </div>
                        <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text)', marginTop: 2 }}>
                          {sched.worst_hour.label} (Chi: {formatCompactVND(sched.worst_hour.spend)} • {sched.worst_hour.results} KQ)
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ width: '100%', height: 145, marginTop: 4 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={byHour.filter((_, i) => i % 2 === 0).map((h) => ({
                        label: `${h.hour}h`,
                        spend: (h.spend || 0) + (byHour[h.hour + 1]?.spend || 0),
                        results: (h.results || 0) + (byHour[h.hour + 1]?.results || 0)
                      }))}
                      margin={{ top: 8, right: 6, left: -12, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-light)" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(v) => formatCompactVND(v)} tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} width={45} />
                      <Tooltip
                        formatter={(val: any, name: any) => [
                          name === 'spend' ? formatVND(Number(val)) : `${val} KQ`,
                          name === 'spend' ? 'Chi tiêu' : 'Kết quả'
                        ]}
                        contentStyle={{ borderRadius: 10, fontSize: '0.73rem', border: '1px solid rgba(30, 64, 255, 0.35)' }}
                      />
                      <Bar dataKey="spend" name="spend" fill="#1E40FF" radius={[5, 5, 0, 0]} maxBarSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 2. Age & Gender Breakdown */}
              <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 13, padding: '0.85rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Users size={14} color="#2563eb" /> ĐỘ TUỔI & GIỚI TÍNH (AGE & GENDER)
                  </div>
                  <div style={{ display: 'inline-flex', background: 'var(--color-bg)', padding: 2, borderRadius: 7, border: '1px solid var(--color-border)' }}>
                    <button
                      type="button"
                      onClick={() => setAgeViewMode('gender')}
                      style={{
                        padding: '2px 8px', borderRadius: 5, border: 'none', fontSize: '0.66rem', fontWeight: 700, cursor: 'pointer',
                        background: ageViewMode === 'gender' ? '#1E40FF' : 'transparent',
                        color: ageViewMode === 'gender' ? '#fff' : 'var(--color-text-muted)'
                      }}
                    >
                      Nam / Nữ
                    </button>
                    <button
                      type="button"
                      onClick={() => setAgeViewMode('age_only')}
                      style={{
                        padding: '2px 8px', borderRadius: 5, border: 'none', fontSize: '0.66rem', fontWeight: 700, cursor: 'pointer',
                        background: ageViewMode === 'age_only' ? '#1E40FF' : 'transparent',
                        color: ageViewMode === 'age_only' ? '#fff' : 'var(--color-text-muted)'
                      }}
                    >
                      Chỉ Độ tuổi
                    </button>
                  </div>
                </div>

                {byAgeGender.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', padding: '0.5rem 0' }}>Chưa có dữ liệu độ tuổi cho bài quảng cáo này.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {byAgeGender.map((ag) => {
                      const pct = Math.max(4, Math.round(((ag.spend || 0) / maxAgeSpend) * 100));
                      const mPct = ag.spend > 0 ? Math.round(((ag.male_spend || 0) / ag.spend) * 100) : 0;
                      return (
                        <div key={ag.age} style={{ display: 'grid', gridTemplateColumns: '55px 1fr 135px', alignItems: 'center', gap: 8, fontSize: '0.73rem' }}>
                          <span style={{ fontWeight: 800, color: 'var(--color-text)' }}>{ag.age}</span>
                          <div style={{ background: 'var(--color-bg)', height: 10, borderRadius: 999, overflow: 'hidden', display: 'flex' }}>
                            {ageViewMode === 'gender' ? (
                              <>
                                <div style={{ width: `${(pct * mPct) / 100}%`, background: '#2563eb' }} title={`Nam: ${formatVND(ag.male_spend)}`} />
                                <div style={{ width: `${(pct * (100 - mPct)) / 100}%`, background: '#ec4899' }} title={`Nữ: ${formatVND(ag.female_spend)}`} />
                              </>
                            ) : (
                              <div style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #1E40FF, #60A5FA)' }} />
                            )}
                          </div>
                          <div style={{ textAlign: 'right', fontSize: '0.69rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                            <strong style={{ color: 'var(--color-text)' }}>{formatCompactVND(ag.spend)}</strong> • {ag.results} KQ {ag.cpr > 0 ? `(${formatCompactVND(ag.cpr)})` : ''}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. Top Regions & Platform/Device */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem' }}>
                <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 13, padding: '0.8rem 0.9rem' }}>
                  <div style={{ fontSize: '0.73rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <MapPin size={13} color="#16a34a" /> TOP TỈNH / THÀNH PHỐ
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {byRegion.slice(0, 5).map((r) => (
                      <div key={r.region} style={{ fontSize: '0.71rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{r.region}</span>
                          <span style={{ color: 'var(--color-text-muted)' }}>{formatCompactVND(r.spend)} • <strong>{r.results} KQ</strong></span>
                        </div>
                        <div style={{ background: 'var(--color-bg)', height: 5, borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.max(5, Math.round((r.spend / maxRegSpend) * 100))}%`, height: '100%', background: '#16a34a' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 13, padding: '0.8rem 0.9rem' }}>
                  <div style={{ fontSize: '0.73rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Smartphone size={13} color="#8b5cf6" /> NỀN TẢNG & THIẾT BỊ
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: '0.71rem' }}>
                    {byPlatform.map((p) => (
                      <div key={p.platform} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', borderRadius: 6, background: 'var(--color-bg)' }}>
                        <span style={{ fontWeight: 700 }}>{p.platform}</span>
                        <span>{formatCompactVND(p.spend)} • <strong>{p.results} KQ</strong></span>
                      </div>
                    ))}
                    {byDevice.slice(0, 3).map((d) => (
                      <div key={d.device} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)', padding: '2px 4px' }}>
                        <span>{d.device}</span>
                        <span>{formatCompactVND(d.spend)} ({d.results} KQ)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'targeting' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '560px', overflowY: 'auto', paddingRight: 4 }}>
              {/* 1. Targeting Summary Card (Ported from DOMATION_META renderTargetingSummary) */}
              <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 13, padding: '0.9rem 1rem' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Target size={14} color="#1E40FF" /> CẤU HÌNH TARGETING NHÓM QUẢNG CÁO (AD SET)
                </div>

                {!targeting ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Chưa có dữ liệu cấu hình Targeting cho nhóm quảng cáo này.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Visual Age Bar (13 - 65) + Gender */}
                    <div style={{ background: 'var(--color-bg)', padding: '8px 10px', borderRadius: 9, border: '1px solid var(--color-border-light)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.73rem', fontWeight: 700, marginBottom: 5 }}>
                        <span>Độ tuổi: <strong style={{ color: '#1E40FF' }}>{targeting.age_label}</strong></span>
                        <span>Giới tính: <strong style={{ color: '#2563eb' }}>{targeting.gender_label}</strong></span>
                      </div>
                      <div style={{ position: 'relative', height: 8, background: 'rgba(148, 163, 184, 0.25)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{
                          position: 'absolute',
                          left: `${Math.max(0, Math.min(100, ((targeting.age_min - 13) / 52) * 100))}%`,
                          width: `${Math.max(5, Math.min(100, ((targeting.age_max - targeting.age_min) / 52) * 100))}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #1E40FF, #60A5FA)',
                          borderRadius: 999
                        }} />
                      </div>
                    </div>

                    {/* Geo Locations */}
                    {targeting.locations?.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                          Vị trí địa lý ({targeting.locations.length})
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {targeting.locations.map((loc: string, i: number) => (
                            <span key={i} style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(22, 163, 74, 0.1)', color: '#15803d', fontSize: '0.71rem', fontWeight: 700 }}>
                              {loc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Flexible Spec Interest Groups */}
                    {targeting.interest_groups?.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                          Nhắm mục tiêu chi tiết (Sở thích / Hành vi / Nhân khẩu)
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {targeting.interest_groups.map((grp: any) => (
                            <div key={grp.group_index} style={{ background: 'var(--color-bg)', padding: '6px 9px', borderRadius: 8, border: '1px dashed var(--color-border)' }}>
                              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#1E40FF', marginBottom: 4 }}>
                                Nhóm điều kiện #{grp.group_index} (OR):
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {(grp.items || []).map((it: any, idx: number) => (
                                  <span key={idx} style={{ padding: '2px 7px', borderRadius: 5, background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', fontSize: '0.69rem', fontWeight: 600 }}>
                                    <strong style={{ color: 'var(--color-text-muted)' }}>{it.category}:</strong> {it.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Custom & Excluded Audiences */}
                    {(targeting.custom_audiences?.length > 0 || targeting.excluded_audiences?.length > 0) && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {targeting.custom_audiences?.length > 0 && (
                          <div style={{ background: 'rgba(37, 99, 235, 0.07)', padding: '6px 9px', borderRadius: 8 }}>
                            <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#1d4ed8' }}>Tệp đối tượng tùy chỉnh:</div>
                            <div style={{ fontSize: '0.71rem', marginTop: 2 }}>{targeting.custom_audiences.join(', ')}</div>
                          </div>
                        )}
                        {targeting.excluded_audiences?.length > 0 && (
                          <div style={{ background: 'rgba(220, 38, 38, 0.07)', padding: '6px 9px', borderRadius: 8 }}>
                            <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#b91c1c' }}>Loại trừ (Excluded):</div>
                            <div style={{ fontSize: '0.71rem', marginTop: 2 }}>{targeting.excluded_audiences.join(', ')}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Video Retention Funnel & Engagement Mix */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem' }}>
                <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 13, padding: '0.85rem 0.95rem' }}>
                  <div style={{ fontSize: '0.73rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Play size={13} color="#db2777" /> PHỄU GIỮ CHÂN VIDEO (FUNNEL)
                  </div>
                  {(() => {
                    const vf = videoFunnel || {};
                    const base = Math.max(1, vf.v3s || 0);
                    const steps = [
                      { label: 'Xem 3 giây', val: vf.v3s || 0 },
                      { label: 'Xem 25%', val: vf.p25 || 0 },
                      { label: 'Xem 50%', val: vf.p50 || 0 },
                      { label: 'Xem 75%', val: vf.p75 || 0 },
                      { label: 'ThruPlay', val: vf.thruplay || 0 },
                      { label: 'Xem 100%', val: vf.p100 || 0 }
                    ];
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {steps.map((s) => {
                          const pct = vf.v3s > 0 ? Math.min(100, Math.round((s.val / base) * 100)) : 0;
                          return (
                            <div key={s.label} style={{ fontSize: '0.7rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                <span style={{ fontWeight: 600 }}>{s.label}</span>
                                <span><strong>{s.val.toLocaleString('vi-VN')}</strong> ({pct}%)</span>
                              </div>
                              <div style={{ background: 'var(--color-bg)', height: 5, borderRadius: 999, overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #db2777, #f472b6)' }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 13, padding: '0.85rem 0.95rem' }}>
                  <div style={{ fontSize: '0.73rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Sparkles size={13} color="#1E40FF" /> CHI TIẾT TƯƠNG TÁC (ACTIONS)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: '0.72rem' }}>
                    {[
                      { label: 'Điền Form (Meta Lead)', val: engageMix?.meta_leads ?? adData?.meta_leads ?? 0, highlight: true },
                      { label: 'Bắt đầu Tin nhắn', val: engageMix?.messages_started ?? 0 },
                      { label: 'Nhấp liên kết (Link Clicks)', val: engageMix?.link_clicks ?? 0 },
                      { label: 'Cảm xúc (Reactions)', val: engageMix?.reactions ?? 0 },
                      { label: 'Bình luận (Comments)', val: engageMix?.comments ?? 0 },
                      { label: 'Chia sẻ (Shares)', val: engageMix?.shares ?? 0 },
                      { label: 'Lưu bài viết (Saves)', val: engageMix?.saves ?? 0 }
                    ].map((row) => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 7px', borderRadius: 6, background: row.highlight ? 'rgba(30, 64, 255, 0.1)' : 'var(--color-bg)' }}>
                        <span style={{ fontWeight: row.highlight ? 800 : 600, color: row.highlight ? '#1E40FF' : 'var(--color-text)' }}>{row.label}</span>
                        <strong style={{ color: row.highlight ? '#1E40FF' : 'var(--color-text)' }}>{(row.val || 0).toLocaleString('vi-VN')}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </CustomModal>
  );
};

export default AdPreviewModal;
