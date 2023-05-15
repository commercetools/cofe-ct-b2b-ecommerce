export const fragmentProductVariant = `
  fragment ProductVariant on ProductSearchVariant {
    attributes: attributesRaw {
      name
      value
    }
    images {
      url
    }
    assets {
      sources {
        uri
      }
    }
    ...Prices
  }
`;
