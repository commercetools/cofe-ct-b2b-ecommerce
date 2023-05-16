import { parametersToString } from '.';
import { fragmentCategories } from './fragments/fragmentCategories';
import { fragmentCurrentProduct } from './fragments/fragmentCurrentProduct';
import { fragmentDiscountedPrice } from './fragments/fragmentDiscountedPrice';
import { fragmentFrSearchQuery } from './fragments/fragmentFrSearchQuery';
import { fragmentPrices } from './fragments/fragmentPrices';
import { fragmentProductVariant } from './fragments/fragmentProductVariant';
import * as gql from 'gql-query-builder'

// const query = `
//   query GetProducts($locale: Locale, $currency: Currency!) {
//     productProjectionSearch {
//       ...FrSearchQuery
//       ...CurrentProduct
//     }
//   }
// `;

// export const productProjectionSearchQuery = (parameters: Record<string, any>) =>
//   `${fragmentDiscountedPrice}${fragmentPrices}${fragmentProductVariant}${fragmentFrSearchQuery}${fragmentCategories}${fragmentCurrentProduct}${query(
//     parameters,
//   )}`;

export const productProjectionSearchQuery = (variables, parameters) => gql.query({
  operation:'productProjectionSearch',
  fields: [
    'offset',
    'count',
    'total',
  ],
  variables: {...variables, ...parameters}
})
