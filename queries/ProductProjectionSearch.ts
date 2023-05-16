import { parametersToString } from '.';
import { fragmentCategories } from './fragments/fragmentCategories';
import { fragmentCurrentProduct } from './fragments/fragmentCurrentProduct';
import { fragmentDiscountedPrice } from './fragments/fragmentDiscountedPrice';
import { fragmentFrSearchQuery } from './fragments/fragmentFrSearchQuery';
import { fragmentPrices } from './fragments/fragmentPrices';
import { fragmentProductVariant } from './fragments/fragmentProductVariant';

const query = (parameters: Record<string, any>) => `
  query GetProducts($locale: Locale, $currency: Currency!) {
    productProjectionSearch(${parametersToString(parameters)}) {
      ...FrSearchQuery
      ...CurrentProduct
    }
  }
`;

export const productProjectionSearchQuery = (parameters: Record<string, any>) =>
  `${fragmentDiscountedPrice}${fragmentPrices}${fragmentProductVariant}${fragmentFrSearchQuery}${fragmentCategories}${fragmentCurrentProduct}${query(
    parameters,
  )}`;
