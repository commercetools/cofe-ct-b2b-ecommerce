import { Store as CommercetoolsStore } from '@commercetools/platform-sdk';
import { Store } from '../types/store/store';

export class StoreMappers {
  static mapCommercetoolsStoreToStore(
    store: CommercetoolsStore,
    locale: string,
  ): Store {
    return {
      ...store,
      name: store.name?.[locale],
    };
  }
}
