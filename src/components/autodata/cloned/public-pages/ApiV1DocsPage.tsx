import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Layers,
  Lock,
  Search,
  Shield,
  Terminal,
} from 'lucide-react';

interface ApiParamDoc {
  name: string;
  type: string;
  required?: boolean;
  desc: string;
}

interface ApiEndpointDoc {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  title: string;
  description: string;
  authRequired: boolean;
  moduleKey: string;
  queryParams?: ApiParamDoc[];
  bodyParams?: ApiParamDoc[];
  sampleBody?: Record<string, unknown>;
  sampleResponse: Record<string, unknown>;
}

interface ApiCategoryDoc {
  id: string;
  title: string;
  badge: string;
  endpoints: ApiEndpointDoc[];
}

const API_V1_CATEGORIES: ReadonlyArray<ApiCategoryDoc> = [
  {
    id: 'auth',
    title: '1. Xác thực & Multi-Tenant Session',
    badge: 'Core Auth',
    endpoints: [
      {
        id: 'auth-login',
        method: 'POST',
        path: '/api/v1/auth/login',
        title: 'Đăng nhập Không gian Doanh nghiệp (JWT + RLS)',
        description: 'Xác thực tài khoản theo X-Tenant-Slug và cấp Access Token kèm quyền RBAC hiệu lực.',
        authRequired: false,
        moduleKey: 'auth',
        bodyParams: [
          { name: 'email', type: 'string', required: true, desc: 'Email công việc của nhân sự' },
          { name: 'password', type: 'string', required: true, desc: 'Mật khẩu tài khoản' },
        ],
        sampleBody: { email: 'admin@enterprise.vn', password: 'SecurePassword123!' },
        sampleResponse: {
          success: true,
          data: {
            access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            tenant: { slug: 'enterprise-vn', package_code: 'domation_promax' },
          },
        },
      },
      {
        id: 'workspace-bootstrap',
        method: 'GET',
        path: '/api/v1/workspace/bootstrap',
        title: 'Khởi tạo Cấu hình Tổ chức, Từ điển & Gói SaaS',
        description: 'Trả về gói cước hiện hành, danh sách module mở khóa, từ điển ngành nghề và quyền màn hình.',
        authRequired: true,
        moduleKey: 'settings',
        sampleResponse: {
          success: true,
          data: {
            package_code: 'domation_promax',
            enabled_modules: ['leads', 'audiences', 'erp_hrm_org', 'erp_payroll', 'dom_agent'],
          },
        },
      },
    ],
  },
  {
    id: 'crm',
    title: '2. Master Contacts, Auto Data & Deals 360°',
    badge: 'CRM Core',
    endpoints: [
      {
        id: 'leads-list',
        method: 'GET',
        path: '/api/v1/leads',
        title: 'Truy vấn Danh sách Khách hàng (PII & Scope Filtered)',
        description: 'Lọc hồ sơ khách hàng theo phễu, người phụ trách, điểm nóng và tự động che SĐT nếu không có quyền unmask_phone.',
        authRequired: true,
        moduleKey: 'leads',
        queryParams: [
          { name: 'status', type: 'string', desc: 'assigned | unassigned_pending | won' },
          { name: 'search', type: 'string', desc: 'Tìm theo tên, SĐT, email' },
        ],
        sampleResponse: {
          success: true,
          data: { items: [{ id: 'uuid-1', name: 'Nguyễn Minh Quân', phone: '0901***888', lead_score: 85 }] },
        },
      },
      {
        id: 'leads-create',
        method: 'POST',
        path: '/api/v1/leads',
        title: 'Đẩy Lead mới vào Gatekeeper & Vòng chia Fair-Share',
        description: 'Tiếp nhận lead từ Webhook/Landing Page, kiểm tra chống trùng và phân bổ tự động theo ca trực.',
        authRequired: true,
        moduleKey: 'leads',
        bodyParams: [
          { name: 'name', type: 'string', required: true, desc: 'Họ và tên khách hàng' },
          { name: 'phone', type: 'string', required: true, desc: 'Số điện thoại chuẩn hóa' },
          { name: 'source', type: 'string', desc: 'Nguồn chiến dịch (Meta CAPI, Web Form, Zalo)' },
        ],
        sampleBody: { name: 'Trần Thu Hà', phone: '0912345678', source: 'Website Form' },
        sampleResponse: { success: true, data: { id: 'uuid-lead', status: 'assigned' } },
      },
    ],
  },
  {
    id: 'marketing',
    title: '3. Audiences, Campaigns & Automation Flows',
    badge: 'Marketing Suite',
    endpoints: [
      {
        id: 'audiences-list',
        method: 'GET',
        path: '/api/v1/audiences',
        title: 'Danh sách Tệp Data tĩnh & Tệp Logic động',
        description: 'Lấy danh sách tệp phân khúc khách hàng thời gian thực dùng cho Email, Zalo ZNS và đồng bộ Meta CAPI.',
        authRequired: true,
        moduleKey: 'audiences',
        sampleResponse: {
          success: true,
          data: { items: [{ id: 'aud-1', name: 'Khách VIP Điểm nóng >= 60', audience_type: 'dynamic_logic', member_count: 420 }] },
        },
      },
      {
        id: 'campaigns-create',
        method: 'POST',
        path: '/api/v1/marketing/campaigns',
        title: 'Khởi tạo Chiến dịch Đa kênh (Email SES / Zalo ZNS)',
        description: 'Tạo chiến dịch gửi hàng loạt có khóa nguyên tử chống gửi trùng và cấu hình gửi nhắc tự động.',
        authRequired: true,
        moduleKey: 'campaigns',
        sampleBody: { name: 'Ưu đãi Tri ân Quý 4', channel: 'email', audience_id: 'aud-1' },
        sampleResponse: { success: true, data: { id: 'camp-1', status: 'draft' } },
      },
    ],
  },
  {
    id: 'approvals-hrm',
    title: '4. Phê duyệt Đa cấp N Bước, HRM 360° & Smart Booking',
    badge: 'PROMAX HRM',
    endpoints: [
      {
        id: 'approvals-create',
        method: 'POST',
        path: '/api/v1/approvals/requests',
        title: 'Trình ký Tờ trình Phê duyệt Động theo Hạn mức Tiền',
        description: 'Tự động định tuyến qua Trưởng phòng -> Giám đốc Khối -> Giám đốc Chi nhánh kèm kiểm tra ủy quyền OOO.',
        authRequired: true,
        moduleKey: 'approvals',
        sampleBody: {
          workflow_id: 'uuid-wf',
          title: 'Đề nghị thanh toán nhà cung cấp hạ tầng Cloud',
          amount_vnd: 25000000,
          form_data: { vendor_name: 'Viettel IDC' },
        },
        sampleResponse: { success: true, data: { id: 'req-1', request_code: 'APR-261117-A1B2C3', total_steps: 2, status: 'pending' } },
      },
      {
        id: 'approvals-batch',
        method: 'POST',
        path: '/api/v1/approvals/requests/batch-decide',
        title: 'Phê duyệt / Từ chối Hàng loạt Tờ trình (Batch Decide)',
        description: 'Xử lý hàng loạt tờ trình đang chờ ở bước hiện tại của người duyệt chỉ với 1 giao dịch nguyên tử.',
        authRequired: true,
        moduleKey: 'approvals',
        sampleBody: { request_ids: ['req-1', 'req-2'], decision: 'approve', comment: 'Đồng ý phê duyệt ngân sách.' },
        sampleResponse: { success: true, data: { decision: 'approved', processed_count: 2 } },
      },
      {
        id: 'hrm-org-chart',
        method: 'GET',
        path: '/api/v1/hrm/org-chart',
        title: 'Sơ đồ Tổ chức Phân cấp (Chi nhánh -> Phòng ban -> Nhân sự)',
        description: 'Trả về cây tổ chức đa cấp kèm người quản lý, định biên nhân sự và số hợp đồng hiệu lực.',
        authRequired: true,
        moduleKey: 'hrm',
        sampleResponse: { success: true, data: { total_employees: 48, branches: [] } },
      },
    ],
  },
  {
    id: 'payroll-az',
    title: '5. Bảng lương, Phiếu Hợp tác & Kế toán A-Z (TT200/TT133)',
    badge: 'Payroll & Tax',
    endpoints: [
      {
        id: 'payroll-simulate',
        method: 'POST',
        path: '/api/v1/payroll/simulate',
        title: 'Mô phỏng Hai chiều Lương Gross <-> Net, BHXH & Thuế TNCN',
        description: 'Tính chính xác BHXH/BHYT/BHTN theo trần đóng và biểu thuế lũy tiến từng phần của doanh nghiệp.',
        authRequired: true,
        moduleKey: 'payroll',
        sampleBody: { mode: 'gross_to_net', amount_vnd: 30000000, dependents_count: 1 },
        sampleResponse: {
          success: true,
          data: { gross_pay_vnd: 30000000, emp_insurance_total_vnd: 3150000, pit_tax_vnd: 967500, net_pay_vnd: 25882500 },
        },
      },
      {
        id: 'coop-slips',
        method: 'POST',
        path: '/api/v1/payroll/cooperation-slips',
        title: 'Tạo Phiếu Hợp tác Phân bổ Doanh thu & Hoa hồng Đa Sale',
        description: 'Khởi tạo phiếu chia tỷ lệ hoa hồng tổng 100%, thu thập chữ ký số các bên và tự sinh sổ hoa hồng khi duyệt.',
        authRequired: true,
        moduleKey: 'payroll',
        sampleBody: {
          title: 'Hợp tác tư vấn Hợp đồng Enterprise Q4',
          estimated_value_vnd: 500000000,
          expected_commission_vnd: 15000000,
          shareholders: [
            { user_id: 'uuid-sale-1', percentage: 60 },
            { user_id: 'uuid-sale-2', percentage: 40 },
          ],
        },
        sampleResponse: { success: true, data: { slip_code: 'HT-202611-9F12', status: 'pending_signatures' } },
      },
      {
        id: 'accounting-az',
        method: 'GET',
        path: '/api/v1/payroll/accounting-az',
        title: 'Sổ Nhật ký Chung TT200/TT133, Đối soát BHXH & Tờ khai 05/KK-TNCN',
        description: 'Tổng hợp bút toán lương tự động (TK 334, 3383, 3384, 3386, 3335, 642, 112) và pháp nhân từ Chi nhánh trụ sở.',
        authRequired: true,
        moduleKey: 'payroll',
        queryParams: [{ name: 'period_key', type: 'string', desc: 'Kỳ kế toán YYYY-MM (VD: 2026-11)' }],
        sampleResponse: { success: true, data: { period_key: '2026-11', accounting_regime: 'TT200', journal_entries: [] } },
      },
    ],
  },
  {
    id: 'workchat-agent',
    title: '6. WorkChat Doanh nghiệp & DOM Agent 80 Công cụ AI',
    badge: 'AI & Comms',
    endpoints: [
      {
        id: 'workchat-send',
        method: 'POST',
        path: '/api/v1/workchat/channels/:id/messages',
        title: 'Gửi Tin nhắn, Thẻ Nghiệp vụ ERP hoặc Nhãn Công việc',
        description: 'Gửi tin nhắn thời gian thực, đính kèm thẻ ERP hoặc 9 bộ sticker thương mại + 12 nhãn trạng thái công việc.',
        authRequired: true,
        moduleKey: 'workchat',
        sampleBody: { message_type: 'work_badge', sticker_id: 'da_duyet', content: 'ĐÃ PHÊ DUYỆT' },
        sampleResponse: { success: true, data: { id: 'msg-1', message_type: 'work_badge' } },
      },
      {
        id: 'dom-agent-stream',
        method: 'POST',
        path: '/api/v1/dom-agent/chat/stream',
        title: 'Hội thoại Streaming SSE cùng DOM Agent (80 Công cụ RBAC)',
        description: 'Phản hồi luồng SSE (meta, tool, delta, chart, proposal, done) tuân thủ nghiêm ngặt RLS, RBAC và che PII.',
        authRequired: true,
        moduleKey: 'dom_agent',
        sampleBody: { specialist_key: 'executive_bi', message: 'Phân tích biểu đồ phễu khách hàng và dòng tiền tháng này' },
        sampleResponse: {
          event: 'done',
          tool_executions_count: 2,
          chart_data: { type: 'funnel', title: 'Phân bổ Khách hàng theo Bước Phễu CRM' },
        },
      },
      {
        id: 'dom-agent-proposal-exec',
        method: 'POST',
        path: '/api/v1/dom-agent/proposals/execute',
        title: 'Thực thi Thẻ Đề xuất Xác nhận Trước Khi Ghi (ActionProposalCard)',
        description: 'Thực thi hành động tạo Đơn nghỉ phép / Đề nghị Chi phí / Giao việc sau khi người dùng bấm Xác nhận.',
        authRequired: true,
        moduleKey: 'dom_agent',
        sampleBody: {
          action_type: 'leave',
          title: 'Đơn xin nghỉ phép năm 1 ngày',
          params: { total_days: 1, start_date: '2026-11-20', reason: 'Giải quyết việc gia đình' },
        },
        sampleResponse: { success: true, data: { entity_type: 'approval_request', status: 'pending' } },
      },
    ],
  },
];

