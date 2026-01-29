import { WatchlistDetail } from '@/components/watchlist/WatchlistDetail';

export default function WatchlistDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <WatchlistDetail watchlistId={params.id} />;
}
