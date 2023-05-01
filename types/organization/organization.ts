import { BusinessUnit } from '../business-unit/BusinessUnit';
import { ChannelResourceIdentifier } from '../channel/channel';
import { Store } from '../store/store';

export interface Organization {
  businessUnit: BusinessUnit;
  store: Store;
  superUserBusinessUnitKey?: string;
}
