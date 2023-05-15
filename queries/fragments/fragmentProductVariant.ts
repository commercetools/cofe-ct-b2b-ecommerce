export const fragmentProductVariant = `
  fragment ProductVariant on ProductSearchVariant {
    attributes: attributesRaw {
      name
      value
    }
    ...Prices
  }
`;
