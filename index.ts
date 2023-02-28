import { ActionHandler } from '@frontastic/extension-types';
import * as AccountControllerBase from 'cofe-ct-ecommerce/actionControllers/AccountController';
import * as AccountController from './actionControllers/AccountController';
import * as CartControllerBase from 'cofe-ct-ecommerce/actionControllers/CartController';
import * as CartController from './actionControllers/CartController';
import * as ProductControllerBase from 'cofe-ct-ecommerce/actionControllers/ProductController';
import * as ProductController from './actionControllers/ProductController';
import * as BusinessController from './actionControllers/BusinessUnitController';
import * as CustomerController from './actionControllers/CustomerController';
import * as DashboardController from './actionControllers/DashboardController';
import * as StoreController from './actionControllers/StoreController';
import * as QuoteController from './actionControllers/QuoteController';

export const extender = (source: any, target: any) => {
  if (!target) {
    return source;
  }
  return {
    ...source,
    ...target,
  };
};

export const AccountAction: typeof AccountController &
  typeof AccountControllerBase & { [actionIdentifier: string]: ActionHandler } = extender(
  AccountControllerBase,
  AccountController,
);

export const CartAction: typeof CartController &
  typeof CartControllerBase & { [actionIdentifier: string]: ActionHandler } = extender(
    CartControllerBase,
    CartController,
);

export const ProductAction: typeof ProductController &
  typeof ProductControllerBase & { [actionIdentifier: string]: ActionHandler } = extender(
    ProductControllerBase,
    ProductController,
);

export const BusinessAction = BusinessController;
export const CustomerAction = CustomerController;
export const DashboardAction = DashboardController;
export const StoreAction = StoreController;
export const QuoteAction = QuoteController;
