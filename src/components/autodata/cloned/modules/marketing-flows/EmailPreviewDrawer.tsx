import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Code, Mail, Monitor, Smartphone, X } from 'lucide-react';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import { DrawerSkeleton } from '../../components/ui/Skeleton';
import { apiRequest } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import type { EmailTemplateItemDto } from './flowConstants';

export interface EmailPreviewDrawerProps {
  template: EmailTemplateItemDto | null;
  customSubject?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const EmailPreviewDrawer: React.FC<EmailPreviewDrawerProps> = ({
  template,
  customSubject,
  isOpen,
  onClose,
}) => {
  const { token, tenantSlug, companyName } = useAuth();

  const [viewMode, setViewMode] = useState<'desktop' | 'mobile' | 'html'>('desktop');
  const [loading, setLoading] = useState<boolean>(() =>
    Boolean(isOpen && template?.id && !template.compiled_html)
  );
  const [fetchedHtml, setFetchedHtml] = useState('');

  const fetchTemplateHtml = useCallback(
    async (templateId: string) => {
      const res = await apiRequest<{
        compiled_html?: string;
        template?: { compiled_html?: string };
      }>(`/marketing/templates/${templateId}`, { token, tenantSlug });
      return res?.compiled_html || res?.template?.compiled_html || '';
    },
    [token, tenantSlug]
  );

  useEffect(() => {
    if (!isOpen || !template?.id || template.compiled_html) return;
    let cancelled = false;
    fetchTemplateHtml(template.id)
      .then((html) => {
        if (!cancelled && html) setFetchedHtml(html);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, template?.id, template?.compiled_html, fetchTemplateHtml]);

  if (!isOpen || !template) return null;

  const rawHtml =
    template.compiled_html ||
    fetchedHtml ||
    `<div style="font-family:Inter,sans-serif;max-width:560px;margin:24px auto;padding:28px;border:1px solid #E2E8F0;border-radius:16px;background:#FFFFFF;color:#0F172A">
      <div style="font-size:12px;font-weight:700;color:#1E40FF;margin-bottom:8px">${companyName || 'DOMATION'}</div>
      <h2 style="margin:0 0 12px">${customSubject || template.subject || template.name}</h2>
      <p style="color:#475569;line-height:1.6">Xin chào <strong>Nguyễn Minh Khang</strong>, đây là bản xem trước trực quan của mẫu Email được gắn trong Automation Flow.</p>
      <a href="#cta" style="display:inline-block;margin-top:12px;padding:10px 20px;border-radius:10px;background:#1E40FF;color:#FFFFFF;text-decoration:none;font-weight:700">Khám Phá Ngay</a>
    </div>`;

  const interpolatedHtml = rawHtml
    .replace(/\{\{\s*lead\.name\s*\}\}/g, 'Nguyễn Minh Khang')
    .replace(/\{\{\s*tenant\.name\s*\}\}/g, companyName || 'DOMATION')
    .replace(/\{\{\s*unsubscribe_url\s*\}\}/g, '#unsubscribe');

  const drawerNode = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9600,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(15, 23, 42, 0.35)',
        backdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(780px, 95vw)',
          height: '100vh',
          background: '#FFFFFF',
          borderLeft: '1px solid #E2E8F0',
          boxShadow: '-16px 0 48px rgba(15, 23, 42, 0.14)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.35rem',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: '#EEF2FF',
                color: '#1E40FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Mail size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>{template.name}</span>
                <Badge tone="primary">Live Render</Badge>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                Subject: {customSubject || template.subject || template.name}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={() => setViewMode('desktop')}
              className="btn secondary sm"
              style={{ height: 34, color: viewMode === 'desktop' ? '#1E40FF' : '#64748B' }}
            >
              <Monitor size={14} /> Desktop
            </button>
            <button
              type="button"
              onClick={() => setViewMode('mobile')}
              className="btn secondary sm"
              style={{ height: 34, color: viewMode === 'mobile' ? '#1E40FF' : '#64748B' }}
            >
              <Smartphone size={14} /> Mobile
            </button>
            <button
              type="button"
              onClick={() => setViewMode('html')}
              className="btn secondary sm"
              style={{ height: 34, color: viewMode === 'html' ? '#1E40FF' : '#64748B' }}
            >
              <Code size={14} /> HTML
            </button>
            <button type="button" onClick={onClose} className="btn secondary sm" style={{ height: 34 }}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Viewport Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', background: '#F8F9FA', display: 'flex', justifyContent: 'center' }}>
          {loading ? (
            <div style={{ width: '100%' }}>
              <DrawerSkeleton />
            </div>
          ) : viewMode === 'html' ? (
            <pre
              style={{
                width: '100%',
                margin: 0,
                padding: '1rem',
                borderRadius: 14,
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                fontSize: '0.75rem',
                color: '#334155',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {interpolatedHtml}
            </pre>
          ) : (
            <iframe
              title="flow-email-preview-drawer"
              sandbox=""
              srcDoc={interpolatedHtml}
              style={{
                width: viewMode === 'mobile' ? 375 : '100%',
                maxWidth: viewMode === 'mobile' ? 375 : 640,
                height: '100%',
                minHeight: 520,
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 16,
                boxShadow: '0 8px 28px rgba(15, 23, 42, 0.06)',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(drawerNode, document.body) : null;
};

export default EmailPreviewDrawer;
