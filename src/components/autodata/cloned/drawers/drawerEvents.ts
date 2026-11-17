import type {
  CrmCompanyRecord,
  CrmContactRecord,
  CrmDealRecord,
  HelpdeskTicketRecord,
  WorkspaceTaskRecord,
} from './crmTypes';

export function openGlobalCustomerDrawer(
  contactOrId: string | CrmContactRecord,
  initialTab = 'overview'
): void {
  if (typeof window === 'undefined') return;
  const detail =
    typeof contactOrId === 'string'
      ? { id: contactOrId, contactId: contactOrId, initialTab }
      : { contact: contactOrId, id: contactOrId.id, initialTab };
  window.dispatchEvent(new CustomEvent('open-customer-drawer', { detail }));
}

export function openGlobalCompanyDrawer(companyOrId: string | CrmCompanyRecord): void {
  if (typeof window === 'undefined') return;
  const detail =
    typeof companyOrId === 'string'
      ? { id: companyOrId, companyId: companyOrId }
      : { company: companyOrId, id: companyOrId.id };
  window.dispatchEvent(new CustomEvent('open-company-drawer', { detail }));
}

export function openGlobalDealDrawer(dealOrId: string | CrmDealRecord): void {
  if (typeof window === 'undefined') return;
  const detail =
    typeof dealOrId === 'string'
      ? { id: dealOrId, dealId: dealOrId }
      : { deal: dealOrId, id: dealOrId.id };
  window.dispatchEvent(new CustomEvent('open-deal-drawer', { detail }));
}

export function openGlobalTaskDrawer(taskOrId: string | WorkspaceTaskRecord): void {
  if (typeof window === 'undefined') return;
  const detail =
    typeof taskOrId === 'string'
      ? { id: taskOrId, taskId: taskOrId }
      : { task: taskOrId, id: taskOrId.id };
  window.dispatchEvent(new CustomEvent('open-global-task', { detail }));
}

export function openGlobalTicketDrawer(ticketOrId: string | HelpdeskTicketRecord): void {
  if (typeof window === 'undefined') return;
  const detail =
    typeof ticketOrId === 'string'
      ? { id: ticketOrId, ticketId: ticketOrId }
      : { ticket: ticketOrId, id: ticketOrId.id };
  window.dispatchEvent(new CustomEvent('open-ticket-drawer', { detail }));
}

export function openGenericEntityDrawer(entity: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('open-generic-entity-drawer', { detail: { entity } }));
}
