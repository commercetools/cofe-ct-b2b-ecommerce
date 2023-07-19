import { CartMapper } from './CartMapper';
import { ApprovalFlow, DomainApprovalFlow } from '../types/approval/Flow';
import { Locale } from 'cofe-ct-ecommerce/interfaces/Locale';

export class ApprovalFlowMapper {
  static mapCommercetoolsFlowToDomainFlow(flow: ApprovalFlow, locale: Locale): DomainApprovalFlow {
    return {
      ...flow,
      order: CartMapper.commercetoolsOrderToOrder(flow.order.obj, locale),
    };
  }
}
