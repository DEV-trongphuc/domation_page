export interface DomationConsultationInput {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  service?: string;
  budget_or_scale?: string;
  addons_summary?: string;
  total_price_vnd?: number;
  message?: string;
  source_form: string;
  metadata?: Record<string, unknown>;
}

export interface DomationConsultationResult {
  lead_code?: string;
  saved_to_db?: boolean;
  sheets_dispatched?: boolean;
  customer_mail_status?: string | null;
}

export async function submitDomationConsultation(
  input: DomationConsultationInput
): Promise<DomationConsultationResult> {
  const isBrowser = typeof window !== 'undefined';
  const searchParams = isBrowser ? new URLSearchParams(window.location.search) : null;

  const payload = {
    event_type: 'consultation',
    name: (input.name || '').trim(),
    email: (input.email || '').trim().toLowerCase(),
    phone: (input.phone || '').trim(),
    company: (input.company || '').trim(),
    service: (input.service || 'Tư vấn Giải pháp DOMATION').trim(),
    budget_or_scale: (input.budget_or_scale || '').trim(),
    addons_summary: (input.addons_summary || '').trim(),
    total_price_vnd: input.total_price_vnd || undefined,
    message: (input.message || '').trim(),
    source_form: input.source_form,
    page_path: isBrowser ? window.location.pathname : '',
    page_url: isBrowser ? window.location.href : '',
    utm_source: searchParams?.get('utm_source') || '',
    utm_medium: searchParams?.get('utm_medium') || '',
    utm_campaign: searchParams?.get('utm_campaign') || '',
    metadata: input.metadata || {},
  };

  try {
    const res = await fetch('/api/autodata?action=consultation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok || (json && json.success === false)) {
      const errMessage =
        json?.error?.message || `Không thể gửi yêu cầu (HTTP ${res.status}).`;
      // Validation error from backend (4xx) should be surfaced directly to the user
      if (res.status >= 400 && res.status < 500) {
        throw new Error(errMessage);
      }
      throw new Error(errMessage);
    }

    return (json?.data || json || {}) as DomationConsultationResult;
  } catch (err) {
    // Optional direct Apps Script fallback when explicitly configured for pure static environments
    const directFallbackUrl = (
      (import.meta as unknown as { env?: Record<string, string> }).env
        ?.VITE_DOMATION_MASTER_APPSCRIPT_URL || ''
    ).trim();

    if (
      directFallbackUrl &&
      (!(err instanceof Error) || !err.message.includes('Email') && !err.message.includes('Số điện thoại'))
    ) {
      await fetch(directFallbackUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      return { saved_to_db: false, sheets_dispatched: true };
    }

    throw err;
  }
}
