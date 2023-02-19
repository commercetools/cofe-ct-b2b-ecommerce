import * as AccountActions from './AccountController';
import * as ProductActions from './ProductController';
import * as CartActions from './CartController';
import * as WishlistActions from './WishlistController';
import * as ProjectActions from './ProjectController';
import * as StoreActions from './StoreController';
import * as BusinessUnitActions from './BusinessUnitController';
import * as CustomerActions from './CustomerController';
import * as QuoteActions from './QuoteController';
import * as DashboardActions from './DashboardController';

export const actions = {
  account: AccountActions,
  cart: CartActions,
  customer: CustomerActions,
  product: ProductActions,
  wishlist: WishlistActions,
  project: ProjectActions,
  store: StoreActions,
  quote: QuoteActions,
  'business-unit': BusinessUnitActions,
  dashboard: DashboardActions,
};
