import React, { useEffect, useRef, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eraser,
  PenTool,
  Video,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import { ModalBodySkeleton } from '../../components/ui/Skeleton';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import {
  ASSET_CATEGORY_LABELS,
  CONTRACT_TYPE_LABELS,
  type BookingAvailabilityRule,
  type HrContractDto,
  type HrEmployeeDto,
  type PublicBookingPreviewDto,
} from './hrmTypes';

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  height: 44,
  padding: '0 0.85rem',
  borderRadius: 12,
  border: '1px solid #CBD5E1',
  background: '#FFFFFF',
  color: '#0F172A',
  fontSize: '0.86rem',
  outline: 'none',
};

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 700,
  color: '#334155',
  marginBottom: 6,
};

/* ============================================================================
 * 1. DIGITAL SIGNATURE PAD MODAL (`SignaturePadModal`)
 * ============================================================================ */
export const SignaturePadModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  targetTitle: string;
  onSaveSignature: (dataUrl: string) => Promise<void>;
}> = ({ isOpen, onClose, targetTitle, onSaveSignature }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const [hasStroke, setHasStroke] = useState(false);
  const [saving, setSaving] = useState(false);

  const getCoords = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    const me = e as React.MouseEvent<HTMLCanvasElement>;
    return {
      x: me.clientX - rect.left,
      y: me.clientY - rect.top,
    };
  };

  const handleStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const pt = getCoords(e, canvas);
    drawingRef.current = true;
    ctx.strokeStyle = '#1E40FF';
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
  };

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const pt = getCoords(e, canvas);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    if (!hasStroke) setHasStroke(true);
  };

  const handleEnd = () => {
    drawingRef.current = false;
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStroke(false);
  };

  const handleConfirm = async () => {
    if (!hasStroke || !canvasRef.current) {
      toast.error('Vui lòng ký tên lên khung vẽ trước khi lưu.');
      return;
    }
    setSaving(true);
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      await onSaveSignature(dataUrl);
      handleClear();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu chữ ký số.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <CustomModal isOpen={isOpen} onClose={onClose} title={`Chữ Ký Số Nội Bộ • ${targetTitle}`} width={560}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ fontSize: '0.82rem', color: '#475569' }}>
          Dùng chuột hoặc màn hình cảm ứng ký trực tiếp vào khung bên dưới. Chữ ký được lưu chuẩn PNG cho Hợp đồng & Phê duyệt nội bộ.
        </div>

        <div
          style={{
            borderRadius: 16,
            border: '1.5px dashed #1E40FF',
            background: '#F8FAFF',
            padding: 12,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <canvas
            ref={canvasRef}
            width={480}
            height={180}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            style={{
              background: '#FFFFFF',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              cursor: 'crosshair',
              maxWidth: '100%',
              touchAction: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleClear}
            className="btn secondary"
            style={{ height: 40, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Eraser size={15} /> Xóa ký lại
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={onClose} className="btn secondary" style={{ height: 44, padding: '0 1.15rem' }}>
              Đóng
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleConfirm()}
              style={{
                height: 44,
                padding: '0 1.35rem',
                borderRadius: 12,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <PenTool size={15} /> {saving ? 'Đang lưu...' : 'Xác nhận Chữ ký số'}
            </button>
          </div>
        </div>
      </div>
    </CustomModal>
  );
};

/* ============================================================================
 * 2. LABOR CONTRACT CREATE MODAL
 * ============================================================================ */
export const ContractCreateModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  employees: HrEmployeeDto[];
  token: string | null;
  tenantSlug: string | null;
  onSaved: () => void;
}> = ({ isOpen, onClose, employees, token, tenantSlug, onSaved }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [contractType, setContractType] = useState<HrContractDto['contract_type']>('fixed_term');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => {
    const nextYr = new Date();
    nextYr.setFullYear(nextYr.getFullYear() + 1);
    return nextYr.toISOString().slice(0, 10);
  });
  const [baseSalary, setBaseSalary] = useState('15000000');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmp = employeeId || employees[0]?.id;
    if (!targetEmp) {
      toast.error('Vui lòng tạo hồ sơ nhân sự trước khi lập hợp đồng.');
      return;
    }
    setSaving(true);
    try {
      await apiRequest('/hrm/contracts', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          employee_id: targetEmp,
          contract_number: contractNumber.trim() || undefined,
          contract_type: contractType,
          start_date: startDate,
          end_date: contractType === 'indefinite' ? null : endDate,
          base_salary_vnd: Number(baseSalary || 0),
          insurance_salary_vnd: Number(baseSalary || 0),
          notes: notes.trim() || null,
        },
      });
      toast.success('Đã phát hành hợp đồng lao động mới!');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo hợp đồng lao động.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <CustomModal isOpen={isOpen} onClose={onClose} title="Lập Hợp Đồng Lao Động Mới" width={620}>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
          <div>
            <label style={LABEL_STYLE}>Nhân sự ký kết *</label>
            <select
              value={employeeId || employees[0]?.id || ''}
              onChange={(e) => setEmployeeId(e.target.value)}
              style={INPUT_STYLE}
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.employee_code} — {emp.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={LABEL_STYLE}>Số hợp đồng</label>
            <input
              type="text"
              value={contractNumber}
              onChange={(e) => setContractNumber(e.target.value)}
              placeholder="Tự sinh nếu để trống"
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Loại hợp đồng *</label>
            <select
              value={contractType}
              onChange={(e) => setContractType(e.target.value as HrContractDto['contract_type'])}
              style={INPUT_STYLE}
            >
              {Object.entries(CONTRACT_TYPE_LABELS).map(([k, lbl]) => (
                <option key={k} value={k}>
                  {lbl}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={LABEL_STYLE}>Mức lương hợp đồng (VNĐ)</label>
            <input
              type="number"
              min={0}
              step={500000}
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Hiệu lực từ ngày *</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={INPUT_STYLE} />
          </div>
          {contractType !== 'indefinite' && (
            <div>
              <label style={LABEL_STYLE}>Đến ngày</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={INPUT_STYLE} />
            </div>
          )}
        </div>
        <div>
          <label style={LABEL_STYLE}>Điều khoản / Ghi chú bổ sung</label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} style={INPUT_STYLE} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" onClick={onClose} className="btn secondary" style={{ height: 44, padding: '0 1.2rem' }}>
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              height: 44,
              padding: '0 1.4rem',
              borderRadius: 12,
              border: 'none',
              background: '#1E40FF',
              color: '#FFFFFF',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {saving ? 'Đang lưu...' : 'Tạo hợp đồng'}
          </button>
        </div>
      </form>
    </CustomModal>
  );
};

/* ============================================================================
 * 3. ASSET HANDOVER MODAL
 * ============================================================================ */
export const AssetHandoverModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  employees: HrEmployeeDto[];
  token: string | null;
  tenantSlug: string | null;
  onSaved: () => void;
}> = ({ isOpen, onClose, employees, token, tenantSlug, onSaved }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [assetName, setAssetName] = useState('');
  const [category, setCategory] = useState('laptop');
  const [serialNumber, setSerialNumber] = useState('');
  const [assetValue, setAssetValue] = useState('25000000');
  const [condition, setCondition] = useState('Mới 100% nguyên tem');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmp = employeeId || employees[0]?.id;
    if (!targetEmp || !assetName.trim()) {
      toast.error('Vui lòng chọn nhân sự và nhập tên tài sản bàn giao.');
      return;
    }
    setSaving(true);
    try {
      await apiRequest('/hrm/assets', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          employee_id: targetEmp,
          asset_name: assetName.trim(),
          category,
          serial_number: serialNumber.trim() || null,
          asset_value_vnd: Number(assetValue || 0),
          condition_on_handover: condition,
        },
      });
      toast.success('Đã ghi nhận biên bản bàn giao tài sản!');
      setAssetName('');
      setSerialNumber('');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể bàn giao tài sản.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <CustomModal isOpen={isOpen} onClose={onClose} title="Cấp Phát & Bàn Giao Tài Sản Nhân Sự" width={580}>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
        <div>
          <label style={LABEL_STYLE}>Nhân sự nhận bàn giao *</label>
          <select
            value={employeeId || employees[0]?.id || ''}
            onChange={(e) => setEmployeeId(e.target.value)}
            style={INPUT_STYLE}
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.employee_code} — {emp.full_name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.85rem' }}>
          <div>
            <label style={LABEL_STYLE}>Tên thiết bị / Tài sản *</label>
            <input
              type="text"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              placeholder="MacBook Pro / Thẻ từ / Điện thoại..."
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Phân loại</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={INPUT_STYLE}>
              {Object.entries(ASSET_CATEGORY_LABELS).map(([k, lbl]) => (
                <option key={k} value={k}>
                  {lbl}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={LABEL_STYLE}>Số Serial / IMEI</label>
            <input type="text" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} style={INPUT_STYLE} />
          </div>
          <div>
            <label style={LABEL_STYLE}>Giá trị tài sản (VNĐ)</label>
            <input
              type="number"
              min={0}
              step={500000}
              value={assetValue}
              onChange={(e) => setAssetValue(e.target.value)}
              style={INPUT_STYLE}
            />
          </div>
        </div>
        <div>
          <label style={LABEL_STYLE}>Tình trạng lúc bàn giao</label>
          <input type="text" value={condition} onChange={(e) => setCondition(e.target.value)} style={INPUT_STYLE} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" onClick={onClose} className="btn secondary" style={{ height: 44, padding: '0 1.2rem' }}>
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              height: 44,
              padding: '0 1.4rem',
              borderRadius: 12,
              border: 'none',
              background: '#1E40FF',
              color: '#FFFFFF',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {saving ? 'Đang lưu...' : 'Xác nhận bàn giao'}
          </button>
        </div>
      </form>
    </CustomModal>
  );
};

/* ============================================================================
 * 4. SMART 1-ON-1 BOOKING LINK CREATOR & INTERACTIVE SLOT PICKER PREVIEW
 * ============================================================================ */
export const BookingLinkCreateModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  tenantSlug: string | null;
  onSaved: () => void;
}> = ({ isOpen, onClose, token, tenantSlug, onSaved }) => {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [duration, setDuration] = useState('30');
  const [buffer, setBuffer] = useState('10');
  const [locationValue, setLocationValue] = useState('Google Meet / Zoom tự động');
  const [startHour, setStartHour] = useState('09:00');
  const [endHour, setEndHour] = useState('17:00');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề lịch hẹn 1-1.');
      return;
    }
    setSaving(true);
    try {
      const availability_rules: BookingAvailabilityRule[] = [1, 2, 3, 4, 5].map((dow) => ({
        day_of_week: dow,
        start_time: startHour,
        end_time: endHour,
      }));
      await apiRequest('/hrm/booking-links', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          title: title.trim(),
          slug: slug.trim() || undefined,
          duration_minutes: Number(duration || 30),
          buffer_minutes: Number(buffer || 10),
          location_type: 'video_link',
          location_value: locationValue.trim(),
          availability_rules,
        },
      });
      toast.success('Đã tạo trang Đặt lịch 1-1 Thông minh!');
      setTitle('');
      setSlug('');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo trang đặt lịch 1-1.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <CustomModal isOpen={isOpen} onClose={onClose} title="Tạo Trang Đặt Lịch Hẹn 1-1 Thông Minh" width={620}>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
        <div>
          <label style={LABEL_STYLE}>Tiêu đề buổi hẹn 1-1 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Phỏng vấn Ứng viên 1-1 / Demo Giải pháp Doanh nghiệp"
            style={INPUT_STYLE}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
          <div>
            <label style={LABEL_STYLE}>Đường dẫn định danh (Slug tùy chọn)</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="demo-b2b-30p"
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Địa điểm / Phòng họp trực tuyến</label>
            <input type="text" value={locationValue} onChange={(e) => setLocationValue(e.target.value)} style={INPUT_STYLE} />
          </div>
          <div>
            <label style={LABEL_STYLE}>Thời lượng mỗi ca (phút)</label>
            <select value={duration} onChange={(e) => setDuration(e.target.value)} style={INPUT_STYLE}>
              <option value="15">15 phút</option>
              <option value="30">30 phút</option>
              <option value="45">45 phút</option>
              <option value="60">60 phút</option>
            </select>
          </div>
          <div>
            <label style={LABEL_STYLE}>Khoảng nghỉ giữa 2 ca (Buffer phút)</label>
            <select value={buffer} onChange={(e) => setBuffer(e.target.value)} style={INPUT_STYLE}>
              <option value="0">0 phút</option>
              <option value="10">10 phút</option>
              <option value="15">15 phút</option>
              <option value="30">30 phút</option>
            </select>
          </div>
          <div>
            <label style={LABEL_STYLE}>Khung giờ mở nhận lịch (Thứ 2 - Thứ 6)</label>
            <input type="time" value={startHour} onChange={(e) => setStartHour(e.target.value)} style={INPUT_STYLE} />
          </div>
          <div>
            <label style={LABEL_STYLE}>Kết thúc nhận lịch trong ngày</label>
            <input type="time" value={endHour} onChange={(e) => setEndHour(e.target.value)} style={INPUT_STYLE} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" onClick={onClose} className="btn secondary" style={{ height: 44, padding: '0 1.2rem' }}>
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              height: 44,
              padding: '0 1.4rem',
              borderRadius: 12,
              border: 'none',
              background: '#1E40FF',
              color: '#FFFFFF',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {saving ? 'Đang tạo...' : 'Tạo liên kết đặt lịch'}
          </button>
        </div>
      </form>
    </CustomModal>
  );
};

