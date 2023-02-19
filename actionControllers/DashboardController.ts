import { ActionContext, Request, Response } from '@frontastic/extension-types';
import { getLocale } from 'cofe-ct-ecommerce/utils/Request';
import { DashboardApi } from '../apis/DashboardApi';

type ActionHook = (request: Request, actionContext: ActionContext) => Promise<Response>;

const DASHBOARD_CONTAINER = 'dashboard-container';
const DASHBOARD_KEY_POSTFIX = 'dashboard';

const getDashboardKey = (accountId: string): string => {
  return `${accountId}__${DASHBOARD_KEY_POSTFIX}`;
};

export const getMyDashboard: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const dashboardApi = new DashboardApi(actionContext.frontasticContext, getLocale(request));

  const accountId = request.sessionData?.account?.accountId;
  if (!accountId) {
    throw new Error('Not logged in');
  }

  let dashboard = null;
  try {
    dashboard = await dashboardApi.get(getDashboardKey(accountId), DASHBOARD_CONTAINER);
  } catch (e) {
    dashboard = await dashboardApi.create({
      container: DASHBOARD_CONTAINER,
      key: getDashboardKey(accountId),
      value: {
        customer: {
          id: accountId,
          typeId: 'customer',
        },
        widgets: [
          {
            id: 'OrderList',
            layout: {
              i: 'OrderList',
              x: 0,
              y: 2,
              w: 12,
              h: 3,
              isDraggable: undefined,
            },
          },
          {
            id: 'OrderStatus',
            layout: {
              i: 'OrderStatus',
              x: 0,
              y: 0,
              w: 5,
              h: 2,
              isDraggable: undefined,
            },
          },
          {
            id: 'RecentPurchase',
            layout: {
              i: 'RecentPurchase',
              x: 6,
              y: 0,
              w: 6,
              h: 2,
              isDraggable: undefined,
            },
          },
        ],
      },
    });
  }
  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(dashboard),
    sessionData: request.sessionData,
  };

  return response;
};

export const updateDashboard: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const dashboardApi = new DashboardApi(actionContext.frontasticContext, getLocale(request));

  const { widgets } = JSON.parse(request?.body);

  const accountId = request.sessionData?.account?.accountId;
  if (!accountId) {
    throw new Error('Not logged in');
  }

  let dashboard = await dashboardApi.get(getDashboardKey(accountId), DASHBOARD_CONTAINER);

  if (dashboard) {
    dashboard = await dashboardApi.create({
      version: dashboard.version,
      container: DASHBOARD_CONTAINER,
      key: getDashboardKey(accountId),
      value: {
        customer: {
          id: accountId,
          typeId: 'customer',
        },
        widgets,
      },
    });
  } else {
    throw new Error('dashboard does not exist');
  }

  const response: Response = {
    statusCode: 200,
    sessionData: request.sessionData,
  };

  return response;
};
