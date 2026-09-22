import { gql } from "@apollo/client";

// ── Fragments ───────────────────────────────────────────────────────────────

export const MEDIA_ITEM_FRAGMENT = gql`
  fragment MediaItemFields on MediaItem {
    tmdbId
    title
    originalTitle
    overview
    poster
    backdrop
    releaseDate
    genres {
      id
      name
    }
    voteAverage
    voteCount
    popularity
    certification
    imdbRating
  }
`;

export const TRENDING_ITEM_FRAGMENT = gql`
  fragment TrendingItemFields on TrendingItem {
    ...MediaItemFields
    mediaType
  }
  ${MEDIA_ITEM_FRAGMENT}
`;

// ── Media ───────────────────────────────────────────────────────────────────

export const GET_MEDIA = gql`
  query GetMedia($type: MediaType!, $id: Int!, $language: String) {
    media(type: $type, id: $id, language: $language) {
      ... on MovieDetail {
        tmdbId
        title
        originalTitle
        overview
        poster
        backdrop
        releaseDate
        genres { id name }
        voteAverage
        voteCount
        popularity
        certification
        imdbId
        kpId
        imdbRating
        imdbVotes
        runtime
        budget
        revenue
        status
        tagline
        productionCompanies { id name logo }
        collection { id name poster }
        trailers
        credits {
          cast { id name character profile order }
          crew { id name job department profile }
        }
      }
      ... on TVDetail {
        tmdbId
        title
        originalTitle
        overview
        poster
        backdrop
        releaseDate
        genres { id name }
        voteAverage
        voteCount
        popularity
        certification
        imdbId
        kpId
        imdbRating
        imdbVotes
        seasons { id name seasonNumber episodeCount overview poster airDate }
        numberOfSeasons
        numberOfEpisodes
        status
        tagline
        networks { id name logo }
        productionCompanies { id name logo }
        trailers
        credits {
          cast { id name character profile order }
          crew { id name job department profile }
        }
      }
    }
  }
`;

export const GET_MEDIA_CREDITS = gql`
  query GetMediaCredits($type: MediaType!, $id: Int!, $language: String) {
    mediaCredits(type: $type, id: $id, language: $language) {
      cast { id name character profile order }
      crew { id name job department profile }
    }
  }
`;

export const GET_SEASON = gql`
  query GetSeason($tvId: Int!, $season: Int!, $language: String) {
    season(tvId: $tvId, season: $season, language: $language) {
      id
      name
      seasonNumber
      overview
      poster
      airDate
      episodes {
        id
        name
        overview
        still
        airDate
        episodeNumber
        seasonNumber
        voteAverage
        runtime
      }
    }
  }
`;

// ── Lists ───────────────────────────────────────────────────────────────────

export const GET_TRENDING = gql`
  query GetTrending($type: MediaType, $page: Int, $language: String) {
    trending(type: $type, page: $page, language: $language) {
      items {
        ...TrendingItemFields
      }
      page
      totalPages
      totalResults
    }
  }
  ${TRENDING_ITEM_FRAGMENT}
`;

export const GET_MOVIE_LIST = gql`
  query GetMovieList($list: MovieList!, $page: Int, $language: String) {
    movieList(list: $list, page: $page, language: $language) {
      items {
        ...MediaItemFields
      }
      page
      totalPages
      totalResults
    }
  }
  ${MEDIA_ITEM_FRAGMENT}
`;

export const GET_TV_LIST = gql`
  query GetTVList($list: TVList!, $page: Int, $language: String) {
    tvList(list: $list, page: $page, language: $language) {
      items {
        ...MediaItemFields
      }
      page
      totalPages
      totalResults
    }
  }
  ${MEDIA_ITEM_FRAGMENT}
`;

// ── Related ─────────────────────────────────────────────────────────────────

export const GET_SIMILAR = gql`
  query GetSimilar($type: MediaType!, $id: Int!, $page: Int, $language: String) {
    similar(type: $type, id: $id, page: $page, language: $language) {
      items { ...MediaItemFields }
      page
      totalPages
      totalResults
    }
  }
  ${MEDIA_ITEM_FRAGMENT}
`;

