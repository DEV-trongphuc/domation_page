import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  CreditCard,
  DollarSign,
  FileCheck2,
  FileSearch,
  ScanText,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Badge,
  Card,
  EmptyState,
  FormCard,
} from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, formatVnd, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  SAMPLE_CONTRACT_TEXT,
  type GlobalSearchHit,
  type OcrExtractionItem,
  type OpenApiSpecPayload,
} from './cloudFilesTypes';

export interface CloudOcrSearchPanelsProps {
  mode: 'ocr' | 'search_docs';
  ocrItems: OcrExtractionItem[];
  openApiSpec: OpenApiSpecPayload | null;
  onOpenIdExtractor: () => void;
  onOpenContractParser: () => void;
  onReload: () => Promise<void> | void;
}

export const CloudOcrSearchPanels: React.FC<CloudOcrSearchPanelsProps> = ({
  mode,
  ocrItems,
  openApiSpec,
  onOpenIdExtractor,
  onOpenContractParser,
  onReload,
}) => {
  const { token, tenantSlug } = useAuth();
  const navigate = useNavigate();

  // Quick inline OCR state
  const [ocrDocType, setOcrDocType] = useState('contract');
  const [ocrTitle, setOcrTitle] = useState('Hợp đồng Kinh tế B2B 2026');
  const [ocrRawText, setOcrRawText] = useState(SAMPLE_CONTRACT_TEXT);
  const [extracting, setExtracting] = useState(false);

  // Global search state
  const [globalQuery, setGlobalQuery] = useState('');
  const [searchHits, setSearchHits] = useState<GlobalSearchHit[]>([]);
  const [searching, setSearching] = useState(false);

  const handleQuickOcr = async () => {
    if (!ocrRawText.trim()) {
      toast.error('Vui lòng nhập hoặc dán nội dung Hợp đồng / CCCD / ĐKKD');
      return;
    }
    setExtracting(true);
    try {
      await apiRequest('/erp-ops/ocr/extract', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          doc_type: ocrDocType,
          source_title: ocrTitle.trim(),
          raw_text: ocrRawText,
        },
      });
      toast.success('DOM Agent OCR đã bóc tách cấu trúc & đối soát pháp nhân!');
      await onReload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể bóc tách OCR'));
    } finally {
      setExtracting(false);
    }
  };

  const handleSaveCompany = async (ocrId: string) => {
    try {
      await apiRequest(`/erp-ops/ocr/extractions/${ocrId}/save-company`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {},
      });
      toast.success('Đã lưu Đối tác vào danh sách Công ty B2B!');
      await onReload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu Công ty B2B'));
    }
  };

  const handleSaveTransaction = async (ocrId: string) => {
    try {
      await apiRequest(`/erp-ops/ocr/extractions/${ocrId}/save-transaction`, {
        method: 'POST',
        token,
        tenantSlug,
        body: { tx_type: 'income' },
      });
      toast.success('Đã hạch toán Hợp đồng sang Sổ quỹ Tài chính!');
      await onReload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể hạch toán giao dịch'));
    }
  };

  const handleRunSearch = async () => {
    if (!globalQuery.trim()) {
      setSearchHits([]);
      return;
    }
    setSearching(true);
    try {
      const res = await apiRequest<{ results: GlobalSearchHit[] }>(
        `/erp-ops/global-search?q=${encodeURIComponent(globalQuery.trim())}`,
        { token, tenantSlug }
      );
      setSearchHits(res.results || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Lỗi tìm kiếm liên phân hệ'));
    } finally {
      setSearching(false);
    }
  };

  if (mode === 'ocr') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.9rem' }}>
          <FormCard
            icon={<CreditCard size={18} />}
            title="DOM Vision — Quét CCCD / Hộ chiếu"
            description="Bóc tách 12 trường định danh cá nhân & điền thẳng vào CRM Lead"
            badge={<Badge tone="primary">KYC Auto-Fill</Badge>}
            onClick={onOpenIdExtractor}
          />
          <FormCard
            icon={<Sparkles size={18} />}
            title="AI Import Hợp đồng & Lịch Thanh Toán"
            description="Kiểm tra MST Pháp nhân Bên A, tách đợt thu tiền & tạo B2B Company"
            badge={<Badge tone="success">Milestones</Badge>}
            onClick={onOpenContractParser}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1rem' }}>
          <Card
            title="Bóc Tách Nhanh Văn Bản Hợp Đồng / CCCD / ĐKKD"
            subtitle="Đối chiếu tự động Pháp nhân & Mã số thuế Bên A với Chi nhánh Trụ sở"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 10 }}>
                <select value={ocrDocType} onChange={(e) => setOcrDocType(e.target.value)} style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }}>
                  <option value="contract">Hợp đồng Kinh tế</option>
                  <option value="business_license">Giấy phép ĐKKD</option>
                  <option value="cccd">Căn cước công dân (CCCD)</option>
                  <option value="invoice">Hóa đơn GTGT</option>
                </select>
                <input value={ocrTitle} onChange={(e) => setOcrTitle(e.target.value)} placeholder="Tên hồ sơ..." style={{ height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 12px' }} />
              </div>
              <textarea value={ocrRawText} onChange={(e) => setOcrRawText(e.target.value)} rows={8} style={{ borderRadius: 12, border: '1px solid #E2E8F0', padding: '10px 12px', fontSize: '0.82rem', lineHeight: 1.5 }} />
              <button
                type="button"
                disabled={extracting}
                onClick={() => void handleQuickOcr()}
                style={{ height: 44, borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <ScanText size={16} /> {extracting ? 'Đang bóc tách...' : 'Chạy DOM Agent OCR & Đối Soát'}
              </button>
            </div>
          </Card>

          <Card title="Lịch Sử Bóc Tách & Chuyển Đổi 1 Chạm" subtitle={`${ocrItems.length} bản ghi OCR`}>
            {ocrItems.length === 0 ? (
              <EmptyState title="Chưa có bản ghi OCR nào" description="Sử dụng trình quét CCCD, Hợp đồng hoặc bóc tách nhanh bên trái." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ocrItems.slice(0, 8).map((item) => (
                  <div key={item.id} style={{ padding: 12, borderRadius: 14, border: '1px solid #DBEAFE', background: '#F8FAFF', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                      <strong style={{ fontSize: '0.86rem', color: '#0F172A' }}>{item.source_title}</strong>
                      <Badge tone={item.branch_verification.tax_code_matched ? 'success' : 'info'} icon={<FileCheck2 size={12} />}>
                        {item.branch_verification.tax_code_matched ? 'Khớp MST Bên A' : item.doc_type.toUpperCase()}
                      </Badge>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#334155' }}>
                      Đối tác / Họ tên: <strong>{item.extracted_party_name || '—'}</strong> • MST/CCCD: {item.extracted_tax_code || item.extracted_id_number || '—'}
                    </div>
                    {item.contract_value_vnd > 0 && (
                      <div style={{ fontSize: '0.8rem', color: '#1E40FF', fontWeight: 700 }}>
                        Giá trị: {formatVnd(item.contract_value_vnd)} ({item.effective_date || '—'} → {item.expiry_date || '—'})
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 4 }}>
                      {item.saved_company_id ? (
                        <Badge tone="success"><CheckCircle2 size={12} /> Đã lưu B2B Company</Badge>
                      ) : (
                        <button type="button" onClick={() => void handleSaveCompany(item.id)} className="btn secondary" style={{ height: 34, fontSize: '0.75rem', color: '#1E40FF' }}>
                          <Building2 size={12} style={{ display: 'inline', marginRight: 4 }} /> Lưu B2B Company
                        </button>
                      )}
                      {item.saved_transaction_id ? (
                        <Badge tone="success"><CheckCircle2 size={12} /> Đã ghi Sổ quỹ</Badge>
                      ) : (
                        <button type="button" onClick={() => void handleSaveTransaction(item.id)} className="btn secondary" style={{ height: 34, fontSize: '0.75rem', color: '#059669' }}>
                          <DollarSign size={12} style={{ display: 'inline', marginRight: 4 }} /> Hạch toán Sổ quỹ
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      <Card
        title="Spotlight Tìm Kiếm Xuyên Phân Hệ (Global Cross-Module Search)"
        subtitle="Tra cứu đồng thời Khách hàng 360° (che PII tự động), Công ty B2B, Deals, Dự án, Helpdesk, Đơn bán & Cloud ACL"
      >
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            value={globalQuery}
            onChange={(e) => setGlobalQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleRunSearch(); }}
            placeholder="Nhập tên khách hàng, MST, mã đơn SO, mã Ticket hoặc tên file..."
            style={{ flex: 1, height: 44, borderRadius: 12, border: '1px solid #E2E8F0', padding: '0 14px' }}
          />
          <button
            type="button"
            onClick={() => void handleRunSearch()}
            style={{ height: 44, padding: '0 18px', borderRadius: 12, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Search size={16} /> {searching ? 'Đang tìm...' : 'Tìm toàn hệ thống'}
          </button>
        </div>
        {searchHits.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 10 }}>
            {searchHits.map((hit) => (
              <FormCard
                key={`${hit.entity_type}-${hit.id}`}
                icon={<FileSearch size={18} />}
                title={hit.title}
                description={hit.subtitle}
                badge={<Badge tone="info">{hit.entity_type}</Badge>}
                onClick={() => navigate(hit.route)}
              />
            ))}
          </div>
        )}
      </Card>

      {openApiSpec && (
        <Card
          title={openApiSpec.info.title}
          subtitle={openApiSpec.info.description}
          actions={<Badge tone="success" icon={<ShieldCheck size={12} />}>OpenAPI {openApiSpec.openapi}</Badge>}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {openApiSpec.tenant_metadata.required_headers.map((h) => (
              <Badge key={h} tone="neutral" style={{ fontFamily: 'monospace' }}>{h}</Badge>
            ))}
            <Badge tone="primary" style={{ fontFamily: 'monospace' }}>
              HMAC: {openApiSpec.tenant_metadata.webhook_signature_header}
            </Badge>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {openApiSpec.endpoints_catalog.map((ep) => (
              <div key={`${ep.method}-${ep.path}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 10, background: '#F8F9FA', border: '1px solid #E2E8F0', fontSize: '0.82rem' }}>
                <div>
                  <Badge tone={ep.method === 'GET' ? 'info' : 'primary'} style={{ marginRight: 8 }}>{ep.method}</Badge>
                  <code style={{ fontWeight: 700, color: '#0F172A' }}>{ep.path}</code>
                </div>
                <span style={{ color: '#64748B', fontSize: '0.76rem' }}>{ep.module}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
