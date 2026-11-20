export interface SearchSource {
  id: string;
  name: string;
  mark: string;
  live: boolean;
}

export const searchSources: SearchSource[] = [
  { id: "neoani", name: "NeoAni", mark: "NA", live: true },
  { id: "neowatch", name: "NeoWatch", mark: "NW", live: false },
];
