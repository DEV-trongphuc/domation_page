import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  Eraser,
  FileSignature,
  Laptop,
  Lock,
  PenTool,
  Plus,
  RotateCcw,
  Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card, EmptyState } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, formatVnd, getErrorMessage } from '../../../autodataApi';
import {
  ASSET_CATEGORY_LABELS,
  ASSET_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
  type HrAssetDto,
  type HrContractDto,
  type HrEmployeeRbacSummary,
} from './hrmTypes';
import type { EmployeeDossierFormState } from './AccountDossierProfileOrgTabs';

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  height: 44,
  padding: '0 0.85rem',
  borderRadius: 12,
  border: '1px solid #CBD5E1',
  background: '#FFFFFF',
  color: '#0F172A',
  fontSize: '0.85rem',
  outline: 'none',
};

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: '0.76rem',
  fontWeight: 700,
  color: '#334155',
  marginBottom: 6,
};

/* ============================================================================
 * SUB-TAB 3: HỢP ĐỒNG LAO ĐỘNG & CHỮ KÝ SỐ CANVAS
 * ============================================================================ */
export const DossierContractsSignatureTab: React.FC<{
  employeeId: string;
  defaultBaseSalaryVnd: number;
  contracts: HrContractDto[];
  canCreate: boolean;
  token: string | null;
  tenantSlug: string | null;
  onRefreshDossier: () => Promise<void>;
}> = ({ employeeId, defaultBaseSalaryVnd, contracts, canCreate, token, tenantSlug, onRefreshDossier }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [contractType, setContractType] = useState<HrContractDto['contract_type']>('fixed_term');
  const [contractNumber, setContractNumber] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => {
    const nextYr = new Date();
    nextYr.setFullYear(nextYr.getFullYear() + 1);
    return nextYr.toISOString().slice(0, 10);
  });
  const [contractSalary, setContractSalary] = useState(() => String(defaultBaseSalaryVnd || 15_000_000));
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);

  // Active contract being signed via HTML5 Canvas
  const [signingContract, setSigningContract] = useState<HrContractDto | null>(null);
  const [signingParty, setSigningParty] = useState<'employee' | 'employer'>('employee');
  const [hasStroke, setHasStroke] = useState(false);
  const [signingBusy, setSigningBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await apiRequest('/hrm/contracts', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          employee_id: employeeId,
          contract_number: contractNumber.trim() || undefined,
          contract_type: contractType,
          start_date: startDate,
          end_date: contractType === 'indefinite' ? null : endDate,
          base_salary_vnd: Number(contractSalary || 0),
          insurance_salary_vnd: Number(contractSalary || 0),
          notes: notes.trim() || null,
        },
      });
      toast.success('Đã phát hành hợp đồng lao động mới!');
      setContractNumber('');
      setNotes('');
      setShowCreateForm(false);
      await onRefreshDossier();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo hợp đồng lao động.'));
    } finally {
      setCreating(false);
    }
  };

  const getPt = (
    ev: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in ev && ev.touches.length > 0) {
      return { x: ev.touches[0].clientX - rect.left, y: ev.touches[0].clientY - rect.top };
    }
    const me = ev as React.MouseEvent<HTMLCanvasElement>;
    return { x: me.clientX - rect.left, y: me.clientY - rect.top };
  };

  const startDraw = (ev: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const pt = getPt(ev, canvas);
    drawingRef.current = true;
    ctx.strokeStyle = '#1E40FF';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
  };

  const moveDraw = (ev: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const pt = getPt(ev, canvas);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    if (!hasStroke) setHasStroke(true);
  };

  const stopDraw = () => {
    drawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasStroke(false);
  };

  const submitContractSignature = async () => {
    if (!signingContract || !canvasRef.current || !hasStroke) {
      toast.error('Vui lòng ký trực tiếp lên khung Canvas trước khi xác nhận.');
      return;
    }
    setSigningBusy(true);
    try {
      const signatureDataUrl = canvasRef.current.toDataURL('image/png');
      await apiRequest(`/hrm/contracts/${signingContract.id}/sign`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          party: signingParty,
          signature_data_url: signatureDataUrl,
        },
      });
      toast.success(`Đã ký số hợp đồng ${signingContract.contract_number} thành công!`);
      clearCanvas();
      setSigningContract(null);
      await onRefreshDossier();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể ký số hợp đồng.'));
    } finally {
      setSigningBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: '0.83rem', color: '#475569' }}>
          Quản lý lịch sử Hợp đồng thử việc, HĐLĐ xác định/không xác định thời hạn & ký điện tử HTML5 Canvas.
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setShowCreateForm((v) => !v)}
            style={{
              height: 40,
              padding: '0 1rem',
              borderRadius: 12,
              border: 'none',
              background: '#1E40FF',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.8rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <Plus size={14} /> {showCreateForm ? 'Đóng biểu mẫu' : 'Phát hành Hợp đồng mới'}
          </button>
        )}
      </div>

      {showCreateForm && (
        <Card title="Tạo Hợp đồng Lao động Mới" padding="1rem 1.15rem" style={{ borderColor: '#1E40FF' }}>
          <form onSubmit={handleCreateContract} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: '0.8rem' }}>
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
                <label style={LABEL_STYLE}>Loại hợp đồng</label>
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
                  value={contractSalary}
                  onChange={(e) => setContractSalary(e.target.value)}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Hiệu lực từ ngày</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={INPUT_STYLE} />
              </div>
              {contractType !== 'indefinite' && (
                <div>
                  <label style={LABEL_STYLE}>Đến ngày</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={INPUT_STYLE} />
                </div>
              )}
              <div>
                <label style={LABEL_STYLE}>Điều khoản ghi chú</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Phụ lục / Thỏa thuận kèm theo..."
                  style={INPUT_STYLE}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" onClick={() => setShowCreateForm(false)} className="btn secondary" style={{ height: 40 }}>
                Hủy
              </button>
              <button
                type="submit"
                disabled={creating}
                style={{
                  height: 40,
                  padding: '0 1.2rem',
                  borderRadius: 10,
                  border: 'none',
                  background: '#1E40FF',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {creating ? 'Đang lưu...' : 'Lưu & Phát hành HĐ'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {signingContract && (
        <Card
          title={`Ký số Điện tử Hợp đồng • ${signingContract.contract_number}`}
          subtitle="Ký trực tiếp lên khung Canvas bên dưới để đóng dấu xác thực vào hợp đồng"
          padding="1rem 1.15rem"
          style={{ border: '1.5px solid #1E40FF', background: '#F8FAFF' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setSigningParty('employee')}
                style={{
                  height: 36,
                  padding: '0 12px',
                  borderRadius: 10,
                  border: signingParty === 'employee' ? '1.5px solid #1E40FF' : '1px solid #CBD5E1',
                  background: signingParty === 'employee' ? '#FFFFFF' : '#F1F5F9',
                  color: signingParty === 'employee' ? '#1E40FF' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                Người lao động ký (Bên B)
              </button>
              <button
                type="button"
                onClick={() => setSigningParty('employer')}
                style={{
                  height: 36,
                  padding: '0 12px',
                  borderRadius: 10,
                  border: signingParty === 'employer' ? '1.5px solid #1E40FF' : '1px solid #CBD5E1',
                  background: signingParty === 'employer' ? '#FFFFFF' : '#F1F5F9',
                  color: signingParty === 'employer' ? '#1E40FF' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                Đại diện Doanh nghiệp ký (Bên A)
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', padding: 8, borderRadius: 14, border: '1.5px dashed #1E40FF', background: '#FFFFFF' }}>
              <canvas
                ref={canvasRef}
                width={460}
                height={150}
                onMouseDown={startDraw}
                onMouseMove={moveDraw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={moveDraw}
                onTouchEnd={stopDraw}
                style={{ maxWidth: '100%', cursor: 'crosshair', touchAction: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <button type="button" onClick={clearCanvas} className="btn secondary" style={{ height: 38, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Eraser size={14} /> Xóa ký lại
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setSigningContract(null)} className="btn secondary" style={{ height: 40 }}>
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={signingBusy}
                  onClick={() => void submitContractSignature()}
                  style={{
                    height: 40,
                    padding: '0 1.2rem',
                    borderRadius: 10,
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
                  <PenTool size={14} /> {signingBusy ? 'Đang đóng dấu...' : 'Xác nhận Ký số'}
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {contracts.length === 0 ? (
        <EmptyState
          icon={<FileSignature size={24} />}
          title="Chưa có hợp đồng lao động nào"
          description="Bấm 'Phát hành Hợp đồng mới' để thiết lập HĐLĐ và ký số điện tử trực tiếp."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {contracts.map((ct) => (
            <div
              key={ct.id}
              style={{
                padding: '1rem 1.15rem',
                borderRadius: 16,
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, color: '#1E40FF', fontSize: '0.92rem' }}>{ct.contract_number}</span>
                  <Badge tone="info">{CONTRACT_TYPE_LABELS[ct.contract_type] || ct.contract_type}</Badge>
                  <Badge tone={ct.status === 'active' ? 'success' : 'neutral'}>
                    {ct.status === 'active' ? 'Đang hiệu lực' : ct.status}
                  </Badge>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: 4 }}>
                  Hiệu lực: <strong>{String(ct.start_date).slice(0, 10)}</strong> →{' '}
                  <strong>{ct.end_date ? String(ct.end_date).slice(0, 10) : 'Không xác định thời hạn'}</strong> • Lương HĐ:{' '}
                  <strong>{formatVnd(ct.base_salary_vnd)}</strong>
                </div>
                {ct.employee_signature_url && (
                  <img
                    src={ct.employee_signature_url}
                    alt="Chữ ký HĐ"
                    style={{ marginTop: 8, height: 42, borderRadius: 8, border: '1px solid #E2E8F0', padding: 3, background: '#FFFFFF' }}
                  />
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {ct.signed_by_employee ? (
                  <Badge tone="success" icon={<CheckCircle2 size={12} />}>
                    NLĐ đã ký số
                  </Badge>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSigningContract(ct);
                      setSigningParty('employee');
                    }}
                    className="btn secondary"
                    style={{ height: 36, color: '#1E40FF', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  >
                    <PenTool size={13} /> Ký số HĐ
                  </button>
                )}
                {ct.signed_by_employer && (
                  <Badge tone="primary">Đại diện DN: {ct.employer_signer_name || 'Đã ký'}</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * SUB-TAB 4: TÀI SẢN BÀN GIAO (`GET/POST /hrm/assets`, `PATCH /hrm/assets/:id`)
 * ============================================================================ */
export const DossierAssetsTab: React.FC<{
  employeeId: string;
  assets: HrAssetDto[];
  canEdit: boolean;
  token: string | null;
  tenantSlug: string | null;
  onRefreshDossier: () => Promise<void>;
}> = ({ employeeId, assets, canEdit, token, tenantSlug, onRefreshDossier }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [category, setCategory] = useState('laptop');
  const [serialNumber, setSerialNumber] = useState('');
  const [assetValue, setAssetValue] = useState('22000000');
  const [condition, setCondition] = useState('Mới 100% nguyên tem');
  const [saving, setSaving] = useState(false);

  const handleAssignAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim()) {
      toast.error('Vui lòng nhập tên thiết bị / tài sản bàn giao.');
      return;
    }
    setSaving(true);
    try {
      await apiRequest('/hrm/assets', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          employee_id: employeeId,
          asset_name: assetName.trim(),
          category,
          serial_number: serialNumber.trim() || null,
          asset_value_vnd: Number(assetValue || 0),
          condition_on_handover: condition.trim() || 'Tốt',
        },
      });
      toast.success('Đã ghi nhận tài sản cấp phát cho nhân sự!');
      setAssetName('');
      setSerialNumber('');
      setShowAdd(false);
      await onRefreshDossier();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể cấp phát tài sản.'));
    } finally {
      setSaving(false);
    }
  };

  const handlePatchAsset = async (assetId: string, body: Record<string, unknown>, successMsg: string) => {
    try {
      await apiRequest(`/hrm/assets/${assetId}`, {
        method: 'PATCH',
        token,
        tenantSlug,
        body,
      });
      toast.success(successMsg);
      await onRefreshDossier();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể cập nhật trạng thái tài sản.'));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: '0.83rem', color: '#475569' }}>
          Theo dõi trang thiết bị công cụ dụng cụ cấp phát kèm số Serial/IMEI và biên bản thu hồi.
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            style={{
              height: 40,
              padding: '0 1rem',
              borderRadius: 12,
              border: 'none',
              background: '#1E40FF',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.8rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <Plus size={14} /> {showAdd ? 'Đóng biểu mẫu' : 'Cấp phát thiết bị mới'}
          </button>
        )}
      </div>

      {showAdd && (
        <Card title="Biên bản Cấp phát Tài sản Mới" padding="1rem 1.15rem" style={{ borderColor: '#1E40FF' }}>
          <form onSubmit={handleAssignAsset} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.8rem' }}>
            <div>
              <label style={LABEL_STYLE}>Tên tài sản / Thiết bị *</label>
              <input
                type="text"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                placeholder="MacBook Pro M3 / Thẻ từ..."
                style={INPUT_STYLE}
              />
            </div>
            <div>
              <label style={LABEL_STYLE}>Danh mục</label>
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
              <label style={LABEL_STYLE}>Giá trị (VNĐ)</label>
              <input type="number" min={0} step={500000} value={assetValue} onChange={(e) => setAssetValue(e.target.value)} style={INPUT_STYLE} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Tình trạng bàn giao</label>
              <input type="text" value={condition} onChange={(e) => setCondition(e.target.value)} style={INPUT_STYLE} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  height: 44,
                  padding: '0 1.2rem',
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
        </Card>
      )}

      {assets.length === 0 ? (
        <EmptyState
          icon={<Laptop size={24} />}
          title="Chưa có thiết bị nào đang bàn giao"
          description="Cấp phát Laptop, màn hình, điện thoại công vụ hoặc thẻ ra vào cho nhân sự tại đây."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {assets.map((ast) => (
            <div
              key={ast.id}
              style={{
                padding: '0.95rem 1.15rem',
                borderRadius: 16,
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, color: '#0F172A' }}>{ast.asset_name}</span>
                  <Badge tone="neutral">{ast.asset_code}</Badge>
                  <Badge tone={ast.status === 'assigned' ? 'primary' : ast.status === 'returned' ? 'success' : 'warning'}>
                    {ASSET_STATUS_LABELS[ast.status] || ast.status}
                  </Badge>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 4 }}>
                  {ASSET_CATEGORY_LABELS[ast.category] || ast.category}
                  {ast.serial_number ? ` • SN: ${ast.serial_number}` : ''} • Giá trị: <strong>{formatVnd(ast.asset_value_vnd)}</strong> • Bàn giao:{' '}
                  {String(ast.handed_over_at).slice(0, 10)}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {!ast.acknowledged_by_employee && ast.status === 'assigned' && (
                  <button
                    type="button"
                    onClick={() =>
                      void handlePatchAsset(ast.id, { acknowledged_by_employee: true }, 'Đã xác nhận biên bản nhận tài sản!')
                    }
                    className="btn secondary"
                    style={{ height: 34, fontSize: '0.76rem', color: '#1E40FF' }}
                  >
                    Xác nhận đã nhận
                  </button>
                )}
                {ast.status === 'assigned' && canEdit && (
                  <button
                    type="button"
                    onClick={() => void handlePatchAsset(ast.id, { status: 'returned' }, 'Đã thu hồi tài sản bàn giao!')}
                    className="btn secondary"
                    style={{ height: 34, fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <RotateCcw size={12} /> Thu hồi
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * SUB-TAB 5: THU NHẬP ĐÃI NGỘ & PHÂN QUYỀN RBAC
 * ============================================================================ */
export const DossierCompensationRbacTab: React.FC<{
  form: EmployeeDossierFormState;
  onPatch: (patch: Partial<EmployeeDossierFormState>) => void;
  salaryMasked: boolean;
  readOnly: boolean;
  rbacSummary: HrEmployeeRbacSummary | null;
  fallbackScope: string;
}> = ({ form, onPatch, salaryMasked, readOnly, rbacSummary, fallbackScope }) => {
  const grossPackage =
    Number(form.base_salary_vnd || 0) +
    Number(form.meal_allowance_vnd || 0) +
    Number(form.responsibility_allowance_vnd || 0) +
    Number(form.travel_allowance_vnd || 0) +
    Number(form.phone_allowance_vnd || 0);

  const moduleEntries = Object.entries(rbacSummary?.modules || {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      <Card
        title="Cấu trúc Lương Cơ bản, Lương Đóng BHXH & Phụ cấp Định kỳ"
        actions={
          !salaryMasked ? (
            <Badge tone="primary">Tổng thu nhập Gross định mức: {formatVnd(grossPackage)}</Badge>
          ) : undefined
        }
        padding="1.05rem 1.2rem"
      >
        {salaryMasked ? (
          <div
            style={{
              padding: '1.25rem',
              borderRadius: 14,
              background: '#F8F9FA',
              border: '1px dashed #CBD5E1',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: '#475569',
              fontSize: '0.84rem',
            }}
          >
            <Lock size={18} color="#1E40FF" />
            Thông tin thu nhập & đãi ngộ được bảo mật theo phân quyền RBAC (`hrm.view_financials`).
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
            <div>
              <label style={LABEL_STYLE}>Lương cơ bản (VNĐ/tháng)</label>
              <input
                type="number"
                min={0}
                step={500000}
                disabled={readOnly}
                value={form.base_salary_vnd}
                onChange={(e) => onPatch({ base_salary_vnd: e.target.value })}
                style={INPUT_STYLE}
              />
            </div>
            <div>
              <label style={LABEL_STYLE}>Mức lương đóng BHXH / BHYT / BHTN</label>
              <input
                type="number"
                min={0}
                step={500000}
                disabled={readOnly}
                value={form.insurance_salary_vnd}
                onChange={(e) => onPatch({ insurance_salary_vnd: e.target.value })}
                style={INPUT_STYLE}
              />
            </div>
            <div>
              <label style={LABEL_STYLE}>Phụ cấp ăn trưa / ca (VNĐ)</label>
              <input
                type="number"
                min={0}
                step={50000}
                disabled={readOnly}
                value={form.meal_allowance_vnd}
                onChange={(e) => onPatch({ meal_allowance_vnd: e.target.value })}
                style={INPUT_STYLE}
              />
            </div>
            <div>
              <label style={LABEL_STYLE}>Phụ cấp trách nhiệm (VNĐ)</label>
              <input
                type="number"
                min={0}
                step={100000}
                disabled={readOnly}
                value={form.responsibility_allowance_vnd}
                onChange={(e) => onPatch({ responsibility_allowance_vnd: e.target.value })}
                style={INPUT_STYLE}
              />
            </div>
            <div>
              <label style={LABEL_STYLE}>Phụ cấp xăng xe / đi lại (VNĐ)</label>
              <input
                type="number"
                min={0}
                step={100000}
                disabled={readOnly}
                value={form.travel_allowance_vnd}
                onChange={(e) => onPatch({ travel_allowance_vnd: e.target.value })}
                style={INPUT_STYLE}
              />
            </div>
            <div>
              <label style={LABEL_STYLE}>Phụ cấp điện thoại / công vụ (VNĐ)</label>
              <input
                type="number"
                min={0}
                step={100000}
                disabled={readOnly}
                value={form.phone_allowance_vnd}
                onChange={(e) => onPatch({ phone_allowance_vnd: e.target.value })}
                style={INPUT_STYLE}
              />
            </div>
          </div>
        )}
      </Card>

      <Card
        title="Tóm tắt Vai trò Phân quyền RBAC & Phạm vi Dữ liệu (Data Scope)"
        subtitle="Quyền truy cập phân hệ được kế thừa từ Vai trò RBAC của Tài khoản liên kết"
        padding="1.05rem 1.2rem"
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: moduleEntries.length > 0 ? 14 : 0 }}>
          <Badge tone="primary" icon={<Shield size={12} />}>
            Vai trò: {rbacSummary?.role_name || rbacSummary?.role_key || (form.user_id ? 'Thành viên Hệ thống' : 'Chưa gắn User')}
          </Badge>
          <Badge tone="success" icon={<Lock size={12} />}>
            Data Scope: {rbacSummary?.data_scope || fallbackScope}
          </Badge>
          {rbacSummary?.is_tenant_owner && <Badge tone="warning">Chủ sở hữu Không gian làm việc (Tenant Owner)</Badge>}
        </div>

        {moduleEntries.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
            {moduleEntries.slice(0, 12).map(([modKey, perm]) => {
              const enabledActs = Object.entries(perm.actions || {})
                .filter(([, v]) => Boolean(v))
                .map(([k]) => k);
              return (
                <div
                  key={modKey}
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: 12,
                    background: '#F8F9FA',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A' }}>{modKey}</span>
                    <Badge tone="info">{perm.scope || perm.data_scope || 'own'}</Badge>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 4 }}>
                    {enabledActs.length > 0 ? enabledActs.join(', ') : 'Chỉ xem cơ bản'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
