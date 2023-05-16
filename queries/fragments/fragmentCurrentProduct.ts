export const fragmentCurrentProduct = `
  fragment CurrentProduct on ProductProjectionSearchResult {
    results {
      id
      version
      name(locale: $locale)
      slug(locale: $locale)
      description(locale: $locale)
      masterVariant {
        ...ProductVariant
      }
      variants {
        ...ProductVariant
      }
      categories {
        ...Categories
      }
    }
  }
`;
