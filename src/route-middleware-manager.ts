import { NextApiRequest, NextApiResponse } from 'next';
import { RouteMiddlewareHandler } from './route-middleware-handler';

export class RouteMiddlewareManager {
  private static _instance: RouteMiddlewareManager;

  public routeMiddlewareHandler: RouteMiddlewareHandler[] = [];

  public static getInstance() {
    if (!RouteMiddlewareManager._instance) {
      RouteMiddlewareManager._instance = new RouteMiddlewareManager();
    }

    return RouteMiddlewareManager._instance;
  }

  public registerMiddleware(
    handler: (
      req: NextApiRequest,
      res: NextApiResponse,
      next: () => Promise<void>,
      payload: { [key: string]: any }
    ) => void
  ) {
    const instance = new RouteMiddlewareHandler(handler);

    this.routeMiddlewareHandler.push(instance);

    return instance;
  }

  public init() {
    return {
      registerMiddleware: this.registerMiddleware.bind(this),
    };
  }
}

export const {
  registerMiddleware,
} = RouteMiddlewareManager.getInstance().init();
