import type {
  EmailBlockItem,
  EmailValidationIssue,
  SenderVaultStatus,
  SpamCheckReport,
  ValidationResultPayload,
} from './templateTypes';

const SPAM_KEYWORDS: ReadonlyArray<string> = [
  'miễn phí 100%',
  'trúng thưởng',
  'rút tiền ngay',
  'làm giàu nhanh',
  'không rủi ro',
  'thu nhập thụ động',
  'vốn 0 đồng',
];

export function buildLocalValidationResult(
  subject: string,
  blocks: EmailBlockItem[],
  compiledHtml: string,
  senderVault?: SenderVaultStatus
): ValidationResultPayload {
  const issues: EmailValidationIssue[] = [];
  let risk = 5;
  const trimmedSubject = subject.trim();

  if (!trimmedSubject) {
    risk += 25;
    issues.push({
      id: 'subj-empty',
      blockId: null,
      category: 'subject_issue',
      severity: 'high',
      title: 'Thiếu tiêu đề Email (Subject)',
      detail: 'Email không có Subject sẽ bị bộ lọc hộp thư đánh giá điểm tin cậy thấp.',
    });
  } else {
    if (trimmedSubject.length > 78) {
      risk += 8;
      issues.push({
        id: 'subj-long',
        blockId: null,
        category: 'subject_issue',
        severity: 'low',
        title: 'Tiêu đề dài trên 78 ký tự',
        detail: 'Một phần tiêu đề có thể bị cắt bớt trên màn hình di động.',
      });
    }
    if ((trimmedSubject.match(/!/g) || []).length >= 2) {
      risk += 12;
      issues.push({
        id: 'subj-exclaim',
        blockId: null,
        category: 'subject_issue',
        severity: 'medium',
        title: 'Lạm dụng dấu chấm than (!)',
        detail: 'Tránh dùng từ 2 dấu chấm than trở lên trong tiêu đề.',
      });
    }
  }

  const hasUnsubscribe = /\{\{\s*unsubscribe_url\s*\}\}/i.test(compiledHtml);
  if (!hasUnsubscribe) {
    risk += 30;
    issues.push({
      id: 'missing-unsub',
      blockId: null,
      category: 'missing_unsubscribe',
      severity: 'high',
      title: 'Thiếu biến {{unsubscribe_url}}',
      detail: 'Bắt buộc có liên kết hủy đăng ký chuẩn CAN-SPAM / Gmail Bulk Sender.',
    });
  }

  const textLower = `${trimmedSubject} ${compiledHtml.replace(/<[^>]+>/g, ' ')}`.toLowerCase();
  for (const kw of SPAM_KEYWORDS) {
    if (textLower.includes(kw)) {
      risk += 14;
      issues.push({
        id: `spam-${kw}`,
        blockId: null,
        category: 'spam_keyword',
        severity: 'medium',
        title: `Từ khóa nhạy cảm: "${kw}"`,
        detail: 'Cụm từ này dễ khiến email bị chuyển vào tab Quảng cáo hoặc Spam.',
      });
    }
  }

  let brokenLinksCount = 0;
  let missingAltCount = 0;
  for (const b of blocks) {
    if (['button', 'hero_banner', 'product_card', 'pricing_card', 'video_thumbnail'].includes(b.type)) {
      const rawUrl = (b.url || '').trim();
      const valid =
        rawUrl.startsWith('http://') ||
        rawUrl.startsWith('https://') ||
        rawUrl.startsWith('mailto:') ||
        rawUrl.startsWith('tel:') ||
        /^\{\{.+\}\}$/.test(rawUrl);
      if (!valid || rawUrl === '#') {
        brokenLinksCount += 1;
        risk += 10;
        issues.push({
          id: `link-${b.id}`,
          blockId: b.id,
          category: 'broken_link',
          severity: 'medium',
          title: `Liên kết chưa hợp lệ (${b.type})`,
          detail: `Khối "${b.title || b.buttonLabel || b.type}" đang để trống hoặc dùng "#" không thể theo dõi click.`,
        });
      }
      if (/\{\{.+\}\}/.test(rawUrl) && !(b.fallbackUrl || '').trim()) {
        issues.push({
          id: `fallback-${b.id}`,
          blockId: b.id,
          category: 'missing_fallback_url',
          severity: 'low',
          title: 'Chưa cấu hình Fallback URL cho link biến động',
          detail: `Nên nhập URL dự phòng cho "${rawUrl}" phòng khi dữ liệu khách hàng trống.`,
        });
      }
    }
    if ((b.type === 'image' || b.type === 'product_card') && !(b.altText || b.title || '').trim()) {
      missingAltCount += 1;
      risk += 6;
      issues.push({
        id: `alt-${b.id}`,
        blockId: b.id,
        category: 'missing_alt',
        severity: 'low',
        title: 'Hình ảnh thiếu mô tả ALT',
        detail: 'Bổ sung văn bản thay thế ALT giúp tăng khả năng hiển thị khi trình duyệt chặn tải ảnh.',
      });
    }
  }

  const clampedRisk = Math.min(100, Math.max(0, risk));
  const deliverabilityScore = Math.max(0, 100 - clampedRisk);
  const deliverabilityGrade: ValidationResultPayload['deliverabilityGrade'] =
    deliverabilityScore >= 85
      ? 'A+'
      : deliverabilityScore >= 70
        ? 'A'
        : deliverabilityScore >= 50
          ? 'B'
          : deliverabilityScore >= 30
            ? 'C'
            : 'D';

  return {
    score: deliverabilityScore,
    deliverabilityGrade,
    hasUnsubscribe,
    brokenLinksCount,
    missingAltCount,
    issues,
    senderVault,
  };
}

export function evaluateLocalSpamScore(
  subject: string,
  blocks: EmailBlockItem[],
  compiledHtml: string
): SpamCheckReport {
  const full = buildLocalValidationResult(subject, blocks, compiledHtml);
  const spamRiskScore = Math.max(0, 100 - full.score);
  return {
    score: spamRiskScore,
    deliverabilityGrade: full.deliverabilityGrade,
    issues: full.issues.map((i) => ({ severity: i.severity, message: `${i.title}: ${i.detail}` })),
  };
}
