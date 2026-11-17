import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Award,
  Building2,
  CornerDownRight,
  Link2,
  Megaphone,
  MessageCircle,
  Paperclip,
  Pin,
  Plus,
  RefreshCw,
  Search,
  Send,
  Smile,
  Sparkles,
  Trophy,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { Avatar } from '../../components/ui/Avatar';
import { Badge, Card, EmptyState } from '../../components/ui/AutoDataLoadingModal';
import { FeedTabSkeleton } from '../../components/ui/Skeleton';
import { ScreenHelpButton } from '../../components/ui/ScreenHelpButton';
import { AutodataApiError, apiRequest, formatShortDate, getErrorMessage } from '../../../autodataApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '../../contexts/EntitlementContext';
import { StickerPickerModal } from '../../chat/StickerPickerModal';
import type { ChatSticker } from '../../chat/ChatStickers';
import type { WorkChatBootstrapDto } from '../../chat/workchatTypes';
import {
  FEED_POST_CATEGORIES,
  FEED_REACTION_TYPES,
  KUDOS_BADGE_PRESETS,
  type FeedAttachmentCard,
  type FeedCommentRecord,
  type FeedPostCategory,
  type FeedPostRecord,
  type FeedReactionType,
  type KudosLeaderboardRecord,
  type KudosRecognitionRecord,
} from './workchatFeedTypes';

export interface EnterpriseFeedViewProps {
  embedded?: boolean;
}

interface BranchLite {
  id: string;
  name: string;
}

