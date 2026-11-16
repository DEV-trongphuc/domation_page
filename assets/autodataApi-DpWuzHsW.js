var e=`domation_autodata_session_v2`,t=`domation_cookie_consent_v1`;function n(e,t){let n=e&&e.trim().length>0?e.trim():`https://domation.net/api/autodata?action=webhook-test&slug=ten-cong-ty&token=whsec_xxx`,r=t&&t.trim().length>0?t.trim():`sale01@doanhnghiep.vn`;return`/**
 * DOMATION Auto Data — Google Apps Script Đồng Bộ 2 Chiều (Auto Data <-> Google Sheet Riêng Từng Sale)
 * Hướng dẫn: Mở Google Sheet -> Tiện ích mở rộng -> Apps Script -> Dán mã -> Triển khai Web App (doPost) & Cài Trigger onEdit / onFormSubmit
 */
const DOMATION_WEBHOOK_URL = ${JSON.stringify(n)};
const SALE_OWNER_EMAIL = ${JSON.stringify(r)};

// Chiều 1 (Auto Data -> Sheet riêng của Sale): Nhận Lead mới từ Auto Data và tự động ghi/cập nhật dòng trên Google Sheet
function doPost(e) {
  const body = e && e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  sheet.appendRow([
    new Date(),
    body.name || 'Khách hàng mới',
    String(body.phone || '').trim(),
    body.utm_source || 'autodata_router',
    body.product_interest || 'Tư vấn trực tiếp',
    body.sale_status || 'Mới phân bổ',
    body.note || ''
  ]);
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}

// Chiều 2A (Google Form / Sheet -> Auto Data): Tự động bắn dòng Lead mới vào Auto Data Router (< 4s)
function onFormSubmit(e) {
  const row = e && e.values ? e.values : [];
  const payload = {
    name: row[1] || 'Khách hàng Google Sheet',
    phone: String(row[2] || '').trim(),
    utm_source: row[3] || 'google_sheets',
    product_interest: row[4] || 'Tư vấn trực tiếp',
    sale_owner_email: SALE_OWNER_EMAIL
  };
  UrlFetchApp.fetch(DOMATION_WEBHOOK_URL, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}

// Chiều 2B (Sheet riêng của Sale -> Auto Data): Khi Sale sửa Trạng thái (Cột F) hoặc Ghi chú (Cột G) -> Đồng bộ ngược & kích hoạt Meta CAPI
function onEdit(e) {
  if (!e || !e.range) return;
  const col = e.range.getColumn();
  if (col !== 6 && col !== 7) return; // Chỉ đồng bộ khi sửa cột Trạng thái hoặc Ghi chú
  const sheet = e.range.getSheet();
  const r = e.range.getRow();
  if (r <= 1) return;
  const syncPayload = {
    sync_direction: 'sheet_to_autodata',
    phone: String(sheet.getRange(r, 3).getValue() || '').trim(),
    sale_status: String(sheet.getRange(r, 6).getValue() || '').trim(),
    sale_note: String(sheet.getRange(r, 7).getValue() || '').trim(),
    sale_owner_email: SALE_OWNER_EMAIL
  };
  UrlFetchApp.fetch(DOMATION_WEBHOOK_URL, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(syncPayload),
    muteHttpExceptions: true
  });
}`}function r(e,t=!1){let n=String(e??``);if(t){let e=n.trim();return/^\+84\d+/.test(e.replace(/\s+/g,``))?`0${e.replace(/\s+/g,``).slice(3)}`:/^[=+\-@]/.test(e)?`'${e}`:e}return/^[=+\-@\t\r]/.test(n)?`'${n}`:n}function i(e){let t=[`Mã Lead`,`Họ tên khách hàng`,`Số điện thoại`,`Sale sở hữu`,`Nhu cầu quan tâm`,`Ghi chú cá nhân`,`Chế độ định tuyến`,`Đồng bộ Google Sheets`,`Thời gian tạo`],n=(e,t=!1)=>`"${r(e,t).replace(/"/g,`""`)}"`,i=e.map(e=>[e.id,e.name,e.phone,e.sale_owner_name,e.product_interest,e.note,`Cá nhân (Bỏ qua Vòng Chia • Sở hữu riêng)`,e.sheet_sync_status,new Date(e.created_at).toLocaleString(`vi-VN`)]);return`\uFEFF${[t.map(e=>n(e,!1)).join(`,`),...i.map(e=>e.map((e,t)=>n(e,t===2)).join(`,`))].join(`\r
`)}`}function a(e,t){let n=[],r=``,i=!1;for(let a=0;a<e.length;a+=1){let o=e[a];o===`"`?i&&e[a+1]===`"`?(r+=`"`,a+=1):i=!i:o===t&&!i?(n.push(r.trim().replace(/^'+/,``)),r=``):r+=o}return n.push(r.trim().replace(/^'+/,``)),n}function o(e,t=`Chuyên viên Sale Nội Bộ #01`){let n=e.replace(/^\uFEFF/,``).trim();if(!n)return[];let r=n.split(/\r?\n/).map(e=>e.trim()).filter(e=>e.length>0);if(r.length===0)return[];let i=r[0],o=i.includes(`	`)&&!i.includes(`,`)?`	`:i.split(`;`).length>i.split(`,`).length?`;`:`,`,s=r.map(e=>a(e,o)),c=s[0].map(e=>e.toLowerCase()),l=c.some(e=>e.includes(`họ tên`)||e.includes(`số điện thoại`)||e.includes(`mã lead`)||e===`name`||e===`phone`||e===`sdt`),u=l?s.slice(1):s,d=l&&(c[0]?.includes(`mã lead`)||c[0]===`id`)&&s[0].length>=5,f=[];for(let e of u){if(e.length<2)continue;let n=d?e[1]||``:e[0]||``,r=d?e[2]||``:e[1]||``,i=d?e[3]||t:e[4]||t,a=d?e[4]||`Khách hàng Import CSV cá nhân`:e[2]||`Khách hàng Import CSV cá nhân`,o=d?e[5]||`Import từ file CSV vào Cổng Sale Cá Nhân`:e[3]||`Import từ file CSV vào Cổng Sale Cá Nhân`;n.trim()&&r.replace(/\D/g,``).length>=9&&f.push({name:n.trim(),phone:r.trim(),sale_owner_name:i.trim()||t,product_interest:a.trim(),note:o.trim()})}return f}var s={currency:`VND`,trial_duration_months:1,trial_duration_days:30,trial_warning_days:14,base_monthly_price_vnd:15e5,annual_discount_pct:15,min_topup_vnd:1e5,post_trial_policy:`step_renewal_or_upgrade`,automation_upgrade_url:`/automation`,crm_upgrade_url:`/crm`,erp_upgrade_url:`/erp`,payment_bank_info:{bank_name:`Techcombank (TCB)`,account_number:`19038889996868`,account_holder:`CONG TY TNHH DOM MARKETING`,transfer_prefix:`DOMDATA`},plans:[{code:`autodata_standard`,step_order:1,name:`Auto Data Standard`,tagline:`Gói tiêu chuẩn cho đội Sale nội bộ — Mặc định sau 1 tháng 0đ.`,badge:`Mặc Định • Phổ Biến Nhất`,plan_tier:`starter`,monthly_price_vnd:15e5,annual_discount_pct:15,annual_total_vnd:153e5,annual_monthly_equivalent_vnd:1275e3,annual_saved_vnd:27e5,max_sales:5,max_managers:3,max_users:8,max_rounds:5,monthly_lead_quota:15e3,is_enterprise_upgrade:!1,features:[`Chia số trực tiếp về Sale tức thì (1:1 hoặc năng lực)`,`Cổng Sale riêng: tự nhập khách, xuất CSV & bật/tắt ca trực`,`Báo khách qua ZaloBot & đồng bộ Google Sheets, API 2 chiều`,`Phản hồi tín hiệu chất lượng về Meta Ads (CAPI)`]},{code:`autodata_growth`,step_order:2,name:`Auto Data Pro`,tagline:`Mở rộng đa đội Sale, chi nhánh & tối ưu quảng cáo chuyên sâu.`,badge:`Đội Sale Mở Rộng`,plan_tier:`growth`,monthly_price_vnd:3e6,annual_discount_pct:15,annual_total_vnd:306e5,annual_monthly_equivalent_vnd:255e4,annual_saved_vnd:54e5,max_sales:25,max_managers:10,max_users:35,max_rounds:30,monthly_lead_quota:1e5,is_enterprise_upgrade:!1,features:[`Toàn bộ gói Standard + đa phễu độc lập theo từng sản phẩm`,`Chia số theo chiến dịch, khu vực & khung giờ trực ca`,`Tối ưu Ads đa kênh + Google Sheets & REST API không giới hạn`,`Đền bù 1-đổi-1 khi duyệt số rác & báo cáo hiệu suất Lãnh Đạo`]},{code:`domation_crm_erp`,step_order:3,name:`Automation • CRM 360° • ERP 5.0`,tagline:`Mở rộng liền mạch lên Automation, CRM 360° & ERP 5.0.`,badge:`Hệ Sinh Thái Toàn Diện`,plan_tier:`enterprise`,monthly_price_vnd:6e6,annual_discount_pct:15,annual_total_vnd:612e5,annual_monthly_equivalent_vnd:51e5,annual_saved_vnd:108e5,max_users:9999,max_rounds:999,monthly_lead_quota:1e6,is_enterprise_upgrade:!0,features:[`Giữ nguyên 100% Lead, lịch sử Timeline & đội ngũ hiện có`,`Automation: Flow rẽ nhánh IF/ELSE, Email kéo thả, Zalo ZNS & AI 24/7`,`CRM 360°: Kanban 8 nấc, Báo giá, Hợp đồng & Hóa đơn điện tử`,`ERP 5.0: 12 phân hệ HRM GPS AI, Lương KPI, Tài chính & Kho vận`]}],topup_packages:[{id:`topup_1m`,label:`Gói Topup 1 Tháng`,amount_vnd:15e5,bonus_vnd:0,equivalent_months_note:`Đủ gia hạn ngay 1 tháng gói Auto Data Standard`,highlight:!1},{id:`topup_3m`,label:`Gói Topup 3 Tháng`,amount_vnd:45e5,bonus_vnd:0,equivalent_months_note:`Đủ gia hạn 1 quý (3 tháng) liên tục`,highlight:!1},{id:`topup_6m`,label:`Gói Topup 6 Tháng (+5% Bonus)`,amount_vnd:9e6,bonus_vnd:45e4,equivalent_months_note:`Tặng thêm 450.000₫ vào ví gia hạn`,highlight:!1},{id:`topup_12m`,label:`Gói Topup Năm (Tiết kiệm 15%)`,amount_vnd:153e5,bonus_vnd:0,equivalent_months_note:`Đủ mua gói Năm (-15%), chỉ 1.275.000₫/tháng`,highlight:!0}]},c=class extends Error{status;code;constructor(e,t,n){super(n),this.status=e,this.code=t}};function l(){if(!(typeof window>`u`))try{localStorage.removeItem(`domation_autodata_session_v1`),localStorage.removeItem(`domation_global_date`)}catch{}}function u(t){if(!(typeof window>`u`)){l();try{localStorage.setItem(e,JSON.stringify(t))}catch{}}}function d(){if(!(typeof window>`u`))try{localStorage.removeItem(e)}catch{}}function f(e,t){return e instanceof Error&&e.message?e.message:typeof e==`string`&&e?e:t}async function p(e,t){let n={};t?.token&&(n.Authorization=`Bearer ${t.token}`),t?.tenantSlug&&(n[`X-Tenant-Slug`]=t.tenantSlug),t?.body!==void 0&&(n[`Content-Type`]=`application/json`);let r=e.startsWith(`/api/`)?e:`/api/v1${e.startsWith(`/`)?e:`/${e}`}`,i=await fetch(r,{method:t?.method||`GET`,headers:n,body:t?.body===void 0?void 0:JSON.stringify(t.body)});if(t?.isCsv){if(!i.ok)throw new c(i.status,`EXPORT_FAILED`,`Không thể xuất CSV (${i.status})`);return await i.text()}let a=await i.json().catch(()=>null);if(!i.ok||a&&a.success===!1){let e=a?.error?.code||`API_ERROR`,t=a?.error?.message||`Yêu cầu thất bại (HTTP ${i.status})`;throw new c(i.status,e,t)}return a&&`data`in a?a.data:a}function m(e){return`${Math.round(Number(e||0)).toLocaleString(`vi-VN`)}₫`}function h(e){if(!e)return`—`;let t=new Date(e);return Number.isNaN(t.getTime())?String(e):t.toLocaleString(`vi-VN`,{day:`2-digit`,month:`2-digit`,hour:`2-digit`,minute:`2-digit`})}export{m as a,u as c,e as d,n as f,h as i,t as l,o as m,p as n,f as o,i as p,d as r,l as s,c as t,s as u};