export const GET_RECOMMENDATIONS = gql`
  query GetRecommendations($type: MediaType!, $id: Int!, $page: Int, $language: String) {
    recommendations(type: $type, id: $id, page: $page, language: $language) {
      items { ...MediaItemFields }
      page
      totalPages
      totalResults
    }
  }
  ${MEDIA_ITEM_FRAGMENT}
`;

export const GET_RELATED_BY_CAST = gql`
  query GetRelatedByCast($type: MediaType!, $id: Int!, $page: Int, $language: String) {
    relatedByCast(type: $type, id: $id, page: $page, language: $language) {
      items { ...MediaItemFields }
      page
      totalPages
      totalResults
    }
  }
  ${MEDIA_ITEM_FRAGMENT}
`;

export const GET_RELATED_BY_STUDIO = gql`
  query GetRelatedByStudio($type: MediaType!, $id: Int!, $page: Int, $language: String) {
    relatedByStudio(type: $type, id: $id, page: $page, language: $language) {
      items { ...MediaItemFields }
      page
      totalPages
      totalResults
      label
    }
  }
  ${MEDIA_ITEM_FRAGMENT}
`;

// ── Search ──────────────────────────────────────────────────────────────────

export const SEARCH = gql`
  query Search(
    $q: String, $type: SearchType, $genre: String, $year: Int,
    $yearFrom: Int, $yearTo: Int, $rating: Float,
    $ratingFrom: Float, $ratingTo: Float, $keyword: String,
    $country: String, $sortBy: String, $page: Int, $language: String
  ) {
    search(
      q: $q, type: $type, genre: $genre, year: $year,
      yearFrom: $yearFrom, yearTo: $yearTo, rating: $rating,
      ratingFrom: $ratingFrom, ratingTo: $ratingTo, keyword: $keyword,
      country: $country, sortBy: $sortBy, page: $page, language: $language
    ) {
      items {
        ... on MediaItem {
          ...MediaItemFields
        }
        ... on PersonSearchItem {
          mediaType
          tmdbId
          name
          profile
          department
        }
      }
      page
      totalPages
      totalResults
    }
  }
  ${MEDIA_ITEM_FRAGMENT}
`;

// ── Genres ──────────────────────────────────────────────────────────────────

export const GET_GENRES = gql`
  query GetGenres($language: String) {
    genres(language: $language) {
      movie { id name }
      tv { id name }
    }
  }
`;

// ── People ──────────────────────────────────────────────────────────────────

export const GET_PERSON = gql`
  query GetPerson($id: Int!, $language: String) {
    person(id: $id, language: $language) {
      tmdbId
      name
      profile
      department
    }
  }
`;

export const GET_PERSON_CREDITS = gql`
  query GetPersonCredits($id: Int!, $page: Int, $language: String) {
    personCredits(id: $id, page: $page, language: $language) {
      items {
        tmdbId
        title
        originalTitle
        overview
        poster
        releaseDate
        voteAverage
        voteCount
        popularity
        mediaType
        role
        creditType
      }
      page
      totalPages
      totalResults
    }
  }
`;

// ── Categories ──────────────────────────────────────────────────────────────

export const GET_CATEGORIES = gql`
  query GetCategories($language: String) {
    categories(language: $language) {
      section
      items { id name slug type backdrop }
    }
  }
`;

export const GET_CATEGORY_COLLECTION = gql`
  query GetCategoryCollection($slug: String!, $page: Int, $language: String) {
    categoryCollection(slug: $slug, page: $page, language: $language) {
      category { id name slug }
      items { ...MediaItemFields }
      page
      totalPages
      totalResults
    }
  }
  ${MEDIA_ITEM_FRAGMENT}
`;

// ── Players ─────────────────────────────────────────────────────────────────

export const GET_PLAYER = gql`
  query GetPlayer($provider: PlayerProvider!, $kpId: Int, $tmdbId: Int, $imdbId: String, $season: Int, $episode: Int) {
    player(provider: $provider, kpId: $kpId, tmdbId: $tmdbId, imdbId: $imdbId, season: $season, episode: $episode) {
      provider
      url
      type
    }
  }
`;

