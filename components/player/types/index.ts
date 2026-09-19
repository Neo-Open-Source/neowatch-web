export interface SubtitleTrackOption {
  id: string
  label: string
  language: string
  url: string
}

export interface EpisodeInfo {
  id: string
  seriesTitle: string
  seasonNumber: number
  episodeNumber: number
  episodeTitle: string
  rating?: number
  thumbnail?: string
}

export interface MovieInfo {
  title: string
  year?: number
  rating?: number
}

export type ContentInfo = EpisodeInfo | MovieInfo

export interface AudioTrack {
  id: number
  label: string
  language: string
}

export interface SubtitleTrack {
  id: string | 'off'
  label: string
  language: string
}

export interface QualityLevel {
  id: number
  label: string
  height: number
  bitrate?: number
}

export interface SeasonOption {
  seasonNumber: number
  episodes: EpisodeInfo[]
}

export interface PlayerSettings {
  audioTrack: number
  subtitleTrack: string | 'off'
  subtitleSize: number
  quality: number | 'auto'
  playbackSpeed: number
}

export type PlayerState = 'playing' | 'paused' | 'buffering' | 'ended' | 'error'

export interface PlayerProps {
  src: string
  content: ContentInfo
  seasons?: SeasonOption[]
  poster?: string
  autoPlay?: boolean
  onClose?: () => void
  onNextEpisode?: () => void
  onSeasonChange?: (season: number, episode: EpisodeInfo) => void
  subtitles?: SubtitleTrackOption[]
  initialSettings?: Partial<PlayerSettings>
  className?: string
}

export interface CdnEpisodeDto {
  season: number
  episode: number
  title: string
  m3u8Url: string
}

export interface CdnVideoDto {
  id: string
  title: string
  isSeries: boolean
  m3u8Url: string
  season: number | null
  episode: number | null
  episodes: CdnEpisodeDto[]
}

export interface CdnPlayerOptions {
  apiUrl: string
  cdnId?: number
  imdbId?: string
  kpId?: number
  tmdbId?: number
  mediaType?: 'movie' | 'tv'
  season?: number
  episode?: number
}

export type CdnPlayerProps = CdnPlayerOptions &
  Omit<PlayerProps, 'src' | 'content' | 'seasons' | 'onNextEpisode' | 'onSeasonChange'>
