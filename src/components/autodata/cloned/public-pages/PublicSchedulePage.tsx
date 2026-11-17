import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  List,
  MapPin,
  RefreshCw,
  User,
  Video,
  X,
} from 'lucide-react';
import { apiRequest, getErrorMessage } from '../../autodataApi';
import { CalendarSkeleton, Skeleton } from '../components/ui/Skeleton';

interface PublicScheduleEvent {
  id: string;
  type: 'appointment' | 'session' | string;
  date: string;
  title: string;
  subtitle?: string;
  start_time?: string;
  end_time?: string;
  time: string;
  location?: string;
  booking_slug?: string;
  available_slots_count?: number;
}

interface PublicSchedulePayload {
  mode: string;
  slug: string;
  organization: {
    name: string;
    logo_url: string;
    address: string;
    phone: string;
    industry_label: string;
    education_addon: boolean;
  };
  shifts: Array<{
    id: string;
    code: string;
    name: string;
    start_time: string;
    end_time: string;
    working_days: number[];
  }>;
  booking_links: Array<{
    id: string;
    slug: string;
    title: string;
    subtitle?: string | null;
    host_name: string;
    duration_minutes: number;
    location_type?: string | null;
    location_value?: string | null;
  }>;
  events: PublicScheduleEvent[];
}

function resolveScheduleSlug(params: Record<string, string | undefined>): string {
  const candidate =
    params.slug || params.customerId || params.campaignId || params.lecturerId || '';
  if (candidate.trim()) return candidate.trim();
  if (typeof window === 'undefined') return '';
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
}

function toIsoDateLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const PublicSchedulePage: React.FC = () => {
  const rawParams = useParams<{
    slug?: string;
    customerId?: string;
    campaignId?: string;
    lecturerId?: string;
  }>();
  const navigate = useNavigate();
  const activeSlug = useMemo(() => resolveScheduleSlug(rawParams), [rawParams]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [payload, setPayload] = useState<PublicSchedulePayload | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'agenda'>('calendar');
  const [cursorMonth, setCursorMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  const loadSchedule = useCallback(async () => {
    if (!activeSlug) {
      setError('Liên kết lịch trình không hợp lệ.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest<PublicSchedulePayload>(
        `/api/v1/hrm/public-schedule/${encodeURIComponent(activeSlug)}`
      );
      setPayload(res);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Không thể tải lịch công khai cho liên kết này.'));
    } finally {
      setLoading(false);
    }
  }, [activeSlug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!activeSlug) {
        if (!cancelled) {
          setError('Liên kết lịch trình không hợp lệ.');
          setLoading(false);
        }
        return;
      }
      try {
        const res = await apiRequest<PublicSchedulePayload>(
          `/api/v1/hrm/public-schedule/${encodeURIComponent(activeSlug)}`
        );
        if (!cancelled) {
          setPayload(res);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Không thể tải lịch công khai cho liên kết này.'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeSlug]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, PublicScheduleEvent[]>();
    for (const ev of payload?.events || []) {
      const key = String(ev.date || '').slice(0, 10);
      const list = map.get(key) || [];
      list.push(ev);
      map.set(key, list);
    }
    return map;
  }, [payload?.events]);

  const calendarCells = useMemo(() => {
    const year = cursorMonth.getFullYear();
    const month = cursorMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    // Monday-first grid (0 = Monday ... 6 = Sunday)
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ dateStr: string; dayNum: number; inMonth: boolean }> = [];

    for (let i = 0; i < startOffset; i++) {
      const d = new Date(year, month, 1 - (startOffset - i));
      cells.push({ dateStr: toIsoDateLocal(d), dayNum: d.getDate(), inMonth: false });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      cells.push({ dateStr: toIsoDateLocal(d), dayNum: day, inMonth: true });
    }
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1];
      const nextDate = new Date(`${last.dateStr}T00:00:00`);
      nextDate.setDate(nextDate.getDate() + 1);
      cells.push({
        dateStr: toIsoDateLocal(nextDate),
        dayNum: nextDate.getDate(),
        inMonth: false,
      });
    }
    return cells;
  }, [cursorMonth]);

  const todayIso = useMemo(() => toIsoDateLocal(new Date()), []);
  const selectedDayEvents = useMemo(
    () => (selectedDateStr ? eventsByDate.get(selectedDateStr) || [] : []),
    [eventsByDate, selectedDateStr]
  );

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8F9FA', padding: '2rem 1rem' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 20, padding: 24, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <Skeleton width={52} height={52} borderRadius={14} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Skeleton width={240} height={22} />
                <Skeleton width={180} height={14} />
              </div>
            </div>
            <Skeleton width={160} height={40} borderRadius={12} />
          </div>
          <div style={{ background: '#FFFFFF', borderRadius: 20, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <CalendarSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8F9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 460, width: '100%', background: '#FFFFFF', borderRadius: 20, padding: 32, border: '1px solid #E2E8F0', textAlign: 'center' }}>
          <AlertCircle size={40} color="#DC2626" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ margin: '0 0 8px', fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
            Không thể mở lịch trình công khai
          </h2>
          <p style={{ margin: '0 0 20px', fontSize: '0.88rem', color: '#64748B' }}>{error}</p>
          <button
            type="button"
            onClick={() => void loadSchedule()}
            style={{ height: 44, padding: '0 20px', borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <RefreshCw size={16} /> Tải lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA', padding: '2rem 1rem', color: '#0F172A' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header Card */}
        <div style={{ background: '#FFFFFF', borderRadius: 22, padding: '22px 26px', border: '1px solid #E2E8F0', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img
              src={payload.organization.logo_url || '/imgs/autodata/ICON.png'}
              alt={payload.organization.name}
              style={{ width: 52, height: 52, borderRadius: 14, objectFit: 'contain', border: '1px solid #DBEAFE', padding: 6, background: '#FFFFFF' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                  {payload.organization.name}
                </h1>
                <span style={{ padding: '3px 10px', borderRadius: 999, background: '#EFF6FF', color: '#1E40FF', fontSize: '0.74rem', fontWeight: 700 }}>
                  {payload.organization.industry_label}
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                Cổng Lịch làm việc, Ca trực & Lịch hẹn 1-1 Công khai
                {payload.organization.address ? ` • ${payload.organization.address}` : ''}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              style={{
                height: 40,
                padding: '0 14px',
                borderRadius: 10,
                border: viewMode === 'calendar' ? 'none' : '1px solid #CBD5E1',
                background: viewMode === 'calendar' ? '#1E40FF' : '#FFFFFF',
                color: viewMode === 'calendar' ? '#FFFFFF' : '#334155',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <CalendarDays size={15} /> Lịch Tháng
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              style={{
                height: 40,
                padding: '0 14px',
                borderRadius: 10,
                border: viewMode === 'agenda' ? 'none' : '1px solid #CBD5E1',
                background: viewMode === 'agenda' ? '#1E40FF' : '#FFFFFF',
                color: viewMode === 'agenda' ? '#FFFFFF' : '#334155',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <List size={15} /> Danh sách Sự kiện
            </button>
          </div>
        </div>

        {/* Booking Links Strip if available */}
        {payload.booking_links.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            {payload.booking_links.map((bl) => (
              <div
                key={bl.id}
                style={{ background: '#FFFFFF', borderRadius: 16, padding: 18, border: '1px solid #DBEAFE', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
              >
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>{bl.title}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 3 }}>
                    <User size={12} style={{ display: 'inline', marginRight: 4 }} />
                    {bl.host_name} • {bl.duration_minutes} phút
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/booking/${bl.slug}`)}
                  style={{ height: 38, padding: '0 14px', borderRadius: 10, border: 'none', background: '#EFF6FF', color: '#1E40FF', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
                >
                  Đặt lịch <ExternalLink size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Calendar or Agenda */}
        {viewMode === 'calendar' ? (
          <div style={{ background: '#FFFFFF', borderRadius: 22, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarIcon size={18} color="#1E40FF" />
                Tháng {String(cursorMonth.getMonth() + 1).padStart(2, '0')} / {cursorMonth.getFullYear()}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setCursorMonth(new Date(cursorMonth.getFullYear(), cursorMonth.getMonth() - 1, 1))}
                  style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid #CBD5E1', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <ChevronLeft size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setCursorMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                  }}
                  style={{ height: 38, padding: '0 12px', borderRadius: 10, border: '1px solid #CBD5E1', background: '#FFFFFF', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Hôm nay
                </button>
                <button
                  type="button"
                  onClick={() => setCursorMonth(new Date(cursorMonth.getFullYear(), cursorMonth.getMonth() + 1, 1))}
                  style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid #CBD5E1', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'].map((dow) => (
                <div key={dow} style={{ padding: '10px 12px', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textAlign: 'center' }}>
                  {dow}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {calendarCells.map((cell) => {
                const dayEvents = eventsByDate.get(cell.dateStr) || [];
                const isToday = cell.dateStr === todayIso;
                return (
                  <div
                    key={cell.dateStr}
                    onClick={() => {
                      if (dayEvents.length > 0) setSelectedDateStr(cell.dateStr);
                    }}
                    style={{
                      minHeight: 112,
                      padding: 10,
                      borderRight: '1px solid #F1F5F9',
                      borderBottom: '1px solid #F1F5F9',
                      background: !cell.inMonth ? '#F8FAFC' : isToday ? '#F0F7FF' : '#FFFFFF',
                      opacity: cell.inMonth ? 1 : 0.55,
                      cursor: dayEvents.length > 0 ? 'pointer' : 'default',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          background: isToday ? '#1E40FF' : 'transparent',
                          color: isToday ? '#FFFFFF' : '#0F172A',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {cell.dayNum}
                      </span>
                      {dayEvents.length > 0 && (
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1E40FF', background: '#DBEAFE', padding: '1px 6px', borderRadius: 999 }}>
                          {dayEvents.length} lịch
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          style={{
                            padding: '4px 6px',
                            borderRadius: 6,
                            background: ev.type === 'appointment' ? '#DCFCE7' : '#EFF6FF',
                            color: ev.type === 'appointment' ? '#047857' : '#1E40FF',
                            fontSize: '0.71rem',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {ev.start_time ? `${ev.start_time} ` : ''}{ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>
                          +{dayEvents.length - 2} phiên khác
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ background: '#FFFFFF', borderRadius: 22, padding: 24, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {payload.events.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#64748B' }}>
                Chưa có sự kiện công khai nào trong giai đoạn này.
              </div>
            ) : (
              payload.events.map((ev) => (
                <div
                  key={ev.id}
                  style={{ padding: 16, borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
                >
                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>{ev.title}</div>
                    {ev.subtitle && <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: 2 }}>{ev.subtitle}</div>}
                    <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: '0.78rem', color: '#64748B', flexWrap: 'wrap' }}>
                      <span><CalendarIcon size={13} style={{ display: 'inline', marginRight: 4 }} />{ev.date}</span>
                      <span><Clock size={13} style={{ display: 'inline', marginRight: 4 }} />{ev.time}</span>
                      {ev.location && (
                        <span>
                          {ev.location.startsWith('http') ? <Video size={13} style={{ display: 'inline', marginRight: 4 }} /> : <MapPin size={13} style={{ display: 'inline', marginRight: 4 }} />}
                          {ev.location}
                        </span>
                      )}
                    </div>
                  </div>
                  {ev.booking_slug && (
                    <button
                      type="button"
                      onClick={() => navigate(`/booking/${ev.booking_slug}`)}
                      style={{ height: 38, padding: '0 14px', borderRadius: 10, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      Đăng ký khung giờ
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Day Detail Modal */}
        {selectedDateStr && (
          <div
            onClick={() => setSelectedDateStr(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 1000 }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ width: '100%', maxWidth: 520, background: '#FFFFFF', borderRadius: 20, padding: 24, border: '1px solid #E2E8F0', maxHeight: '85vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                  Chi tiết lịch ngày {selectedDateStr}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedDateStr(null)}
                  style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #E2E8F0', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={16} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selectedDayEvents.map((ev) => (
                  <div key={ev.id} style={{ padding: 14, borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>{ev.title}</div>
                    {ev.subtitle && <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: 2 }}>{ev.subtitle}</div>}
                    <div style={{ fontSize: '0.78rem', color: '#1E40FF', fontWeight: 700, marginTop: 6 }}>
                      {ev.time} {ev.location ? `• ${ev.location}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicSchedulePage;
