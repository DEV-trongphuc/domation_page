import React from 'react';
import type { TenantSessionV2, WorkspaceScreenKey } from './autodataTypes';
import { AutodataClonedRoot } from './cloned/AutodataClonedRoot';

interface AutoDataWorkspaceAppProps {
  session: TenantSessionV2;
  initialView?: WorkspaceScreenKey;
  onSessionUpdated: (next: TenantSessionV2) => void;
  onLoggedOut: () => void;
  onNavigateSlug: (slug: string) => void;
  onSwitchWorkspaceRequested: () => void;
}

export const AutoDataWorkspaceApp: React.FC<AutoDataWorkspaceAppProps> = ({
  session,
  initialView = 'dashboard',
  onSessionUpdated,
  onLoggedOut,
  onNavigateSlug,
  onSwitchWorkspaceRequested,
}) => {
  return (
    <AutodataClonedRoot
      session={session}
      initialView={initialView}
      onSessionUpdated={onSessionUpdated}
      onLoggedOut={onLoggedOut}
      onNavigateSlug={onNavigateSlug}
      onSwitchWorkspaceRequested={onSwitchWorkspaceRequested}
    />
  );
};

export default AutoDataWorkspaceApp;
