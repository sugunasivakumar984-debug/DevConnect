import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sparkles, MapPin, Filter, Bookmark } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAiSearch, useSaveSearch, useSearchDevelopers, useTrendingSkills } from '../api/hooks';
import { Avatar, Badge, Button, Card, CardBody, Chip, EmptyState, Input, Label, Skeleton } from '../components/ui';
import { avatarGradient, availabilityLabel } from '../lib/utils';
import type { DeveloperSearchFilters, Profile } from '@devconnect/shared';

export default function Developers() {
  const [filters, setFilters] = useState<DeveloperSearchFilters>({ page: 1, pageSize: 12 });
  const [showFilters, setShowFilters] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResults, setAiResults] = useState<Profile[] | null>(null);

  const { data, isLoading } = useSearchDevelopers(filters);
  const { data: trending } = useTrendingSkills();
  const aiSearch = useAiSearch();
  const saveSearch = useSaveSearch();

  const update = (patch: Partial<DeveloperSearchFilters>) =>
    setFilters((f) => ({ ...f, ...patch, page: 1 }));

  const onAiSearch = async () => {
    if (aiQuery.trim().length < 3) return;
    try {
      const result = await aiSearch.mutateAsync(aiQuery);
      setAiResults(result.results);
      toast.success('AI search complete');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const onSaveSearch = async () => {
    try {
      await saveSearch.mutateAsync({
        name: filters.q || 'Saved search',
        query: filters.q ?? '',
        filters: filters as unknown as Record<string, unknown>,
      });
      toast.success('Search saved');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const items = aiResults ?? data?.items ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Find developers</h1>
        <p className="text-sm text-slate-400">Search by name, skills, location and availability.</p>
      </div>

      {/* AI search */}
      <Card className="border-brand-500/20 bg-brand-500/5">
        <CardBody className="space-y-3">
          <p className="flex items-center gap-2 text-sm font-medium text-brand-200">
            <Sparkles size={15} /> Natural language search
          </p>
          <div className="flex gap-2">
            <Input
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void onAiSearch()}
              placeholder='e.g. "frontend React developers in Berlin with 3+ years"'
            />
            <Button onClick={() => void onAiSearch()} loading={aiSearch.isPending}>
              Search
            </Button>
          </div>
          {aiResults && (
            <button
              type="button"
              className="text-xs text-slate-400 hover:text-white"
              onClick={() => setAiResults(null)}
            >
              Clear AI results
            </button>
          )}
        </CardBody>
      </Card>

      {/* Keyword search + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input
            value={filters.q ?? ''}
            onChange={(e) => update({ q: e.target.value })}
            placeholder="Search by name or headline…"
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={() => setShowFilters((v) => !v)}>
          <Filter size={15} /> Filters
        </Button>
        <Button variant="outline" onClick={() => void onSaveSearch()}>
          <Bookmark size={15} /> Save
        </Button>
      </div>

      {showFilters && (
        <Card>
          <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label>Skills (comma separated)</Label>
              <Input
                value={filters.skills?.join(', ') ?? ''}
                onChange={(e) =>
                  update({ skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })
                }
                placeholder="React, TypeScript"
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input value={filters.location ?? ''} onChange={(e) => update({ location: e.target.value })} />
            </div>
            <div>
              <Label>Availability</Label>
              <select
                value={filters.availability ?? ''}
                onChange={(e) => update({ availability: (e.target.value || undefined) as never })}
                className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm"
              >
                <option value="">Any</option>
                <option value="open_to_work">Open to work</option>
                <option value="hiring">Hiring</option>
                <option value="busy">Busy</option>
              </select>
            </div>
            <div>
              <Label>Minimum years</Label>
              <Input
                type="number"
                min={0}
                value={filters.min_years ?? ''}
                onChange={(e) => update({ min_years: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={Boolean(filters.open_to_work)}
                  onChange={(e) => update({ open_to_work: e.target.checked || undefined })}
                  className="rounded border-slate-700 bg-slate-900"
                />
                Only developers open to work
              </label>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Trending skills */}
      {trending?.length ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Trending:</span>
          {trending.slice(0, 8).map((s: any) => (
            <Chip key={s.name} onClick={() => update({ skills: [s.name] })}>
              {s.name} <span className="text-slate-500">{s.count}</span>
            </Chip>
          ))}
        </div>
      ) : null}

      {isLoading && !aiResults && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <EmptyState
          icon={<Search size={26} />}
          title="No developers found"
          description="Try broadening your filters or search terms."
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((person: any) => (
          <Card key={person.id} className="card-hover">
            <CardBody className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar
                  src={person.avatar_url}
                  name={person.full_name ?? person.username}
                  size={44}
                  gradient={avatarGradient(person.username)}
                />
                <div className="min-w-0">
                  <Link to={`/u/${person.username}`} className="block truncate font-medium hover:text-brand-300">
                    {person.full_name ?? person.username}
                  </Link>
                  <p className="truncate text-xs text-slate-500">@{person.username}</p>
                </div>
              </div>

              <p className="line-clamp-2 text-sm text-slate-400">
                {person.headline ?? 'Developer on DevConnect'}
              </p>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {person.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {person.location}
                  </span>
                )}
                <Badge tone={person.availability === 'open_to_work' ? 'success' : 'default'}>
                  {availabilityLabel(person.availability)}
                </Badge>
              </div>

              <Link to={`/u/${person.username}`} className="block">
                <Button size="sm" variant="secondary" className="w-full">
                  View profile
                </Button>
              </Link>
            </CardBody>
          </Card>
        ))}
      </div>

      {!aiResults && data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={filters.page === 1}
            onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
          >
            Previous
          </Button>
          <span className="text-sm text-slate-400">
            Page {data.page} of {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!data.hasMore}
            onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
