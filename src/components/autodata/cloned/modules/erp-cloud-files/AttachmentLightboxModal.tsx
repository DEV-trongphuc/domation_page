import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  detectAttachmentType,
  formatBytes,
  triggerClientDownload,
  type AttachmentItem,
} from './cloudFilesTypes';

export interface AttachmentLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: AttachmentItem[];
  initialIndex?: number;
}

const LightboxInnerViewer: React.FC<{
  items: AttachmentItem[];
  initialIndex: number;
  onClose: () => void;
}> = ({ items, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.max(0, Math.min(initialIndex, Math.max(0, items.length - 1)))
  );
  const [zoom, setZoom] = useState(1);

  const handlePrev = useCallback(() => {
    if (items.length <= 1) return;
    setZoom(1);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  }, [items.length]);

  const handleNext = useCallback(() => {
    if (items.length <= 1) return;
    setZoom(1);
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  }, [items.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, onClose]);

  const safeIdx = Math.max(0, Math.min(currentIndex, items.length - 1));
  const current = items[safeIdx];
  if (!current) return null;

  const detectedType = current.type || detectAttachmentType(current);
  const hasRealUrl =
    Boolean(current.url) &&
    (current.url.startsWith('http://') ||
      current.url.startsWith('https://') ||
      current.url.startsWith('data:') ||
      current.url.startsWith('blob:'));

  const handleDownloadCurrent = () => {
    if (current.content_preview && !hasRealUrl) {
      triggerClientDownload(
        current.name || 'cloud-document.txt',
        current.content_preview,
        'text/plain;charset=utf-8'
      );
      return;
    }
    const link = document.createElement('a');
    link.href = current.url || '#';
    link.download = current.name || 'attachment';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1rem 1.25rem',
      }}
    >
      {/* Top Toolbar */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '10px 16px',
          borderRadius: 16,
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.18)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#EEF2FF',
              color: '#1E40FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FileText size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: '0.9rem',
                color: '#0F172A',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {current.name || 'Tài liệu đính kèm'}
            </div>
            <div style={{ fontSize: '0.73rem', color: '#64748B' }}>
              {current.storage_key || current.mime_type || 'Cloud Preview'}
              {typeof current.size_bytes === 'number' ? ` • ${formatBytes(current.size_bytes)}` : ''}
            </div>
          </div>
          {items.length > 1 && (
            <span
              style={{
                padding: '3px 10px',
                borderRadius: 999,
                background: '#EFF6FF',
                color: '#1E40FF',
                fontSize: '0.74rem',
                fontWeight: 800,
              }}
            >
              {safeIdx + 1} / {items.length}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
            title="Thu nhỏ"
            style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8F9FA', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ZoomOut size={16} />
          </button>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155', minWidth: 44, textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2.5, Number((z + 0.25).toFixed(2))))}
            title="Phóng to"
            style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8F9FA', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            title="100%"
            style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8F9FA', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <RotateCcw size={15} />
          </button>
          <button
            type="button"
            onClick={handleDownloadCurrent}
            title="Tải xuống"
            style={{ height: 38, padding: '0 12px', borderRadius: 10, border: 'none', background: '#1E40FF', color: '#FFFFFF', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <Download size={15} /> Tải về
          </button>
          {hasRealUrl && (
            <a
              href={current.url}
              target="_blank"
              rel="noopener noreferrer"
              title="Mở thẻ mới"
              style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8F9FA', color: '#0F172A', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ExternalLink size={15} />
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            title="Đóng (Esc)"
            style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={17} />
          </button>
        </div>
      </div>

      {/* Main Preview Viewport */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          flex: 1,
          margin: '1rem auto',
          width: 'min(980px, 96vw)',
          background: '#FFFFFF',
          borderRadius: 20,
          border: '1px solid #E2E8F0',
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: 20,
        }}
      >
        {detectedType === 'image' && hasRealUrl ? (
          <img
            src={current.url}
            alt={current.name || 'Preview'}
            style={{
              maxWidth: '100%',
              maxHeight: '72vh',
              objectFit: 'contain',
              transform: `scale(${zoom})`,
              transition: 'transform 0.18s ease',
              borderRadius: 12,
            }}
          />
        ) : detectedType === 'pdf' && hasRealUrl ? (
          <iframe
            src={current.url}
            title={current.name || 'PDF Preview'}
            style={{ width: '100%', height: '72vh', border: 'none', borderRadius: 12 }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              maxWidth: 780,
              padding: '1.5rem',
              borderRadius: 16,
              background: '#F8F9FA',
              border: '1px solid #E2E8F0',
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
            }}
          >
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1E40FF', marginBottom: 8 }}>
              BẢN XEM TRƯỚC NỘI DUNG TÀI LIỆU CÔ LẬP
            </div>
            <pre
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: '0.84rem',
                color: '#0F172A',
                lineHeight: 1.6,
              }}
            >
              {current.content_preview ||
                `Tệp tin: ${current.name || 'Không tên'}\nĐường dẫn lưu trữ cô lập: ${current.storage_key || current.url}\nĐịnh dạng: ${current.mime_type || 'application/octet-stream'}`}
            </pre>
          </div>
        )}
      </div>

      {/* Bottom Prev / Next Controls */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}
      >
        <button
          type="button"
          disabled={items.length <= 1}
          onClick={handlePrev}
          style={{ height: 42, padding: '0 16px', borderRadius: 12, border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#0F172A', fontWeight: 700, cursor: items.length > 1 ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <ChevronLeft size={16} /> Trước (←)
        </button>
        <button
          type="button"
          disabled={items.length <= 1}
          onClick={handleNext}
          style={{ height: 42, padding: '0 16px', borderRadius: 12, border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#0F172A', fontWeight: 700, cursor: items.length > 1 ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          Tiếp theo (→) <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export const AttachmentLightboxModal: React.FC<AttachmentLightboxModalProps> = ({
  isOpen,
  onClose,
  items,
  initialIndex = 0,
}) => {
  if (!isOpen || items.length === 0 || typeof document === 'undefined') return null;
  return createPortal(
    <LightboxInnerViewer
      key={`${initialIndex}-${items.length}`}
      items={items}
      initialIndex={initialIndex}
      onClose={onClose}
    />,
    document.body
  );
};
