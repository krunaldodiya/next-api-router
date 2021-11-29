import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { NextApiRouter, Route, RouteManager } from './interfaces';
import { RouteMiddlewareHandler } from './route-middleware-handler';
import { MethodList } from './types';
import { pathToRegExp } from './utils/url-match';

const initialRoute: Route = {
  routeUrl: undefined,
  routeMethod: undefined,
  routeHandler: undefined,
  routeMiddlewares: [],
};

class NextRouter {
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

  init(): NextApiRouter {
    return {
      get: this.get.bind(this),
      post: this.post.bind(this),
      put: this.post.bind(this),
      patch: this.post.bind(this),
      delete: this.post.bind(this),
      render: this.render.bind(this),
    };
  }

  public get(routeUrl: string, routeHandler: NextApiHandler): RouteManager {
    return this.addRoute('GET', routeUrl, routeHandler);
  }

  public post(routeUrl: string, routeHandler: NextApiHandler): RouteManager {
    return this.addRoute('POST', routeUrl, routeHandler);
  }

  public put(routeUrl: string, routeHandler: NextApiHandler): RouteManager {
    return this.addRoute('PUT', routeUrl, routeHandler);
  }

  public patch(routeUrl: string, routeHandler: NextApiHandler): RouteManager {
    return this.addRoute('PATCH', routeUrl, routeHandler);
  }

  public delete(routeUrl: string, routeHandler: NextApiHandler): RouteManager {
    return this.addRoute('DELETE', routeUrl, routeHandler);
  }

  public applyMiddleware(
    routeMiddlewareHandler: RouteMiddlewareHandler
  ): RouteManager {
    const routeMiddlewares = [
      ...this.route.routeMiddlewares,
      routeMiddlewareHandler,
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

  public render(): (req: NextApiRequest, res: NextApiResponse) => Promise<any> {
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

      const routeHandler = routeToRender.routeHandler;

      if (routeToRender.routeMiddlewares.length === 0) {
        return await routeHandler(req, res);
      }

      if (routeToRender.routeMiddlewares.length > 0) {
        for (
          let index = 0;
          index < routeToRender.routeMiddlewares.length;
          index++
        ) {
          const routeMiddleware = routeToRender.routeMiddlewares[index];

          const next = async () => {
            const isLastMiddleware =
              routeToRender.routeMiddlewares.length - 1 === index;

            if (routeHandler && isLastMiddleware) {
              return await routeHandler(req, res);
            }
          };

          const routeMiddlewareHandler = routeMiddleware.getHandler();
          const routeMiddlewarePayload = routeMiddleware.getPayload();

          return await routeMiddlewareHandler(
            req,
            res,
            next,
            routeMiddlewarePayload(req)
          );
        }
      }
    };
  }

  private addRoute(
    routeMethod: MethodList,
    routeUrl: string,
    routeHandler: NextApiHandler
  ) {
    const matchingRoutes = this.getMatchingRoutes(routeMethod, routeUrl);

    if (matchingRoutes.length > 0) {
      this.error = 'Duplicate route detected';
    }

    this.route = { ...this.route, routeMethod, routeUrl, routeHandler };

    return {
      applyMiddleware: this.applyMiddleware.bind(this),
      create: this.create.bind(this),
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
