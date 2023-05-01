import { BusinessUnit } from '../business-unit/BusinessUnit';
import { ChannelResourceIdentifier } from '../channel/channel';
import { Store } from '../store/store';

export interface Organization {
  businessUnit: BusinessUnit;
  distributionChannel: ChannelResourceIdentifier;
  supplyChannel: ChannelResourceIdentifier;
  store: Store;
  superUserBusinessUnitKey?: string;
}
