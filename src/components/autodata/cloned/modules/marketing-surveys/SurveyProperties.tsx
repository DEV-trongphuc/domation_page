import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { SurveyPropertiesBlockTab } from './SurveyPropertiesBlockTab';
import { SurveyPropertiesSettingsTab } from './SurveyPropertiesSettingsTab';
import type {
  AudienceRefDto,
  SurveyBlockDto,
  SurveySettingsDto,
  SurveyThemeDto,
  VoucherCampaignRefDto,
} from './surveyTypes';

interface SurveyPropertiesProps {
  selectedBlock: SurveyBlockDto | null;
  allBlocks: ReadonlyArray<SurveyBlockDto>;
  theme: SurveyThemeDto;
  settings: SurveySettingsDto;
  audiences: AudienceRefDto[];
  voucherCampaigns: VoucherCampaignRefDto[];
  onUpdateBlock: (id: string, patch: Partial<SurveyBlockDto>) => void;
  onUpdateTheme: (patch: Partial<SurveyThemeDto>) => void;
  onUpdateSettings: (patch: Partial<SurveySettingsDto>) => void;
  onClearSelection: () => void;
}

export const SurveyProperties: React.FC<SurveyPropertiesProps> = ({
  selectedBlock,
  allBlocks,
  theme,
  settings,
  audiences,
  voucherCampaigns,
  onUpdateBlock,
  onUpdateTheme,
  onUpdateSettings,
  onClearSelection,
}) => (
  <div
    style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: 18,
      padding: '0.95rem',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      maxHeight: 'calc(100vh - 170px)',
      overflowY: 'auto',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', fontWeight: 800, color: '#0F172A' }}>
        <SlidersHorizontal size={15} color="#1E40FF" />
        {selectedBlock ? 'Thuộc Tính Khối Câu Hỏi' : 'Cấu Hình Tổng Thể & Luật Điểm'}
      </div>
      {selectedBlock && (
        <button
          type="button"
          onClick={onClearSelection}
          className="btn secondary sm"
          style={{ height: 28, fontSize: '0.72rem', color: '#1E40FF' }}
        >
          Cấu hình chung
        </button>
      )}
    </div>

    {selectedBlock ? (
      <SurveyPropertiesBlockTab
        block={selectedBlock}
        allBlocks={allBlocks}
        onUpdate={(patch) => onUpdateBlock(selectedBlock.id, patch)}
      />
    ) : (
      <SurveyPropertiesSettingsTab
        theme={theme}
        settings={settings}
        audiences={audiences}
        voucherCampaigns={voucherCampaigns}
        onUpdateTheme={onUpdateTheme}
        onUpdateSettings={onUpdateSettings}
      />
    )}
  </div>
);

export default SurveyProperties;