const METHOD_COLORS: Record<ApiEndpointDoc['method'], { bg: string; color: string }> = {
  GET: { bg: '#EFF6FF', color: '#1E40FF' },
  POST: { bg: '#ECFDF5', color: '#059669' },
  PUT: { bg: '#FEF3C7', color: '#D97706' },
  PATCH: { bg: '#F3E8FF', color: '#7C3AED' },
  DELETE: { bg: '#FEF2F2', color: '#DC2626' },
};

function buildCodeSnippet(
  ep: ApiEndpointDoc,
  lang: 'curl' | 'ts' | 'python' | 'php',
  origin: string
): string {
  const url = `${origin}${ep.path}`;
  if (lang === 'curl') {
    const lines = [`curl -X ${ep.method} "${url}" \\`];
    if (ep.authRequired) {
      lines.push(`  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\`);
      lines.push(`  -H "X-Tenant-Slug: your-company-slug" \\`);
    }
    lines.push(`  -H "Content-Type: application/json"${ep.sampleBody ? ' \\' : ''}`);
    if (ep.sampleBody) {
      lines.push(`  -d '${JSON.stringify(ep.sampleBody, null, 2)}'`);
    }
    return lines.join('\n');
  }

  if (lang === 'ts') {
    return [
      `const response = await fetch('${url}', {`,
      `  method: '${ep.method}',`,
      `  headers: {`,
      ...(ep.authRequired
        ? [
            `    'Authorization': \`Bearer \${accessToken}\`,`,
            `    'X-Tenant-Slug': 'your-company-slug',`,
          ]
        : []),
      `    'Content-Type': 'application/json',`,
      `  },`,
      ...(ep.sampleBody ? [`  body: JSON.stringify(${JSON.stringify(ep.sampleBody, null, 2)}),`] : []),
      `});`,
      `const json = await response.json();`,
      `console.log(json);`,
    ].join('\n');
  }

  if (lang === 'python') {
    return [
      `import requests`,
      ``,
      `resp = requests.${ep.method.toLowerCase()}(`,
      `    "${url}",`,
      `    headers={`,
      ...(ep.authRequired
        ? [
            `        "Authorization": f"Bearer {access_token}",`,
            `        "X-Tenant-Slug": "your-company-slug",`,
          ]
        : []),
      `        "Content-Type": "application/json",`,
      `    },`,
      ...(ep.sampleBody ? [`    json=${JSON.stringify(ep.sampleBody, null, 4)},`] : []),
      `)`,
      `print(resp.status_code, resp.json())`,
    ].join('\n');
  }

  return [
    `<?php`,
    `$ch = curl_init('${url}');`,
    `curl_setopt($ch, CURLOPT_CUSTOMREQUEST, '${ep.method}');`,
    `curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);`,
    `curl_setopt($ch, CURLOPT_HTTPHEADER, [`,
    ...(ep.authRequired
      ? [
          `    'Authorization: Bearer ' . $accessToken,`,
          `    'X-Tenant-Slug: your-company-slug',`,
        ]
      : []),
    `    'Content-Type: application/json',`,
    `]);`,
    ...(ep.sampleBody
      ? [`curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(${JSON.stringify(ep.sampleBody)}));`]
      : []),
    `$result = json_decode(curl_exec($ch), true);`,
  ].join('\n');
}

export const ApiV1DocsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<'ALL' | ApiEndpointDoc['method']>('ALL');
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('auth-login');
  const [expandedCatIds, setExpandedCatIds] = useState<Record<string, boolean>>({
    auth: true,
    crm: true,
    marketing: true,
    'approvals-hrm': true,
    'payroll-az': true,
    'workchat-agent': true,
  });
  const [lang, setLang] = useState<'curl' | 'ts' | 'python' | 'php'>('curl');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://api.domation.vn';

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key.toLowerCase() === 'k') || (e.key === '/' && document.activeElement?.tagName !== 'INPUT')) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return API_V1_CATEGORIES.map((cat) => ({
      ...cat,
      endpoints: cat.endpoints.filter((ep) => {
        if (methodFilter !== 'ALL' && ep.method !== methodFilter) return false;
        if (!q) return true;
        return (
          ep.title.toLowerCase().includes(q) ||
          ep.path.toLowerCase().includes(q) ||
          ep.description.toLowerCase().includes(q) ||
          cat.title.toLowerCase().includes(q)
        );
      }),
    })).filter((cat) => cat.endpoints.length > 0);
  }, [searchQuery, methodFilter]);

  const activeEndpoint = useMemo(() => {
    for (const cat of filteredCategories) {
      const found = cat.endpoints.find((e) => e.id === selectedEndpointId);
      if (found) return found;
    }
    return filteredCategories[0]?.endpoints[0] || API_V1_CATEGORIES[0].endpoints[0];
  }, [filteredCategories, selectedEndpointId]);

  const totalEndpoints = useMemo(
    () => API_V1_CATEGORIES.reduce((sum, c) => sum + c.endpoints.length, 0),
    []
  );

  const copyText = (text: string, key: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    }
  };

  const snippet = useMemo(
    () => buildCodeSnippet(activeEndpoint, lang, origin),
    [activeEndpoint, lang, origin]
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA', color: '#0F172A' }}>
      {/* Top Bar */}
      <header style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '14px 24px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 1380, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src="/imgs/autodata/ICON.png"
              alt="DOMATION API"
              style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid #DBEAFE', padding: 4 }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0F172A' }}>
                  DOMATION Multi-Tenant REST API v1
                </span>
                <span style={{ padding: '2px 8px', borderRadius: 999, background: '#EFF6FF', color: '#1E40FF', fontSize: '0.72rem', fontWeight: 700 }}>
                  {totalEndpoints} Endpoints • RLS Isolated
                </span>
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                Chuẩn bảo mật JWT + X-Tenant-Slug + PostgreSQL FORCE RLS / MariaDB 10.6
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', minWidth: 260 }}>
              <Search size={15} color="#64748B" style={{ position: 'absolute', left: 12, top: 13 }} />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm endpoint, đường dẫn... (Ctrl+K)"
                style={{ width: '100%', height: 40, padding: '0 12px 0 36px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: '0.84rem', background: '#F8FAFC' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethodFilter(m)}
                  style={{
                    height: 36,
                    padding: '0 10px',
                    borderRadius: 8,
                    border: methodFilter === m ? 'none' : '1px solid #E2E8F0',
                    background: methodFilter === m ? '#1E40FF' : '#FFFFFF',
                    color: methodFilter === m ? '#FFFFFF' : '#475569',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Split Layout */}
      <div style={{ maxWidth: 1380, margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>
        {/* Left Navigation */}
        <aside style={{ background: '#FFFFFF', borderRadius: 18, border: '1px solid #E2E8F0', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredCategories.map((cat) => {
            const open = expandedCatIds[cat.id] !== false;
            return (
              <div key={cat.id} style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: 8 }}>
                <button
                  type="button"
                  onClick={() => setExpandedCatIds((prev) => ({ ...prev, [cat.id]: !open }))}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 6px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A' }}>{cat.title}</span>
                  {open ? <ChevronDown size={15} color="#64748B" /> : <ChevronRight size={15} color="#64748B" />}
                </button>
                {open && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                    {cat.endpoints.map((ep) => {
                      const active = ep.id === activeEndpoint.id;
                      const mStyle = METHOD_COLORS[ep.method];
                      return (
                        <button
                          key={ep.id}
                          type="button"
                          onClick={() => setSelectedEndpointId(ep.id)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 10px',
                            borderRadius: 10,
                            border: active ? '1px solid #BFDBFE' : '1px solid transparent',
                            background: active ? '#EFF6FF' : 'transparent',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <span style={{ padding: '2px 6px', borderRadius: 6, background: mStyle.bg, color: mStyle.color, fontSize: '0.66rem', fontWeight: 800, minWidth: 42, textAlign: 'center' }}>
                            {ep.method}
                          </span>
                          <span style={{ fontSize: '0.79rem', fontWeight: active ? 700 : 500, color: active ? '#1E40FF' : '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ep.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </aside>

        {/* Right Detail + Code Generator */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 20, padding: 28, border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <span style={{ padding: '4px 10px', borderRadius: 8, background: METHOD_COLORS[activeEndpoint.method].bg, color: METHOD_COLORS[activeEndpoint.method].color, fontWeight: 800, fontSize: '0.78rem' }}>
                {activeEndpoint.method}
              </span>
              <code style={{ padding: '6px 12px', borderRadius: 8, background: '#F1F5F9', color: '#0F172A', fontWeight: 700, fontSize: '0.86rem' }}>
                {activeEndpoint.path}
              </code>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: activeEndpoint.authRequired ? '#FEF3C7' : '#ECFDF5', color: activeEndpoint.authRequired ? '#B45309' : '#059669', fontSize: '0.74rem', fontWeight: 700 }}>
                {activeEndpoint.authRequired ? <><Lock size={12} /> Bearer JWT + X-Tenant-Slug</> : <><Shield size={12} /> Public Endpoint</>}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: '#EFF6FF', color: '#1E40FF', fontSize: '0.74rem', fontWeight: 700 }}>
                <Layers size={12} /> Module: {activeEndpoint.moduleKey}
              </span>
            </div>

            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 8px', color: '#0F172A' }}>
              {activeEndpoint.title}
            </h1>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', lineHeight: 1.6 }}>
              {activeEndpoint.description}
            </p>

            {(activeEndpoint.queryParams || activeEndpoint.bodyParams) && (
              <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0F172A' }}>
                  Tham số Đầu vào (Parameters)
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B' }}>
                      <th style={{ padding: '8px 10px' }}>Tên trường</th>
                      <th style={{ padding: '8px 10px' }}>Kiểu</th>
                      <th style={{ padding: '8px 10px' }}>Bắt buộc</th>
                      <th style={{ padding: '8px 10px' }}>Mô tả</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...(activeEndpoint.queryParams || []), ...(activeEndpoint.bodyParams || [])].map((p) => (
                      <tr key={p.name} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px' }}><code style={{ color: '#1E40FF', fontWeight: 700 }}>{p.name}</code></td>
                        <td style={{ padding: '10px', color: '#475569' }}>{p.type}</td>
                        <td style={{ padding: '10px' }}>{p.required ? <strong style={{ color: '#DC2626' }}>Có</strong> : 'Tùy chọn'}</td>
                        <td style={{ padding: '10px', color: '#334155' }}>{p.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SDK Code Generator */}
          <div style={{ background: '#0F172A', borderRadius: 20, padding: 22, color: '#F8FAFC' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Terminal size={16} color="#60A5FA" />
                <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>Mẫu Gọi Tích hợp Đa Ngôn ngữ</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {([
                  { id: 'curl', label: 'cURL' },
                  { id: 'ts', label: 'TypeScript' },
                  { id: 'python', label: 'Python' },
                  { id: 'php', label: 'PHP' },
                ] as const).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setLang(tab.id)}
                    style={{
                      height: 32,
                      padding: '0 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: lang === tab.id ? '#1E40FF' : '#1E293B',
                      color: '#FFFFFF',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => copyText(snippet, 'req')}
                  style={{ height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid #334155', background: '#1E293B', color: '#E2E8F0', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  {copiedKey === 'req' ? <><Check size={13} color="#34D399" /> Đã chép</> : <><Copy size={13} /> Sao chép</>}
                </button>
              </div>
            </div>
            <pre style={{ margin: 0, padding: 16, borderRadius: 12, background: '#020617', color: '#E2E8F0', fontSize: '0.8rem', lineHeight: 1.55, overflowX: 'auto' }}>
              <code>{snippet}</code>
            </pre>

            <div style={{ marginTop: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8' }}>
                  JSON Response Mẫu (200 / 201 OK)
                </span>
                <button
                  type="button"
                  onClick={() => copyText(JSON.stringify(activeEndpoint.sampleResponse, null, 2), 'res')}
                  style={{ height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#CBD5E1', fontSize: '0.72rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  {copiedKey === 'res' ? <><Check size={12} color="#34D399" /> Đã chép</> : <><Copy size={12} /> Chép JSON</>}
                </button>
              </div>
              <pre style={{ margin: 0, padding: 16, borderRadius: 12, background: '#020617', color: '#93C5FD', fontSize: '0.79rem', lineHeight: 1.5, overflowX: 'auto' }}>
                <code>{JSON.stringify(activeEndpoint.sampleResponse, null, 2)}</code>
              </pre>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ApiV1DocsPage;
