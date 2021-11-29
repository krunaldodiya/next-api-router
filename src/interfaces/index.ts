import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { RouteMiddlewareHandler } from '../route-middleware-handler';
import { MethodList } from '../types';

export interface Route {
  routeUrl: string | undefined;
  routeMethod: MethodList | undefined;
  routeHandler: NextApiHandler | undefined;
  routeMiddlewares: RouteMiddlewareHandler[];
}

export interface Handler {
  (
    req: NextApiRequest,
    res: NextApiResponse,
    next: () => Promise<void>,
    payload: any
  ): void;
}

export interface RouteManager {
  applyMiddleware(routeMiddlewareHandler: RouteMiddlewareHandler): RouteManager;
  create(): void;
}

export interface NextApiRouter {
  get(routeName: string, routeHandler: NextApiHandler): RouteManager;
  post(routeName: string, routeHandler: NextApiHandler): RouteManager;
  put(routeName: string, routeHandler: NextApiHandler): RouteManager;
  patch(routeName: string, routeHandler: NextApiHandler): RouteManager;
  delete(routeName: string, routeHandler: NextApiHandler): RouteManager;
  render(): (req: NextApiRequest, res: NextApiResponse) => Promise<any>;
}
