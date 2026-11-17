import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Globe,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Sparkles,
  User,
  Video,
} from 'lucide-react';
import { apiRequest, getErrorMessage } from '../../autodataApi';
import { Skeleton } from '../components/ui/Skeleton';

interface BookingSlotItem {
  start_time: string;
  end_time: string;
  available?: boolean;
}

interface AvailableDayItem {
  date: string;
  day_of_week?: number;
  label?: string;
  slots: BookingSlotItem[];
}

interface CustomQuestionSpec {
  key: string;
  label: string;
  required?: boolean;
}

interface BookingLinkDto {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  meeting_purpose?: string | null;
  duration_minutes: number;
  buffer_minutes: number;
  timezone: string;
  location_type?: string | null;
  location_value?: string | null;
  host_name: string;
  custom_questions?: CustomQuestionSpec[];
}

interface PublicBookingReadPayload {
  booking_link: BookingLinkDto;
  organization: {
    name: string;
    customer_label?: string;
  };
  booked_slots: Array<{ booking_date: string; start_time: string; end_time: string }>;
  available_days: AvailableDayItem[];
}

interface PublicBookCreatePayload {
  appointment: {
    id: string;
    guest_name: string;
    guest_email?: string | null;
    booking_date: string;
    start_time: string;
    end_time: string;
    status: string;
  };
  ics_content: string;
}

function resolveSlugFromUrl(paramSlug?: string, paramCode?: string): string {
  if (paramSlug && paramSlug.trim()) return paramSlug.trim();
  if (paramCode && paramCode.trim()) return paramCode.trim();
  if (typeof window === 'undefined') return '';
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
}

function formatDateVi(isoDate: string): string {
  const parts = isoDate.slice(0, 10).split('-');
  if (parts.length !== 3) return isoDate;
  const d = new Date(`${isoDate.slice(0, 10)}T00:00:00`);
  const dowNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const dow = Number.isNaN(d.getTime()) ? '' : `${dowNames[d.getDay()]}, `;
  return `${dow}${parts[2]}/${parts[1]}/${parts[0]}`;
}

