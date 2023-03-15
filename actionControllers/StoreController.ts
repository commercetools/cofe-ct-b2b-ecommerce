import { ChannelResourceIdentifier } from '../types/channel/channel';
import { ActionContext, Request, Response } from '@frontastic/extension-types';
import { Store } from '../types/store/store';
import { StoreDraft } from '@commercetools/platform-sdk';
import { getLocale } from 'cofe-ct-ecommerce/utils/Request';
import { StoreApi } from '../apis/StoreApi';
import { CartApi } from '../apis/CartApi';
import { BusinessUnitApi } from '../apis/BusinessUnitApi';
import { StoreMappers } from 'mappers/StoreMappers';

type ActionHook = (request: Request, actionContext: ActionContext) => Promise<Response>;

type AccountRegisterBody = {
  account: {
    email?: string;
    confirmed?: boolean;
    company?: string;
    rootCategoryId?: string;
  };
  parentBusinessUnit: string;
};

const DEFAULT_CHANNEL_KEY = 'default-channel';

export const create: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const storeApi = new StoreApi(actionContext.frontasticContext, getLocale(request));

  const data = await mapRequestToStore(request, actionContext, storeApi);

  try {
    const store = await storeApi.create(data);

    const response: Response = {
      statusCode: 200,
      body: JSON.stringify(store),
      sessionData: request.sessionData,
    };

    return response;
  } catch (error) {
    const response: Response = {
      statusCode: 400,
      sessionData: request.sessionData,
      // @ts-ignore
      error: error.message,
      errorCode: 400,
    };

    return response;
  }
};

export const query: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const storeApi = new StoreApi(actionContext.frontasticContext, getLocale(request));
  const where = request.query['where'];

  const stores = await storeApi.query(where);

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(stores),
    sessionData: request.sessionData,
  };

  return response;
};

export const setMe: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const storeApi = new StoreApi(actionContext.frontasticContext, getLocale(request));
  const cartApi = new CartApi(actionContext.frontasticContext, getLocale(request));

  const data = JSON.parse(request.body);

  const store = await storeApi.get(data.key);

  let distributionChannel = request.sessionData?.organization?.distributionChannel;

  if (store?.distributionChannels?.length) {
    distributionChannel = store.distributionChannels[0];
  }

  const organization = {
    ...request.sessionData?.organization,
    distributionChannel,
  };

  organization.store = StoreMappers.mapStoreToSmallerStore(store);

  const cart = await cartApi.getForUser(request.sessionData?.account, organization);

  const cartId = cart.cartId;

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(distributionChannel),
    sessionData: {
      ...request.sessionData,
      cartId,
      organization,
    },
  };

  return response;
};

async function getParentDistChannels(parentStores: any): Promise<ChannelResourceIdentifier[]> {
  return parentStores.reduce((prev: ChannelResourceIdentifier[], item: Store) => {
    if (item.distributionChannels.length) {
      return [...prev, ...item.distributionChannels?.map((channel) => ({ id: channel.id, typeId: 'channel' }))];
    }
    return prev;
  }, []);
}

async function getParentSupplyChannels(parentStores: any): Promise<ChannelResourceIdentifier[]> {
  return parentStores.reduce((prev: ChannelResourceIdentifier[], item: Store) => {
    if (item.supplyChannels.length) {
      return [...prev, ...item.supplyChannels?.map((channel) => ({ id: channel.id, typeId: 'channel' }))];
    }
    return prev;
  }, []);
}

async function mapRequestToStore(
  request: Request,
  actionContext: ActionContext,
  storeApi: StoreApi,
): Promise<StoreDraft> {
  const storeBody: AccountRegisterBody = JSON.parse(request.body);
  const key = storeBody.account.company.toLowerCase().replace(/ /g, '_');
  const parentBusinessUnit = storeBody.parentBusinessUnit;

  let supplyChannels: ChannelResourceIdentifier[] = [];
  let distributionChannels: ChannelResourceIdentifier[] = [];

  if (parentBusinessUnit) {
    const businessUnitApi = new BusinessUnitApi(actionContext.frontasticContext, getLocale(request));
    const businessUnit = await businessUnitApi.get(parentBusinessUnit);

    if (businessUnit?.stores) {
      const storeKeys = businessUnit?.stores.map((store) => `"${store.key}"`).join(' ,');
      const results = await storeApi.query(`key in (${storeKeys})`);

      if (results.length) {
        distributionChannels = await getParentDistChannels(results);
        supplyChannels = await getParentSupplyChannels(results);
      }
    }
  } else {
    supplyChannels.push({
      key: DEFAULT_CHANNEL_KEY,
      typeId: 'channel',
    });
    distributionChannels.push({
      key: DEFAULT_CHANNEL_KEY,
      typeId: 'channel',
    });
  }

  const store: StoreDraft = {
    key: `store_${parentBusinessUnit ? `${parentBusinessUnit}_` : ''}${key}`,
    // @ts-ignore
    name: storeBody.account.company,
    distributionChannels,
    supplyChannels,
  };

  return store;
}
