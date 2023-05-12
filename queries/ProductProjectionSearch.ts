const parameterToString = (parameters) => Object.entries(parameters)
  .map(([key, value]) => `${key}: ${value}`)
  .join(", ");

const query = (parameters: Record<string, any>) => `
  query GetProducts($locale: Locale, $currency: Currency!) {
    productProjectionSearch(${parameterToString(parameters)}) {
      ...FrSearchQuery
      ...CurrentProduct
    }
  }
`;

const fragmentDiscountedPrice = `
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

const fragmentPrices = `
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

const fragmentProductVariant = `
  fragment ProductVariant on ProductSearchVariant {
    attributesRaw {
      name
      value
    }
    ...Prices
  }
`;

const fragmentFrSearchQuery = `
  fragment FrSearchQuery on ProductProjectionSearchResult {
    offset
    count
    total
    facets {
      facet
      value {
        type
      }
    }
  }
`;

const fragmentCategories = `
  fragment Categories on Category {
    id
    name(locale: $locale)
    slug(locale: $locale)
    ancestors {
      id
    }
    orderHint
    parent {
      id
    }
  }
`;

const fragmentCurrentProduct = `
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

export const productProjectionSearchQuery = (parameters: Record<string, any>) => `${fragmentDiscountedPrice}${fragmentPrices}${fragmentProductVariant}${fragmentFrSearchQuery}${fragmentCategories}${fragmentCurrentProduct}${query(parameters)}`;
