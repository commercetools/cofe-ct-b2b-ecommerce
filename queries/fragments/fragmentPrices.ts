export const fragmentPrices = `
  fragment Prices on ProductSearchVariant {
    scopedPrice {
      value {
        centAmount
        currencyCode
      }
      channel {
        id
      }
      discounted {
        ...DiscountedPrice
      }
    }
    prices {
      value {
        currencyCode
        centAmount
      }
      channel {
        id
      }
      discounted {
        ...DiscountedPrice
      }
      customerGroup {
        key
      }
      country
    }
    price(currency: $currency) {
      channel {
        id
      }
      discounted {
        ...DiscountedPrice
      }
      value {
        currencyCode
        centAmount
      }
    }
  }
`;
