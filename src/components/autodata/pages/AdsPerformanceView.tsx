import React, { useCallback, useEffect, useState } from 'react';
import { Eye, Megaphone, MousePointerClick, RefreshCw, TrendingUp, X } from 'lucide-react';
import { apiRequest, formatVnd } from '../autodataApi';

interface AdsSummary {
  total_spend?: number;
  total_ads_tracked?: number;
  avg_cpl?: number;
  total_ad_leads?: number;
  avg_cpql?: number;
  total_positive_leads?: number;
  overall_positive_rate?: number;
  total_negative_leads?: number;
}

interface AdPerformanceRow {
  ad_id: string;
  ad_name: string;
  campaign_name: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  total_leads: number;
  cpl: number;
  cpql: number;
  positive_rate: number;
  positive_leads: number;
  image_url?: string;
  creative_title?: string;
  creative_body?: string;
}

interface AdsPerformanceViewProps {
  token: string;
  tenantSlug: string;
}

export const AdsPerformanceView: React.FC<AdsPerformanceViewProps> = ({ token, tenantSlug }) => {
  const [summary, setSummary] = useState<AdsSummary>({});
  const [ads, setAds] = useState<AdPerformanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewAd, setPreviewAd] = useState<AdPerformanceRow | null>(null);

  const fetchAds = useCallback(async () => {
    return apiRequest<{ summary: AdsSummary; ads: AdPerformanceRow[] }>('/analytics/ads-performance', {
      token,
      tenantSlug,
    });
  }, [token, tenantSlug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchAds();
        if (!cancelled) {
          setSummary(res.summary || {});
          setAds(res.ads || []);
        }
      } catch {
        if (!cancelled) setAds([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchAds]);

  const reload = async () => {
    setLoading(true);
    try {
      const res = await fetchAds();
      setSummary(res.summary || {});
      setAds(res.ads || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="inkica-glass-card flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2.5">
          <Megaphone className="h-5 w-5 text-[#1E40FF]" />
          <div>
            <h1 className="text-lg font-bold text-slate-900">Hiệu Suất Quảng Cáo Meta Ads (CPL & CPQL)</h1>
            <p className="text-xs text-slate-500">Đối soát chi phí quảng cáo với chất lượng chăm sóc Lead thực tế</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void reload()}
          className="ql-btn-outline inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Làm mới
        </button>
      </div>

      <div data-tour="ads-summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="inkica-glass-card rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-500">Tổng Chi Tiêu Meta Ads</p>
          <p className="mt-1.5 text-2xl font-extrabold text-slate-900">{formatVnd(summary.total_spend || 0)}</p>
          <p className="mt-1 text-xs text-slate-400">{summary.total_ads_tracked || 0} mẫu quảng cáo theo dõi</p>
        </div>
        <div className="inkica-glass-card rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-500">Chi Phí / Lead (CPL)</p>
          <p className="mt-1.5 text-2xl font-extrabold text-[#1E40FF]">{formatVnd(summary.avg_cpl || 0)}</p>
          <p className="mt-1 text-xs text-slate-400">{summary.total_ad_leads || 0} Lead đổ từ Ads</p>
        </div>
        <div className="inkica-glass-card rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-500">Chi Phí / Lead Chất Lượng (CPQL)</p>
          <p className="mt-1.5 text-2xl font-extrabold text-emerald-600">{formatVnd(summary.avg_cpql || 0)}</p>
          <p className="mt-1 text-xs text-slate-400">{summary.total_positive_leads || 0} Lead chất lượng</p>
        </div>
        <div className="inkica-glass-card rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-500">Tỷ Lệ Tín Hiệu Tích Cực</p>
          <p className="mt-1.5 text-2xl font-extrabold text-[#0284C7]">{summary.overall_positive_rate || 0}%</p>
          <p className="mt-1 text-xs text-slate-400">Không đạt: {summary.total_negative_leads || 0}</p>
        </div>
      </div>

      <div data-tour="ads-table" className="inkica-glass-card overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Mẫu Quảng Cáo / Chiến Dịch</th>
                <th className="px-4 py-3">Chi Tiêu</th>
                <th className="px-4 py-3">Hiển Thị / Click / CTR</th>
                <th className="px-4 py-3">Leads</th>
                <th className="px-4 py-3">CPL / CPQL</th>
                <th className="px-4 py-3">Chất Lượng</th>
                <th className="px-4 py-3 text-right">Xem Mẫu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ads.map((ad) => (
                <tr key={ad.ad_id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <p className="max-w-xs truncate font-semibold text-slate-900">{ad.ad_name}</p>
                    <p className="max-w-xs truncate text-[11px] text-slate-400">{ad.campaign_name}</p>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900">{formatVnd(ad.spend)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <MousePointerClick className="h-3.5 w-3.5 text-slate-400" />
                      {Number(ad.impressions).toLocaleString()} / {ad.clicks} ({ad.ctr}%)
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-[#1E40FF]">{ad.total_leads}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{formatVnd(ad.cpl)}</p>
                    <p className="text-[11px] text-emerald-600">CPQL: {formatVnd(ad.cpql)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-700">
                      <TrendingUp className="h-3 w-3" /> {ad.positive_rate}% ({ad.positive_leads} tốt)
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setPreviewAd(ad)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 font-semibold text-slate-700 hover:border-[#1E40FF] hover:text-[#1E40FF]"
                    >
                      <Eye className="h-3.5 w-3.5" /> Preview
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && ads.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    Chưa có dữ liệu Meta Ads Insights.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {previewAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-[#0284C7]">Ad Creative Preview</p>
                <h3 className="text-base font-bold text-slate-900">{previewAd.ad_name}</h3>
              </div>
              <button type="button" onClick={() => setPreviewAd(null)} className="rounded-lg p-1 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            {previewAd.image_url && (
              <img src={previewAd.image_url} alt={previewAd.ad_name} className="mb-3 h-48 w-full rounded-xl object-cover" />
            )}
            <p className="text-sm font-semibold text-slate-900">{previewAd.creative_title || previewAd.campaign_name}</p>
            <p className="mt-1 text-xs text-slate-600">{previewAd.creative_body || 'Không có mô tả chi tiết mẫu quảng cáo.'}</p>
          </div>
        </div>
      )}
    </div>
  );
};
