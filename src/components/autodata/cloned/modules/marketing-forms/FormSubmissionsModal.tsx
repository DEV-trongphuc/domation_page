import React, { useEffect, useState } from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Table, type TableColumn } from '../../components/ui/AutoDataLoadingModal';
import { CustomModal } from '../../components/ui/CustomModal';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { apiRequest, formatShortDate, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import type { FormSubmissionDto, MktFormDto } from './types';

interface SubmissionsInnerProps {
  form: MktFormDto;
}

const FormSubmissionsInner: React.FC<SubmissionsInnerProps> = ({ form }) => {
  const { token, tenantSlug } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<FormSubmissionDto[]>([]);

  useEffect(() => {
    let cancelled = false;
    apiRequest<{ items?: FormSubmissionDto[] }>(`/marketing/forms/${form.id}/submissions`, {
      token,
      tenantSlug,
    })
      .then((res) => {
        if (!cancelled) setItems(res.items || []);
      })
      .catch((err) => {
        if (!cancelled) toast.error(getErrorMessage(err, 'Không thể tải danh sách lượt điền Form.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form.id, token, tenantSlug]);

  const columns: Array<TableColumn<FormSubmissionDto>> = [
    {
      key: 'contact',
      header: 'Khách hàng (Bảo mật PII)',
      render: (r) => {
        const fallbackName =
          r.name ||
          (typeof r.submitted_data?.name === 'string' ? r.submitted_data.name : '') ||
          'Khách đăng ký';
        return (
          <div>
            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.83rem' }}>{fallbackName}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontFamily: 'monospace' }}>
              {[r.phone, r.email].filter(Boolean).join(' • ') || '—'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'routing',
      header: 'Chế độ Định tuyến',
      render: (r) =>
        r.routing_mode === 'sale_round' ? (
          <Badge tone="success">Mode B: Vòng chia Sale</Badge>
        ) : (
          <Badge tone="primary">Mode A: Nurture</Badge>
        ),
    },
    {
      key: 'otp',
      header: 'Xác thực OTP',
      render: (r) =>
        r.otp_verified ? (
          <Badge tone="success" icon={<CheckCircle2 size={12} />}>
            Đã xác thực
          </Badge>
        ) : (
          <Badge tone="neutral">Không yêu cầu</Badge>
        ),
    },
    {
      key: 'utm',
      header: 'Nguồn UTM & Dữ liệu phụ',
      render: (r) => {
        const src = typeof r.utm_data?.utm_source === 'string' ? r.utm_data.utm_source : '';
        const camp = typeof r.utm_data?.utm_campaign === 'string' ? r.utm_data.utm_campaign : '';
        const extraPairs = Object.entries(r.submitted_data || {}).filter(
          ([k, v]) => !['name', 'phone', 'email', 'otp_code', 'otp_id', 'utm_source', 'utm_campaign'].includes(k) && v !== '' && v !== null && v !== undefined
        );
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {src || camp ? (
              <span style={{ fontSize: '0.73rem', color: '#1E40FF', fontWeight: 700 }}>
                {[src, camp].filter(Boolean).join(' / ')}
              </span>
            ) : null}
            <span style={{ fontSize: '0.73rem', color: '#475569' }}>
              {extraPairs.length > 0
                ? extraPairs.slice(0, 2).map(([k, v]) => `${k}: ${String(v)}`).join(' • ')
                : 'Chuẩn hồ sơ'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'time',
      header: 'Thời gian',
      align: 'right',
      render: (r) => <span style={{ fontSize: '0.76rem', color: '#64748B' }}>{formatShortDate(r.created_at)}</span>,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          padding: '0.75rem 1rem',
          borderRadius: 12,
          background: '#F8FAFF',
          border: '1px solid #DBEAFE',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#1E3A8A', fontWeight: 600 }}>
          <ShieldCheck size={16} color="#1E40FF" />
          Dữ liệu SĐT/Email tuân thủ tự động chính sách che dấu PII theo phân quyền RBAC của tài khoản.
        </div>
        <Badge tone="primary">{items.length} bản ghi gần nhất</Badge>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : (
        <Table
          columns={columns}
          rows={items}
          rowKey={(r) => r.id}
          emptyTitle="Chưa có lượt điền Biểu mẫu nào"
          emptyDescription="Hãy nhúng Form lên Landing Page hoặc dùng Sandbox Kiểm thử trong mục Mã nhúng."
        />
      )}
    </div>
  );
};

interface FormSubmissionsModalProps {
  form: MktFormDto | null;
  onClose: () => void;
}

export const FormSubmissionsModal: React.FC<FormSubmissionsModalProps> = ({ form, onClose }) => (
  <CustomModal
    isOpen={Boolean(form)}
    onClose={onClose}
    title={`Danh Sách Lượt Điền Biểu Mẫu — ${form?.name || ''}`}
    width={880}
  >
    {form && <FormSubmissionsInner key={form.id} form={form} />}
  </CustomModal>
);

export default FormSubmissionsModal;
