import { Store as CommercetoolsStore } from '@commercetools/platform-sdk';
import { Store } from '../types/store/store';

export class StoreMappers {
  static mapCommercetoolsStoreToStore(store: CommercetoolsStore, locale: string): Store {
    return {
      name: store.name?.[locale],
      id: store.id,
      key: store.key,
      distributionChannels: store.distributionChannels,
      supplyChannels: store.supplyChannels,
    };
  }
  static mapStoreToSmallerStore(store: Store): Store {
    const distributionChannels = store.distributionChannels?.map((channel) => ({ id: channel.id }))
    const supplyChannels = store.supplyChannels?.map((channel) => ({ id: channel.id }));
    return {
      name: store.name,
      id: store.id,
      key: store.key,
      // @ts-ignore
      distributionChannels: distributionChannels?.length ? distributionChannels.slice(0,1) : [],
      // @ts-ignore
      supplyChannels: supplyChannels?.length ? supplyChannels.slice(0, 1) : [],
    };
  }
}