export const GET_CDN_PLAYER = gql`
  query GetCdnPlayer($cdnId: Int, $kpId: Int, $imdbId: String, $season: Int, $episode: Int) {
    cdnPlayer(cdnId: $cdnId, kpId: $kpId, imdbId: $imdbId, season: $season, episode: $episode) {
      provider
      id
      title
      isSeries
      m3u8Url
      season
      episode
      episodes { season episode title m3u8Url }
    }
  }
`;

// ── Collection ──────────────────────────────────────────────────────────────

export const GET_COLLECTION = gql`
  query GetCollection($id: Int!, $language: String) {
    mediaCollection(id: $id, language: $language) {
      id
      name
      overview
      poster
      backdrop
      parts { ...MediaItemFields }
    }
  }
  ${MEDIA_ITEM_FRAGMENT}
`;

// ── Auth / User ─────────────────────────────────────────────────────────────

export const GET_LOGIN_URL = gql`
  query GetLoginUrl($redirectUri: String, $codeChallenge: String) {
    loginUrl(redirectUri: $redirectUri, codeChallenge: $codeChallenge)
  }
`;

export const GET_FAVORITES = gql`
  query GetFavorites($page: Int, $language: String) {
    favorites(page: $page, language: $language) {
      items {
        ...MediaItemFields
        mediaId
        mediaType
        createdAt
      }
      page
      totalPages
      totalResults
    }
  }
  ${MEDIA_ITEM_FRAGMENT}
`;

export const GET_WATCH_LATER = gql`
  query GetWatchLater {
    watchLater {
      mediaId
      createdAt
    }
  }
`;

export const GET_SYNC_PROGRESS = gql`
  query GetSyncProgress {
    syncProgress {
      mediaId
      mediaType
      season
      episode
      progress
      updatedAt
    }
  }
`;

// ── Support / Torrents ──────────────────────────────────────────────────────

export const GET_SUPPORTERS = gql`
  query GetSupporters {
    supporters {
      id
      name
      type
      description
      contributions
      year
      isActive
    }
  }
`;

export const SEARCH_TORRENTS = gql`
  query SearchTorrents($q: String, $imdbId: String) {
    torrentSearch(q: $q, imdbId: $imdbId) {
      title
      seeders
      leechers
      size
      magnet
      quality
      type
    }
  }
`;

// ── Mutations ───────────────────────────────────────────────────────────────

export const ADD_FAVORITE = gql`
  mutation AddFavorite($mediaId: Int!, $mediaType: MediaType) {
    addFavorite(mediaId: $mediaId, mediaType: $mediaType) {
      id
      mediaId
      mediaType
      createdAt
    }
  }
`;

export const REMOVE_FAVORITE = gql`
  mutation RemoveFavorite($mediaId: Int!, $mediaType: MediaType) {
    removeFavorite(mediaId: $mediaId, mediaType: $mediaType)
  }
`;

export const ADD_WATCH_LATER = gql`
  mutation AddToWatchLater($mediaId: Int!) {
    addToWatchLater(mediaId: $mediaId) {
      mediaId
      createdAt
    }
  }
`;

export const REMOVE_WATCH_LATER = gql`
  mutation RemoveFromWatchLater($mediaId: Int!) {
    removeFromWatchLater(mediaId: $mediaId)
  }
`;

export const UPSERT_PROGRESS = gql`
  mutation UpsertProgress($mediaId: Int!, $mediaType: MediaType, $season: Int, $episode: Int, $progress: Float!) {
    upsertProgress(mediaId: $mediaId, mediaType: $mediaType, season: $season, episode: $episode, progress: $progress) {
      mediaId
      mediaType
      season
      episode
      progress
      updatedAt
    }
  }
`;

export const BATCH_SYNC_PROGRESS = gql`
  mutation BatchSyncProgress($items: [SyncProgressInput!]!) {
    batchSyncProgress(items: $items) {
      items {
        mediaId
        mediaType
        season
        episode
        progress
        updatedAt
      }
      count
    }
  }
`;

export const REFRESH_TOKENS = gql`
  mutation RefreshTokens($refreshToken: String!) {
    refreshTokens(refreshToken: $refreshToken) {
      accessToken
      refreshToken
      idToken
      expiresIn
    }
  }
`;

export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;
