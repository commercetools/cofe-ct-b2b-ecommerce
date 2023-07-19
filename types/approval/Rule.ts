import { AssociateRoleAssignment } from '../associate/Associate';
import { BusinessUnitResourceIdentifier } from '../business-unit/BusinessUnit';

export interface ApproverDisjunction {
  or: AssociateRoleAssignment[];
}
export interface ApproverConjunction {
  and: ApproverDisjunction[];
}

export interface ApproverHierarchy {
  tiers: ApproverConjunction[];
}

export interface ApprovalRuleUpdateActionSetStatus {
  action: 'setStatus';
  status: 'Active' | 'Inactive';
}

export interface ApprovalRuleUpdateActionSetPredicate {
  action: 'setPredicate';
  predicate: string;
}

export interface ApprovalRuleUpdateActionSetRequester {
  action: 'setRequesters';
  requesters: AssociateRoleAssignment[];
}

export interface ApprovalRuleDraft {
  name: string;
  predicate: string;
  description?: string;
  status: 'Active' | 'Inactive';
  approvers: ApproverHierarchy;
  requesters: AssociateRoleAssignment[];
}

export interface ApprovalRuleUpdate {
  version: number;
  actions: (
    | ApprovalRuleUpdateActionSetStatus
    | ApprovalRuleUpdateActionSetPredicate
    | ApprovalRuleUpdateActionSetRequester
  )[];
}

export interface ApprovalRule {
  id: string;
  version: number;
  approvers: ApproverHierarchy;
  businessUnit: BusinessUnitResourceIdentifier;
  description?: string;
  name: string;
  status: 'Active' | 'Inactive';
  requesters: AssociateRoleAssignment[];
  predicate: string;
}
