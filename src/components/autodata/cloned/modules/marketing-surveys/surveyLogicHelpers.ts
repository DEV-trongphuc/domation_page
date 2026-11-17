import {
  BRANCHING_CAPABLE_TYPES,
  END_SURVEY_TARGET,
  LAYOUT_BLOCK_TYPES,
  createDefaultSurveyBlock,
  type QuestionCrossTabStat,
  type ScoreRedirectRule,
  type SurveyBlockDto,
  type SurveyItemDto,
  type SurveyRespondentDto,
  type SurveySettingsDto,
} from './surveyTypes';

export function createPresetSurveyBlocks(preset: 'nps' | 'quiz' | 'branching' | 'csat'): SurveyBlockDto[] {
  if (preset === 'nps') {
    return [
      createDefaultSurveyBlock('nps'),
      {
        ...createDefaultSurveyBlock('long_text'),
        label: 'Điều gì khiến bạn ấn tượng nhất hoặc muốn chúng tôi cải thiện thêm?',
        placeholder: 'Chia sẻ góp ý của bạn...',
      },
      {
        ...createDefaultSurveyBlock('phone'),
        label: 'Số điện thoại nhận quà tri ân (Tùy chọn)',
        placeholder: '0909 123 456',
      },
    ];
  }

  if (preset === 'csat') {
    return [
      createDefaultSurveyBlock('csat_stars'),
      createDefaultSurveyBlock('emoji_rating'),
      createDefaultSurveyBlock('likert_matrix'),
    ];
  }

  if (preset === 'branching') {
    const detailQuestion: SurveyBlockDto = {
      ...createDefaultSurveyBlock('quiz_scored'),
      label: 'Quy mô đội ngũ Kinh doanh & Marketing hiện tại của bạn?',
    };
    const phoneBlock: SurveyBlockDto = {
      ...createDefaultSurveyBlock('phone'),
      label: 'Số điện thoại nhận bản kế hoạch triển khai 1-1',
      required: true,
    };
    const gateBlock: SurveyBlockDto = {
      ...createDefaultSurveyBlock('branch_jump'),
      label: 'Doanh nghiệp bạn đã sẵn sàng triển khai chuyển đổi số trong Quý này chưa?',
      required: true,
      options: [
        { id: crypto.randomUUID(), label: 'Sẵn sàng triển khai ngay', value: 'ready_now', points: 25, jumpToBlockId: detailQuestion.id },
        { id: crypto.randomUUID(), label: 'Đang khảo sát ngân sách', value: 'researching', points: 10, jumpToBlockId: phoneBlock.id },
        { id: crypto.randomUUID(), label: 'Chỉ tham khảo thông tin', value: 'just_looking', points: 0, jumpToBlockId: END_SURVEY_TARGET },
      ],
    };
    return [gateBlock, createDefaultSurveyBlock('page_break'), detailQuestion, createDefaultSurveyBlock('page_break'), phoneBlock];
  }

  return [
    createDefaultSurveyBlock('nps'),
    createDefaultSurveyBlock('quiz_scored'),
    {
      ...createDefaultSurveyBlock('short_text'),
      label: 'Họ và tên người tham gia',
      required: true,
      placeholder: 'Nguyễn Văn A',
    },
    {
      ...createDefaultSurveyBlock('phone'),
      label: 'Số điện thoại nhận kết quả & Voucher',
      required: true,
      placeholder: '0909 123 456',
    },
  ];
}

export function splitSurveyIntoPages(blocks: ReadonlyArray<SurveyBlockDto>): SurveyBlockDto[][] {
  const pages: SurveyBlockDto[][] = [];
  let current: SurveyBlockDto[] = [];
  for (const blk of blocks) {
    if (blk.type === 'page_break') {
      if (current.length > 0) {
        pages.push(current);
        current = [];
      }
    } else {
      current.push(blk);
    }
  }
  if (current.length > 0 || pages.length === 0) {
    pages.push(current);
  }
  return pages;
}

export type BranchStepOutcome =
  | { action: 'next'; pageIndex: number; scrollBlockId?: string }
  | { action: 'end' };

export function evaluateBranchingNextStep(
  pageBlocks: ReadonlyArray<SurveyBlockDto>,
  answers: Record<string, unknown>,
  pages: ReadonlyArray<ReadonlyArray<SurveyBlockDto>>,
  currentPageIdx: number
): BranchStepOutcome {
  for (const blk of pageBlocks) {
    if (!BRANCHING_CAPABLE_TYPES.has(blk.type)) continue;
    const rawAns = answers[blk.id];
    if (rawAns === undefined || rawAns === null || rawAns === '') continue;

    const selectedStr = String(rawAns);
    const matchedOpt = (blk.options || []).find(
      (o) => o.value === selectedStr || o.label === selectedStr
    );
    const jumpTarget = matchedOpt?.jumpToBlockId || blk.defaultJumpToBlockId;
    if (!jumpTarget) continue;

    if (jumpTarget === END_SURVEY_TARGET) {
      return { action: 'end' };
    }

    const targetPageIdx = pages.findIndex((p) => p.some((b) => b.id === jumpTarget));
    if (targetPageIdx >= 0) {
      return {
        action: 'next',
        pageIndex: targetPageIdx,
        scrollBlockId: jumpTarget,
      };
    }
  }

  if (currentPageIdx + 1 < pages.length) {
    return { action: 'next', pageIndex: currentPageIdx + 1 };
  }
  return { action: 'end' };
}

