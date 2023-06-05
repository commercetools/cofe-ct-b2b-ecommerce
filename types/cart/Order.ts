import { LineItemReturnItemDraft } from './LineItem';
import { Cart } from './Cart';

export interface ReturnInfoItem extends LineItemReturnItemDraft {
  createdAt?: string;
  returnInfoId: string;
}

export interface ReturnInfo {
  items: ReturnInfoItem[];
  returnDate?: string;
  returnTrackingId?: string;
}

export interface Order extends Cart {
  orderId?: string;
  orderVersion?: string;
  orderState?: string;
  createdAt?: Date;
  businessUnit?: string;
  returnInfo?: ReturnInfo[];
  purchaseOrderNumber?: string;
  shipmentState?: string;
}
