import React, { useState } from 'react';
import { KeyRound, RotateCcw, Save, ShieldCheck, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomModal } from '../../components/ui/CustomModal';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import { apiRequest, getErrorMessage } from '../../../autodataApi';
import {
  DEFAULT_ROBOT_AVATAR,
  PERSONA_TONE_OPTIONS,
  type DomAgentConfigDto,
} from './domAgentTypes';

interface DomAgentPersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DomAgentConfigDto;
  canManage: boolean;
  token?: string | null;
  tenantSlug?: string | null;
  onSaved: (next: DomAgentConfigDto) => void;
}

export const DomAgentPersonaModal: React.FC<DomAgentPersonaModalProps> = ({
  isOpen,
  onClose,
  config,
  canManage,
  token,
  tenantSlug,
  onSaved,
}) => {
  const [agentName, setAgentName] = useState(() => config.agent_name || 'DOM Agent');
  const [avatarUrl, setAvatarUrl] = useState(() => config.avatar_url || DEFAULT_ROBOT_AVATAR);
  const [greetingMessage, setGreetingMessage] = useState(() => config.greeting_message || '');
  const [personaTone, setPersonaTone] = useState(() => config.persona_tone || 'executive_concise');
  const [preferredModel, setPreferredModel] = useState(
    () => config.preferred_model || 'gemini-2.5-flash'
  );
  const [temperature, setTemperature] = useState(() => Number(config.temperature ?? 0.25));
  const [enableMorningBriefing, setEnableMorningBriefing] = useState(() =>
    Boolean(config.enable_morning_briefing ?? true)
  );
  const [guardrailLines, setGuardrailLines] = useState(() =>
    (config.guardrail_rules || []).join('\n')
  );
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [clearByok, setClearByok] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarBroken, setAvatarBroken] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      toast.error('Tài khoản của bạn không có quyền thay đổi cấu hình trợ lý.');
      return;
    }
    if (!agentName.trim()) {
      toast.error('Tên hiển thị của trợ lý không được để trống.');
      return;
    }

    setSaving(true);
    try {
      const rules = guardrailLines
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      const payload: Record<string, unknown> = {
        agent_name: agentName.trim(),
        avatar_url: avatarUrl.trim() || DEFAULT_ROBOT_AVATAR,
        greeting_message: greetingMessage.trim(),
        persona_tone: personaTone,
        preferred_model: preferredModel,
        temperature,
        enable_morning_briefing: enableMorningBriefing,
        guardrail_rules: rules,
      };

      if (clearByok) {
        payload.gemini_api_key = '__CLEAR__';
      } else if (geminiApiKey.trim()) {
        payload.gemini_api_key = geminiApiKey.trim();
      }

      const updated = await apiRequest<DomAgentConfigDto>('/dom-agent/config', {
        method: 'PUT',
        token,
        tenantSlug,
        body: payload,
      });

      onSaved(updated);
      toast.success(`Đã lưu cấu hình White-Label cho ${updated.agent_name}!`);
      onClose();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Không thể lưu cấu hình DOM Agent.'));
    } finally {
      setSaving(false);
    }
  };

  const effectivePreviewLogo =
    !avatarBroken && avatarUrl.trim() ? avatarUrl.trim() : DEFAULT_ROBOT_AVATAR;

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Cấu hình White-Label Nhân cách & Khóa BYOK cho DOM Agent"
      width="720px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '0.9rem 1.1rem',
            borderRadius: 16,
            background: '#F8FAFF',
            border: '1px solid #DBEAFE',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 6px 16px rgba(30, 64, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 7,
              flexShrink: 0,
            }}
          >
            <img
              src={effectivePreviewLogo}
              alt="DOM Agent Avatar"
              onError={() => setAvatarBroken(true)}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                {agentName.trim() || 'DOM Agent'}
              </span>
              <Badge tone="primary" icon={<Sparkles size={11} />}>
                White-Label SaaS
              </Badge>
              {config.has_byok_gemini ? (
                <Badge tone="success" icon={<ShieldCheck size={11} />}>
                  BYOK Vault: {config.gemini_key_hint || 'Đã kết nối'}
                </Badge>
              ) : (
                <Badge tone="info">Local SQL/RAG Orchestrator</Badge>
              )}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 3 }}>
              Tùy chỉnh biệt danh, ảnh đại diện thương hiệu riêng, giọng văn điều hành và khóa Gemini BYOK mã hóa AES-256-GCM.
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.9rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
              Tên trợ lý nội bộ của doanh nghiệp
            </label>
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="DOM Agent"
              disabled={!canManage}
              style={{
                width: '100%',
                height: 40,
                padding: '0 0.85rem',
                borderRadius: 12,
                border: '1px solid #CBD5E1',
                fontSize: '0.84rem',
                color: '#0F172A',
                background: '#FFFFFF',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
              URL Avatar thương hiệu (Mặc định Logo Robot)
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => {
                  setAvatarBroken(false);
                  setAvatarUrl(e.target.value);
                }}
                placeholder={DEFAULT_ROBOT_AVATAR}
                disabled={!canManage}
                style={{
                  flex: 1,
                  height: 40,
                  padding: '0 0.85rem',
                  borderRadius: 12,
                  border: '1px solid #CBD5E1',
                  fontSize: '0.84rem',
                  color: '#0F172A',
                  background: '#FFFFFF',
                }}
              />
              <button
                type="button"
                title="Đặt lại Logo Robot DOMATION mặc định"
                onClick={() => {
                  setAvatarBroken(false);
                  setAvatarUrl(DEFAULT_ROBOT_AVATAR);
                }}
                disabled={!canManage}
                style={{
                  height: 40,
                  padding: '0 0.7rem',
                  borderRadius: 12,
                  border: '1px solid #E2E8F0',
                  background: '#F8F9FA',
                  color: '#475569',
                  cursor: canManage ? 'pointer' : 'not-allowed',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.9rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
              Phong cách phản hồi (Persona Tone)
            </label>
            <select
              value={personaTone}
              onChange={(e) => setPersonaTone(e.target.value)}
              disabled={!canManage}
              style={{
                width: '100%',
                height: 40,
                padding: '0 0.75rem',
                borderRadius: 12,
                border: '1px solid #CBD5E1',
                fontSize: '0.82rem',
                color: '#0F172A',
                background: '#FFFFFF',
              }}
            >
              {PERSONA_TONE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
              Mô hình LLM ưu tiên (khi gắn BYOK)
            </label>
            <select
              value={preferredModel}
              onChange={(e) => setPreferredModel(e.target.value)}
              disabled={!canManage}
              style={{
                width: '100%',
                height: 40,
                padding: '0 0.75rem',
                borderRadius: 12,
                border: '1px solid #CBD5E1',
                fontSize: '0.82rem',
                color: '#0F172A',
                background: '#FFFFFF',
              }}
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Tốc độ cao • Function Calling)</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro (Phân tích BI Chuyên sâu)</option>
              <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
              Độ sáng tạo Temperature ({temperature.toFixed(2)})
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              disabled={!canManage}
              style={{ width: '100%', marginTop: 10, accentColor: '#1E40FF' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
            Lời chào mở đầu mặc định
          </label>
          <textarea
            rows={2}
            value={greetingMessage}
            onChange={(e) => setGreetingMessage(e.target.value)}
            disabled={!canManage}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: 12,
              border: '1px solid #CBD5E1',
              fontSize: '0.83rem',
              color: '#0F172A',
              background: '#FFFFFF',
              resize: 'vertical',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
            Quy tắc Bảo vệ Nội bộ (Guardrail Rules — mỗi dòng 1 quy tắc)
          </label>
          <textarea
            rows={3}
            value={guardrailLines}
            onChange={(e) => setGuardrailLines(e.target.value)}
            disabled={!canManage}
            placeholder="Ví dụ: Chỉ trích dẫn chính sách bảo hành từ văn bản đã ban hành chính thức"
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: 12,
              border: '1px solid #CBD5E1',
              fontSize: '0.82rem',
              color: '#0F172A',
              background: '#FFFFFF',
              resize: 'vertical',
            }}
          />
        </div>

        <div
          style={{
            padding: '0.9rem 1rem',
            borderRadius: 14,
            background: '#F8F9FA',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
              <KeyRound size={15} color="#1E40FF" />
              <span>Khóa Google Gemini API Riêng (BYOK — Mã hóa AES-256-GCM Vault)</span>
            </div>
            {config.has_byok_gemini && (
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', color: '#DC2626', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={clearByok}
                  onChange={(e) => setClearByok(e.target.checked)}
                  disabled={!canManage}
                />
                Gỡ khóa BYOK hiện tại
              </label>
            )}
          </div>
          <input
            type="password"
            value={geminiApiKey}
            onChange={(e) => {
              setClearByok(false);
              setGeminiApiKey(e.target.value);
            }}
            disabled={!canManage || clearByok}
            placeholder={
              config.has_byok_gemini
                ? `Đang dùng khóa ${config.gemini_key_hint || 'Vault'} — nhập khóa mới nếu muốn xoay vòng`
                : 'Nhập AIzaSy... để kích hoạt Gemini Function-Calling trực tiếp (để trống sẽ chạy Local SQL/RAG Orchestrator)'
            }
            style={{
              width: '100%',
              height: 40,
              padding: '0 0.85rem',
              borderRadius: 12,
              border: '1px solid #CBD5E1',
              fontSize: '0.82rem',
              color: '#0F172A',
              background: '#FFFFFF',
            }}
          />
        </div>

        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.83rem',
            fontWeight: 600,
            color: '#0F172A',
            cursor: canManage ? 'pointer' : 'default',
          }}
        >
          <input
            type="checkbox"
            checked={enableMorningBriefing}
            onChange={(e) => setEnableMorningBriefing(e.target.checked)}
            disabled={!canManage}
            style={{ accentColor: '#1E40FF', width: 16, height: 16 }}
          />
          Bật tính năng Tổng hợp Bản tin Điều hành Chủ động mỗi sáng (Morning Executive Briefing)
        </label>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              height: 40,
              padding: '0 1rem',
              borderRadius: 12,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#334155',
              fontWeight: 600,
              fontSize: '0.83rem',
              cursor: 'pointer',
            }}
          >
            Đóng
          </button>
          {canManage && (
            <button
              type="submit"
              disabled={saving}
              style={{
                height: 40,
                padding: '0 1.25rem',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #1E40FF 0%, #0284C7 100%)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.83rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: saving ? 'wait' : 'pointer',
              }}
            >
              <Save size={15} />
              {saving ? 'Đang lưu...' : 'Lưu Cấu hình DOM Agent'}
            </button>
          )}
        </div>
      </form>
    </CustomModal>
  );
};
