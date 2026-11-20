const cardFields = /* GraphQL */ `
  fragment ShelfCardFields on Card {
    key
    kind
    title
    titleOriginal
    year
    poster
    rating
    genresRu
    tagsRu
    ageRating
    description
    available
  }
`;

export const SEARCH_QUERY = /* GraphQL */ `
  ${cardFields}
  query Search($q: String, $kind: String, $genre: String, $tag: String, $studio: String, $page: Int, $limit: Int) {
    search(q: $q, kind: $kind, genre: $genre, tag: $tag, studio: $studio, page: $page, limit: $limit) {
      page
      totalPages
      totalResults
      items {
        ...ShelfCardFields
      }
    }
  }
`;
