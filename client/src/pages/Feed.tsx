import { useState } from 'react';
import { Rss, Sparkles } from 'lucide-react';
import { useFeed } from '../api/hooks';
import { FeedComposer, FeedPostCard } from '../components/feed/FeedPostCard';
import { Button, EmptyState, Skeleton, Reveal } from '../components/ui';

export default function Feed() {
  const [rankByAi, setRankByAi] = useState(false);
  const { data, isLoading, isError, error } = useFeed(rankByAi ? 'ai' : undefined);

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-20">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-heading-2">Feed</h1>
        <Button
          variant={rankByAi ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setRankByAi((v) => !v)}
          title="Rank posts with AI based on your skills and connections"
          className={rankByAi ? '!bg-[linear-gradient(135deg,#AF52DE_0%,#5AC8FA_100%)] !text-white !border-transparent shadow-md' : ''}
        >
          <Sparkles size={14} /> {rankByAi ? 'AI ranked' : 'Rank with AI'}
        </Button>
      </div>

      <Reveal>
        <FeedComposer />
      </Reveal>

      {isLoading && (
        <div className="space-y-5 mt-8">
          <Skeleton className="h-48 rounded-card" />
          <Skeleton className="h-48 rounded-card" />
        </div>
      )}

      {isError && (
        <div className="mt-8">
          <EmptyState
            title="Could not load the feed"
            description={(error as Error)?.message ?? 'Please try again shortly.'}
          />
        </div>
      )}

      {!isLoading && data?.items?.length === 0 && (
        <div className="mt-8">
          <EmptyState
            icon={<Rss size={32} />}
            title="Your feed is empty"
            description="Share your first update or connect with developers to see their posts here."
          />
        </div>
      )}

      <div className="space-y-5 mt-8 stagger-children">
        {data?.items?.map((post) => (
          <FeedPostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
