import { Calendar, MapPin, Video } from 'lucide-react';
import { useEvents } from '../api/hooks';
import { Badge, Button, Card, CardBody, EmptyState, Skeleton } from '../components/ui';
import { formatDate } from '../lib/utils';
import { post } from '../lib/axios';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { qk } from '../api/hooks';
import type { Event } from '@devconnect/shared';

export default function Events() {
  const { data, isLoading } = useEvents();
  const queryClient = useQueryClient();

  const rsvp = async (id: string) => {
    try {
      await post(`/events/${id}/rsvp`, { status: 'going' });
      void queryClient.invalidateQueries({ queryKey: qk.events });
      toast.success('RSVP confirmed');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Calendar size={22} /> Events &amp; meetups
        </h1>
        <p className="text-sm text-slate-400">Upcoming developer events you can join.</p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      )}

      {!isLoading && !data?.items?.length && (
        <EmptyState
          icon={<Calendar size={26} />}
          title="No upcoming events"
          description="Check back soon — new meetups are added regularly."
        />
      )}

      <div className="space-y-3">
        {(data?.items as Event[] | undefined)?.map((event) => (
          <Card key={event.id} className="card-hover">
            <CardBody className="flex flex-wrap items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-brand-500/15 text-center">
                <div>
                  <p className="text-lg font-bold leading-none text-brand-300">
                    {new Date(event.date).getDate()}
                  </p>
                  <p className="text-[10px] uppercase text-brand-300/70">
                    {new Date(event.date).toLocaleDateString(undefined, { month: 'short' })}
                  </p>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium">{event.title}</h3>
                <p className="line-clamp-2 text-sm text-slate-400">{event.description}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>{formatDate(event.date)}</span>
                  {event.is_online ? (
                    <span className="flex items-center gap-1">
                      <Video size={12} /> Online
                    </span>
                  ) : event.location ? (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {event.location}
                    </span>
                  ) : null}
                  {event.rsvp_count ? <Badge>{event.rsvp_count} going</Badge> : null}
                </div>
              </div>
              <div className="flex gap-2">
                {event.url && (
                  <a href={event.url} target="_blank" rel="noreferrer noopener">
                    <Button size="sm" variant="outline">
                      Details
                    </Button>
                  </a>
                )}
                <Button size="sm" onClick={() => void rsvp(event.id)}>
                  RSVP
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