export const PublicBooking1on1Page: React.FC = () => {
  const params = useParams<{ slug?: string; bookingCode?: string }>();
  const activeSlug = useMemo(
    () => resolveSlugFromUrl(params.slug, params.bookingCode),
    [params.slug, params.bookingCode]
  );

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [bookingLink, setBookingLink] = useState<BookingLinkDto | null>(null);
  const [orgName, setOrgName] = useState<string>('DOMATION Workspace');
  const [availableDays, setAvailableDays] = useState<AvailableDayItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<BookingSlotItem | null>(null);

  const [guestName, setGuestName] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [guestCompany, setGuestCompany] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [confirmed, setConfirmed] = useState<PublicBookCreatePayload | null>(null);

  const loadBookingInfo = useCallback(async () => {
    if (!activeSlug) {
      setError('Liên kết đặt lịch hẹn 1-1 không hợp lệ.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest<PublicBookingReadPayload>(
        `/api/v1/hrm/public-booking/${encodeURIComponent(activeSlug)}`
      );
      setBookingLink(res.booking_link);
      setOrgName(res.organization?.name || 'DOMATION Workspace');
      const days = Array.isArray(res.available_days) ? res.available_days : [];
      setAvailableDays(days);
      const firstOpenDay = days.find((d) => d.slots && d.slots.length > 0) || days[0];
      if (firstOpenDay) {
        setSelectedDate(firstOpenDay.date);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Không tìm thấy liên kết đặt lịch 1-1 hoặc lịch đã tạm đóng.'));
    } finally {
      setLoading(false);
    }
  }, [activeSlug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!activeSlug) {
        if (!cancelled) {
          setError('Liên kết đặt lịch hẹn 1-1 không hợp lệ.');
          setLoading(false);
        }
        return;
      }
      try {
        const res = await apiRequest<PublicBookingReadPayload>(
          `/api/v1/hrm/public-booking/${encodeURIComponent(activeSlug)}`
        );
        if (cancelled) return;
        setBookingLink(res.booking_link);
        setOrgName(res.organization?.name || 'DOMATION Workspace');
        const days = Array.isArray(res.available_days) ? res.available_days : [];
        setAvailableDays(days);
        const firstOpenDay = days.find((d) => d.slots && d.slots.length > 0) || days[0];
        if (firstOpenDay) {
          setSelectedDate(firstOpenDay.date);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Không tìm thấy liên kết đặt lịch 1-1 hoặc lịch đã tạm đóng.'));
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

  const currentDayObj = useMemo(
    () => availableDays.find((d) => d.date === selectedDate) || availableDays[0] || null,
    [availableDays, selectedDate]
  );

  const handleDownloadIcs = () => {
    if (!confirmed?.ics_content) return;
    const blob = new Blob([confirmed.ics_content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lich-hen-1on1-${confirmed.appointment.booking_date}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedSlot) {
      setSubmitError('Vui lòng chọn ngày và khung giờ còn trống.');
      return;
    }
    if (!guestName.trim()) {
      setSubmitError('Vui lòng nhập Họ và tên của bạn.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await apiRequest<PublicBookCreatePayload>(
        `/api/v1/hrm/public-booking/${encodeURIComponent(activeSlug)}/book`,
        {
          method: 'POST',
          body: {
            guest_name: guestName.trim(),
            guest_email: guestEmail.trim() || undefined,
            guest_phone: guestPhone.trim() || undefined,
            guest_company: guestCompany.trim() || undefined,
            booking_date: selectedDate,
            start_time: selectedSlot.start_time,
            end_time: selectedSlot.end_time,
            topic: topic.trim() || undefined,
            answers_json: answers,
          },
        }
      );
      setConfirmed(res);
    } catch (err: unknown) {
      setSubmitError(
        getErrorMessage(
          err,
          'Khung giờ vừa được đặt trước bởi khách khác. Vui lòng chọn khung giờ khác.'
        )
      );
      setSelectedSlot(null);
      void loadBookingInfo();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8F9FA', padding: '2.5rem 1rem' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 20, padding: 28, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Skeleton width={140} height={22} borderRadius={12} />
            <Skeleton width="85%" height={28} />
            <Skeleton width="65%" height={16} />
            <Skeleton width="100%" height={90} borderRadius={12} />
          </div>
          <div style={{ background: '#FFFFFF', borderRadius: 20, padding: 28, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Skeleton width={200} height={20} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {Array.from({ length: 6 }).map((_, idx) => (
                <Skeleton key={idx} width="100%" height={44} borderRadius={10} />
              ))}
            </div>
            <Skeleton width="100%" height={160} borderRadius={12} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !bookingLink) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8F9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 460, width: '100%', background: '#FFFFFF', borderRadius: 20, padding: 32, border: '1px solid #E2E8F0', textAlign: 'center', boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)' }}>
          <AlertCircle size={42} color="#DC2626" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ margin: '0 0 8px', fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
            Không thể mở trang đặt lịch
          </h2>
          <p style={{ margin: '0 0 20px', fontSize: '0.88rem', color: '#64748B', lineHeight: 1.5 }}>
            {error || 'Liên kết đặt lịch không tồn tại hoặc đã hết hiệu lực.'}
          </p>
          <button
            type="button"
            onClick={() => void loadBookingInfo()}
            style={{ height: 44, padding: '0 20px', borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <RefreshCw size={16} /> Thử tải lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA', padding: '2.5rem 1rem', color: '#0F172A' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        {confirmed ? (
          <div style={{ maxWidth: 580, margin: '0 auto', background: '#FFFFFF', borderRadius: 24, padding: 36, border: '1px solid #DBEAFE', boxShadow: '0 18px 42px rgba(30, 64, 255, 0.08)', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 size={34} />
            </div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 8px', color: '#0F172A' }}>
              Đặt lịch hẹn 1-1 thành công!
            </h1>
            <p style={{ fontSize: '0.9rem', color: '#475569', margin: '0 0 20px' }}>
              Xác nhận lịch hẹn của <strong>{confirmed.appointment.guest_name}</strong> cùng{' '}
              <strong>{bookingLink.host_name}</strong> ({orgName}).
            </p>
            <div style={{ background: '#F8FAFF', border: '1px solid #DBEAFE', borderRadius: 16, padding: 18, textAlign: 'left', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem' }}>
                <Calendar size={17} color="#1E40FF" />
                <span><strong>Ngày hẹn:</strong> {formatDateVi(confirmed.appointment.booking_date)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem' }}>
                <Clock size={17} color="#1E40FF" />
                <span><strong>Khung giờ:</strong> {confirmed.appointment.start_time} – {confirmed.appointment.end_time} ({bookingLink.timezone})</span>
              </div>
              {bookingLink.location_value && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem' }}>
                  <Video size={17} color="#1E40FF" />
                  <span><strong>Địa điểm / Phòng họp:</strong> {bookingLink.location_value}</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleDownloadIcs}
                style={{ height: 44, padding: '0 20px', borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <Download size={16} /> Tải tệp lịch (.ics) vào Google / Outlook
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmed(null);
                  setSelectedSlot(null);
                  void loadBookingInfo();
                }}
                style={{ height: 44, padding: '0 18px', borderRadius: 12, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}
              >
                Đặt lịch khác
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, alignItems: 'start' }}>
            {/* Left Info Card */}
            <div style={{ background: '#FFFFFF', borderRadius: 22, padding: 28, border: '1px solid #E2E8F0', boxShadow: '0 10px 28px rgba(15, 23, 42, 0.04)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: '#EFF6FF', color: '#1E40FF', fontSize: '0.76rem', fontWeight: 700, marginBottom: 16 }}>
                <Sparkles size={14} /> {orgName} • Smart 1-on-1 Booking
              </div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>
                {bookingLink.title}
              </h1>
              {bookingLink.subtitle && (
                <p style={{ fontSize: '0.9rem', color: '#475569', margin: '0 0 14px' }}>{bookingLink.subtitle}</p>
              )}
              {bookingLink.description && (
                <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.6, margin: '0 0 20px' }}>
                  {bookingLink.description}
                </p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.86rem', color: '#334155' }}>
                  <User size={17} color="#1E40FF" />
                  <span>Người chủ trì: <strong>{bookingLink.host_name}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.86rem', color: '#334155' }}>
                  <Clock size={17} color="#1E40FF" />
                  <span>Thời lượng phiên: <strong>{bookingLink.duration_minutes} phút</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.86rem', color: '#334155' }}>
                  <Globe size={17} color="#1E40FF" />
                  <span>Múi giờ: <strong>{bookingLink.timezone || 'Asia/Ho_Chi_Minh'}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.86rem', color: '#334155' }}>
                  {bookingLink.location_type === 'video_link' ? (
                    <Video size={17} color="#1E40FF" />
                  ) : (
                    <MapPin size={17} color="#1E40FF" />
                  )}
                  <span>Hình thức: <strong>{bookingLink.location_value || 'Trực tuyến qua Video'}</strong></span>
                </div>
              </div>
            </div>

            {/* Right Interactive Slot Picker + Form */}
            <form
              onSubmit={handleSubmit}
              style={{ background: '#FFFFFF', borderRadius: 22, padding: 28, border: '1px solid #E2E8F0', boxShadow: '0 10px 28px rgba(15, 23, 42, 0.04)', display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>
                  1. Chọn ngày hẹn khả dụng
                </label>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                  {availableDays.map((day) => {
                    const active = day.date === selectedDate;
                    return (
                      <button
                        key={day.date}
                        type="button"
                        onClick={() => {
                          setSelectedDate(day.date);
                          setSelectedSlot(null);
                        }}
                        style={{
                          minWidth: 112,
                          padding: '10px 12px',
                          borderRadius: 12,
                          border: active ? '2px solid #1E40FF' : '1px solid #E2E8F0',
                          background: active ? '#EFF6FF' : '#FFFFFF',
                          color: active ? '#1E40FF' : '#334155',
                          cursor: 'pointer',
                          textAlign: 'left',
                          flexShrink: 0,
                        }}
                      >
                        <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>{formatDateVi(day.date)}</div>
                        <div style={{ fontSize: '0.72rem', color: active ? '#1E40FF' : '#64748B', marginTop: 2 }}>
                          {day.slots.length} khung trống
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>
                  2. Chọn khung giờ ({bookingLink.duration_minutes} phút)
                </label>
                {currentDayObj && currentDayObj.slots.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
                    {currentDayObj.slots.map((slot) => {
                      const isPicked = selectedSlot?.start_time === slot.start_time;
                      return (
                        <button
                          key={slot.start_time}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          style={{
                            height: 42,
                            borderRadius: 10,
                            border: isPicked ? '2px solid #1E40FF' : '1px solid #CBD5E1',
                            background: isPicked ? '#1E40FF' : '#FFFFFF',
                            color: isPicked ? '#FFFFFF' : '#0F172A',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                          }}
                        >
                          {slot.start_time}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: 14, borderRadius: 12, background: '#F8FAFC', color: '#64748B', fontSize: '0.84rem' }}>
                    Ngày này đã kín lịch. Vui lòng chọn ngày tiếp theo.
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: 6 }}>Họ và tên *</label>
                  <div style={{ position: 'relative' }}>
                    <User size={15} color="#64748B" style={{ position: 'absolute', left: 12, top: 14 }} />
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      style={{ width: '100%', height: 44, padding: '0 12px 0 36px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: 6 }}>Số điện thoại</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={15} color="#64748B" style={{ position: 'absolute', left: 12, top: 14 }} />
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="0901234567"
                      style={{ width: '100%', height: 44, padding: '0 12px 0 36px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: 6 }}>Email nhận lịch (.ics)</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} color="#64748B" style={{ position: 'absolute', left: 12, top: 14 }} />
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="ban@congty.vn"
                      style={{ width: '100%', height: 44, padding: '0 12px 0 36px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: 6 }}>Đơn vị / Công ty</label>
                  <div style={{ position: 'relative' }}>
                    <Building2 size={15} color="#64748B" style={{ position: 'absolute', left: 12, top: 14 }} />
                    <input
                      type="text"
                      value={guestCompany}
                      onChange={(e) => setGuestCompany(e.target.value)}
                      placeholder="Tên doanh nghiệp"
                      style={{ width: '100%', height: 44, padding: '0 12px 0 36px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>
              </div>

              {(bookingLink.custom_questions || []).map((q) => (
                <div key={q.key}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: 6 }}>
                    {q.label} {q.required ? '*' : ''}
                  </label>
                  <input
                    type="text"
                    required={Boolean(q.required)}
                    value={answers[q.key] || ''}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
                    style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: '0.86rem' }}
                  />
                </div>
              ))}

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: 6 }}>
                  Nội dung / Mục tiêu trao đổi
                </label>
                <textarea
                  rows={3}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ghi chú nội dung cần trao đổi trong buổi hẹn..."
                  style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #CBD5E1', fontSize: '0.86rem', resize: 'vertical' }}
                />
              </div>

              {submitError && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: '0.83rem', fontWeight: 600 }}>
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !selectedSlot}
                style={{
                  height: 46,
                  borderRadius: 12,
                  border: 'none',
                  background: !selectedSlot ? '#94A3B8' : '#1E40FF',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: !selectedSlot || submitting ? 'not-allowed' : 'pointer',
                  boxShadow: selectedSlot ? '0 8px 20px rgba(30, 64, 255, 0.25)' : 'none',
                }}
              >
                {submitting
                  ? 'Đang xác nhận lịch hẹn...'
                  : selectedSlot
                    ? `Xác nhận đặt lịch lúc ${selectedSlot.start_time} (${formatDateVi(selectedDate)})`
                    : 'Vui lòng chọn khung giờ trống'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicBooking1on1Page;