const PublicBookingPreviewBody: React.FC<{
  slug: string;
  onClose: () => void;
  onBooked: () => void;
}> = ({ slug, onClose, onBooked }) => {
  const [preview, setPreview] = useState<PublicBookingPreviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [topic, setTopic] = useState('');
  const [bookingNow, setBookingNow] = useState(false);
  const [icsResult, setIcsResult] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadPreview = async () => {
      try {
        const res = await apiRequest<PublicBookingPreviewDto>(`/hrm/public-booking/${slug}`);
        if (!active) return;
        setPreview(res);
        if (res.available_days.length > 0) {
          setSelectedDate(res.available_days[0].date);
        }
      } catch (err) {
        if (active) toast.error(getErrorMessage(err, 'Không thể tải khung giờ trống.'));
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadPreview();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading || !preview) {
    return <ModalBodySkeleton rows={4} />;
  }

  const activeDay = preview.available_days.find((d) => d.date === selectedDate) || preview.available_days[0];

  const handleBookTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !guestName.trim()) {
      toast.error('Vui lòng chọn khung giờ trống và nhập họ tên người đặt.');
      return;
    }
    setBookingNow(true);
    try {
      const res = await apiRequest<{ ics_content: string }>(`/hrm/public-booking/${slug}/book`, {
        method: 'POST',
        body: {
          guest_name: guestName.trim(),
          guest_email: guestEmail.trim() || undefined,
          guest_phone: guestPhone.trim() || undefined,
          booking_date: selectedDate,
          start_time: selectedTime,
          topic: topic.trim() || undefined,
        },
      });
      setIcsResult(res.ics_content || 'BEGIN:VCALENDAR\nEND:VCALENDAR');
      toast.success('Đặt lịch hẹn 1-1 thành công!');
      onBooked();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Khung giờ đã có người đặt hoặc dữ liệu chưa hợp lệ.'));
    } finally {
      setBookingNow(false);
    }
  };

  const downloadIcs = () => {
    if (!icsResult) return;
    const blob = new Blob([icsResult], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking-${slug}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (icsResult) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <CheckCircle2 size={44} color="#059669" />
        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
          Đã xác nhận lịch hẹn 1-1 vào {selectedTime} ngày {selectedDate}!
        </div>
        <button
          type="button"
          onClick={downloadIcs}
          style={{
            height: 44,
            padding: '0 1.35rem',
            borderRadius: 12,
            border: 'none',
            background: '#1E40FF',
            color: '#FFFFFF',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
          }}
        >
          <Download size={15} /> Tải tệp Lịch (.ics) vào Google / Outlook Calendar
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleBookTest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div
        style={{
          padding: '1rem',
          borderRadius: 16,
          background: '#F8FAFF',
          border: '1px solid #DBEAFE',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div>
          <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '1rem' }}>{preview.booking_link.title}</div>
          <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: 2 }}>
            Chuyên gia phụ trách: <strong>{preview.booking_link.host_name}</strong> • {preview.organization.name}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Badge tone="primary" icon={<Clock size={12} />}>
            {preview.booking_link.duration_minutes} phút
          </Badge>
          <Badge tone="info" icon={<Video size={12} />}>
            {preview.booking_link.location_value || 'Online'}
          </Badge>
        </div>
      </div>

      <div>
        <label style={LABEL_STYLE}>1. Chọn ngày làm việc còn trống</label>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {preview.available_days.map((d) => {
            const active = d.date === activeDay?.date;
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => {
                  setSelectedDate(d.date);
                  setSelectedTime('');
                }}
                style={{
                  padding: '0.55rem 0.95rem',
                  borderRadius: 12,
                  border: active ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                  background: active ? '#EEF2FF' : '#FFFFFF',
                  color: active ? '#1E40FF' : '#334155',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <Calendar size={13} style={{ display: 'inline', marginRight: 5 }} />
                {d.date}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label style={LABEL_STYLE}>2. Chọn khung giờ trống (Tự động khóa ca trùng)</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
          {(activeDay?.slots || []).map((slot) => {
            const isSelected = selectedTime === slot.start_time;
            return (
              <button
                key={slot.start_time}
                type="button"
                disabled={!slot.available}
                onClick={() => setSelectedTime(slot.start_time)}
                style={{
                  height: 40,
                  borderRadius: 10,
                  border: isSelected ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                  background: !slot.available ? '#F1F5F9' : isSelected ? '#1E40FF' : '#FFFFFF',
                  color: !slot.available ? '#94A3B8' : isSelected ? '#FFFFFF' : '#0F172A',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: slot.available ? 'pointer' : 'not-allowed',
                }}
              >
                {slot.start_time} - {slot.end_time}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
        <div>
          <label style={LABEL_STYLE}>Họ tên ({preview.organization.customer_label}) *</label>
          <input type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)} style={INPUT_STYLE} />
        </div>
        <div>
          <label style={LABEL_STYLE}>Số điện thoại</label>
          <input type="text" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} style={INPUT_STYLE} />
        </div>
        <div>
          <label style={LABEL_STYLE}>Email nhận lịch (.ics)</label>
          <input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} style={INPUT_STYLE} />
        </div>
      </div>

      <div>
        <label style={LABEL_STYLE}>Nội dung cần trao đổi</label>
        <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} style={INPUT_STYLE} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button type="button" onClick={onClose} className="btn secondary" style={{ height: 44, padding: '0 1.2rem' }}>
          Đóng
        </button>
        <button
          type="submit"
          disabled={bookingNow}
          style={{
            height: 44,
            padding: '0 1.4rem',
            borderRadius: 12,
            border: 'none',
            background: '#1E40FF',
            color: '#FFFFFF',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {bookingNow ? 'Đang giữ chỗ...' : 'Xác nhận đặt lịch 1-1'}
        </button>
      </div>
    </form>
  );
};

export const PublicBookingInteractivePreviewModal: React.FC<{
  slug: string | null;
  onClose: () => void;
  onBooked: () => void;
}> = ({ slug, onClose, onBooked }) => (
  <CustomModal
    isOpen={Boolean(slug)}
    onClose={onClose}
    title="Trình Chọn Khung Giờ Đặt Lịch 1-1 Trực Quan (Public Slot Picker)"
    width={760}
  >
    {slug && <PublicBookingPreviewBody key={slug} slug={slug} onClose={onClose} onBooked={onBooked} />}
  </CustomModal>
);
