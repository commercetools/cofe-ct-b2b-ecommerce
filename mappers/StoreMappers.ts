import { Store as CommercetoolsStore, Store } from '@commercetools/platform-sdk';

export const mapCommercetoolsStoreToStore = (
  store: CommercetoolsStore,
  locale: string,
): Store => {
  return {
    ...store,
    // @ts-ignore
    name: store.name?.[locale],
  };
};
