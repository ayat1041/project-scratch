'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@repo/ui/components/ui/button';
import { Badge } from '@repo/ui/components/ui/badge';
import type { SiteSeoSettingsVersionSummaryType } from '@repo/schemas-types/payload-schemas/content/site-seo-settings/response.schema';
import { handleRestoreSiteSeoSettingsVersion } from '../handlers';

interface VersionHistoryListProps {
  initialVersions: SiteSeoSettingsVersionSummaryType[];
}

export const VersionHistoryList = ({ initialVersions }: VersionHistoryListProps) => {
  const router = useRouter();
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const onRestore = async (versionId: string) => {
    setRestoringId(versionId);
    try {
      await handleRestoreSiteSeoSettingsVersion(versionId);
      router.push('/dashboard/content/seo-settings');
      router.refresh();
    } catch {
      // handler already surfaced a toast
    } finally {
      setRestoringId(null);
    }
  };

  if (initialVersions.length === 0) {
    return <p className="text-sm text-muted-foreground">No versions yet.</p>;
  }

  return (
    <div className="divide-y rounded-md border">
      {initialVersions.map((version) => (
        <div key={version.id} className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <span className="font-medium">Version {version.versionNumber}</span>
            <Badge variant={version.status === 'published' ? 'default' : 'secondary'}>
              {version.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {version.publishedAt
                ? `Published ${new Date(version.publishedAt).toLocaleString()}`
                : `Created ${new Date(version.createdAt).toLocaleString()}`}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={restoringId === version.id}
            onClick={() => onRestore(version.id)}
          >
            {restoringId === version.id ? 'Restoring...' : 'Restore as draft'}
          </Button>
        </div>
      ))}
    </div>
  );
};

VersionHistoryList.displayName = 'VersionHistoryList';
