import { LineItem as DomainLineItem  } from '@commercetools/frontend-domain-types/cart/LineItem';

export interface LineItemReturnItemDraft {
  quantity: number;
  lineItemId: string;
  comment?: string;
  shipmentState: string;
}
export interface Target {
  quantity: number;
  addressKey: string;
}

export interface LineItem extends DomainLineItem {
  custom?: Record<string, any>;
  shippingDetails?: {
    targets?: Target[];
    valid: boolean;
  };
}