export const EnterpriseFeedView: React.FC<EnterpriseFeedViewProps> = ({ embedded = false }) => {
  const { token, tenantSlug, user } = useAuth();
  const { can } = useEntitlement();
  const canCreate = can('erp_workchat', 'create');

  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<FeedPostRecord[]>([]);
  const [kudosItems, setKudosItems] = useState<KudosRecognitionRecord[]>([]);
  const [leaderboard, setLeaderboard] = useState<KudosLeaderboardRecord[]>([]);
  const [staff, setStaff] = useState<WorkChatBootstrapDto['staff']>([]);
  const [departments, setDepartments] = useState<WorkChatBootstrapDto['departments']>([]);
  const [branches, setBranches] = useState<BranchLite[]>([]);

  // Feed Filters
  const [filterDeptId, setFilterDeptId] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Rich Composer State
  const [composerTitle, setComposerTitle] = useState('');
  const [composerContent, setComposerContent] = useState('');
  const [composerType, setComposerType] = useState<FeedPostCategory>('announcement');
  const [composerDeptId, setComposerDeptId] = useState('');
  const [composerBranchId, setComposerBranchId] = useState('');
  const [composerPinned, setComposerPinned] = useState(false);
  const [composerAttachments, setComposerAttachments] = useState<FeedAttachmentCard[]>([]);
  const [newAttachmentTitle, setNewAttachmentTitle] = useState('');
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [showAttachmentInput, setShowAttachmentInput] = useState(false);
  const [submittingPost, setSubmittingPost] = useState(false);

  // Comments & Nested Replies per Post
  const [expandedPostIds, setExpandedPostIds] = useState<Record<string, boolean>>({});
  const [commentsByPost, setCommentsByPost] = useState<Record<string, FeedCommentRecord[]>>({});
  const [commentDraftByPost, setCommentDraftByPost] = useState<Record<string, string>>({});
  const [replyParentByPost, setReplyParentByPost] = useState<Record<string, FeedCommentRecord | null>>({});

  // Sticker Picker (shared for Composer or Specific Post Comment)
  const [stickerTarget, setStickerTarget] = useState<
    | { scope: 'composer'; anchorEl: HTMLElement }
    | { scope: 'comment'; postId: string; anchorEl: HTMLElement }
    | null
  >(null);

  // Kudos Modal
  const [kudosModalOpen, setKudosModalOpen] = useState(false);
  const [kudosRecipientId, setKudosRecipientId] = useState('');
  const [kudosPresetKey, setKudosPresetKey] = useState(KUDOS_BADGE_PRESETS[0].key);
  const [kudosPoints, setKudosPoints] = useState(String(KUDOS_BADGE_PRESETS[0].points));
  const [kudosMessage, setKudosMessage] = useState('');

  const loadFeedBundle = useCallback(async () => {
    const deptParam = filterDeptId !== 'all' ? `?department_id=${encodeURIComponent(filterDeptId)}` : '';
    const [bootRes, feedRes, kudosRes] = await Promise.all([
      apiRequest<WorkChatBootstrapDto>('/workchat/bootstrap', { token, tenantSlug }),
      apiRequest<{ items?: FeedPostRecord[] }>(`/workchat/feed${deptParam}`, { token, tenantSlug }),
      apiRequest<{ items?: KudosRecognitionRecord[]; leaderboard?: KudosLeaderboardRecord[] }>(
        '/workchat/kudos',
        { token, tenantSlug }
      ),
    ]);

    let loadedBranches: BranchLite[] = [];
    try {
      const hrmBoot = await apiRequest<{ branches?: Array<{ id: string; name: string }> }>(
        '/hrm/bootstrap',
        { token, tenantSlug }
      );
      if (Array.isArray(hrmBoot?.branches)) {
        loadedBranches = hrmBoot.branches;
      }
    } catch {
      // Optional branch list if HRM module not enabled on current package
    }

    return {
      boot: bootRes,
      posts: Array.isArray(feedRes?.items) ? feedRes.items : [],
      kudosItems: Array.isArray(kudosRes?.items) ? kudosRes.items : [],
      leaderboard: Array.isArray(kudosRes?.leaderboard) ? kudosRes.leaderboard.slice(0, 15) : [],
      branches: loadedBranches,
    };
  }, [token, tenantSlug, filterDeptId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const bundle = await loadFeedBundle();
        if (!cancelled) {
          setStaff(bundle.boot.staff || []);
          setDepartments(bundle.boot.departments || []);
          setPosts(bundle.posts);
          setKudosItems(bundle.kudosItems);
          setLeaderboard(bundle.leaderboard);
          setBranches(bundle.branches);
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(getErrorMessage(err, 'Không thể tải Bảng tin Doanh nghiệp'));
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
  }, [loadFeedBundle]);

  const filteredPosts = useMemo(() => {
    const kw = searchText.trim().toLowerCase();
    return posts.filter((p) => {
      if (filterCategory !== 'all' && p.post_type !== filterCategory) return false;
      if (pinnedOnly && !p.is_pinned) return false;
      if (kw) {
        const hay = `${p.title || ''} ${p.content} ${p.author_name} ${p.department_name || ''}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [posts, filterCategory, pinnedOnly, searchText]);

  const handlePublishPost = async () => {
    if (!composerContent.trim()) {
      toast.error('Vui lòng nhập nội dung bài viết');
      return;
    }
    setSubmittingPost(true);
    try {
      const created = await apiRequest<FeedPostRecord>('/workchat/feed', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          title: composerTitle.trim() || null,
          content: composerContent.trim(),
          post_type: composerType,
          department_id: composerDeptId || null,
          branch_id: composerBranchId || null,
          is_pinned: composerPinned,
          attachments: composerAttachments,
        },
      });
      setPosts((prev) => [created, ...prev]);
      setComposerTitle('');
      setComposerContent('');
      setComposerAttachments([]);
      setComposerPinned(false);
      toast.success('Đã đăng bài lên Bảng tin Doanh nghiệp!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể đăng bài viết'));
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleReactPost = async (post: FeedPostRecord, reactionType: FeedReactionType) => {
    try {
      let updatedReactions: Record<string, string[]> | undefined;
      let updatedTotal = post.likes_count;

      try {
        const res = await apiRequest<{
          id: string;
          likes_count?: number;
          reactions?: Record<string, string[]>;
        }>(`/workchat/feed/${post.id}/react`, {
          method: 'POST',
          token,
          tenantSlug,
          body: { reaction_type: reactionType },
        });
        updatedReactions = res.reactions;
        if (typeof res.likes_count === 'number') {
          updatedTotal = res.likes_count;
        }
      } catch (innerErr) {
        if (innerErr instanceof AutodataApiError && innerErr.status === 404) {
          const fallback = await apiRequest<{ id: string; likes_count: number }>(
            `/workchat/feed/${post.id}/like`,
            {
              method: 'POST',
              token,
              tenantSlug,
              body: {},
            }
          );
          updatedTotal = fallback.likes_count;
          const actorId = user?.id || 'me';
          const currentMap = { ...(post.reactions || {}) };
          const curList = Array.isArray(currentMap[reactionType])
            ? [...currentMap[reactionType]]
            : [];
          const idx = curList.indexOf(actorId);
          if (idx >= 0) curList.splice(idx, 1);
          else curList.push(actorId);
          currentMap[reactionType] = curList;
          updatedReactions = currentMap;
        } else {
          throw innerErr;
        }
      }

      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? {
                ...p,
                likes_count: updatedTotal,
                reactions: updatedReactions ?? p.reactions,
              }
            : p
        )
      );
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể thả biểu cảm bài viết'));
    }
  };

  const toggleCommentsSection = async (postId: string) => {
    const nextOpen = !expandedPostIds[postId];
    setExpandedPostIds((prev) => ({ ...prev, [postId]: nextOpen }));
    if (nextOpen && !commentsByPost[postId]) {
      try {
        const res = await apiRequest<{ items?: FeedCommentRecord[] }>(
          `/workchat/feed/${postId}/comments`,
          { token, tenantSlug }
        );
        setCommentsByPost((prev) => ({
          ...prev,
          [postId]: Array.isArray(res?.items) ? res.items : [],
        }));
      } catch {
        setCommentsByPost((prev) => ({ ...prev, [postId]: [] }));
      }
    }
  };

  const handleSubmitComment = async (postId: string, overrideText?: string) => {
    const text = (overrideText ?? commentDraftByPost[postId] ?? '').trim();
    if (!text) return;
    const replyTarget = replyParentByPost[postId] || null;
    const finalContent =
      replyTarget && !overrideText ? `@${replyTarget.author_name} ${text}` : text;

    try {
      const created = await apiRequest<FeedCommentRecord>(`/workchat/feed/${postId}/comments`, {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          content: finalContent,
          parent_id: replyTarget?.id || null,
        },
      });

      const enriched: FeedCommentRecord = {
        ...created,
        parent_id: created.parent_id ?? replyTarget?.id ?? null,
      };

      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), enriched],
      }));
      if (!overrideText) {
        setCommentDraftByPost((prev) => ({ ...prev, [postId]: '' }));
      }
      setReplyParentByPost((prev) => ({ ...prev, [postId]: null }));
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p))
      );
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể gửi bình luận'));
    }
  };

  const handleCreateKudos = async () => {
    if (!kudosRecipientId || !kudosMessage.trim()) {
      toast.error('Vui lòng chọn đồng nghiệp và nhập lời vinh danh');
      return;
    }
    const preset =
      KUDOS_BADGE_PRESETS.find((b) => b.key === kudosPresetKey) || KUDOS_BADGE_PRESETS[0];

    try {
      await apiRequest('/workchat/kudos', {
        method: 'POST',
        token,
        tenantSlug,
        body: {
          recipient_user_id: kudosRecipientId,
          badge_key: preset.key,
          badge_title: `${preset.icon} ${preset.title}`,
          points: Number(kudosPoints || preset.points),
          message: kudosMessage.trim(),
        },
      });
      toast.success('Đã gửi vinh danh lên Bảng Vàng Kudos!');
      setKudosMessage('');
      setKudosModalOpen(false);
      const refreshed = await loadFeedBundle();
      setKudosItems(refreshed.kudosItems);
      setLeaderboard(refreshed.leaderboard);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo ghi nhận Kudos'));
    }
  };

  if (loading) {
    return <FeedTabSkeleton />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {!embedded && (
        <Card
          padding="1.25rem 1.5rem"
          style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)' }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  background: '#EEF2FF',
                  border: '1px solid #DBEAFE',
                  color: '#1E40FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Megaphone size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '1.16rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Bảng Tin Doanh Nghiệp & Bảng Vàng Kudos
                  </h1>
                  <Badge tone="primary">{posts.length} bài đăng</Badge>
                  <Badge tone="success">Top {leaderboard.length}/15 Vinh danh</Badge>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '3px 0 0' }}>
                  Truyền thông nội bộ theo Chi nhánh / Phòng ban, 6 biểu cảm đa sắc thái, bình luận đa tầng & ghi nhận thành tích.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ScreenHelpButton screenKey="feed" />
              {canCreate && (
                <button
                  type="button"
                  onClick={() => setKudosModalOpen(true)}
                  style={{
                    minHeight: 42,
                    padding: '0 16px',
                    borderRadius: 12,
                    border: 'none',
                    background: 'linear-gradient(135deg, #1E40FF 0%, #0284C7 100%)',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(30, 64, 255, 0.25)',
                  }}
                >
                  <Award size={16} />
                  <span>Gửi Vinh Danh Kudos</span>
                </button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Two-Column Layout: Left Feed Stream + Right Kudos & Top 15 Leaderboard */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 360px',
          gap: '1.25rem',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Composer + Filters + Posts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
          {/* Rich Post Composer */}
          {canCreate && (
            <Card title="Đăng Thông Báo & Chia Sẻ Nội Bộ">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {FEED_POST_CATEGORIES.map((cat) => {
                    const active = composerType === cat.key;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setComposerType(cat.key)}
                        style={{
                          padding: '5px 11px',
                          borderRadius: 999,
                          border: active ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                          background: active ? '#EEF2FF' : '#F8FAFC',
                          color: active ? '#1E40FF' : '#475569',
                          fontSize: '0.75rem',
                          fontWeight: active ? 800 : 600,
                          cursor: 'pointer',
                        }}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  value={composerTitle}
                  onChange={(e) => setComposerTitle(e.target.value)}
                  placeholder="Tiêu đề thông báo (tùy chọn)..."
                  style={{
                    minHeight: 40,
                    padding: '0 12px',
                    borderRadius: 11,
                    border: '1px solid #CBD5E1',
                    background: '#F8F9FA',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    color: '#0F172A',
                  }}
                />

                <textarea
                  rows={3}
                  value={composerContent}
                  onChange={(e) => setComposerContent(e.target.value)}
                  placeholder="Chia sẻ thông báo điều hành, chính sách mới hoặc tin vui cùng toàn thể đội ngũ..."
                  style={{
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    fontSize: '0.85rem',
                    color: '#0F172A',
                    resize: 'vertical',
                  }}
                />

                {/* Composer Attachments Preview */}
                {composerAttachments.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {composerAttachments.map((att, idx) => (
                      <Badge key={`${att.title}_${idx}`} tone="info">
                        📎 {att.title}
                      </Badge>
                    ))}
                  </div>
                )}

                {showAttachmentInput && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8 }}>
                    <input
                      type="text"
                      value={newAttachmentTitle}
                      onChange={(e) => setNewAttachmentTitle(e.target.value)}
                      placeholder="Tên tài liệu / thẻ đính kèm..."
                      style={{
                        minHeight: 38,
                        padding: '0 10px',
                        borderRadius: 9,
                        border: '1px solid #CBD5E1',
                        fontSize: '0.8rem',
                      }}
                    />
                    <input
                      type="text"
                      value={newAttachmentUrl}
                      onChange={(e) => setNewAttachmentUrl(e.target.value)}
                      placeholder="Đường dẫn URL (nếu có)..."
                      style={{
                        minHeight: 38,
                        padding: '0 10px',
                        borderRadius: 9,
                        border: '1px solid #CBD5E1',
                        fontSize: '0.8rem',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newAttachmentTitle.trim()) return;
                        setComposerAttachments((prev) => [
                          ...prev,
                          {
                            kind: newAttachmentUrl.trim() ? 'link' : 'document',
                            title: newAttachmentTitle.trim(),
                            url: newAttachmentUrl.trim() || undefined,
                          },
                        ]);
                        setNewAttachmentTitle('');
                        setNewAttachmentUrl('');
                        setShowAttachmentInput(false);
                      }}
                      style={{
                        minHeight: 38,
                        padding: '0 12px',
                        borderRadius: 9,
                        border: 'none',
                        background: '#1E40FF',
                        color: '#FFFFFF',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Thêm thẻ
                    </button>
                  </div>
                )}

                {/* Visibility + Pin + Submit Row */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    paddingTop: 6,
                    borderTop: '1px solid #F1F5F9',
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                    {branches.length > 0 && (
                      <select
                        value={composerBranchId}
                        onChange={(e) => setComposerBranchId(e.target.value)}
                        style={{
                          height: 36,
                          padding: '0 10px',
                          borderRadius: 9,
                          border: '1px solid #CBD5E1',
                          background: '#FFFFFF',
                          fontSize: '0.76rem',
                        }}
                      >
                        <option value="">Toàn chi nhánh</option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            Chi nhánh: {b.name}
                          </option>
                        ))}
                      </select>
                    )}

                    <select
                      value={composerDeptId}
                      onChange={(e) => setComposerDeptId(e.target.value)}
                      style={{
                        height: 36,
                        padding: '0 10px',
                        borderRadius: 9,
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        fontSize: '0.76rem',
                      }}
                    >
                      <option value="">Toàn công ty</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          Phòng ban: {d.name}
                        </option>
                      ))}
                    </select>

                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        color: composerPinned ? '#1E40FF' : '#475569',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={composerPinned}
                        onChange={(e) => setComposerPinned(e.target.checked)}
                      />
                      <Pin size={13} />
                      <span>Ghim đầu trang</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowAttachmentInput((prev) => !prev)}
                      style={{
                        height: 34,
                        padding: '0 10px',
                        borderRadius: 9,
                        border: '1px solid #E2E8F0',
                        background: '#F8FAFC',
                        color: '#475569',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        cursor: 'pointer',
                      }}
                    >
                      <Paperclip size={13} />
                      <span>Thẻ đính kèm</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) =>
                        setStickerTarget({ scope: 'composer', anchorEl: e.currentTarget })
                      }
                      style={{
                        height: 34,
                        padding: '0 10px',
                        borderRadius: 9,
                        border: '1px solid #E2E8F0',
                        background: '#F8FAFC',
                        color: '#1E40FF',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        cursor: 'pointer',
                      }}
                    >
                      <Smile size={13} />
                      <span>Sticker / Emoji</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={submittingPost}
                    onClick={handlePublishPost}
                    style={{
                      minHeight: 38,
                      padding: '0 18px',
                      borderRadius: 10,
                      border: 'none',
                      background: 'linear-gradient(135deg, #1E40FF 0%, #0284C7 100%)',
                      color: '#FFFFFF',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer',
                    }}
                  >
                    <Send size={14} />
                    <span>{submittingPost ? 'Đang đăng...' : 'Đăng bài viết'}</span>
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* Filter Toolbar */}
          <Card padding="0.85rem 1.1rem">
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  flex: 1,
                  minWidth: 180,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '0 10px',
                  height: 38,
                  borderRadius: 10,
                  background: '#F8F9FA',
                  border: '1px solid #E2E8F0',
                }}
              >
                <Search size={14} color="#64748B" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Tìm bài viết, người đăng..."
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '0.8rem',
                  }}
                />
              </div>

              <select
                value={filterDeptId}
                onChange={(e) => setFilterDeptId(e.target.value)}
                style={{
                  height: 38,
                  padding: '0 10px',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  fontSize: '0.78rem',
                }}
              >
                <option value="all">Tất cả phòng ban</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{
                  height: 38,
                  padding: '0 10px',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  fontSize: '0.78rem',
                }}
              >
                <option value="all">Mọi phân loại</option>
                {FEED_POST_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setPinnedOnly((prev) => !prev)}
                style={{
                  height: 38,
                  padding: '0 11px',
                  borderRadius: 10,
                  border: pinnedOnly ? '1px solid #D97706' : '1px solid #E2E8F0',
                  background: pinnedOnly ? '#FEF3C7' : '#FFFFFF',
                  color: pinnedOnly ? '#B45309' : '#475569',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                📌 Đã ghim
              </button>

              <button
                type="button"
                onClick={async () => {
                  const bundle = await loadFeedBundle();
                  setPosts(bundle.posts);
                  setKudosItems(bundle.kudosItems);
                  setLeaderboard(bundle.leaderboard);
                  toast.success('Đã làm mới Bảng tin');
                }}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  color: '#475569',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                title="Làm mới"
              >
                <RefreshCw size={15} />
              </button>
            </div>
          </Card>

          {/* Feed Stream */}
          {filteredPosts.length === 0 ? (
            <EmptyState
              icon={<Megaphone size={24} />}
              title="Chưa có bài đăng nào trên Bảng tin"
              description="Hãy đăng thông báo đầu tiên để kết nối và truyền cảm hứng cho toàn đội ngũ."
            />
          ) : (
            filteredPosts.map((post) => {
              const catMeta =
                FEED_POST_CATEGORIES.find((c) => c.key === post.post_type) ||
                FEED_POST_CATEGORIES[0];
              const isCommentsOpen = Boolean(expandedPostIds[post.id]);
              const postComments = commentsByPost[post.id] || [];
              const rootComments = postComments.filter((c) => !c.parent_id && !c.parent_comment_id);
              const getReplies = (parentId: string) =>
                postComments.filter(
                  (c) => c.parent_id === parentId || c.parent_comment_id === parentId
                );

              return (
                <Card key={post.id} padding="1.2rem 1.35rem">
                  {/* Post Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={post.author_name} size={40} />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>
                            {post.author_name}
                          </span>
                          <Badge tone={catMeta.tone}>{catMeta.label}</Badge>
                          {post.is_pinned && <Badge tone="warning">📌 Ghim quan trọng</Badge>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.73rem', color: '#64748B', marginTop: 2 }}>
                          <span>{formatShortDate(post.created_at)}</span>
                          {post.department_name && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                              <Building2 size={11} />
                              {post.department_name}
                            </span>
                          )}
                          {post.branch_name && <span>• {post.branch_name}</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Post Title & Content */}
                  {post.title && (
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: '12px 0 6px' }}>
                      {post.title}
                    </h3>
                  )}
                  <div
                    style={{
                      fontSize: '0.87rem',
                      color: '#1E293B',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                      marginTop: post.title ? 4 : 12,
                    }}
                  >
                    {post.content}
                  </div>

                  {/* Post Attachment Cards */}
                  {Array.isArray(post.attachments) && post.attachments.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                      {post.attachments.map((att, idx) => (
                        <a
                          key={`${post.id}_att_${idx}`}
                          href={att.url || '#'}
                          target={att.url ? '_blank' : undefined}
                          rel="noreferrer"
                          style={{
                            padding: '8px 12px',
                            borderRadius: 12,
                            border: '1px solid #DBEAFE',
                            background: '#F8FAFF',
                            color: '#1E40FF',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <Link2 size={13} />
                          <span>{att.title}</span>
                        </a>
                      ))}
                    </div>
                  )}

                  {/* 6 Reaction Types Bar */}
                  <div
                    style={{
                      marginTop: 14,
                      paddingTop: 10,
                      borderTop: '1px solid #F1F5F9',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {FEED_REACTION_TYPES.map((rx) => {
                        const list = post.reactions?.[rx.type] || [];
                        const fallbackCount =
                          rx.type === 'like' && list.length === 0 ? post.likes_count : list.length;
                        return (
                          <button
                            key={rx.type}
                            type="button"
                            onClick={() => handleReactPost(post, rx.type)}
                            title={rx.label}
                            style={{
                              padding: '4px 9px',
                              borderRadius: 999,
                              border: fallbackCount > 0 ? `1px solid ${rx.color}` : '1px solid #E2E8F0',
                              background: fallbackCount > 0 ? rx.bg : '#F8FAFC',
                              color: fallbackCount > 0 ? rx.color : '#475569',
                              fontSize: '0.73rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              cursor: 'pointer',
                            }}
                          >
                            <span>{rx.emoji}</span>
                            <span>{rx.label}</span>
                            {fallbackCount > 0 && <span>({fallbackCount})</span>}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleCommentsSection(post.id)}
                      style={{
                        padding: '5px 11px',
                        borderRadius: 999,
                        border: '1px solid #E2E8F0',
                        background: isCommentsOpen ? '#EEF2FF' : '#FFFFFF',
                        color: isCommentsOpen ? '#1E40FF' : '#475569',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        cursor: 'pointer',
                      }}
                    >
                      <MessageCircle size={14} />
                      <span>{post.comments_count} Bình luận</span>
                    </button>
                  </div>

                  {/* Nested Comments Section */}
                  {isCommentsOpen && (
                    <div
                      style={{
                        marginTop: 12,
                        paddingTop: 12,
                        borderTop: '1px solid #E2E8F0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}
                    >
                      {rootComments.map((c) => {
                        const replies = getReplies(c.id);
                        return (
                          <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                              <Avatar name={c.author_name} size={28} />
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    padding: '8px 12px',
                                    borderRadius: 12,
                                    background: '#F8F9FA',
                                    border: '1px solid #E2E8F0',
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.73rem' }}>
                                    <strong style={{ color: '#0F172A' }}>{c.author_name}</strong>
                                    <span style={{ color: '#94A3B8' }}>{formatShortDate(c.created_at)}</span>
                                  </div>
                                  <div style={{ fontSize: '0.81rem', color: '#1E293B', marginTop: 3 }}>
                                    {c.content}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setReplyParentByPost((prev) => ({ ...prev, [post.id]: c }))
                                  }
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: '#1E40FF',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    marginTop: 3,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Phản hồi
                                </button>
                              </div>
                            </div>

                            {/* Nested Replies */}
                            {replies.length > 0 && (
                              <div style={{ paddingLeft: 34, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {replies.map((rep) => (
                                  <div key={rep.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                                    <CornerDownRight size={13} color="#94A3B8" style={{ marginTop: 6 }} />
                                    <Avatar name={rep.author_name} size={24} />
                                    <div
                                      style={{
                                        flex: 1,
                                        padding: '7px 10px',
                                        borderRadius: 11,
                                        background: '#EFF6FF',
                                        border: '1px solid #DBEAFE',
                                      }}
                                    >
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                                        <strong style={{ color: '#1E40FF' }}>{rep.author_name}</strong>
                                        <span style={{ color: '#64748B' }}>{formatShortDate(rep.created_at)}</span>
                                      </div>
                                      <div style={{ fontSize: '0.79rem', color: '#0F172A', marginTop: 2 }}>
                                        {rep.content}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Reply Banner */}
                      {replyParentByPost[post.id] && (
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '5px 10px',
                            borderRadius: 8,
                            background: '#EEF2FF',
                            fontSize: '0.73rem',
                            color: '#1E40FF',
                          }}
                        >
                          <span>
                            Đang phản hồi bình luận của <strong>{replyParentByPost[post.id]?.author_name}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setReplyParentByPost((prev) => ({ ...prev, [post.id]: null }))
                            }
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700 }}
                          >
                            Hủy
                          </button>
                        </div>
                      )}

                      {/* Comment Input + Sticker Button */}
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={(e) =>
                            setStickerTarget({
                              scope: 'comment',
                              postId: post.id,
                              anchorEl: e.currentTarget,
                            })
                          }
                          title="Chọn Sticker / Nhãn dán bình luận"
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            border: '1px solid #E2E8F0',
                            background: '#F8FAFC',
                            color: '#1E40FF',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <Smile size={16} />
                        </button>
                        <input
                          type="text"
                          value={commentDraftByPost[post.id] || ''}
                          onChange={(e) =>
                            setCommentDraftByPost((prev) => ({
                              ...prev,
                              [post.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSubmitComment(post.id);
                            }
                          }}
                          placeholder="Viết bình luận phản hồi (Enter để gửi)..."
                          style={{
                            flex: 1,
                            height: 38,
                            padding: '0 12px',
                            borderRadius: 10,
                            border: '1px solid #CBD5E1',
                            background: '#FFFFFF',
                            fontSize: '0.8rem',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSubmitComment(post.id)}
                          style={{
                            height: 38,
                            padding: '0 14px',
                            borderRadius: 10,
                            border: 'none',
                            background: '#1E40FF',
                            color: '#FFFFFF',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Gửi
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>

        {/* Right Column: Top 15 Leaderboard + Kudos Recognition Wall */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card
            title="Bảng Xếp Hạng Top 15 Kudos"
            subtitle="Vinh danh nhân sự xuất sắc nhất kỳ"
            actions={
              canCreate ? (
                <button
                  type="button"
                  onClick={() => setKudosModalOpen(true)}
                  style={{
                    height: 32,
                    padding: '0 10px',
                    borderRadius: 9,
                    border: 'none',
                    background: '#1E40FF',
                    color: '#FFFFFF',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={13} />
                  <span>Vinh danh</span>
                </button>
              ) : undefined
            }
          >
            {leaderboard.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: '#64748B', textAlign: 'center', padding: '14px 0' }}>
                Chưa có điểm vinh danh trong kỳ này.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {leaderboard.slice(0, 15).map((leader) => {
                  const medal =
                    leader.rank === 1 ? '🥇' : leader.rank === 2 ? '🥈' : leader.rank === 3 ? '🥉' : `#${leader.rank}`;
                  return (
                    <div
                      key={leader.user_id}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 12,
                        background: leader.rank <= 3 ? '#F8FAFF' : '#FFFFFF',
                        border: leader.rank === 1 ? '1px solid #BFDBFE' : '1px solid #F1F5F9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <span style={{ width: 26, fontSize: '0.84rem', fontWeight: 800, color: '#1E40FF' }}>
                          {medal}
                        </span>
                        <Avatar name={leader.full_name} size={28} />
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              color: '#0F172A',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {leader.full_name}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
                            {leader.kudos_count} lượt ghi nhận
                          </div>
                        </div>
                      </div>
                      <Badge tone={leader.rank <= 3 ? 'primary' : 'neutral'}>
                        +{leader.total_points} đ
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card
            title="Tường Ghi Nhận Kudos Gần Đây"
            subtitle="Lời cảm ơn & khích lệ giữa các đồng nghiệp"
          >
            {kudosItems.length === 0 ? (
              <EmptyState
                icon={<Trophy size={22} />}
                title="Chưa có lời vinh danh"
                description="Gửi Kudos đầu tiên để lan tỏa văn hóa ghi nhận tích cực!"
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 460, overflowY: 'auto' }}>
                {kudosItems.map((kd) => (
                  <div
                    key={kd.id}
                    style={{
                      padding: '11px 12px',
                      borderRadius: 14,
                      background: 'linear-gradient(145deg, #F8FAFF 0%, #FFFFFF 100%)',
                      border: '1px solid #DBEAFE',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 5 }}>
                      <Badge tone="primary">{kd.badge_title}</Badge>
                      <Badge tone="success">+{kd.points} điểm</Badge>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#0F172A', fontWeight: 700 }}>
                      <Sparkles size={12} color="#1E40FF" style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      {kd.sender_name} vinh danh <span style={{ color: '#1E40FF' }}>{kd.recipient_name}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: 4, lineHeight: 1.45 }}>
                      &ldquo;{kd.message}&rdquo;
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: 4 }}>
                      {formatShortDate(kd.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Sticker Picker Modal */}
      <StickerPickerModal
        isOpen={Boolean(stickerTarget)}
        onClose={() => setStickerTarget(null)}
        anchorEl={stickerTarget?.anchorEl ?? null}
        mode="popover"
        initialTab="work"
        onSelectEmoji={(em) => {
          if (stickerTarget?.scope === 'composer') {
            setComposerContent((prev) => `${prev}${em}`);
          } else if (stickerTarget?.scope === 'comment') {
            const pid = stickerTarget.postId;
            setCommentDraftByPost((prev) => ({ ...prev, [pid]: `${prev[pid] || ''}${em}` }));
          }
        }}
        onSelectWorkBadge={(badge: ChatSticker) => {
          const text = `${badge.icon} [${badge.badgeText}]`;
          if (stickerTarget?.scope === 'composer') {
            setComposerContent((prev) => `${prev} ${text}`.trim());
          } else if (stickerTarget?.scope === 'comment') {
            handleSubmitComment(stickerTarget.postId, text);
          }
        }}
        onSelectSticker={(_url, _packId, label) => {
          const text = label || '✨';
          if (stickerTarget?.scope === 'composer') {
            setComposerContent((prev) => `${prev} ${text}`.trim());
          } else if (stickerTarget?.scope === 'comment') {
            handleSubmitComment(stickerTarget.postId, text);
          }
        }}
      />

      {/* Send Kudos Modal */}
      <CustomModal
        isOpen={kudosModalOpen}
        onClose={() => setKudosModalOpen(false)}
        title="Gửi Vinh Danh Lên Bảng Vàng Kudos"
        width={520}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A' }}>
              Chọn đồng nghiệp được vinh danh *
            </label>
            <select
              value={kudosRecipientId}
              onChange={(e) => setKudosRecipientId(e.target.value)}
              style={{
                minHeight: 42,
                padding: '0 11px',
                borderRadius: 11,
                border: '1px solid #CBD5E1',
                fontSize: '0.84rem',
              }}
            >
              <option value="">-- Chọn nhân sự --</option>
              {staff.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.full_name} ({st.email})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A' }}>
              Danh hiệu ghi nhận
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {KUDOS_BADGE_PRESETS.map((b) => {
                const selected = kudosPresetKey === b.key;
                return (
                  <button
                    key={b.key}
                    type="button"
                    onClick={() => {
                      setKudosPresetKey(b.key);
                      setKudosPoints(String(b.points));
                    }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 10,
                      border: selected ? '1.5px solid #1E40FF' : '1px solid #E2E8F0',
                      background: selected ? '#EEF2FF' : '#FFFFFF',
                      color: selected ? '#1E40FF' : '#475569',
                      fontSize: '0.75rem',
                      fontWeight: selected ? 800 : 600,
                      cursor: 'pointer',
                    }}
                  >
                    {b.icon} {b.title} (+{b.points}đ)
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A' }}>
              Số điểm thưởng Kudos (5 - 100)
            </label>
            <input
              type="number"
              min={5}
              max={100}
              value={kudosPoints}
              onChange={(e) => setKudosPoints(e.target.value)}
              style={{
                minHeight: 40,
                padding: '0 12px',
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                fontSize: '0.84rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A' }}>
              Lời nhắn ghi nhận thành tích *
            </label>
            <textarea
              rows={3}
              value={kudosMessage}
              onChange={(e) => setKudosMessage(e.target.value)}
              placeholder="Chia sẻ đóng góp nổi bật của đồng nghiệp..."
              style={{
                padding: '10px 12px',
                borderRadius: 11,
                border: '1px solid #CBD5E1',
                fontSize: '0.84rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button
              type="button"
              onClick={() => setKudosModalOpen(false)}
              style={{
                minHeight: 40,
                padding: '0 14px',
                borderRadius: 11,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleCreateKudos}
              style={{
                minHeight: 40,
                padding: '0 18px',
                borderRadius: 11,
                border: 'none',
                background: 'linear-gradient(135deg, #1E40FF 0%, #0284C7 100%)',
                color: '#FFFFFF',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Gửi Vinh Danh
            </button>
          </div>
        </div>
      </CustomModal>
    </div>
  );
};

export default EnterpriseFeedView;
