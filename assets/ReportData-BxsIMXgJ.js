import{l as e,n as t,r as n}from"./createLucideIcon-BHTqy3qS.js";import{t as r}from"./arrow-left-Ds1oNicJ.js";import{t as i}from"./calendar-zqfdPu0D.js";import{t as a}from"./check-DNNkWEks.js";import{t as o}from"./chevron-down-HjwK6qFR.js";import{t as ee}from"./chevron-up-D9MSDBxo.js";import{t as s}from"./circle-alert-BuhK2B8N.js";import{t as c}from"./circle-check-big-CyroxlrL.js";import{t as te}from"./circle-x-Cgvg6jmg.js";import{t as l}from"./copy-DygL54Kc.js";import{t as u}from"./file-text-CcC-VKLM.js";import{t as ne}from"./layers-DavyoQJH.js";import{t as d}from"./loader-circle-FoLYeArg.js";import{t as f}from"./lock-Bub2MpUP.js";import{n as p,t as m}from"./LuxuryBackgroundDecor-CSb5M6vX.js";import{t as h}from"./mail-hkCb7a10.js";import{t as g}from"./phone-i4umuPuu.js";import{t as _}from"./send-ByrxFCrH.js";import{t as v}from"./shield-Cv4erjdb.js";import{t as y}from"./sparkles-mkpfPdaR.js";import{t as re}from"./triangle-alert-jFzGYx3E.js";import{t as ie}from"./user-BLPbsxAM.js";import{C as ae,S as oe,i as b,n as x}from"./LanguageContext-DMHNcX-H.js";import{n as S}from"./AuthContext-DScjtmZ7.js";var C=e(n(),1),w=t(),T=`/imgs/autodata/domation_ai_icon.svg`,E=`/imgs/autodata/domation_ai_icon.svg`,D=[{reason:`Số sai định dạng`,note:`Số điện thoại sai định dạng, thiếu số hoặc thừa số (không đúng chuẩn số điện thoại).`},{reason:`Sai nhu cầu dự án`,note:`Khách hàng không quan tâm hoặc nhầm lẫn dự án DOMATION AutoData.`},{reason:`Trùng lặp với Data cũ`,note:`Data đã có trong hệ thống và đang được xử lý trong vòng {n} tháng.`},{reason:`Lý do khác`,note:`Vui lòng cung cấp chi tiết giải trình ở phần ghi chú bên dưới.`}],O={lead_id:999,sale_id:1,round_id:1,lead_name:`Trần Thị Mai Anh`,lead_phone:`0912 345 678`,lead_email:`maianh.tran@gmail.com`,lead_source:`Facebook Ads — Chiến dịch DOMATION AutoData`,lead_type:`Căn hộ 2 Phòng Ngủ`,lead_note:`Quan tâm: Căn hộ 2PN tầng cao view biển
Ngân sách: 3.5 – 5 tỷ
Khung giờ gọi: 14:00 - 17:00 hàng ngày`,consultant_name:`Phúc (Đại lý Test)`,consultant_email:`turniodev@gmail.com`,round_name:`DOMATION AutoData - Meta Form Inbound`,assigned_at:new Date().toISOString(),existing_report:null,duplicate_check_months:6,is_allowed_to_report:!0},k=()=>{let{t:e}=x(),t=oe(),{user:n,token:k,logout:se}=S(),[,ce]=(0,C.useState)(()=>document.documentElement.getAttribute(`data-theme`)||`light`);(0,C.useEffect)(()=>{let e=()=>{ce(document.documentElement.getAttribute(`data-theme`)||`light`)};return window.addEventListener(`theme-change`,e),()=>window.removeEventListener(`theme-change`,e)},[]);let[j]=ae(),[M]=(0,C.useState)({leadId:j.get(`lead_id`)||``,saleId:j.get(`sale_id`)||``,roundId:j.get(`round_id`)??`0`,isTest:!1}),[le,N]=(0,C.useState)(D),[P,F]=(0,C.useState)(null),[I,L]=(0,C.useState)(!0),[R,z]=(0,C.useState)(``),[B,V]=(0,C.useState)(!1),[H,U]=(0,C.useState)(``),[W,ue]=(0,C.useState)(``),[G,K]=(0,C.useState)(!1),[q,J]=(0,C.useState)(`idle`),[de,Y]=(0,C.useState)(``),[fe,X]=(0,C.useState)(!1),[Z,pe]=(0,C.useState)(!1);(0,C.useEffect)(()=>{if(M.isTest){F(O),N(D),U(D[0].reason),L(!1);return}if(!k||!n){L(!1);return}let t=e=>e.trim().length>0;if(!t(M.leadId)||!t(M.saleId)||!(e=>e.trim().length>=0)(M.roundId)){z(e(`Đường dẫn không hợp lệ hoặc thiếu tham số. Vui lòng mở lại từ tin nhắn Zalo Bot hoặc Email.`)),L(!1);return}L(!0),b(`get_report_context&lead_id=${M.leadId}&sale_id=${M.saleId}&round_id=${M.roundId}`).then(t=>{if(t.success&&t.data){let r=t.data;F(r);let i=n?.role===`sale`,a=(n?.email||``).toLowerCase().trim(),o=(r?.consultant_email||``).toLowerCase().trim();if(i&&a!==o&&String(n?.consultant_id)!==String(r?.sale_id)){V(!0),z(e(`Data này được phân bổ độc quyền cho: ${r?.consultant_name||`-`} (${r?.consultant_email||`-`}). Tài khoản đang đăng nhập (${n?.email||`-`}) không có quyền báo cáo dữ liệu này.`));return}if(r.is_allowed_to_report===!1)z(e(`Tài khoản của bạn hiện không có quyền gửi báo cáo lỗi data.`));else{let e=r.report_error_reasons&&r.report_error_reasons.length>0?r.report_error_reasons:D;N(e),e.length>0&&U(e[0].reason)}}else t.forbidden&&V(!0),z(e(t.message)||e(`Không tìm thấy thông tin lượt phân bổ hoặc đường dẫn đã hết hiệu lực.`))}).catch(t=>z(e(t.message)||e(`Lỗi kết nối tới máy chủ. Vui lòng thử lại sau.`))).finally(()=>L(!1))},[M,k,n,e]);let me=e=>{e&&(navigator.clipboard.writeText(e),X(!0),setTimeout(()=>X(!1),2e3))},Q=H.toLowerCase().includes(`khác`)||H.toLowerCase().includes(`other`),he=async t=>{if(t.preventDefault(),M.isTest){Y(e(`Đây là chế độ xem thử nghiệm (Mock) — không gửi báo cáo thực tế.`)),J(`error`);return}if(G||q===`success`)return;K(!0),Y(``);let n=Q?`${H}: ${W.trim()}`:W.trim()?`${H} (Ghi chú: ${W.trim()})`:H,r={lead_id:P?.lead_id||Number(M.leadId),sale_id:P?.sale_id||Number(M.saleId),round_id:P?.round_id!==void 0&&P?.round_id!==null?Number(P.round_id):Number(M.roundId),reason:n};try{let t=await b(`submit_report`,{method:`POST`,body:JSON.stringify(r)});t.success?J(`success`):(J(`error`),Y(e(t.message)||e(`Không thể gửi báo cáo. Vui lòng liên hệ Admin.`)))}catch(t){J(`error`),Y(e(t.message)||e(`Lỗi kết nối mạng khi gửi báo cáo.`))}finally{K(!1)}},$=()=>(window.location.pathname.replace(/^\/data(?=\/|$)/,``)||`/report-data`)+window.location.search;return(0,w.jsxs)(`div`,{className:`report-page-root`,children:[(0,w.jsx)(m,{variant:`report`}),(0,w.jsx)(`div`,{className:`ambient-glow glow-1`}),(0,w.jsx)(`div`,{className:`ambient-glow glow-2`}),(0,w.jsx)(`div`,{className:`ambient-glow glow-3`}),(0,w.jsxs)(`div`,{className:`report-main-container`,children:[(0,w.jsxs)(`header`,{className:`report-header`,children:[(0,w.jsx)(`div`,{className:`brand-logo-container`,children:(0,w.jsx)(`img`,{src:T,alt:`DOMATION AutoData`,className:`brand-logo-full`})}),(0,w.jsxs)(`div`,{className:`header-badge-pill`,children:[(0,w.jsx)(`img`,{src:E,alt:``,style:{width:15,height:15,objectFit:`contain`}}),(0,w.jsx)(`span`,{className:`badge-pulse-dot`}),(0,w.jsxs)(`span`,{className:`badge-text`,children:[e(`BÁO CÁO DỮ LIỆU DƯỚI CHUẨN`),M.isTest?` [TEST]`:``]})]}),(0,w.jsx)(`h1`,{className:`header-title`,children:e(`Yêu Cầu Thẩm Định & Bù Data`)}),(0,w.jsx)(`p`,{className:`header-desc`,children:e(`Báo cáo thông tin data không đạt chuẩn để Quản trị viên xét duyệt phân bổ bù data mới`)}),n&&(0,w.jsxs)(`div`,{className:`logged-in-user-chip`,children:[(0,w.jsx)(`span`,{className:`user-dot-online`}),(0,w.jsxs)(`span`,{children:[e(`Đang đăng nhập:`),` `,(0,w.jsx)(`strong`,{children:n.email}),` (`,n.name||n.role,`)`]})]})]}),(0,w.jsx)(`div`,{className:`report-content-wrapper`,children:!M.isTest&&(!k||!n)?(0,w.jsxs)(`div`,{className:`state-card auth-required-card`,children:[(0,w.jsx)(`div`,{className:`state-icon-circle auth-circle`,children:(0,w.jsx)(f,{size:36,className:`state-icon`})}),(0,w.jsxs)(`div`,{className:`badge-security-tag`,children:[(0,w.jsx)(v,{size:13}),(0,w.jsx)(`span`,{children:e(`BẢO MẬT DỮ LIỆU ĐẠI LÝ`)})]}),(0,w.jsx)(`h2`,{className:`state-card-title`,children:e(`Yêu Cầu Đăng Nhập Xác Thực`)}),(0,w.jsx)(`p`,{className:`state-card-desc`,children:e(`Dữ liệu khách hàng được mã hóa bảo mật. Vui lòng đăng nhập tài khoản Đại lý được phân bổ để xác thực quyền hạn và thực hiện báo cáo.`)}),(0,w.jsx)(`div`,{className:`state-card-actions`,children:(0,w.jsxs)(`button`,{type:`button`,onClick:()=>{t(`/login?redirect=${encodeURIComponent($())}`)},className:`btn-state-action primary-gold`,children:[(0,w.jsx)(f,{size:16}),(0,w.jsx)(`span`,{children:e(`Đăng Nhập Tài Khoản Đại Lý`)})]})})]}):I?(0,w.jsxs)(`div`,{className:`state-card loading-card`,children:[(0,w.jsx)(`div`,{className:`luxury-spinner-wrap`,children:(0,w.jsx)(d,{size:44,className:`luxury-spin`})}),(0,w.jsx)(`p`,{className:`loading-text`,children:e(`Đang xác thực thông tin lượt phân bổ...`)}),(0,w.jsx)(`span`,{className:`loading-sub`,children:e(`Vui lòng chờ trong giây lát`)})]}):B?(0,w.jsxs)(`div`,{className:`state-card error-card`,children:[(0,w.jsx)(`div`,{className:`state-icon-circle warning-circle`,children:(0,w.jsx)(re,{size:38,className:`state-icon`})}),(0,w.jsxs)(`div`,{className:`badge-danger-tag`,children:[(0,w.jsx)(v,{size:13}),(0,w.jsx)(`span`,{children:e(`KHÔNG ĐÚNG CHỦ SỞ HỮU`)})]}),(0,w.jsx)(`h2`,{className:`state-card-title`,children:e(`Tài Khoản Không Phải Người Phụ Trách`)}),(0,w.jsx)(`p`,{className:`state-card-desc`,children:R}),(0,w.jsxs)(`div`,{className:`state-card-actions`,children:[(0,w.jsxs)(`button`,{type:`button`,onClick:()=>{se(),t(`/login?redirect=${encodeURIComponent($())}`)},className:`btn-state-action primary-gold`,children:[(0,w.jsx)(p,{size:16}),(0,w.jsx)(`span`,{children:e(`Đổi Tài Khoản / Đăng Nhập Lại`)})]}),(0,w.jsxs)(`button`,{type:`button`,onClick:()=>t(`/sale-portal`),className:`btn-state-action`,children:[(0,w.jsx)(r,{size:16}),(0,w.jsx)(`span`,{children:e(`Về Portal Nhận Data`)})]})]})]}):R?(0,w.jsxs)(`div`,{className:`state-card error-card`,children:[(0,w.jsx)(`div`,{className:`state-icon-circle error-circle`,children:(0,w.jsx)(te,{size:38,className:`state-icon`})}),(0,w.jsx)(`h2`,{className:`state-card-title`,children:e(`Liên Kết Không Khả Dụng`)}),(0,w.jsx)(`p`,{className:`state-card-desc`,children:R}),(0,w.jsx)(`div`,{className:`state-card-actions`,children:(0,w.jsxs)(`button`,{type:`button`,onClick:()=>t(`/sale-portal`),className:`btn-state-action`,children:[(0,w.jsx)(r,{size:16}),(0,w.jsx)(`span`,{children:e(`Về Trang Quản Lý Đại Lý`)})]})})]}):q===`success`?(0,w.jsxs)(`div`,{className:`state-card success-card`,children:[(0,w.jsx)(`div`,{className:`state-icon-circle success-circle`,children:(0,w.jsx)(c,{size:40,className:`state-icon`})}),(0,w.jsxs)(`div`,{className:`badge-success-tag`,children:[(0,w.jsx)(y,{size:14}),(0,w.jsx)(`span`,{children:e(`TIẾP NHẬN THÀNH CÔNG`)})]}),(0,w.jsx)(`h2`,{className:`state-card-title`,children:e(`Báo Cáo Đã Được Gửi Tới Admin`)}),(0,w.jsx)(`p`,{className:`state-card-desc`,children:e(`Hệ thống đã ghi nhận yêu cầu báo cáo lỗi data của bạn. Sau khi Quản trị viên duyệt, hệ thống sẽ tự động kích hoạt lượt chia bù data ưu tiên cho bạn.`)}),(0,w.jsx)(`div`,{className:`state-card-actions`,children:(0,w.jsxs)(`button`,{type:`button`,onClick:()=>t(`/sale-portal`),className:`btn-state-action primary-gold`,children:[(0,w.jsx)(r,{size:16}),(0,w.jsx)(`span`,{children:e(`Về Portal Nhận Data`)})]})})]}):(0,w.jsxs)(`div`,{className:`master-report-grid`,children:[(0,w.jsxs)(`aside`,{className:`lead-dossier-panel`,children:[(0,w.jsx)(`img`,{src:E,alt:``,className:`ql-brief-panel-decor`,"aria-hidden":`true`}),(0,w.jsxs)(`div`,{className:`panel-section-title`,children:[(0,w.jsxs)(`div`,{className:`panel-title-pill`,children:[(0,w.jsx)(ie,{size:13,className:`text-gold`}),(0,w.jsx)(`span`,{children:e(`THÔNG TIN DATA ĐƯỢC CHIA`)})]}),(0,w.jsxs)(`span`,{className:`lead-id-tag`,children:[`ID #`,P?.lead_id||M.leadId]})]}),P&&(0,w.jsxs)(w.Fragment,{children:[(0,w.jsxs)(`div`,{className:`customer-hero-card`,children:[(0,w.jsx)(`div`,{className:`customer-avatar-badge`,children:P.lead_name?P.lead_name.trim().charAt(0).toUpperCase():`K`}),(0,w.jsxs)(`div`,{className:`customer-meta-info`,children:[(0,w.jsx)(`span`,{className:`customer-role-label`,children:e(`KHÁCH HÀNG`)}),(0,w.jsx)(`h3`,{className:`customer-name-heading`,children:P.lead_name||e(`Chưa cập nhật tên`)}),(0,w.jsxs)(`div`,{className:`customer-phone-row`,children:[(0,w.jsx)(g,{size:14,className:`phone-icon`}),(0,w.jsx)(`span`,{className:`phone-number-text`,children:P.lead_phone||e(`Chưa có SĐT`)}),P.lead_phone&&(0,w.jsx)(`button`,{type:`button`,onClick:()=>me(P.lead_phone),className:`btn-copy-mini`,title:e(`Sao chép số điện thoại`),children:fe?(0,w.jsx)(a,{size:12,className:`text-success`}):(0,w.jsx)(l,{size:12})})]})]})]}),(0,w.jsxs)(`div`,{className:`consultant-pill-card`,children:[(0,w.jsx)(`div`,{className:`consultant-avatar-mini`,children:(0,w.jsx)(v,{size:14,className:`text-gold`})}),(0,w.jsxs)(`div`,{className:`consultant-text-wrap`,children:[(0,w.jsx)(`span`,{className:`field-micro-label`,children:e(`ĐẠI LÝ PHỤ TRÁCH`)}),(0,w.jsx)(`div`,{className:`consultant-fullname`,children:P.consultant_name}),(0,w.jsx)(`div`,{className:`consultant-email-sub`,children:P.consultant_email})]})]}),(0,w.jsxs)(`div`,{className:`attributes-list`,children:[(0,w.jsxs)(`div`,{className:`attr-item`,children:[(0,w.jsx)(`div`,{className:`attr-icon-wrap`,children:(0,w.jsx)(ne,{size:13})}),(0,w.jsxs)(`div`,{className:`attr-content`,children:[(0,w.jsx)(`span`,{className:`attr-label`,children:e(`Vòng phân bổ`)}),(0,w.jsx)(`span`,{className:`attr-value gold-text`,children:P.round_name||e(`Phân bổ trực tiếp`)})]})]}),(0,w.jsxs)(`div`,{className:`attr-item`,children:[(0,w.jsx)(`div`,{className:`attr-icon-wrap`,children:(0,w.jsx)(u,{size:13})}),(0,w.jsxs)(`div`,{className:`attr-content`,children:[(0,w.jsx)(`span`,{className:`attr-label`,children:e(`Nguồn dữ liệu`)}),(0,w.jsx)(`span`,{className:`attr-value`,children:P.lead_source||e(`Quảng cáo / Biểu mẫu`)})]})]}),(0,w.jsxs)(`div`,{className:`attr-item`,children:[(0,w.jsx)(`div`,{className:`attr-icon-wrap`,children:(0,w.jsx)(i,{size:13})}),(0,w.jsxs)(`div`,{className:`attr-content`,children:[(0,w.jsx)(`span`,{className:`attr-label`,children:e(`Thời gian nhận`)}),(0,w.jsx)(`span`,{className:`attr-value`,children:P.assigned_at?new Date(P.assigned_at).toLocaleString(`vi-VN`,{dateStyle:`short`,timeStyle:`short`}):`—`})]})]}),(0,w.jsxs)(`button`,{type:`button`,className:`mobile-accordion-toggle`,onClick:()=>pe(!Z),children:[(0,w.jsx)(`span`,{children:e(Z?`Thu gọn chi tiết`:`Xem thêm thông tin chi tiết`)}),Z?(0,w.jsx)(ee,{size:14}):(0,w.jsx)(o,{size:14})]}),(0,w.jsxs)(`div`,{className:`collapsible-details ${Z?`is-open`:``}`,children:[P.lead_email&&(0,w.jsxs)(`div`,{className:`attr-item`,children:[(0,w.jsx)(`div`,{className:`attr-icon-wrap`,children:(0,w.jsx)(h,{size:13})}),(0,w.jsxs)(`div`,{className:`attr-content`,children:[(0,w.jsx)(`span`,{className:`attr-label`,children:e(`Email khách`)}),(0,w.jsx)(`span`,{className:`attr-value`,children:P.lead_email})]})]}),P.lead_type&&(0,w.jsxs)(`div`,{className:`attr-item`,children:[(0,w.jsx)(`div`,{className:`attr-icon-wrap`,children:(0,w.jsx)(y,{size:13})}),(0,w.jsxs)(`div`,{className:`attr-content`,children:[(0,w.jsx)(`span`,{className:`attr-label`,children:e(`Nhu cầu`)}),(0,w.jsx)(`span`,{className:`attr-value`,children:P.lead_type})]})]}),P.lead_note&&(0,w.jsxs)(`div`,{className:`lead-note-box`,children:[(0,w.jsxs)(`div`,{className:`note-box-header`,children:[(0,w.jsx)(u,{size:12,className:`text-gold`}),(0,w.jsx)(`span`,{children:e(`Ghi chú chi tiết từ nguồn`)})]}),(0,w.jsx)(`div`,{className:`note-box-body`,children:P.lead_note})]})]})]})]})]}),(0,w.jsxs)(`main`,{className:`report-form-panel`,children:[(0,w.jsx)(`img`,{src:E,alt:``,className:`ql-form-panel-decor`,"aria-hidden":`true`}),M.isTest&&(0,w.jsxs)(`div`,{className:`test-mode-alert`,children:[(0,w.jsx)(s,{size:16,className:`text-amber`}),(0,w.jsx)(`span`,{children:e(`Chế độ xem trước (Mock Data) — Không lưu vào dữ liệu thực tế.`)})]}),P?.existing_report===`pending`&&(0,w.jsxs)(`div`,{className:`status-notice-block pending-notice`,children:[(0,w.jsx)(`div`,{className:`status-notice-icon`,children:(0,w.jsx)(v,{size:28})}),(0,w.jsxs)(`div`,{className:`status-notice-body`,children:[(0,w.jsx)(`h3`,{children:e(`Đang Chờ Quản Trị Viên Phê Duyệt`)}),(0,w.jsx)(`p`,{children:e(`Bạn đã gửi báo cáo cho data này trước đó. Vui lòng chờ Admin thẩm duyệt để được nhận data bù ưu tiên.`)})]})]}),P?.existing_report===`approved`&&(0,w.jsxs)(`div`,{className:`status-notice-block approved-notice`,children:[(0,w.jsx)(`div`,{className:`status-notice-icon`,children:(0,w.jsx)(c,{size:28})}),(0,w.jsxs)(`div`,{className:`status-notice-body`,children:[(0,w.jsx)(`h3`,{children:e(`Báo Cáo Đã Được Phê Duyệt ✅`)}),(0,w.jsx)(`p`,{children:e(`Yêu cầu báo cáo đã được chấp thuận. Lượt bù data đã được cộng vào thứ tự phân bổ ưu tiên của bạn.`)})]})]}),P?.existing_report===`approved_no_comp`&&(0,w.jsxs)(`div`,{className:`status-notice-block approved-notice`,children:[(0,w.jsx)(`div`,{className:`status-notice-icon`,children:(0,w.jsx)(c,{size:28})}),(0,w.jsxs)(`div`,{className:`status-notice-body`,children:[(0,w.jsx)(`h3`,{children:e(`Báo Cáo Đã Được Duyệt (Không Bù)`)}),(0,w.jsx)(`p`,{children:e(`Báo cáo lỗi data này đã được Quản trị viên ghi nhận và xử lý hoàn tất.`)})]})]}),P?.existing_report===`rejected`&&(0,w.jsxs)(`div`,{className:`form-error-banner`,style:{marginBottom:`12px`},children:[(0,w.jsx)(s,{size:16}),(0,w.jsx)(`span`,{children:e(`Báo cáo trước đó đã bị từ chối. Bạn có thể cập nhật lý do và gửi lại báo cáo bên dưới.`)})]}),(!P?.existing_report||P?.existing_report===`rejected`)&&(0,w.jsxs)(`form`,{onSubmit:he,className:`report-action-form`,children:[q===`error`&&(0,w.jsxs)(`div`,{className:`form-error-banner`,children:[(0,w.jsx)(s,{size:16}),(0,w.jsx)(`span`,{children:de})]}),(0,w.jsxs)(`div`,{className:`form-section-header`,children:[(0,w.jsx)(`span`,{className:`step-badge`,children:`1`}),(0,w.jsxs)(`div`,{children:[(0,w.jsx)(`h4`,{className:`section-title`,children:e(`Chọn Lý Do Báo Cáo Không Đạt Chuẩn`)}),(0,w.jsx)(`p`,{className:`section-subtitle`,children:e(`Lựa chọn chính xác tình trạng thực tế khi bạn liên hệ với khách hàng`)})]})]}),(0,w.jsx)(`div`,{className:`reason-options-group`,children:le.map((t,n)=>{let r=H===t.reason;return(0,w.jsxs)(`label`,{className:`reason-option-card ${r?`is-selected`:``}`,children:[(0,w.jsxs)(`div`,{className:`reason-card-head`,children:[(0,w.jsx)(`input`,{type:`radio`,name:`reason`,value:t.reason,checked:r,onChange:()=>U(t.reason),className:`reason-radio-input`}),(0,w.jsx)(`span`,{className:`reason-label-text`,children:e(t.reason)}),r&&(0,w.jsx)(`span`,{className:`selected-check-dot`})]}),t.note&&(0,w.jsx)(`div`,{className:`reason-note-text`,children:e(t.note.replace(/{n}/g,String(P?.duplicate_check_months||6)))})]},t.reason||n)})}),(0,w.jsxs)(`div`,{className:`form-section-header`,style:{marginTop:`1rem`},children:[(0,w.jsx)(`span`,{className:`step-badge`,children:`2`}),(0,w.jsxs)(`div`,{children:[(0,w.jsxs)(`h4`,{className:`section-title`,children:[e(`Ghi Chú Giải Trình Bổ Sung`),Q&&(0,w.jsx)(`span`,{className:`required-star`,children:`*`})]}),(0,w.jsx)(`p`,{className:`section-subtitle`,children:e(`Cung cấp thêm bằng chứng, thời điểm gọi hoặc lịch sử liên lạc (nếu có)`)})]})]}),(0,w.jsx)(`div`,{className:`textarea-container`,children:(0,w.jsx)(`textarea`,{required:Q,value:W,onChange:e=>ue(e.target.value),placeholder:e(Q?`Vui lòng mô tả chi tiết lý do lỗi data (bắt buộc)...`:`Số sai định dạng, spam phá...`),className:`luxury-textarea`,rows:3})}),(0,w.jsxs)(`div`,{className:`form-footer-action`,children:[(0,w.jsx)(`button`,{type:`submit`,disabled:G,className:`btn-submit-report`,children:G?(0,w.jsxs)(w.Fragment,{children:[(0,w.jsx)(d,{size:18,className:`luxury-spin`}),(0,w.jsx)(`span`,{children:e(`Đang gửi báo cáo thẩm định...`)})]}):M.isTest?(0,w.jsx)(`span`,{children:e(`Chế độ thử nghiệm (Gửi bị vô hiệu)`)}):(0,w.jsxs)(w.Fragment,{children:[(0,w.jsx)(_,{size:18}),(0,w.jsx)(`span`,{children:e(`GỬI BÁO CÁO DUYỆT BÙ DATA`)})]})}),(0,w.jsxs)(`p`,{className:`footer-disclaimer`,children:[`🔒 `,e(`Báo cáo sẽ được ghi nhận vào nhật ký phân bổ và chuyển trực tiếp tới Ban Quản Trị.`)]})]})]})]})]})}),(0,w.jsx)(`footer`,{className:`report-footer`,children:(0,w.jsxs)(`span`,{children:[`© `,new Date().getFullYear(),` DOMATION AUTO DATA ĐÀ NẴNG · DỮ LIỆU ĐẠI LÝ BẢO MẬT`]})})]}),(0,w.jsx)(A,{})]})},A=()=>(0,w.jsx)(`style`,{children:`
    /* Root Page Container */
    .report-page-root {
      width: 100%;
      min-height: 100vh;
      background:
        radial-gradient(circle at 8% 15%, rgba(30, 64, 255, 0.14) 0%, rgba(248, 249, 250, 0) 45%),
        radial-gradient(circle at 88% 12%, rgba(2, 132, 199, 0.10) 0%, rgba(248, 249, 250, 0) 48%),
        radial-gradient(circle at 92% 85%, rgba(30, 64, 255, 0.10) 0%, rgba(248, 249, 250, 0) 45%),
        #F8F9FA;
      color: var(--color-text, #0F172A);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      position: relative;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 16px 48px;
      box-sizing: border-box;
    }

    html[data-autodata-workspace="active"][data-theme='dark'] .report-page-root {
      background: radial-gradient(ellipse at 50% 0%, #131C31 0%, #0B1120 60%, #090E1A 100%);
      color: var(--color-text, #F8FAFC);
    }

    /* Ambient Gold Light Accents */
    .ambient-glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(85px);
      pointer-events: none;
      z-index: 0;
    }
    .glow-1 {
      top: -120px;
      left: 10%;
      width: 460px;
      height: 460px;
      background: radial-gradient(circle, rgba(30, 64, 255, 0.18) 0%, rgba(30, 64, 255, 0) 70%);
    }
    .glow-2 {
      top: 35%;
      right: -80px;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(30, 64, 255, 0.14) 0%, rgba(30, 64, 255, 0) 70%);
    }
    .glow-3 {
      bottom: -60px;
      left: 20%;
      width: 340px;
      height: 340px;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0) 70%);
    }

    /* Luxury Botanical & Geometric SVG Watermarks in Background */
    .bg-decor-svg {
      position: absolute;
      pointer-events: none;
      z-index: 0;
    }
    .decor-left {
      top: 40px;
      left: 20px;
      width: 220px;
      height: 220px;
      opacity: 0.7;
    }
    .decor-right {
      bottom: 80px;
      right: 30px;
      width: 260px;
      height: 260px;
      opacity: 0.65;
    }

    /* Main Container */
    .report-main-container {
      width: 100%;
      max-width: 980px;
      margin: 0 auto;
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* ── HEADER STYLING ── */
    .report-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 10px;
    }

    .brand-logo-container {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 4px;
    }
    .brand-logo-full {
      height: 56px;
      max-width: 320px;
      object-fit: contain;
      filter: drop-shadow(0 4px 12px rgba(30, 64, 255, 0.15));
    }

    .header-badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(30, 64, 255, 0.08);
      border: 1px solid rgba(30, 64, 255, 0.25);
      padding: 5px 16px;
      border-radius: 999px;
      backdrop-filter: blur(8px);
    }
    .badge-pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #D97706;
      box-shadow: 0 0 8px #D97706;
      animation: pulseGlow 2s infinite;
    }
    @keyframes pulseGlow {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.85); }
    }
    .badge-text {
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.8px;
      color: var(--color-primary, #1E40FF);
      text-transform: uppercase;
    }

    .header-title {
      font-size: 1.75rem;
      font-weight: 900;
      letter-spacing: -0.02em;
      margin: 2px 0 0;
      color: var(--color-text, #0F172A);
      line-height: 1.25;
    }
    [data-theme='dark'] .header-title {
      color: #F8F9FA;
    }

    .header-desc {
      font-size: 0.9rem;
      color: var(--color-text-muted, #64748B);
      margin: 0;
      max-width: 540px;
      line-height: 1.5;
    }

    .logged-in-user-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      color: var(--color-text-muted, #64748B);
      background: rgba(30, 64, 255, 0.06);
      border: 1px solid rgba(30, 64, 255, 0.18);
      padding: 3px 12px;
      border-radius: 999px;
      margin-top: 4px;
    }
    .user-dot-online {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10B981;
    }

    /* ── MASTER CARD LAYOUT ── */
    .report-content-wrapper {
      width: 100%;
    }

    .master-report-grid {
      display: grid;
      grid-template-columns: 360px 1fr;
      background: var(--color-surface, #FFFFFF);
      border-radius: 24px;
      border: 1px solid var(--color-border, #E2E8F0);
      box-shadow: 0 20px 50px -10px rgba(36, 28, 20, 0.08), 0 0 0 1px rgba(30, 64, 255, 0.08);
      overflow: hidden;
      min-height: 580px;
    }
    [data-theme='dark'] .master-report-grid {
      background: #181512;
      border-color: rgba(30, 64, 255, 0.22);
      box-shadow: 0 24px 60px -10px rgba(0, 0, 0, 0.6);
    }

    /* ── LEFT PANEL: LEAD DOSSIER (Synced with Landing Page .ql-brief-panel) ── */
    .lead-dossier-panel {
      background: linear-gradient(155deg, #FFFFFF 0%, #FCF8EE 60%, #F3EAD8 100%);
      border-right: 1.5px solid rgba(197, 160, 89, 0.36);
      padding: 26px 22px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
    }
    .ql-brief-panel-decor {
      position: absolute;
      bottom: -36px;
      right: -36px;
      width: 185px;
      height: 185px;
      opacity: 0.095;
      pointer-events: none !important;
      user-select: none !important;
      z-index: 0;
      object-fit: contain;
    }
    .report-form-panel {
      position: relative;
      overflow: hidden;
    }
    .ql-form-panel-decor {
      position: absolute;
      top: -36px;
      right: -36px;
      width: 190px;
      height: 190px;
      opacity: 0.055;
      pointer-events: none !important;
      user-select: none !important;
      z-index: 0;
      object-fit: contain;
    }
    [data-theme='dark'] .lead-dossier-panel {
      background: #13110e;
      border-right-color: rgba(30, 64, 255, 0.16);
    }

    .panel-section-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .panel-title-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-text-muted, #64748B);
    }
    .text-gold {
      color: var(--color-primary, #1E40FF);
    }
    .lead-id-tag {
      font-size: 0.7rem;
      font-weight: 800;
      color: var(--color-primary, #1E40FF);
      background: rgba(30, 64, 255, 0.1);
      padding: 2px 8px;
      border-radius: 6px;
      font-family: monospace;
    }

    /* Customer Hero Card */
    .customer-hero-card {
      background: var(--color-surface, #FFFFFF);
      border: 1px solid var(--color-border, #E2E8F0);
      border-radius: 16px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: 0 4px 12px rgba(36, 28, 20, 0.03);
    }
    [data-theme='dark'] .customer-hero-card {
      background: #1e1a16;
      border-color: rgba(30, 64, 255, 0.18);
    }

    .customer-avatar-badge {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1E40FF 0%, #D4AF37 100%);
      color: #FFFFFF;
      font-size: 1.25rem;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 10px rgba(30, 64, 255, 0.25);
    }

    .customer-meta-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .customer-role-label {
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      color: var(--color-text-muted, #64748B);
      text-transform: uppercase;
    }
    .customer-name-heading {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 800;
      color: var(--color-text, #0F172A);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    [data-theme='dark'] .customer-name-heading {
      color: #F8F9FA;
    }

    .customer-phone-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 2px;
    }
    .phone-icon {
      color: #D97706;
      flex-shrink: 0;
    }
    .phone-number-text {
      font-size: 0.92rem;
      font-weight: 800;
      color: #D97706;
      letter-spacing: 0.5px;
    }
    .btn-copy-mini {
      background: rgba(30, 64, 255, 0.08);
      border: 1px solid rgba(30, 64, 255, 0.2);
      border-radius: 6px;
      padding: 3px 6px;
      cursor: pointer;
      color: var(--color-text-muted, #64748B);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .btn-copy-mini:hover {
      background: rgba(30, 64, 255, 0.16);
      color: var(--color-primary, #1E40FF);
    }
    .text-success {
      color: #10B981;
    }

    /* Consultant Card */
    .consultant-pill-card {
      background: rgba(16, 185, 129, 0.06);
      border: 1px solid rgba(16, 185, 129, 0.2);
      border-radius: 14px;
      padding: 12px 14px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    [data-theme='dark'] .consultant-pill-card {
      background: rgba(16, 185, 129, 0.1);
      border-color: rgba(16, 185, 129, 0.25);
    }
    .consultant-avatar-mini {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .consultant-text-wrap {
      flex: 1;
      min-width: 0;
    }
    .field-micro-label {
      font-size: 0.62rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      color: #059669;
      text-transform: uppercase;
      display: block;
      margin-bottom: 2px;
    }
    [data-theme='dark'] .field-micro-label {
      color: #34D399;
    }
    .consultant-fullname {
      font-size: 0.88rem;
      font-weight: 800;
      color: var(--color-text, #0F172A);
    }
    [data-theme='dark'] .consultant-fullname {
      color: #F8F9FA;
    }
    .consultant-email-sub {
      font-size: 0.75rem;
      color: var(--color-text-muted, #64748B);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Attributes List */
    .attributes-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .attr-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }
    .attr-icon-wrap {
      width: 26px;
      height: 26px;
      border-radius: 6px;
      background: var(--color-surface, #FFFFFF);
      border: 1px solid var(--color-border, #E2E8F0);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-primary, #1E40FF);
      flex-shrink: 0;
      margin-top: 2px;
    }
    [data-theme='dark'] .attr-icon-wrap {
      background: #1e1a16;
      border-color: rgba(30, 64, 255, 0.18);
    }
    .attr-content {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }
    .attr-label {
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      color: var(--color-text-muted, #64748B);
      text-transform: uppercase;
    }
    .attr-value {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--color-text, #0F172A);
      word-break: break-word;
    }
    [data-theme='dark'] .attr-value {
      color: #F8F9FA;
    }
    .gold-text {
      color: var(--color-primary, #1E40FF) !important;
      font-weight: 700 !important;
    }

    /* Note Box */
    .lead-note-box {
      background: var(--color-surface, #FFFFFF);
      border: 1px solid var(--color-border, #E2E8F0);
      border-radius: 12px;
      padding: 12px;
      margin-top: 4px;
    }
    [data-theme='dark'] .lead-note-box {
      background: #1e1a16;
      border-color: rgba(30, 64, 255, 0.18);
    }
    .note-box-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.65rem;
      font-weight: 800;
      color: var(--color-text-muted, #64748B);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 6px;
    }
    .note-box-body {
      font-size: 0.8rem;
      color: var(--color-text-light, #334155);
      line-height: 1.5;
      white-space: pre-wrap;
      max-height: 140px;
      overflow-y: auto;
    }
    [data-theme='dark'] .note-box-body {
      color: #CBD5E1;
    }

    .mobile-accordion-toggle {
      display: none;
    }

    /* ── RIGHT PANEL: FORM ACTION ── */
    .report-form-panel {
      padding: 30px;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      overflow-y: auto;
    }

    .report-action-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
      flex: 1;
    }

    .form-section-header {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 2px;
    }
    .step-badge {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--color-primary, #1E40FF);
      color: #FFFFFF;
      font-size: 0.75rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .section-title {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--color-text, #0F172A);
      display: flex;
      align-items: center;
      gap: 4px;
    }
    [data-theme='dark'] .section-title {
      color: #F8F9FA;
    }
    .required-star {
      color: #DC2626;
    }
    .section-subtitle {
      margin: 2px 0 0;
      font-size: 0.78rem;
      color: var(--color-text-muted, #64748B);
    }

    /* Reasons List */
    .reason-options-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .reason-option-card {
      border: 1.5px solid var(--color-border, #E2E8F0);
      background: var(--color-surface, #FFFFFF);
      border-radius: 14px;
      padding: 14px 16px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 4px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    [data-theme='dark'] .reason-option-card {
      background: #1d1915;
      border-color: rgba(30, 64, 255, 0.16);
    }
    .reason-option-card:hover {
      border-color: var(--color-primary, #1E40FF);
      background: rgba(30, 64, 255, 0.03);
    }
    .reason-option-card.is-selected {
      border-color: var(--color-primary, #1E40FF);
      background: rgba(30, 64, 255, 0.08);
      box-shadow: 0 4px 16px rgba(30, 64, 255, 0.12);
    }
    [data-theme='dark'] .reason-option-card.is-selected {
      background: rgba(59, 130, 246, 0.14);
      border-color: #3B82F6;
    }

    .reason-card-head {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .reason-radio-input {
      width: 17px;
      height: 17px;
      accent-color: #1E40FF;
      cursor: pointer;
    }
    .reason-label-text {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--color-text, #0F172A);
      flex: 1;
    }
    [data-theme='dark'] .reason-label-text {
      color: #F8F9FA;
    }
    .is-selected .reason-label-text {
      color: var(--color-primary, #1E40FF);
    }
    [data-theme='dark'] .is-selected .reason-label-text {
      color: #3B82F6;
    }

    .selected-check-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--color-primary, #1E40FF);
      box-shadow: 0 0 6px var(--color-primary, #1E40FF);
    }

    .reason-note-text {
      font-size: 0.78rem;
      color: var(--color-text-muted, #64748B);
      line-height: 1.45;
      padding-left: 27px;
    }

    /* Textarea */
    .textarea-container {
      width: 100%;
    }
    .luxury-textarea {
      width: 100%;
      background: var(--color-surface, #FFFFFF);
      border: 1.5px solid var(--color-border, #E2E8F0);
      border-radius: 14px;
      padding: 12px 14px;
      font-size: 0.88rem;
      color: var(--color-text, #0F172A);
      font-family: inherit;
      outline: none;
      resize: vertical;
      min-height: 85px;
      box-sizing: border-box;
      transition: all 0.2s;
    }
    [data-theme='dark'] .luxury-textarea {
      background: #1d1915;
      border-color: rgba(30, 64, 255, 0.2);
      color: #F8F9FA;
    }
    .luxury-textarea:focus {
      border-color: var(--color-primary, #1E40FF);
      box-shadow: 0 0 0 3px rgba(30, 64, 255, 0.15);
    }

    /* Submit Button */
    .form-footer-action {
      margin-top: 10px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .btn-submit-report {
      width: 100%;
      padding: 15px 24px;
      border-radius: 14px;
      border: none;
      background: linear-gradient(135deg, #2563EB 0%, #1E40FF 50%, #1D4ED8 100%);
      color: #FFFFFF;
      font-size: 0.95rem;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      box-shadow: 0 8px 24px rgba(30, 64, 255, 0.35);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .btn-submit-report:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 12px 28px rgba(30, 64, 255, 0.45);
      filter: brightness(1.05);
    }
    .btn-submit-report:disabled {
      opacity: 0.65;
      cursor: not-allowed;
      box-shadow: none;
    }
    .footer-disclaimer {
      margin: 0;
      font-size: 0.75rem;
      color: var(--color-text-muted, #64748B);
      text-align: center;
    }

    /* ── STATE CARDS (Loading, Auth, Error, Success) ── */
    .state-card {
      background: var(--color-surface, #FFFFFF);
      border-radius: 24px;
      border: 1px solid var(--color-border, #E2E8F0);
      padding: 48px 32px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      box-shadow: 0 20px 50px -10px rgba(36, 28, 20, 0.08);
      max-width: 520px;
      margin: 20px auto;
    }
    [data-theme='dark'] .state-card {
      background: #181512;
      border-color: rgba(30, 64, 255, 0.22);
    }

    .state-icon-circle {
      width: 76px;
      height: 76px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }
    .auth-circle {
      background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
      color: #B45309;
      box-shadow: 0 8px 24px rgba(217, 119, 6, 0.2);
    }
    .error-circle {
      background: linear-gradient(135deg, #FEE2E2 0%, #FCA5A5 100%);
      color: #DC2626;
      box-shadow: 0 8px 24px rgba(220, 38, 38, 0.2);
    }
    .warning-circle {
      background: linear-gradient(135deg, #FFEDD5 0%, #FDBA74 100%);
      color: #C2410C;
      box-shadow: 0 8px 24px rgba(234, 88, 12, 0.2);
    }
    .success-circle {
      background: linear-gradient(135deg, #D1FAE5 0%, #6EE7B7 100%);
      color: #059669;
      box-shadow: 0 8px 24px rgba(16, 185, 129, 0.25);
    }
    .luxury-spinner-wrap {
      color: var(--color-primary, #1E40FF);
      margin-bottom: 16px;
    }
    .luxury-spin {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .state-card-title {
      font-size: 1.35rem;
      font-weight: 800;
      margin: 0 0 10px;
      color: var(--color-text, #0F172A);
    }
    [data-theme='dark'] .state-card-title {
      color: #F8F9FA;
    }
    .state-card-desc {
      font-size: 0.92rem;
      color: var(--color-text-muted, #64748B);
      line-height: 1.6;
      margin: 0 0 24px;
      max-width: 420px;
    }

    .badge-security-tag,
    .badge-success-tag,
    .badge-danger-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.5px;
      padding: 4px 12px;
      border-radius: 999px;
      margin-bottom: 12px;
    }
    .badge-security-tag {
      background: rgba(30, 64, 255, 0.12);
      color: #B45309;
    }
    .badge-success-tag {
      background: rgba(16, 185, 129, 0.12);
      color: #059669;
    }
    .badge-danger-tag {
      background: rgba(220, 38, 38, 0.12);
      color: #DC2626;
    }

    .state-card-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;
    }
    .btn-state-action {
      background: var(--color-bg, #F8F9FA);
      border: 1px solid var(--color-border, #E2E8F0);
      color: var(--color-text, #0F172A);
      padding: 12px 22px;
      border-radius: 12px;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }
    [data-theme='dark'] .btn-state-action {
      background: #25201b;
      border-color: rgba(30, 64, 255, 0.2);
      color: #F8F9FA;
    }
    .btn-state-action:hover {
      background: rgba(30, 64, 255, 0.12);
      border-color: var(--color-primary, #1E40FF);
    }
    .btn-state-action.primary-gold {
      background: linear-gradient(135deg, #1E40FF 0%, #8C6B1C 100%);
      color: #FFFFFF;
      border: none;
      box-shadow: 0 4px 14px rgba(30, 64, 255, 0.35);
    }

    /* Existing Report Banners */
    .status-notice-block {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 24px;
      border-radius: 16px;
      margin: auto 0;
    }
    .pending-notice {
      background: rgba(217, 119, 6, 0.08);
      border: 1.5px solid rgba(217, 119, 6, 0.25);
      color: #D97706;
    }
    .approved-notice {
      background: rgba(16, 185, 129, 0.08);
      border: 1.5px solid rgba(16, 185, 129, 0.25);
      color: #059669;
    }
    .status-notice-body h3 {
      margin: 0 0 6px;
      font-size: 1.05rem;
      font-weight: 800;
    }
    .status-notice-body p {
      margin: 0;
      font-size: 0.88rem;
      line-height: 1.55;
    }

    /* Alerts */
    .test-mode-alert {
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #D97706;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 0.82rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .form-error-banner {
      background: rgba(220, 38, 38, 0.08);
      border: 1px solid rgba(220, 38, 38, 0.25);
      color: #DC2626;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 0.84rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* ── FOOTER ── */
    .report-footer {
      text-align: center;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.8px;
      color: var(--color-text-muted, #64748B);
      opacity: 0.7;
      padding: 12px 0;
    }

    /* ── MOBILE RESPONSIVE ── */
    @media (max-width: 860px) {
      .report-page-root {
        padding: 20px 12px 32px;
      }
      .master-report-grid {
        grid-template-columns: 1fr;
        border-radius: 18px;
      }
      .lead-dossier-panel {
        border-right: none;
        border-bottom: 1px solid var(--color-border, #E2E8F0);
        padding: 20px 16px;
      }
      .report-form-panel {
        padding: 20px 16px;
      }
      .header-title {
        font-size: 1.35rem;
      }
      .mobile-accordion-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        width: 100%;
        background: var(--color-surface, #FFFFFF);
        border: 1px dashed var(--color-border, #E2E8F0);
        border-radius: 10px;
        padding: 8px;
        font-size: 0.78rem;
        font-weight: 700;
        color: var(--color-primary, #1E40FF);
        cursor: pointer;
        margin-top: 4px;
      }
      [data-theme='dark'] .mobile-accordion-toggle {
        background: #1e1a16;
        border-color: rgba(30, 64, 255, 0.2);
      }
      .collapsible-details {
        display: none;
        flex-direction: column;
        gap: 12px;
      }
      .collapsible-details.is-open {
        display: flex;
      }
    }
  `});export{k as ReportData};