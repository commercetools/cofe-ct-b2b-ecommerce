import { LineItemReturnItemDraft } from './LineItem';
import { Order as DomainOrder } from '@commercetools/frontend-domain-types/cart/Order';

export interface ReturnInfoItem extends LineItemReturnItemDraft {
  createdAt?: string;
  returnInfoId: string;
}

export interface ReturnInfo {
  items: ReturnInfoItem[];
  returnDate?: string;
  returnTrackingId?: string;
}

// @ts-ignore
export interface Order extends DomainOrder {
  createdAt: string;
  businessUnit?: string;
  returnInfo: ReturnInfo[];
}
