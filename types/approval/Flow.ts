import { Order } from '../cart/Order';
import { Associate } from '../associate/Associate';
import { BusinessUnitResourceIdentifier } from '../business-unit/BusinessUnit';
import { ApprovalRule } from './Rule';

export type ApprovalFlowStatus = 'Pending' | 'Approved' | 'Rejected';

export interface ApprovalFlowApproval {
  approver: Associate;
  approvedAt: Date;
}

export interface ApprovalFlowRejection {
  rejecter: Associate;
  reason?: string;
  rejectedAt: Date;
}

export interface ApprovalFlow {
  id: string;
  version: number;
  createdAt: Date;
  order: {
    typeId: 'order';
    id: string;
    obj?: any;
  };
  businessUnit: BusinessUnitResourceIdentifier;
  rules: ApprovalRule[];
  status: ApprovalFlowStatus;
  rejection?: ApprovalFlowRejection;
  approvals?: ApprovalFlowApproval[];
}

export interface DomainApprovalFlow {
  id: string;
  version: number;
  createdAt: Date;
  order: Order;
  businessUnit: BusinessUnitResourceIdentifier;
  rules: ApprovalRule[];
  status: ApprovalFlowStatus;
  rejection?: ApprovalFlowRejection;
  approvals?: ApprovalFlowApproval[];
}
