import { NextApiRequest, NextApiResponse } from 'next';
import { Handler } from './interfaces';

export class RouteMiddlewareHandler {
  private handler: Handler;

  private payload: any;

  public constructor(
    handler: (
      req: NextApiRequest,
      res: NextApiResponse,
      next: () => Promise<void>,
      payload: any
    ) => void
  ) {
    this.handler = handler;

    return this;
  }

  public setPayload(payload: any) {
    this.payload = payload;

    return this;
  }

  public getHandler() {
    return this.handler;
  }

  public getPayload() {
    return this.payload;
  }
}
