/**
 * DeveloperPlatforms.tsx
 *
 * The main "Developer Platforms" section rendered inside the Profile page.
 * Shows connected platform cards, summary stats, and an "Add Platform" button.
 */

import { useState } from 'react';
import { Plus, Code2 } from 'lucide-react';
import { Button, Skeleton, EmptyState } from '../ui';
import { cn } from '../../lib/utils';
import {
  useDeveloperPlatforms,
  useDisconnectDeveloperPlatform,
  useRefreshDeveloperPlatform,
  useUpdatePlatformVisibility,
} from '../../api/hooks';
import { fetchPlatformData } from '../../lib/platformServices';
import DeveloperStatsBar from './DeveloperStatsBar';
import PlatformCard from './PlatformCard';
import AddPlatformModal from './AddPlatformModal';
import toast from 'react-hot-toast';

interface Props {
  profileId: string;
  isSelf: boolean;
}

export default function DeveloperPlatforms({ profileId, isSelf }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const { data: connections, isLoading, isError } = useDeveloperPlatforms(profileId);
  const disconnect = useDisconnectDeveloperPlatform();
  const refresh = useRefreshDeveloperPlatform();
  const updateVisibility = useUpdatePlatformVisibility();

  const platforms = connections ?? [];
  const existingPlatformIds = platforms.map((c: any) => c.platform);

  const handleRefresh = async (connection: any) => {
    setRefreshingId(connection.id);
    try {
      const fresh = await fetchPlatformData(connection.platform, connection.platform_username);
      await refresh.mutateAsync({ id: connection.id, cachedData: fresh });
      toast.success('Platform data refreshed');
    } catch (err: any) {
      const msg = err.message === 'NOT_FOUND'
        ? 'Profile not found — username may have changed.'
        : err.message === 'RATE_LIMIT'
        ? 'Rate limited — try again later.'
        : 'Unable to refresh data right now.';
      toast.error(msg);
    } finally {
      setRefreshingId(null);
    }
  };

  const handleDisconnect = async (id: string, platformName: string) => {
    if (!window.confirm(`Disconnect ${platformName}? This will remove it from your profile.`)) return;
    setDisconnectingId(id);
    try {
      await disconnect.mutateAsync(id);
      toast.success(`${platformName} disconnected`);
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to disconnect platform.');
    } finally {
      setDisconnectingId(null);
    }
  };

  const handleToggleVisibility = async (connection: any) => {
    const next = connection.visibility === 'public' ? 'private' : 'public';
    try {
      await updateVisibility.mutateAsync({ id: connection.id, visibility: next });
      toast.success(`Visibility set to ${next}`);
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to update visibility.');
    }
  };

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-[18px]" />
          ))}
        </div>
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-[22px]" />
        ))}
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="rounded-[20px] border border-apple-red/20 bg-apple-red/5 px-6 py-8 text-center">
        <p className="text-[15px] font-semibold text-apple-red mb-1">Unable to load platforms</p>
        <p className="text-[13px] text-label-secondary">Check your connection and try refreshing the page.</p>
      </div>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────
  if (platforms.length === 0) {
    return (
      <>
        <EmptyState
          icon={<Code2 size={28} />}
          title={isSelf ? 'Connect your developer accounts' : 'No developer platforms connected'}
          description={
            isSelf
              ? 'Showcase your GitHub activity, competitive programming stats, open-source contributions and more — all in one place.'
              : 'This developer has not connected any developer platforms yet.'
          }
          action={
            isSelf ? (
              <Button onClick={() => setModalOpen(true)}>
                <Plus size={16} /> Add Developer Platform
              </Button>
            ) : undefined
          }
        />
        {isSelf && (
          <AddPlatformModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            existingPlatforms={existingPlatformIds}
          />
        )}
      </>
    );
  }

  // ── Full view ────────────────────────────────────────────────────────────
  return (
    <>
      {/* Summary stats */}
      <DeveloperStatsBar connections={platforms} />

      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[17px] font-semibold text-label-primary">
            Connected Platforms
          </h3>
          <p className="text-[13px] text-label-tertiary mt-0.5">
            {platforms.length} platform{platforms.length !== 1 ? 's' : ''} connected
          </p>
        </div>
        {isSelf && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setModalOpen(true)}
          >
            <Plus size={14} /> Add Platform
          </Button>
        )}
      </div>

      {/* Platform cards grid */}
      <div className={cn(
        'grid gap-4',
        platforms.length === 1 ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2',
      )}>
        {platforms.map((connection: any) => (
          <PlatformCard
            key={connection.id}
            connection={connection}
            isSelf={isSelf}
            onRefresh={() => void handleRefresh(connection)}
            onDisconnect={() => void handleDisconnect(connection.id, connection.platform)}
            onToggleVisibility={() => void handleToggleVisibility(connection)}
            isRefreshing={refreshingId === connection.id}
            isDisconnecting={disconnectingId === connection.id}
          />
        ))}
      </div>

      {/* Add Platform Modal */}
      {isSelf && (
        <AddPlatformModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          existingPlatforms={existingPlatformIds}
        />
      )}
    </>
  );
}
