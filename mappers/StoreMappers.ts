import { Store as CommercetoolsStore } from '@commercetools/platform-sdk';
import { Store } from '@b2bdemo/types/types/store/store';

export class StoreMappers {
  static mapCommercetoolsStoreToStore(
    store: CommercetoolsStore,
    locale: string,
    config?: Record<string, string>,
  ): Store {
    return {
      ...store,
      name: store.name?.[locale],
    };
  }
}
