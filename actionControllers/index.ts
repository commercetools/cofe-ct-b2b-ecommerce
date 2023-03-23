import * as AccountActions from './AccountController';
import * as ProductActions from './ProductController';
import * as CartActions from './CartController';
import * as WishlistActions from './WishlistController';
import * as StoreActions from './StoreController';
import * as BusinessUnitActions from './BusinessUnitController';
import * as QuoteActions from './QuoteController';
import * as AssociateActions from './AssociateController';

export const actions = {
  account: AccountActions,
  cart: CartActions,
  product: ProductActions,
  wishlist: WishlistActions,
  store: StoreActions,
  quote: QuoteActions,
  'business-unit': BusinessUnitActions,
  'associate': AssociateActions,
};
