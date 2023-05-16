export const fragmentFrSearchQuery = `
  fragment FrSearchQuery on ProductProjectionSearchResult {
    offset
    count
    total
    facets {
      facet
      value {
        type
        ... on TermsFacetResult {
          dataType
          total
           terms {
            ... on TermCount {
              count
              term
            }
          }
        }
        ... on RangeFacetResult {
          ranges {
            type
            ... on RangeCountDouble {
              count
              max
              min
              total
              totalCount
            }
          }
        }
      }
    }
  }
`;
