import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { DrawerSkeleton } from '../components/ui/Skeleton';
import type {
  CrmCompanyRecord,
  CrmContactRecord,
  CrmDealRecord,
  HelpdeskTicketRecord,
  WorkspaceTaskRecord,
} from './crmTypes';

const CustomerProfileDrawer = lazy(() => import('./CustomerProfileDrawer'));
const CompanyDrawer = lazy(() => import('./CompanyDrawer'));
const DealDrawer = lazy(() => import('./DealDrawer'));
const WorkspaceTaskDrawer = lazy(() => import('./WorkspaceTaskDrawer'));
const TicketDrawer = lazy(() => import('./TicketDrawer'));
const EntityDrawer = lazy(() => import('./EntityDrawer'));

interface CustomerDrawerState {
  open: boolean;
  contact: { id: string; name?: string } | CrmContactRecord | null;
  tab: string;
}

export const GlobalEntityDrawers: React.FC = () => {
  const location = useLocation();

  const [customerState, setCustomerState] = useState<CustomerDrawerState>({
    open: false,
    contact: null,
    tab: 'overview',
  });
  const [companyTarget, setCompanyTarget] = useState<{ id: string } | CrmCompanyRecord | null>(null);
  const [dealTarget, setDealTarget] = useState<{ id: string } | CrmDealRecord | null>(null);
  const [taskTarget, setTaskTarget] = useState<{ id: string } | WorkspaceTaskRecord | null>(null);
  const [ticketTarget, setTicketTarget] = useState<{ id: string } | HelpdeskTicketRecord | null>(null);
  const [genericEntity, setGenericEntity] = useState<Record<string, unknown> | null>(null);

  // Listen to URL query parameters (`?contact_id=`, `?deal_id=`, `?company_id=`, `?task_id=`, `?ticket_id=`)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const contactId = params.get('contact_id') || params.get('open_contact_id');
    const dealId = params.get('deal_id') || params.get('open_deal_id');
    const companyId = params.get('company_id') || params.get('open_company_id');
    const taskId = params.get('task_id') || params.get('open_task_id');
    const ticketId = params.get('ticket_id') || params.get('open_ticket_id');
    const tab = params.get('tab') || 'overview';

    const timer = window.setTimeout(() => {
      if (contactId) {
        setCustomerState({ open: true, contact: { id: contactId }, tab });
      } else if (dealId) {
        setDealTarget({ id: dealId });
      } else if (companyId) {
        setCompanyTarget({ id: companyId });
      } else if (taskId) {
        setTaskTarget({ id: taskId });
      } else if (ticketId) {
        setTicketTarget({ id: ticketId });
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [location.pathname, location.search]);

  // Listen to global CustomEvents and `.entity-mention` / `[data-entity-type]` clicks
  useEffect(() => {
    const onOpenCustomer = (e: Event) => {
      const d = (e as CustomEvent<Record<string, unknown>>).detail || {};
      const c =
        (d.contact as CrmContactRecord | undefined) ||
        (d.contactId ? { id: String(d.contactId) } : d.id ? { id: String(d.id) } : null);
      if (c) {
        setCustomerState({
          open: true,
          contact: c,
          tab: String(d.initialTab || d.tab || 'overview'),
        });
      }
    };

    const onOpenCompany = (e: Event) => {
      const d = (e as CustomEvent<Record<string, unknown>>).detail || {};
      const comp =
        (d.company as CrmCompanyRecord | undefined) ||
        (d.companyId ? { id: String(d.companyId) } : d.id ? { id: String(d.id) } : null);
      if (comp) setCompanyTarget(comp);
    };

    const onOpenDeal = (e: Event) => {
      const d = (e as CustomEvent<Record<string, unknown>>).detail || {};
      const dl =
        (d.deal as CrmDealRecord | undefined) ||
        (d.dealId ? { id: String(d.dealId) } : d.id ? { id: String(d.id) } : null);
      if (dl) setDealTarget(dl);
    };

    const onOpenTask = (e: Event) => {
      const d = (e as CustomEvent<Record<string, unknown>>).detail || {};
      const tk =
        (d.task as WorkspaceTaskRecord | undefined) ||
        (d.taskId ? { id: String(d.taskId) } : d.id ? { id: String(d.id) } : null);
      if (tk) setTaskTarget(tk);
    };

    const onOpenTicket = (e: Event) => {
      const d = (e as CustomEvent<Record<string, unknown>>).detail || {};
      const tk =
        (d.ticket as HelpdeskTicketRecord | undefined) ||
        (d.ticketId ? { id: String(d.ticketId) } : d.id ? { id: String(d.id) } : null);
      if (tk) setTicketTarget(tk);
    };

    const onOpenEntity = (e: Event) => {
      const d = (e as CustomEvent<Record<string, unknown>>).detail || {};
      const type = String(d.type || d.entityType || d.entity_type || '').toLowerCase();
      const id = String(d.id || d.entityId || d.entity_id || '');
      if (['contact', 'customer', 'lead', 'student', 'crm_profile'].includes(type) && id) {
        setCustomerState({ open: true, contact: { id }, tab: String(d.tab || 'overview') });
      } else if (['company', 'partner'].includes(type) && id) {
        setCompanyTarget({ id });
      } else if (type === 'deal' && id) {
        setDealTarget({ id });
      } else if (['task', 'activity'].includes(type) && id) {
        setTaskTarget({ id });
      } else if (type === 'ticket' && id) {
        setTicketTarget({ id });
      } else if (d.entity && typeof d.entity === 'object') {
        setGenericEntity(d.entity as Record<string, unknown>);
      }
    };

    const onOpenGeneric = (e: Event) => {
      const d = (e as CustomEvent<{ entity?: Record<string, unknown> }>).detail;
      if (d?.entity) setGenericEntity(d.entity);
    };

    const onGlobalClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest?.(
        '.entity-mention, [data-entity-type]'
      ) as HTMLElement | null;
      if (!target) return;
      const type = (target.getAttribute('data-entity-type') || '').toLowerCase();
      const id = target.getAttribute('data-entity-id') || '';
      if (!type || !id) return;
      e.preventDefault();
      e.stopPropagation();

      if (['contact', 'customer', 'lead', 'student', 'crm_profile'].includes(type)) {
        setCustomerState({ open: true, contact: { id }, tab: 'overview' });
      } else if (type === 'company') {
        setCompanyTarget({ id });
      } else if (type === 'deal') {
        setDealTarget({ id });
      } else if (['task', 'activity'].includes(type)) {
        setTaskTarget({ id });
      } else if (type === 'ticket') {
        setTicketTarget({ id });
      }
    };

    window.addEventListener('open-global-customer', onOpenCustomer);
    window.addEventListener('open-customer-drawer', onOpenCustomer);
    window.addEventListener('open-company-drawer', onOpenCompany);
    window.addEventListener('open-deal-drawer', onOpenDeal);
    window.addEventListener('open-global-task', onOpenTask);
    window.addEventListener('open-ticket-drawer', onOpenTicket);
    window.addEventListener('open-entity-drawer', onOpenEntity);
    window.addEventListener('open-generic-entity-drawer', onOpenGeneric);
    document.addEventListener('click', onGlobalClick);

    return () => {
      window.removeEventListener('open-global-customer', onOpenCustomer);
      window.removeEventListener('open-customer-drawer', onOpenCustomer);
      window.removeEventListener('open-company-drawer', onOpenCompany);
      window.removeEventListener('open-deal-drawer', onOpenDeal);
      window.removeEventListener('open-global-task', onOpenTask);
      window.removeEventListener('open-ticket-drawer', onOpenTicket);
      window.removeEventListener('open-entity-drawer', onOpenEntity);
      window.removeEventListener('open-generic-entity-drawer', onOpenGeneric);
      document.removeEventListener('click', onGlobalClick);
    };
  }, []);

  const hasActiveDrawer = Boolean(
    (customerState.open && customerState.contact) ||
      companyTarget ||
      dealTarget ||
      taskTarget ||
      ticketTarget ||
      genericEntity
  );

  if (!hasActiveDrawer) {
    return null;
  }

  return (
    <Suspense fallback={<DrawerSkeleton />}>
      {customerState.open && customerState.contact && (
        <CustomerProfileDrawer
          isOpen={customerState.open}
          contact={customerState.contact}
          initialTab={customerState.tab}
          onClose={() => setCustomerState({ open: false, contact: null, tab: 'overview' })}
        />
      )}

      {companyTarget && (
        <CompanyDrawer
          isOpen={Boolean(companyTarget)}
          company={companyTarget}
          onClose={() => setCompanyTarget(null)}
        />
      )}

      {dealTarget && (
        <DealDrawer
          isOpen={Boolean(dealTarget)}
          deal={dealTarget}
          onClose={() => setDealTarget(null)}
        />
      )}

      {taskTarget && (
        <WorkspaceTaskDrawer
          isOpen={Boolean(taskTarget)}
          task={taskTarget}
          onClose={() => setTaskTarget(null)}
        />
      )}

      {ticketTarget && (
        <TicketDrawer
          isOpen={Boolean(ticketTarget)}
          ticket={ticketTarget}
          onClose={() => setTicketTarget(null)}
        />
      )}

      {genericEntity && (
        <EntityDrawer
          isOpen={Boolean(genericEntity)}
          entity={genericEntity}
          onClose={() => setGenericEntity(null)}
        />
      )}
    </Suspense>
  );
};

export default GlobalEntityDrawers;
