import { ActionHandler } from '@frontastic/extension-types';
import * as AccountControllerBase from 'cofe-ct-ecommerce/actionControllers/AccountController';
import * as AccountController from './actionControllers/AccountController';
import * as CartControllerBase from 'cofe-ct-ecommerce/actionControllers/CartController';
import * as CartController from './actionControllers/CartController';
import * as ProductControllerBase from 'cofe-ct-ecommerce/actionControllers/ProductController';
import * as ProductController from './actionControllers/ProductController';
import * as WishlistControllerBase from 'cofe-ct-ecommerce/actionControllers/WishlistController';
import * as WishlistController from './actionControllers/WishlistController';
import * as BusinessController from './actionControllers/BusinessUnitController';
import * as DashboardController from './actionControllers/DashboardController';
import * as StoreController from './actionControllers/StoreController';
import * as QuoteController from './actionControllers/QuoteController';

export const extender = (source: any, target: any) => {
  if (!target) {
    return source;
  }
  const merged = {};

  // Merge properties from module A
  for (const key in source) {
    if (target.hasOwnProperty(key)) {
      // If the property exists in both A and B, use the one from B
      merged[key] = target[key];
    } else {
      // Otherwise, use the one from A
      merged[key] = source[key];
    }
  }

  // Merge properties from module B
  for (const key in target) {
    if (!target.hasOwnProperty(key)) {
      // If the property exists only in B, use it
      merged[key] = target[key];
    }
  }

  return merged;
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

export const WishlistAction: typeof WishlistController &
  typeof WishlistControllerBase & { [actionIdentifier: string]: ActionHandler } = extender(
    WishlistControllerBase,
    WishlistController,
);

export const BusinessAction = BusinessController;
export const DashboardAction = DashboardController;
export const StoreAction = StoreController;
export const QuoteAction = QuoteController;
