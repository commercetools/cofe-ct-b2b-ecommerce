import { StoreKeyReference } from '../store/store';
import { Associate } from '../associate/Associate';
import { Address } from '@commercetools/frontend-domain-types/account/Address';
import { Money } from '@commercetools/frontend-domain-types/product/Money';

export enum BusinessUnitType {
  Company = 'Company',
  Division = 'Division',
}

export enum BusinessUnitStatus {
  Active = 'Active',
  Inactive = 'Inactive',
}

export enum StoreMode {
  Explicit = 'Explicit',
  FromParent = 'FromParent',
}

export interface BusinessUnitResourceIdentifier {
  id?: string;
  key: string;
  typeId: 'business-unit';
}

export interface BusinessUnit {
  key: string;
  status?: BusinessUnitStatus | string;
  createdAt?: string;
  stores?: StoreKeyReference[];
  storeMode?: StoreMode | string;
  unitType?: BusinessUnitType | string;
  name: string;
  contactEmail?: string;
  addresses?: (Address & { id?: string })[];
  shippingAddresses?: number[];
  defaultShipingAddress?: number;
  billingAddresses?: number[];
  defaultBillingAddress?: number;
  associates?: Associate[];
  parentUnit?: BusinessUnitResourceIdentifier;
  topLevelUnit?: BusinessUnitResourceIdentifier;
  version?: number;
  children?: BusinessUnit[];
  isRootAdmin?: boolean;
  isAdmin?: boolean;
  custom?: {
    fields?: {
      budget?: Money;
    };
  };
}

export interface BusinessUnitPagedQueryResponse {
  total?: number;
  count: number;
  limit: number;
  offset: number;
  results: BusinessUnit[];
}
