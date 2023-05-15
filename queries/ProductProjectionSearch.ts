function generateParameterString(parameters: any) {
  const parameterPairs: any[] = [];

  // Recursively traverse the parameters object
  function traverse(obj: any, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      const paramName = prefix ? `${prefix}.${key}` : key;
      if (Array.isArray(value)) {
        const arrayValues = value.map((item) => JSON.stringify(item)).join(', ');
        parameterPairs.push(`${paramName}: [${arrayValues}]`);
      } else if (typeof value === 'object' && value !== null) {
        const objectValue = generateParameterString(value);
        parameterPairs.push(`${paramName}: ${objectValue}`);
      } else {
        parameterPairs.push(`${paramName}: ${JSON.stringify(value)}`);
      }
    }
  }

  traverse(parameters);

  return `{ ${parameterPairs.join(', ')} }`.replace(/"([^"]+)":/g, '$1:');
}

function parametersToString(parameters: any) {
  const result = generateParameterString(parameters);
  return result.slice(1, -1);
}
const query = (parameters: Record<string, any>) => `
  query GetProducts($locale: Locale, $currency: Currency!) {
    productProjectionSearch(${parametersToString(parameters)}) {
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

export const productProjectionSearchQuery = (parameters: Record<string, any>) =>
  `${fragmentDiscountedPrice}${fragmentPrices}${fragmentProductVariant}${fragmentFrSearchQuery}${fragmentCategories}${fragmentCurrentProduct}${query(
    parameters,
  )}`;
