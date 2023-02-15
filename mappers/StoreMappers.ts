import { Store as CommercetoolsStore, Store } from '@commercetools/platform-sdk';

export const mapCommercetoolsStoreToStore = (
  store: CommercetoolsStore,
  locale: string,
  config: Record<string, string>,
): Store => {
  return {
    ...store,
    // @ts-ignore
    name: store.name?.[locale],
    isPreBuyStore: !!config ? store.custom?.fields?.[config.storeCustomField] : false,
  };
};