export function matchScoreRedirectRule(
  score: number,
  settings?: SurveySettingsDto,
  topLevelRules?: ReadonlyArray<ScoreRedirectRule>
): ScoreRedirectRule | null {
  const rules =
    (settings?.redirect_rules && settings.redirect_rules.length > 0
      ? settings.redirect_rules
      : topLevelRules) || [];
  for (const rule of rules) {
    if (score >= Number(rule.minScore || 0) && score <= Number(rule.maxScore ?? 999999)) {
      return rule;
    }
  }
  return null;
}

export function computeQuestionCrossTabStats(
  blocks: ReadonlyArray<SurveyBlockDto>,
  responses: ReadonlyArray<SurveyRespondentDto>,
  npsSegment: 'all' | 'promoters' | 'passives' | 'detractors'
): QuestionCrossTabStat[] {
  const filtered = responses.filter((r) => {
    if (npsSegment === 'all') return true;
    if (r.nps_score === null || r.nps_score === undefined) return false;
    if (npsSegment === 'promoters') return r.nps_score >= 9;
    if (npsSegment === 'passives') return r.nps_score >= 7 && r.nps_score <= 8;
    return r.nps_score <= 6;
  });

  const questionBlocks = blocks.filter((b) => !LAYOUT_BLOCK_TYPES.has(b.type));

  return questionBlocks.map((blk) => {
    const counts = new Map<string, number>();
    const sampleTexts: string[] = [];
    let totalAnswered = 0;
    let numSum = 0;
    let numCount = 0;

    if (blk.options && blk.options.length > 0) {
      for (const opt of blk.options) {
        counts.set(opt.value, 0);
      }
    }

    for (const resp of filtered) {
      const val = resp.answers?.[blk.id];
      if (val === undefined || val === null || val === '') continue;
      totalAnswered += 1;

      if (Array.isArray(val)) {
        for (const item of val) {
          const k = String(item);
          counts.set(k, (counts.get(k) || 0) + 1);
        }
      } else if (typeof val === 'number' || ['nps', 'csat_stars', 'slider', 'emoji_rating', 'number'].includes(blk.type)) {
        const n = Number(val);
        if (Number.isFinite(n)) {
          numSum += n;
          numCount += 1;
          const k = String(n);
          counts.set(k, (counts.get(k) || 0) + 1);
        }
      } else if (typeof val === 'object') {
        sampleTexts.push(JSON.stringify(val));
      } else {
        const str = String(val).trim();
        if (blk.options && blk.options.length > 0) {
          counts.set(str, (counts.get(str) || 0) + 1);
        } else if (str) {
          sampleTexts.push(str);
        }
      }
    }

    const optionStats = Array.from(counts.entries()).map(([value, count]) => {
      const optDef = blk.options?.find((o) => o.value === value || o.label === value);
      return {
        value,
        label: optDef ? optDef.label : value,
        count,
        percentage: totalAnswered > 0 ? Math.round((count / totalAnswered) * 100) : 0,
      };
    });

    return {
      blockId: blk.id,
      label: blk.label,
      type: blk.type,
      totalAnswered,
      avgNumber: numCount > 0 ? Number((numSum / numCount).toFixed(2)) : undefined,
      options: optionStats,
      sampleTexts: sampleTexts.slice(0, 5),
    };
  });
}

export function exportSurveyRespondentsCsv(
  survey: SurveyItemDto,
  responses: ReadonlyArray<SurveyRespondentDto>
): void {
  const questionBlocks = survey.blocks.filter((b) => !LAYOUT_BLOCK_TYPES.has(b.type));
  const headers = [
    'ID Phản hồi',
    'Họ và tên',
    'Số điện thoại',
    'Email',
    'Điểm Quiz',
    'Điểm NPS',
    'Tags đã gắn',
    'Thời gian nộp',
    ...questionBlocks.map((b, i) => `Câu ${i + 1}: ${b.label}`),
  ];

  const escapeCsv = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = responses.map((r) => [
    r.id,
    r.name || 'Khách ẩn danh',
    r.phone || '',
    r.email || '',
    r.quiz_score,
    r.nps_score ?? '',
    (r.tags_applied || []).join('; '),
    r.created_at || '',
    ...questionBlocks.map((b) => r.answers?.[b.id] ?? ''),
  ]);

  const csvBody = [
    headers.map(escapeCsv).join(','),
    ...rows.map((row) => row.map(escapeCsv).join(',')),
  ].join('\r\n');

  const blob = new Blob([`\uFEFF${csvBody}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bao-cao-khao-sat-${survey.slug || survey.id}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateQrVisualGrid(seedText: string): boolean[][] {
  const size = 21;
  const grid: boolean[][] = Array.from({ length: size }, () => Array<boolean>(size).fill(false));

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r += 1) {
      for (let c = 0; c < 7; c += 1) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[r0 + r][c0 + c] = isBorder || isCore;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  for (let i = 8; i < size - 8; i += 1) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  let hash = 2166136261;
  for (let i = 0; i < seedText.length; i += 1) {
    hash ^= seedText.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      const isTiming = r === 6 || c === 6;
      if (inTopLeft || inTopRight || inBottomLeft || isTiming) continue;

      const mix = Math.imul(hash ^ (r * 31 + c * 97), 2654435761) >>> 0;
      grid[r][c] = (mix & 3) === 0 || (mix & 5) === 1;
    }
  }

  return grid;
}
