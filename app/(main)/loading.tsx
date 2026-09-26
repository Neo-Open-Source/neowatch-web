import { ContinueWatchingRow } from "@/components/sections/ContinueWatchingRow";
import { WatchlistRow } from "@/components/sections/WatchlistRow";
import { StudiosRow } from "@/components/sections/StudiosRow";
import { TrendingRow } from "@/components/sections/TrendingRow";
import { MediaListRow } from "@/components/sections/MediaListRow";

export default function MainLoading() {
  return (
    <>
      <ContinueWatchingRow title="" />
      <WatchlistRow title="" />
      <StudiosRow title="" initialData={null} />
      <TrendingRow title="" initialData={null} />
      <MediaListRow title="" type="movie" initialData={null} />
      <MediaListRow title="" type="tv" initialData={null} />
    </>
  );
}
