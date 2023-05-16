export const fragmentDiscountedPrice = `
  fragment DiscountedPrice on DiscountedProductSearchPriceValue {
    value {
      currencyCode
      centAmount
    }
    discount {
      description(locale: $locale)
    }
  }
`;
