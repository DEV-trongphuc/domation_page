import React, { useMemo, useState } from 'react';
import {
  Copy,
  Edit2,
  FolderPlus,
  Globe,
  Lock,
  Mail,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import { Badge, EmptyState, PillTabs } from '../../components/ui/AutoDataLoadingModal';
import { formatShortDate } from '../../../autodataApi';
import type { EmailTemplateDto, TemplateGroupDto } from './templateTypes';

export interface TemplateLibraryViewProps {
  templates: EmailTemplateDto[];
  groups: TemplateGroupDto[];
  activeGroupId: string;
  canCreate: boolean;
  canDelete: boolean;
  onChangeGroup: (groupId: string) => void;
  onOpenNewGroupModal: () => void;
  onReload: () => void;
  onOpenStudio: () => void;
  onOpenNewEditor: () => void;
  onEditTemplate: (tpl: EmailTemplateDto) => void;
  onDuplicateTemplate: (tpl: EmailTemplateDto) => void;
  onDeleteTemplate: (id: string) => void;
  onOpenAcl: (tpl: EmailTemplateDto) => void;
  onOpenQuickSend: (tpl: EmailTemplateDto) => void;
}

export const TemplateLibraryView: React.FC<TemplateLibraryViewProps> = ({
  templates,
  groups,
  activeGroupId,
  canCreate,
  canDelete,
  onChangeGroup,
  onOpenNewGroupModal,
  onReload,
  onOpenStudio,
  onOpenNewEditor,
  onEditTemplate,
  onDuplicateTemplate,
  onDeleteTemplate,
  onOpenAcl,
  onOpenQuickSend,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');

  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      if (activeGroupId !== 'all' && tpl.group_id !== activeGroupId) return false;
      if (visibilityFilter !== 'all' && (tpl.visibility || 'company') !== visibilityFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          tpl.name.toLowerCase().includes(q) ||
          tpl.subject.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [templates, activeGroupId, visibilityFilter, searchQuery]);

  const renderVisibilityBadge = (vis?: string) => {
    if (vis === 'private') {
      return (
        <Badge tone="warning" icon={<Lock size={11} />}>
          Riêng tư
        </Badge>
      );
    }
    if (vis === 'team' || vis === 'department') {
      return (
        <Badge tone="info" icon={<Users size={11} />}>
          {vis === 'team' ? 'Đội nhóm' : 'Phòng ban'}
        </Badge>
      );
    }
    return (
      <Badge tone="success" icon={<Globe size={11} />}>
        Toàn công ty
      </Badge>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <PillTabs
          tabs={[
            { key: 'all', label: 'Tất cả Mẫu Email', count: templates.length },
            ...groups.map((g) => ({
              key: g.id,
              label: g.name,
              count: templates.filter((t) => t.group_id === g.id).length,
            })),
          ]}
          activeKey={activeGroupId}
          onChange={onChangeGroup}
        />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={14}
              color="#94A3B8"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên mẫu hoặc Subject..."
              style={{
                height: 44,
                width: 230,
                padding: '0 12px 0 34px',
                borderRadius: 12,
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                fontSize: '0.8rem',
              }}
            />
          </div>

          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value)}
            style={{
              height: 44,
              padding: '0 12px',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            <option value="all">Mọi quyền hiển thị</option>
            <option value="company">Toàn công ty</option>
            <option value="department">Phòng ban</option>
            <option value="team">Đội nhóm</option>
            <option value="private">Riêng tư</option>
          </select>

          <button
            type="button"
            onClick={onOpenNewGroupModal}
            className="btn secondary"
            style={{ height: 44, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <FolderPlus size={15} /> Nhóm mới
          </button>
          <button
            type="button"
            onClick={onReload}
            className="btn secondary"
            style={{ height: 44, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={15} /> Làm mới
          </button>
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <EmptyState
          icon={<Mail size={24} />}
          title="Chưa có mẫu Email phù hợp trong thư viện"
          description="Thiết kế từ đầu bằng Studio Kéo-Thả 15 Khối hoặc nhờ DOM Agent Email Studio tự động sinh bố cục chuẩn chống Spam."
          action={
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={onOpenStudio}
                className="btn secondary"
                style={{ height: 44, color: '#1E40FF', fontWeight: 700 }}
              >
                Mở DOM Agent Email Studio
              </button>
              {canCreate && (
                <button
                  type="button"
                  onClick={onOpenNewEditor}
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
                  Thiết kế từ đầu
                </button>
              )}
            </div>
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1rem' }}>
          {filteredTemplates.map((tpl) => (
            <div
              key={tpl.id}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 20,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
              }}
            >
              <div>
                <div
                  onClick={() => onEditTemplate(tpl)}
                  style={{
                    height: 164,
                    background: '#F8F9FA',
                    borderBottom: '1px solid #F1F5F9',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}
                >
                  {tpl.compiled_html ? (
                    <div
                      style={{
                        width: 600,
                        height: 380,
                        transform: 'scale(0.55)',
                        transformOrigin: 'top left',
                        pointerEvents: 'none',
                      }}
                    >
                      <iframe
                        title={tpl.name}
                        sandbox=""
                        srcDoc={tpl.compiled_html}
                        style={{ width: '100%', height: '100%', border: 'none', background: '#FFFFFF' }}
                      />
                    </div>
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                      <Mail size={28} />
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
                    {renderVisibilityBadge(tpl.visibility)}
                    <Badge tone={tpl.spam_score <= 20 ? 'success' : tpl.spam_score <= 45 ? 'info' : 'warning'}>
                      Spam: {tpl.spam_score}/100
                    </Badge>
                  </div>
                </div>

                <div style={{ padding: '1rem 1.15rem 0.75rem' }}>
                  <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0F172A' }}>{tpl.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tpl.subject}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                    {(tpl.merge_tags || []).slice(0, 3).map((mt) => (
                      <Badge key={mt} tone="neutral">{mt}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: '0.75rem 1.15rem',
                  borderTop: '1px solid #F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 6,
                }}
              >
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                  {tpl.blocks?.length || 0} khối • {formatShortDate(tpl.updated_at)}
                </span>
                <div style={{ display: 'flex', gap: 5 }}>
                  <button
                    type="button"
                    title="Chỉnh sửa trong Studio"
                    onClick={() => onEditTemplate(tpl)}
                    className="btn secondary sm"
                    style={{ height: 34, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <Edit2 size={13} /> Sửa
                  </button>
                  <button
                    type="button"
                    title="Gửi Email Nhanh (Quick Send)"
                    onClick={() => onOpenQuickSend(tpl)}
                    className="btn secondary sm"
                    style={{ height: 34, padding: '0 8px', color: '#059669' }}
                  >
                    <Send size={13} />
                  </button>
                  <button
                    type="button"
                    title="Phân quyền chia sẻ ACL"
                    onClick={() => onOpenAcl(tpl)}
                    className="btn secondary sm"
                    style={{ height: 34, padding: '0 8px', color: '#1E40FF' }}
                  >
                    <ShieldCheck size={13} />
                  </button>
                  <button
                    type="button"
                    title="Nhân bản mẫu"
                    onClick={() => onDuplicateTemplate(tpl)}
                    className="btn secondary sm"
                    style={{ height: 34, padding: '0 8px' }}
                  >
                    <Copy size={13} />
                  </button>
                  {canDelete && (
                    <button
                      type="button"
                      title="Xóa mẫu"
                      onClick={() => onDeleteTemplate(tpl.id)}
                      className="btn secondary sm"
                      style={{ height: 34, padding: '0 8px', color: '#DC2626' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateLibraryView;
