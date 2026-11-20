export interface WatchTrack {
  id: string;
  label: string;
}

export interface WatchSourceTrack {
  trackId: string;
  quality?: string | undefined;
}

export interface WatchSource {
  id: string;
  label: string;
  tracks: {
    voice: WatchSourceTrack[];
    subtitle: WatchSourceTrack[];
  };
}

export interface WatchEpisode {
  number: number;
  available: boolean;
}

export const watchTracks: WatchTrack[] = [
  { id: "v1", label: "audio band" },
  { id: "v2", label: "voice two" },
  { id: "v3", label: "dub three" },
  { id: "v4", label: "voice four" },
  { id: "v5", label: "audio five" },
  { id: "v6", label: "voice six" },
  { id: "v7", label: "dub seven" },
  { id: "v8", label: "voice eight" },
  { id: "v9", label: "alt voice" },
  { id: "v10", label: "voice ten" },
  { id: "s-ru", label: "subs ru" },
  { id: "s-en", label: "subs en" },
  { id: "s-jp", label: "subs jp" },
];

export const watchSources: WatchSource[] = [
  {
    id: "player",
    label: "player",
    tracks: {
      voice: [
        { trackId: "v1", quality: "4K" },
        { trackId: "v2", quality: "FHD" },
        { trackId: "v3", quality: "4K" },
        { trackId: "v4", quality: "FHD" },
        { trackId: "v5", quality: "FHD" },
        { trackId: "v6", quality: "FHD" },
        { trackId: "v7" },
        { trackId: "v8", quality: "FHD" },
      ],
      subtitle: [{ trackId: "s-ru" }, { trackId: "s-en" }, { trackId: "s-jp" }],
    },
  },
  {
    id: "alternative",
    label: "alternative",
    tracks: {
      voice: [
        { trackId: "v9", quality: "FHD" },
        { trackId: "v10" },
        { trackId: "v3", quality: "FHD" },
        { trackId: "v7" },
        { trackId: "v5", quality: "FHD" },
      ],
      subtitle: [{ trackId: "s-ru" }],
    },
  },
];

export const watchEpisodes: WatchEpisode[] = Array.from({ length: 8 }, (_, index) => ({
  number: index + 1,
  available: index === 0,
}));
