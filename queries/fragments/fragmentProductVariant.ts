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
    availability {
      channels {
        results {
          availability {
            isOnStock
            availableQuantity
          }
        }
      }
      noChannel {
        isOnStock
        availableQuantity
      }
    }
    ...Prices
  }
`;
