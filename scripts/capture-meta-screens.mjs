/**
 * Capture live Royal Sapphire DOM Meta Report screens, modals & CRM/ERP Fusion views
 * for /meta-report and /data landing pages.
 *
 * Usage (with Vite dev server running on :5173):
 *   # Full live capture (8 core screens + 3 CRM/ERP Fusion screens):
 *   META_TOKEN=... META_ACCOUNT_ID=302787476028580 node scripts/capture-meta-screens.mjs
 *
 *   # Capture the 3 CRM/ERP Fusion showcase screens (uses META_TOKEN if set, or EcoLife preview dataset):
 *   node scripts/capture-meta-screens.mjs --fusion-only
 *
 * Zero secrets are stored in this script; credentials are read exclusively from process.env at runtime,
 * and preview fixtures exist strictly inside this headless capture script via window.__DOM_META_PREVIEW__.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const requireFromAutodata = createRequire(
  path.resolve(__dirname, '../../AUTO_DATA_TENANRT/package.json')
);
const puppeteer = requireFromAutodata('puppeteer');

const BASE_URL = (process.env.META_DEV_URL || 'http://localhost:5173').replace(/\/+$/, '');
const OUT_DIR = path.resolve(__dirname, '../public/imgs/meta-screens');
const CHROME_PATH =
  process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const META_TOKEN = (process.env.META_TOKEN || '').trim();
const META_ACCOUNT_ID = (process.env.META_ACCOUNT_ID || '302787476028580').trim();
const GADS_CUSTOMER_ID = (process.env.GADS_CUSTOMER_ID || '295-339-0933').trim();
const GADS_SCRIPT_URL = (process.env.GADS_SCRIPT_URL || '').trim();
const GADS_DEV_TOKEN = (process.env.GADS_DEV_TOKEN || '').trim();
const FUSION_ONLY = process.argv.includes('--fusion-only') || !META_TOKEN;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function buildEcoLifeCrmAttributionFixture() {
  const salesRoster = [
    {
      user_id: 'sale_minh_anh',
      name: 'Nguyễn Minh Anh',
      avatar: null,
      lead_count: 34,
      qualified_count: 23,
      closed_count: 4,
      revenue_vnd: 4_850_000_000,
    },
    {
      user_id: 'sale_tuan_kiet',
      name: 'Trần Tuấn Kiệt',
      avatar: null,
      lead_count: 28,
      qualified_count: 18,
      closed_count: 3,
      revenue_vnd: 3_620_000_000,
    },
    {
      user_id: 'sale_khanh_linh',
      name: 'Lê Khánh Linh',
      avatar: null,
      lead_count: 19,
      qualified_count: 12,
      closed_count: 2,
      revenue_vnd: 2_380_000_000,
    },
    {
      user_id: 'sale_hoang_nam',
      name: 'Phạm Hoàng Nam',
      avatar: null,
      lead_count: 13,
      qualified_count: 8,
      closed_count: 1,
      revenue_vnd: 1_250_000_000,
    },
  ];

  const ad1Sales = [
    {
      user_id: 'sale_minh_anh',
      name: 'Nguyễn Minh Anh',
      avatar: null,
      lead_count: 18,
      qualified_count: 13,
      closed_count: 2,
      revenue_vnd: 2_650_000_000,
    },
    {
      user_id: 'sale_tuan_kiet',
      name: 'Trần Tuấn Kiệt',
      avatar: null,
      lead_count: 14,
      qualified_count: 10,
      closed_count: 2,
      revenue_vnd: 2_420_000_000,
    },
    {
      user_id: 'sale_khanh_linh',
      name: 'Lê Khánh Linh',
      avatar: null,
      lead_count: 9,
      qualified_count: 6,
      closed_count: 1,
      revenue_vnd: 1_180_000_000,
    },
    {
      user_id: 'sale_hoang_nam',
      name: 'Phạm Hoàng Nam',
      avatar: null,
      lead_count: 5,
      qualified_count: 3,
      closed_count: 0,
      revenue_vnd: 0,
    },
  ];

  const ad1Leads = [
    {
      id: 'lead_eco_01',
      name: 'Phạm Quốc Bảo',
      phone: '0905•••688',
      email: 'q***@gmail.com',
      pii_masked: true,
      created_at: '2026-11-19T02:18:00.000Z',
      assigned_to: 'sale_minh_anh',
      assigned_to_name: 'Nguyễn Minh Anh',
      assigned_to_avatar: null,
      round_name: 'Vòng Đầu Tư Đà Nẵng VIP',
      quality_status: 'Đã đặt cọc căn 2PN tầng 18',
      stage_key: 'Deposited',
      quality_note: 'Khách đầu tư Hà Nội, đã chuyển cọc 100 triệu giữ căn góc Đông Nam',
      total_revenue_vnd: 1_450_000_000,
      ad_id: '120253871045600781',
      ad_name: 'Ad_Booking_Dau_Tu',
      adset_id: '120253871045590781',
      campaign_id: '120253750847770781',
      campaign_name: 'Lead_Booking_EcoLife_T11',
      source: 'Facebook Lead Ads',
      capi_last_event: 'Purchase',
      capi_last_status: 'sent',
    },
    {
      id: 'lead_eco_02',
      name: 'Đặng Thị Thu Thảo',
      phone: '0913•••922',
      email: 't***@ecolife.vn',
      pii_masked: true,
      created_at: '2026-11-19T01:42:00.000Z',
      assigned_to: 'sale_tuan_kiet',
      assigned_to_name: 'Trần Tuấn Kiệt',
      assigned_to_avatar: null,
      round_name: 'Vòng Đầu Tư Đà Nẵng VIP',
      quality_status: 'Đã ký HĐMB • Thanh toán đợt 1',
      stage_key: 'Closed',
      quality_note: 'Chốt căn hộ Dual-Key hướng sông Hàn, thanh toán nhanh chiết khấu 8%',
      total_revenue_vnd: 1_620_000_000,
      ad_id: '120253871045600781',
      ad_name: 'Ad_Booking_Dau_Tu',
      adset_id: '120253871045590781',
      campaign_id: '120253750847770781',
      campaign_name: 'Lead_Booking_EcoLife_T11',
      source: 'Facebook Lead Ads',
      capi_last_event: 'Purchase',
      capi_last_status: 'sent',
    },
    {
      id: 'lead_eco_03',
      name: 'Võ Minh Hoàng',
      phone: '0988•••415',
      email: 'h***@outlook.com',
      pii_masked: true,
      created_at: '2026-11-18T11:25:00.000Z',
      assigned_to: 'sale_khanh_linh',
      assigned_to_name: 'Lê Khánh Linh',
      assigned_to_avatar: null,
      round_name: 'Vòng Đầu Tư Đà Nẵng VIP',
      quality_status: 'Booking thiện chí 50 triệu',
      stage_key: 'Booking',
      quality_note: 'Khách hẹn thứ Bảy tham quan nhà mẫu và chọn mã căn 3PN view biển',
      total_revenue_vnd: 1_180_000_000,
      ad_id: '120253871045600781',
      ad_name: 'Ad_Booking_Dau_Tu',
      adset_id: '120253871045590781',
      campaign_id: '120253750847770781',
      campaign_name: 'Lead_Booking_EcoLife_T11',
      source: 'Facebook Lead Ads',
      capi_last_event: 'Lead',
      capi_last_status: 'sent',
    },
    {
      id: 'lead_eco_04',
      name: 'Lương Ngọc Diệp',
      phone: '0935•••109',
      email: 'd***@gmail.com',
      pii_masked: true,
      created_at: '2026-11-18T09:10:00.000Z',
      assigned_to: 'sale_minh_anh',
      assigned_to_name: 'Nguyễn Minh Anh',
      assigned_to_avatar: null,
      round_name: 'Vòng Đầu Tư Đà Nẵng VIP',
      quality_status: 'Hẹn gặp xem sa bàn T7',
      stage_key: 'Booked',
      quality_note: 'Quan tâm chính sách ân hạn gốc lãi 18 tháng, đi cùng gia đình',
      total_revenue_vnd: 1_200_000_000,
      ad_id: '120253871045600781',
      ad_name: 'Ad_Booking_Dau_Tu',
      adset_id: '120253871045590781',
      campaign_id: '120253750847770781',
      campaign_name: 'Lead_Booking_EcoLife_T11',
      source: 'Facebook Lead Ads',
      capi_last_event: 'Schedule',
      capi_last_status: 'sent',
    },
    {
      id: 'lead_eco_05',
      name: 'Huỳnh Gia Huy',
      phone: '0977•••530',
      email: 'g***@gmail.com',
      pii_masked: true,
      created_at: '2026-11-18T07:54:00.000Z',
      assigned_to: 'sale_tuan_kiet',
      assigned_to_name: 'Trần Tuấn Kiệt',
      assigned_to_avatar: null,
      round_name: 'Vòng Đầu Tư Đà Nẵng VIP',
      quality_status: 'Khách nét • Xin bảng tính dòng tiền',
      stage_key: 'Qualified',
      quality_note: 'Tài chính sẵn 2.5 tỷ, cần phương án khai thác cho thuê chuyên gia',
      total_revenue_vnd: 800_000_000,
      ad_id: '120253871045600781',
      ad_name: 'Ad_Booking_Dau_Tu',
      adset_id: '120253871045590781',
      campaign_id: '120253750847770781',
      campaign_name: 'Lead_Booking_EcoLife_T11',
      source: 'Facebook Lead Ads',
      capi_last_event: 'QualifiedLead',
      capi_last_status: 'sent',
    },
    {
      id: 'lead_eco_06',
      name: 'Ngô Thanh Tùng',
      phone: '0909•••774',
      email: 't***@company.vn',
      pii_masked: true,
      created_at: '2026-11-17T15:30:00.000Z',
      assigned_to: 'sale_hoang_nam',
      assigned_to_name: 'Phạm Hoàng Nam',
      assigned_to_avatar: null,
      round_name: 'Vòng Đầu Tư Đà Nẵng VIP',
      quality_status: 'Đang tư vấn qua Zalo',
      stage_key: 'Qualified',
      quality_note: 'Đã gửi mặt bằng tầng 12-20 và video thực tế tiến độ dự án',
      total_revenue_vnd: 0,
      ad_id: '120253871045600781',
      ad_name: 'Ad_Booking_Dau_Tu',
      adset_id: '120253871045590781',
      campaign_id: '120253750847770781',
      campaign_name: 'Lead_Booking_EcoLife_T11',
      source: 'Facebook Lead Ads',
      capi_last_event: 'QualifiedLead',
      capi_last_status: 'sent',
    },
  ];

  const bucketCamp1 = {
    entity_id: '120253750847770781',
    total_leads: 86,
    qualified_leads: 58,
    closed_leads: 9,
    negative_leads: 14,
    pending_leads: 14,
    positive_rate: 67.4,
    total_revenue_vnd: 10_850_000_000,
    capi_sent_count: 64,
    pipeline: { Qualified: 32, Booked: 11, Booking: 6, Deposited: 5, Closed: 4, Notlead: 14, unrated: 14 },
    sales: salesRoster,
  };

  const bucketAdset1 = {
    entity_id: '120253871045590781',
    total_leads: 46,
    qualified_leads: 32,
    closed_leads: 5,
    negative_leads: 7,
    pending_leads: 7,
    positive_rate: 69.6,
    total_revenue_vnd: 6_250_000_000,
    capi_sent_count: 35,
    pipeline: { Qualified: 17, Booked: 6, Booking: 4, Deposited: 3, Closed: 2, Notlead: 7, unrated: 7 },
    sales: ad1Sales,
  };

  const bucketAd1 = {
    entity_id: '120253871045600781',
    total_leads: 46,
    qualified_leads: 32,
    closed_leads: 5,
    negative_leads: 7,
    pending_leads: 7,
    positive_rate: 69.6,
    total_revenue_vnd: 6_250_000_000,
    capi_sent_count: 35,
    pipeline: { Qualified: 17, Booked: 6, Booking: 4, Deposited: 3, Closed: 2, Notlead: 7, unrated: 7 },
    sales: ad1Sales,
  };

  const bucketAdset2 = {
    entity_id: '120253871045610781',
    total_leads: 23,
    qualified_leads: 15,
    closed_leads: 2,
    negative_leads: 4,
    pending_leads: 4,
    positive_rate: 65.2,
    total_revenue_vnd: 2_850_000_000,
    capi_sent_count: 17,
    pipeline: { Qualified: 9, Booked: 3, Booking: 1, Deposited: 1, Closed: 1, Notlead: 4, unrated: 4 },
    sales: salesRoster.slice(0, 3),
  };

  const bucketAdset3 = {
    entity_id: '120253871045620781',
    total_leads: 17,
    qualified_leads: 11,
    closed_leads: 2,
    negative_leads: 3,
    pending_leads: 3,
    positive_rate: 64.7,
    total_revenue_vnd: 1_750_000_000,
    capi_sent_count: 12,
    pipeline: { Qualified: 6, Booked: 2, Booking: 1, Deposited: 1, Closed: 1, Notlead: 3, unrated: 3 },
    sales: [salesRoster[1], salesRoster[2], salesRoster[3]],
  };

  const bucketCamp2 = {
    entity_id: '120253902786060781',
    total_leads: 8,
    qualified_leads: 5,
    closed_leads: 1,
    negative_leads: 1,
    pending_leads: 2,
    positive_rate: 62.5,
    total_revenue_vnd: 1_250_000_000,
    capi_sent_count: 6,
    pipeline: { Qualified: 3, Booked: 1, Closed: 1, Notlead: 1, unrated: 2 },
    sales: [salesRoster[0], salesRoster[2]],
  };

  const bucketCamp3 = {
    entity_id: '120253829612420781',
    total_leads: 4,
    qualified_leads: 3,
    closed_leads: 0,
    negative_leads: 0,
    pending_leads: 1,
    positive_rate: 75.0,
    total_revenue_vnd: 0,
    capi_sent_count: 3,
    pipeline: { Qualified: 2, Booked: 1, unrated: 1 },
    sales: [salesRoster[0], salesRoster[1]],
  };

  return {
    crmAttribution: {
      summary: {
        total_leads: 104,
        attributed_leads: 98,
        qualified_leads: 66,
        closed_leads: 10,
        negative_leads: 15,
        total_revenue_vnd: 12_100_000_000,
        capi_sent_count: 73,
      },
      by_campaign: {
        '120253750847770781': bucketCamp1,
        '120253902786060781': bucketCamp2,
        '120253829612420781': bucketCamp3,
      },
      by_adset: {
        '120253871045590781': bucketAdset1,
        '120253871045610781': bucketAdset2,
        '120253871045620781': bucketAdset3,
      },
      by_ad: {
        '120253871045600781': bucketAd1,
      },
    },
    entityLeadsByEntityId: {
      '120253871045600781': ad1Leads,
      '120253871045590781': ad1Leads,
      '120253750847770781': ad1Leads,
    },
    quickConnectStatus: {
      has_meta_token: true,
      total_accounts: 2,
      active_accounts: 2,
      primary_ad_account_id: '302787476028580',
      primary_account_name: 'DOM - 8580 (EcoLife Signature)',
      has_capi_pixel: true,
      dom_meta_connected: false,
      can_auto_connect: true,
      accounts: [
        {
          id: 'acc_ecolife_1',
          ad_account_id: '302787476028580',
          name: 'DOM - 8580 (EcoLife Signature)',
          has_token: true,
          is_active: true,
          currency: 'VND',
          business_name: 'Capital House • EcoLife Signature',
        },
        {
          id: 'acc_ecolife_2',
          ad_account_id: '884192037412901',
          name: 'EcoLife Signature - Remarketing Miền Trung',
          has_token: true,
          is_active: true,
          currency: 'VND',
          business_name: 'Capital House • EcoLife Signature',
        },
      ],
    },
  };
}

function buildEcoLifePreviewDataset(thumbs) {
  const t0 = thumbs[0] || '/assets/partners/logo_ecolife_ngang.webp';
  const t1 = thumbs[1] || t0;
  const t2 = thumbs[2] || t0;
  const t3 = thumbs[3] || t0;
  const t4 = thumbs[4] || t0;
  const t5 = thumbs[5] || t0;

  const makeAd = ({
    id,
    name,
    adset_id,
    adset_name,
    campaign_id,
    campaign_name,
    thumb,
    spend,
    result,
    goal = 'QUALITY LEAD',
    reach,
    impressions,
    reaction,
  }) => {
    const isReach = goal === 'REACH';
    const cpr = result > 0 ? (isReach ? (spend / result) * 1000 : spend / result) : 0;
    const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
    const clicks = Math.round(impressions * 0.018);
    const video3s = Math.round(impressions * 0.24);
    const thruplay = Math.round(video3s * 0.31);
    return {
      id,
      name,
      adset_id,
      adset_name,
      campaign_id,
      campaign_name,
      status: 'ACTIVE',
      effective_status: 'ACTIVE',
      optimization_goal: goal,
      thumbnail_url: thumb,
      image_url: thumb,
      post_url: 'https://www.facebook.com',
      story_id: '',
      spend,
      impressions,
      reach,
      clicks,
      link_click: Math.round(clicks * 0.72),
      leads: isReach ? 0 : result,
      messages: isReach ? 0 : Math.round(result * 1.4),
      purchases: 0,
      purchase_value: 0,
      roas: 0,
      reaction,
      comments: Math.round(reaction * 0.25),
      shares: Math.round(reaction * 0.08),
      follows: 12,
      post_engagement: reaction * 5,
      video_play: Math.round(impressions * 0.42),
      video_3s: video3s,
      video_p25: Math.round(video3s * 0.65),
      video_p50: Math.round(video3s * 0.44),
      video_p75: Math.round(video3s * 0.33),
      video_p95: Math.round(video3s * 0.22),
      video_p100: Math.round(video3s * 0.18),
      thruplay,
      result,
      cpr,
      cpm,
      cpc: clicks > 0 ? spend / clicks : 0,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      frequency: reach > 0 ? impressions / reach : 0,
      hook_rate: impressions > 0 ? (video3s / impressions) * 100 : 0,
      hold_rate: video3s > 0 ? (thruplay / video3s) * 100 : 0,
      actions: isReach ? { post_reaction: reaction } : { lead: result, post_reaction: reaction },
    };
  };

  const ad1 = makeAd({
    id: '120253871045600781',
    name: 'Ad_Booking_Dau_Tu',
    adset_id: '120253871045590781',
    adset_name: '03_TA_Dau_Tu_DaNang_MienTrung',
    campaign_id: '120253750847770781',
    campaign_name: 'Lead_Booking_EcoLife_T11',
    thumb: t0,
    spend: 29_123_406,
    result: 46,
    reach: 84_275,
    impressions: 160_843,
    reaction: 112,
  });

  const ad2 = makeAd({
    id: '120253871045610799',
    name: 'Ad_Booking_Tep_Chung',
    adset_id: '120253871045610781',
    adset_name: '01_Tep_Chung_DaNang_MienTrung',
    campaign_id: '120253750847770781',
    campaign_name: 'Lead_Booking_EcoLife_T11',
    thumb: t1,
    spend: 21_059_449,
    result: 23,
    reach: 168_545,
    impressions: 315_796,
    reaction: 118,
  });

  const ad3 = makeAd({
    id: '120253871045620799',
    name: 'Ad_Booking_O_That',
    adset_id: '120253871045620781',
    adset_name: '02_TA_O_That_DaNang_MienTrung',
    campaign_id: '120253750847770781',
    campaign_name: 'Lead_Booking_EcoLife_T11',
    thumb: t2,
    spend: 15_069_944,
    result: 17,
    reach: 35_784,
    impressions: 81_136,
    reaction: 55,
  });

  const ad4 = makeAd({
    id: '120253902786060799',
    name: 'Ad_Carousel_Booking_EcoLife',
    adset_id: '120253902786060790',
    adset_name: '01_Carousel_Khach_Quan_Tam_2PN_3PN',
    campaign_id: '120253902786060781',
    campaign_name: 'Lead Form Chung - Carosel',
    thumb: t3,
    spend: 7_640_711,
    result: 8,
    reach: 36_743,
    impressions: 51_140,
    reaction: 14,
  });

  const ad5 = makeAd({
    id: '120253829612420799',
    name: 'Ad_Video_Kien_Truc_Xanh',
    adset_id: '120253829612420790',
    adset_name: 'Awareness_Kien_Truc_EcoLife',
    campaign_id: '120253829612420781',
    campaign_name: '[T11 - AWARENESS] EcoLife Signature - Video Kiến Trúc',
    thumb: t4,
    spend: 1_030_577,
    result: 138_804,
    goal: 'REACH',
    reach: 138_804,
    impressions: 155_990,
    reaction: 50,
  });

  const ad6 = makeAd({
    id: '120253818555340799',
    name: 'Ad_Sanh_Don_5_Sao',
    adset_id: '120253818555340790',
    adset_name: 'Awareness_Tien_Ich_5_Sao',
    campaign_id: '120253818555340781',
    campaign_name: '[T11 - AWARENESS] EcoLife Signature - Nâng Tầm Chuẩn Sống',
    thumb: t5,
    spend: 1_019_457,
    result: 138_540,
    goal: 'REACH',
    reach: 138_540,
    impressions: 153_980,
    reaction: 31,
  });

  const wrapAdset = (id, name, campaign_id, campaign_name, ad) => ({
    ...ad,
    id,
    name,
    campaign_id,
    campaign_name,
    daily_budget: 4_500_000,
    lifetime_budget: 0,
    targeting: { age_min: 25, age_max: 54 },
    ads: [ad],
  });

  const adset1 = wrapAdset(
    '120253871045590781',
    '03_TA_Dau_Tu_DaNang_MienTrung',
    '120253750847770781',
    'Lead_Booking_EcoLife_T11',
    ad1
  );
  const adset2 = wrapAdset(
    '120253871045610781',
    '01_Tep_Chung_DaNang_MienTrung',
    '120253750847770781',
    'Lead_Booking_EcoLife_T11',
    ad2
  );
  const adset3 = wrapAdset(
    '120253871045620781',
    '02_TA_O_That_DaNang_MienTrung',
    '120253750847770781',
    'Lead_Booking_EcoLife_T11',
    ad3
  );

  const camp1 = {
    ...ad1,
    id: '120253750847770781',
    name: 'Lead_Booking_EcoLife_T11',
    objective: 'OUTCOME_LEADS',
    optimization_goal: 'QUALITY LEAD',
    spend: 65_252_799,
    impressions: 557_775,
    reach: 260_385,
    clicks: 9_840,
    link_click: 7_120,
    leads: 86,
    messages: 118,
    reaction: 285,
    result: 86,
    cpr: 65_252_799 / 86,
    cpm: (65_252_799 / 557_775) * 1000,
    frequency: 2.14,
    adsets: [adset1, adset2, adset3],
  };

  const camp2 = {
    ...ad4,
    id: '120253902786060781',
    name: 'Lead Form Chung - Carosel',
    objective: 'OUTCOME_LEADS',
    optimization_goal: 'QUALITY LEAD',
    adsets: [
      wrapAdset(
        '120253902786060790',
        '01_Carousel_Khach_Quan_Tam_2PN_3PN',
        '120253902786060781',
        'Lead Form Chung - Carosel',
        ad4
      ),
    ],
  };

  const camp3 = {
    ...ad5,
    id: '120253829612420781',
    name: '[T11 - AWARENESS] EcoLife Signature - Video Kiến Trúc',
    objective: 'OUTCOME_AWARENESS',
    optimization_goal: 'REACH',
    adsets: [
      wrapAdset(
        '120253829612420790',
        'Awareness_Kien_Truc_EcoLife',
        '120253829612420781',
        '[T11 - AWARENESS] EcoLife Signature - Video Kiến Trúc',
        ad5
      ),
    ],
  };

  const camp4 = {
    ...ad6,
    id: '120253818555340781',
    name: '[T11 - AWARENESS] EcoLife Signature - Nâng Tầm Chuẩn Sống',
    objective: 'OUTCOME_AWARENESS',
    optimization_goal: 'REACH',
    adsets: [
      wrapAdset(
        '120253818555340790',
        'Awareness_Tien_Ich_5_Sao',
        '120253818555340781',
        '[T11 - AWARENESS] EcoLife Signature - Nâng Tầm Chuẩn Sống',
        ad6
      ),
    ],
  };

  const dailyDates = [
    ['2026-11-13', 9_850_000, 12],
    ['2026-11-14', 10_420_000, 14],
    ['2026-11-15', 11_680_000, 16],
    ['2026-11-16', 11_120_000, 15],
    ['2026-11-17', 10_390_000, 13],
    ['2026-11-18', 10_960_000, 14],
    ['2026-11-19', 10_523_544, 14],
  ];

  return {
    dateRange: {
      since: '2026-11-13',
      until: '2026-11-19',
      prevSince: '2026-11-06',
      prevUntil: '2026-11-12',
    },
    currentTotals: {
      spend: 74_943_544,
      impressions: 918_885,
      reach: 482_110,
      clicks: 14_820,
      link_click: 10_940,
      leads: 94,
      messages: 132,
      purchases: 0,
      purchase_value: 0,
      roas: 0,
      video_play: 312_000,
      video_3s: 196_400,
      thruplay: 58_900,
      post_engagement: 1_940,
      reaction: 380,
      comments: 94,
      follows: 68,
      cpm: 81_559,
      cpc: 5_057,
      ctr: 1.61,
      frequency: 1.91,
      hook_rate: 21.4,
      hold_rate: 30.0,
    },
    prevTotals: {
      spend: 66_410_000,
      impressions: 824_100,
      reach: 438_900,
      clicks: 12_910,
      leads: 79,
      messages: 112,
      purchases: 0,
      follows: 54,
      cpm: 80_584,
    },
    counts: {
      activeCampaigns: 4,
      totalCampaigns: 4,
      activeAdsets: 6,
      totalAdsets: 6,
      activeAds: 6,
      totalAds: 6,
    },
    daily: dailyDates.map(([date, spend, leads]) => ({
      date,
      spend,
      impressions: Math.round((spend / 81_559) * 1000),
      reach: Math.round((spend / 81_559) * 520),
      clicks: Math.round(leads * 145),
      leads,
      messages: Math.round(leads * 1.35),
      follows: 9,
      cpm: 81_559,
    })),
    campaigns: [camp1, camp2, camp3, camp4],
    platforms: [
      { platform: 'facebook', spend: 59_205_400, impressions: 720_000, reach: 380_000, result: 78 },
      { platform: 'instagram', spend: 15_738_144, impressions: 198_885, reach: 102_110, result: 16 },
    ],
    positions: [
      {
        platform: 'facebook',
        position: 'feed',
        label: 'Facebook Feed',
        spend: 44_100_000,
        impressions: 510_000,
        clicks: 9_100,
        result: 61,
      },
      {
        platform: 'facebook',
        position: 'video_feeds',
        label: 'Facebook Reels & Video',
        spend: 15_105_400,
        impressions: 210_000,
        clicks: 3_200,
        result: 17,
      },
      {
        platform: 'instagram',
        position: 'stream',
        label: 'Instagram Feed & Reels',
        spend: 15_738_144,
        impressions: 198_885,
        clicks: 2_520,
        result: 16,
      },
    ],
    ageGender: [
      { age: '25-34', maleSpend: 11_200_000, femaleSpend: 10_400_000, unknownSpend: 0, totalSpend: 21_600_000, maleResult: 14, femaleResult: 13 },
      { age: '35-44', maleSpend: 18_400_000, femaleSpend: 16_900_000, unknownSpend: 0, totalSpend: 35_300_000, maleResult: 24, femaleResult: 21 },
      { age: '45-54', maleSpend: 9_600_000, femaleSpend: 8_443_544, unknownSpend: 0, totalSpend: 18_043_544, maleResult: 12, femaleResult: 10 },
    ],
    regions: [
      { region: 'Đà Nẵng', spend: 31_400_000, impressions: 380_000, reach: 195_000, result: 42 },
      { region: 'Hà Nội', spend: 22_800_000, impressions: 275_000, reach: 144_000, result: 29 },
      { region: 'TP. Hồ Chí Minh', spend: 13_900_000, impressions: 178_000, reach: 96_000, result: 15 },
      { region: 'Quảng Nam', spend: 6_843_544, impressions: 85_885, reach: 47_110, result: 8 },
    ],
    devices: [
      { device: 'mobile_app', spend: 68_200_000, impressions: 840_000, clicks: 13_600 },
      { device: 'desktop', spend: 6_743_544, impressions: 78_885, clicks: 1_220 },
    ],
    heatmap: [],
    accountOverview: {
      account_id: META_ACCOUNT_ID,
      name: 'DOM - 8580',
      currency: 'VND',
      balance: 18_450_000,
      amount_spent: 642_800_000,
      funding_source: 'Visa Business •••• 8580',
      account_status: 1,
    },
    monthlyByYear: [],
    activities: [],
  };
}

async function extractCreativeThumbsFromLibraryShot(browser) {
  const libPath = path.join(OUT_DIR, 'meta-ads-library.webp');
  if (!fs.existsSync(libPath)) return [];
  const p = await browser.newPage();
  try {
    await p.goto(`${BASE_URL}/imgs/meta-screens/meta-ads-library.webp`, {
      waitUntil: 'networkidle2',
      timeout: 20000,
    });
    const thumbs = await p.evaluate(() => {
      const img = document.querySelector('img');
      if (!img || !img.naturalWidth) return [];
      const boxes = [
        [635, 430, 390, 320],
        [1235, 430, 390, 320],
        [1835, 430, 390, 320],
        [2435, 430, 390, 320],
        [1235, 1235, 390, 320],
        [2435, 1235, 390, 320],
      ];
      return boxes.map(([sx, sy, sw, sh]) => {
        const c = document.createElement('canvas');
        c.width = 240;
        c.height = 240;
        const ctx = c.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 240, 240);
        }
        return c.toDataURL('image/webp', 0.9);
      });
    });
    return Array.isArray(thumbs) ? thumbs : [];
  } catch {
    return [];
  } finally {
    await p.close().catch(() => {});
  }
}

async function captureCoreLiveScreens(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1480, height: 920, deviceScaleFactor: 2 });

  await page.evaluateOnNewDocument(
    (cfg) => {
      window.__DOM_META_PREVIEW__ = {
        authContext: {
          tenantSlug: 'ecolifesignature',
          directMetaToken: cfg.metaToken,
          directAdAccountId: cfg.metaAccountId,
          directGoogleAds: {
            enabled: false,
            customer_id: cfg.gadsCustomerId,
            apps_script_url: cfg.gadsScriptUrl,
            developer_token: cfg.gadsDevToken,
          },
        },
        workspaceName: 'EcoLife Signature',
        userDisplayName: 'Signature',
        userRoleLabel: 'admin',
        initialView: 'dashboard',
      };
    },
    {
      metaToken: META_TOKEN,
      metaAccountId: META_ACCOUNT_ID,
      gadsCustomerId: GADS_CUSTOMER_ID,
      gadsScriptUrl: GADS_SCRIPT_URL,
      gadsDevToken: GADS_DEV_TOKEN,
    }
  );

  const capture = async (name) => {
    const file = path.join(OUT_DIR, `${name}.webp`);
    await page.screenshot({ path: file, type: 'webp', quality: 88 });
    const kb = Math.round(fs.statSync(file).size / 1024);
    console.log(`Captured ${name}.webp (${kb} KB)`);
  };

  const waitVisibleImages = async (limit = 16) => {
    await page.evaluate(async (maxImgs) => {
      await document.fonts.ready;
      const imgs = [...document.querySelectorAll('img')].slice(0, maxImgs);
      await Promise.all(
        imgs.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((resolve) => {
                img.addEventListener('load', resolve, { once: true });
                img.addEventListener('error', resolve, { once: true });
                setTimeout(resolve, 4500);
              })
        )
      );
    }, limit);
  };

  try {
    console.log('Opening /meta-report/ecolifesignature for live Meta screens...');
    await page.goto(`${BASE_URL}/meta-report/ecolifesignature`, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    await page.waitForSelector('[data-testid="open-perf-compare"]', { timeout: 45000 });
    await waitVisibleImages(24);
    await sleep(1500);

    await capture('meta-dashboard');

    await page.click('[data-testid="open-perf-compare"]');
    await sleep(700);
    await capture('meta-performance-compare-modal');
    await page.evaluate(() => {
      const dlg = document.querySelector('[role="dialog"]');
      if (dlg) dlg.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await sleep(500);

    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) =>
        (b.textContent || '').includes('Mở rộng Extra Details')
      );
      if (btn) btn.click();
    });
    await sleep(600);
    await page.evaluate(() => window.scrollTo({ top: 520, behavior: 'instant' }));
    await sleep(600);
    await capture('meta-heatmap-region');
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await sleep(300);

    await page.click('[data-testid="nav-ad_detail"]');
    await sleep(700);
    await page.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr td:nth-child(2) button');
      if (rows[0]) rows[0].click();
    });
    await sleep(450);
    await page.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr td:nth-child(2) button');
      if (rows[1]) rows[1].click();
    });
    await waitVisibleImages(32);
    await sleep(500);
    await capture('meta-campaigns');

    await page.evaluate(() => {
      const adsetBtn = [...document.querySelectorAll('button')].find(
        (b) => (b.textContent || '').trim() === 'Adset'
      );
      const insightBtn = [...document.querySelectorAll('button')].find(
        (b) => (b.textContent || '').trim() === 'Insight'
      );
      const target = adsetBtn || insightBtn;
      if (target) target.click();
    });
    await waitVisibleImages(16);
    await sleep(800);
    await capture('meta-ad-detail-modal');
    await page.evaluate(() => {
      const dlg = document.querySelector('[role="dialog"]');
      if (dlg) dlg.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await sleep(500);

    await page.click('[data-testid="nav-ad_library"]');
    await sleep(900);
    await waitVisibleImages(12);
    await sleep(400);
    await capture('meta-ads-library');

    await page.click('[data-testid="nav-account"]');
    await sleep(1000);
    await capture('meta-ad-account-logs');

    await page.click('[data-testid="open-google-ads-settings"]');
    await sleep(600);
    await page.click('[data-testid="google-ads-toggle"]');
    await sleep(700);
    await capture('meta-google-ads-guide-modal');

    if (GADS_SCRIPT_URL) {
      await page.evaluate(() => {
        const saveBtn = [...document.querySelectorAll('[role="dialog"] button')].find((b) =>
          (b.textContent || '').toLowerCase().includes('lưu cấu hình')
        );
        if (saveBtn) saveBtn.click();
      });
      await sleep(900);
      const hasGadsNav = await page.$('[data-testid="nav-google_ads"]');
      if (hasGadsNav) {
        await page.click('[data-testid="nav-google_ads"]');
        await sleep(3200);
        await capture('meta-google-ads-dashboard');
      }
    }
  } finally {
    await page.close().catch(() => {});
  }
}

async function captureFusionScreens(browser) {
  const thumbs = await extractCreativeThumbsFromLibraryShot(browser);
  const previewDataset = META_TOKEN ? undefined : buildEcoLifePreviewDataset(thumbs);
  const { crmAttribution, entityLeadsByEntityId, quickConnectStatus } =
    buildEcoLifeCrmAttributionFixture();

  const captureOnPage = async (p, name) => {
    const file = path.join(OUT_DIR, `${name}.webp`);
    await p.screenshot({ path: file, type: 'webp', quality: 88 });
    const kb = Math.round(fs.statSync(file).size / 1024);
    console.log(`Captured ${name}.webp (${kb} KB)`);
  };

  // =========================================================================
  // FUSION 1 & 2: Campaign -> Adset -> Ad table with CRM Leads/CPQL/Revenue/Sale
  //               + AdEntityDetailModal open on "Lead & Phân bổ Sale" tab
  // =========================================================================
  const page1 = await browser.newPage();
  await page1.setViewport({ width: 1580, height: 960, deviceScaleFactor: 2 });
  await page1.evaluateOnNewDocument(
    (payload) => {
      window.__DOM_META_PREVIEW__ = {
        authContext: {
          tenantSlug: 'ecolifesignature',
          directMetaToken: payload.metaToken || undefined,
          directAdAccountId: payload.metaAccountId,
          previewDataset: payload.previewDataset,
          previewCrmAttribution: payload.crmAttribution,
          previewEntityLeadsByEntityId: payload.entityLeadsByEntityId,
          previewQuickConnectStatus: payload.quickConnectStatus,
          previewActiveColumns: ['status', 'spend', 'result', 'cpr'],
          directGoogleAds: {
            enabled: false,
            customer_id: '',
            apps_script_url: '',
          },
        },
        workspaceName: 'EcoLife Signature',
        userDisplayName: 'Signature',
        userRoleLabel: 'admin',
        enableCrmAttribution: true,
        erpMode: true,
        initialView: 'ad_detail',
        initialCustomRange: { since: '2026-11-13', until: '2026-11-19' },
      };
    },
    {
      metaToken: META_TOKEN,
      metaAccountId: META_ACCOUNT_ID,
      previewDataset,
      crmAttribution,
      entityLeadsByEntityId,
      quickConnectStatus,
    }
  );

  try {
    console.log('Opening /meta-report/ecolifesignature for Fusion Campaign & Sale Modal captures...');
    await page1.goto(`${BASE_URL}/meta-report/ecolifesignature`, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });
    await page1.waitForSelector('[data-testid="crm-attribution-summary-strip"]', {
      timeout: 30000,
    });
    await sleep(600);

    // Expand Campaign 1 -> Adset 1 so Campaign, Adsets & Ad rows are all visible with CRM columns
    await page1.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr');
      if (rows[0]) rows[0].click();
    });
    await sleep(500);
    await page1.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr');
      if (rows[1]) rows[1].click();
    });
    await sleep(700);

    await captureOnPage(page1, 'fusion-campaign-crm-leads');

    // Open Ad Lead & Phân bổ Sale modal by clicking first CRM lead badge (prefer Ad_Booking_Dau_Tu)
    await page1.evaluate(() => {
      const target =
        document.querySelector('[data-testid="open-crm-leads-120253871045600781"]') ||
        document.querySelector('[data-testid^="open-crm-leads-"]');
      if (target) target.click();
    });
    await page1.waitForSelector('[data-testid="entity-modal-crm-tab"]', { timeout: 15000 });
    await sleep(850);

    await captureOnPage(page1, 'fusion-ad-leads-sale-modal');
  } finally {
    await page1.close().catch(() => {});
  }

  // =========================================================================
  // FUSION 3: Unified Advertising Hub inside CRM Auto Data + 1-Click Quick-Connect
  // =========================================================================
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 1480, height: 920, deviceScaleFactor: 2 });
  await page2.evaluateOnNewDocument(
    (payload) => {
      window.__DOM_META_PREVIEW__ = {
        authContext: {
          tenantSlug: 'ecolifesignature',
          directMetaToken: payload.metaToken || undefined,
          directAdAccountId: payload.metaAccountId,
          previewDataset: payload.previewDataset,
          previewCrmAttribution: payload.crmAttribution,
          previewEntityLeadsByEntityId: payload.entityLeadsByEntityId,
          previewQuickConnectStatus: payload.quickConnectStatus,
          previewActiveColumns: ['status', 'spend', 'result', 'cpr'],
          directGoogleAds: {
            enabled: false,
            customer_id: '',
            apps_script_url: '',
          },
        },
        workspaceName: 'EcoLife Signature',
        userDisplayName: 'Signature',
        userRoleLabel: 'admin',
        mode: 'embedded',
        crmShellPreview: true,
        showCapiTab: true,
        enableCrmAttribution: true,
        defaultQuickConnectOpen: true,
        initialView: 'dashboard',
        initialCustomRange: { since: '2026-11-13', until: '2026-11-19' },
      };
    },
    {
      metaToken: META_TOKEN,
      metaAccountId: META_ACCOUNT_ID,
      previewDataset,
      crmAttribution,
      entityLeadsByEntityId,
      quickConnectStatus,
    }
  );

  try {
    console.log('Opening /meta-report/ecolifesignature for CRM Quick-Connect Unified Hub capture...');
    await page2.goto(`${BASE_URL}/meta-report/ecolifesignature`, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });
    await page2.waitForSelector('[data-testid="dom-meta-quick-connect-modal"]', {
      timeout: 30000,
    });
    await page2.waitForSelector('[data-testid="quick-connect-auto-reuse-banner"]', {
      timeout: 15000,
    });
    await sleep(900);

    await captureOnPage(page2, 'fusion-quick-connect-crm');
  } finally {
    await page2.close().catch(() => {});
  }
}

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: fs.existsSync(CHROME_PATH) ? CHROME_PATH : undefined,
    headless: 'new',
    args: ['--no-sandbox', '--force-color-profile=srgb', '--hide-scrollbars'],
  });
  try {
    if (!FUSION_ONLY && META_TOKEN) {
      await captureCoreLiveScreens(browser);
    }
    await captureFusionScreens(browser);
    console.log('Screenshot capture completed successfully!');
  } finally {
    await browser.close().catch(() => {});
  }
}

run().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
