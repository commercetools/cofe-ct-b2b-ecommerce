import { Store } from '../store/store';
import { Wishlist as DomainWishlist } from '@commercetools/frontend-domain-types/wishlist/Wishlist';
import { LineItem } from '@commercetools/frontend-domain-types/wishlist/LineItem';
export interface Wishlist extends DomainWishlist {
  wishlistId: string;
  wishlistVersion?: string;
  anonymousId?: string;
  accountId?: string;
  name?: string;
  description?: string;
  lineItems?: LineItem[];
  store?: Store;
  shared?: string[];
}

export interface WishlistDraft {
  name: string;
  description?: string;
}
