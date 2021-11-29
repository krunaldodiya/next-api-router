import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';

import {
  Init,
  MethodManager,
  Route,
  RouteManager,
  RouteMiddlewareHandler,
  RouteMiddlewarePayload,
} from './interfaces';
import { MethodList } from './types';

import { pathToRegExp } from './utils/url-match';

const initialRoute: Route = {
  routeUrl: undefined,
  routeMethod: undefined,
  routeHandler: undefined,
  routeMiddlewares: [],
};

export class NextRouter {
  private static _instance: NextRouter;

  private constructor() {}

  public routes: Route[] = [];

  public route: Route = initialRoute;

  public error: string | undefined;

  public static getInstance() {
    if (!NextRouter._instance) {
      NextRouter._instance = new NextRouter();
    }

    return NextRouter._instance;
  }

  init(): Init {
    return {
      get: this.get.bind(this),
      post: this.post.bind(this),
      put: this.post.bind(this),
      patch: this.post.bind(this),
      delete: this.post.bind(this),
      render: this.render.bind(this),
    };
  }

  public get(routeUrl: string): MethodManager {
    return this.addRoute('GET', routeUrl);
  }

  public post(routeUrl: string): MethodManager {
    return this.addRoute('POST', routeUrl);
  }

  public put(routeUrl: string): MethodManager {
    return this.addRoute('PUT', routeUrl);
  }

  public patch(routeUrl: string): MethodManager {
    return this.addRoute('PATCH', routeUrl);
  }

  public delete(routeUrl: string): MethodManager {
    return this.addRoute('DELETE', routeUrl);
  }

  public handler(routeHandler: NextApiHandler): RouteManager {
    this.route = { ...this.route, routeHandler };

    return {
      applyMiddleware: this.applyMiddleware.bind(this),
      create: this.create.bind(this),
    };
  }

  public applyMiddleware(
    routeMiddlewareHandler: RouteMiddlewareHandler,
    routeMiddlewarePayload?: RouteMiddlewarePayload
  ): RouteManager {
    const routeMiddlewares = [
      ...this.route.routeMiddlewares,
      { routeMiddlewareHandler, routeMiddlewarePayload },
    ];

    this.route = { ...this.route, routeMiddlewares };

    return {
      applyMiddleware: this.applyMiddleware.bind(this),
      create: this.create.bind(this),
    };
  }

  public create(): void {
    this.routes.push(this.route);
    this.route = initialRoute;
  }

  public render() {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      if (this.error) {
        return res.status(500).json({ message: this.error });
      }

      if (this.routes.length === 0) {
        return res.status(500).json({ message: 'No routes to handle' });
      }

      const matchingRoutes = this.getMatchingRoutes(
        req.method as string,
        req.url as string
      );

      if (matchingRoutes.length === 0) {
        return res.status(404).json({ message: 'Route not found' });
      }

      const routeToRender = matchingRoutes[0];

      if (
        !routeToRender.routeMethod ||
        !routeToRender.routeUrl ||
        !routeToRender.routeHandler
      ) {
        return res.status(404).json({ message: 'Invalid route configuration' });
      }

      if (routeToRender.routeMiddlewares.length === 0) {
        await routeToRender.routeHandler(req, res);
      }

      if (routeToRender.routeMiddlewares.length > 0) {
        for (
          let index = 0;
          index < routeToRender.routeMiddlewares.length;
          index++
        ) {
          const {
            routeMiddlewareHandler,
            routeMiddlewarePayload,
          } = routeToRender.routeMiddlewares[index];

          const next = async () => {
            const handler = routeToRender.routeHandler;

            const isLastMiddleware =
              routeToRender.routeMiddlewares.length - 1 === index;

            if (handler && isLastMiddleware) {
              await handler(req, res);
            }
          };

          await routeMiddlewareHandler(
            req,
            res,
            next,
            typeof routeMiddlewarePayload === 'function' &&
              routeMiddlewarePayload(req, res)
          );
        }
      }
    };
  }

  private addRoute(routeMethod: MethodList, routeUrl: string) {
    const matchingRoutes = this.getMatchingRoutes(routeMethod, routeUrl);

    if (matchingRoutes.length > 0) {
      this.error = 'Duplicate route detected';
    }

    this.route = { ...this.route, routeMethod, routeUrl };

    return {
      handler: this.handler.bind(this),
    };
  }

  private getMatchingRoutes(routeMethod: string, routeUrl: string) {
    return this.routes.filter(route => {
      const reg = pathToRegExp(route.routeUrl as string);

      const routeUrlMatched = reg.test(routeUrl);

      const routeMethodMatched = route.routeMethod === routeMethod;

      return routeUrlMatched && routeMethodMatched;
    });
  }
}

export const router = NextRouter.getInstance().init();
