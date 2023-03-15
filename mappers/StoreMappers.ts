import { Store as CommercetoolsStore } from '@commercetools/platform-sdk';
import { Store } from '../types/store/store';

export class StoreMappers {
  static mapCommercetoolsStoreToStore(
    store: CommercetoolsStore,
    locale: string,
  ): Store {
    return {
      name: store.name?.[locale],
      id: store.id,
      key: store.key,
      distributionChannels: store.distributionChannels,
      supplyChannels: store.supplyChannels,
    };
  }
  static mapStoreToSmallerStore(
    store: CommercetoolsStore,
    locale: string,
  ): Store {
    return {
      name: store.name?.[locale],
      id: store.id,
      key: store.key,
    };
  }
}
