# Next API Router

Simple api routing for Next.JS.

## Installation

```
$ npm install @krunaldodiya/next-api-router
```

## Quick start

### Configuration

```ts
// /pages/api/[...router].ts
import { router } from '@krunaldodiya/next-api-router';
import { isAuthenticated } from '../middlewares/isAuthenticated';

router
  .post('/api/post/create', async (res: NextApiResponse) => {
    return res.status(200).send({ message: 'hello world' });
  })
  .applyMiddleware(isAuthenticated)
  .applyMiddleware(validateCreatePostSchema)
  .create();

router
  .post('/api/login', (req, res) => {
    return res.status(200).send({ token });
  })
  .applyMiddleware(validateLoginSchema)
  .create();

router
  .get('/api/me', (req, res) => {
    return res.status(200).json({ me: req.user });
  })
  .applyMiddleware(isAuthenticated)
  .create();

export default router.render();
```

## Possible HTTP methods

`router.post()`, `router.get()`, `router.put()`, `router.patch()`, `router.delete()`

## Middleware Example

```ts
// ../middlewares/isAuthenticated.ts
```

```ts
import { verify } from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';
import { registerMiddleware } from '@krunaldodiya/next-api-router';

// this is middleware with default options
const isAuthenticatedHandler = registerMiddleware(
  async (
    req: NextApiRequest,
    res: NextApiResponse,
    next: () => Promise<void>,
    payload: { [key: string]: any }
  ) => {
    const { token, secret } = payload ?? {
      token: req.headers['authorization'],
      secret: process.env.JWT_TOKEN,
    };

    if (!token) {
      return res.status(401).send({ message: 'No token provided' });
    }

    const bearerToken = token.slice(7);

    try {
      await verify(bearerToken, secret);
      await next();
    } catch (error) {
      return res.status(401).send(error);
    }
  }
);

// this is middleware with selected options
export const isAuthenticated = isAuthenticatedHandler.setPayload(
  (req: NextApiRequest) => {
    return {
      token: req.headers['authorization'],
      secret: process.env.JWT_TOKEN,
    };
  }
);
```

```ts
// ../middlewares/loginSchema.ts

import * as yup from 'yup';

const loginSchema = yup.object().shape({
  email: yup
    .string()
    .required()
    .email(),
  password: yup.string().required(),
});

export default loginSchema;
```

```ts
// ../middlewares/createPostSchema.ts

import * as yup from 'yup';

const createPostSchema = yup.object().shape({
  title: yup.string().required(),
  description: yup.text().required(),
});

export default createPostSchema;
```

```ts
// ../middlewares/validateLoginSchema.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { registerMiddleware } from '@krunaldodiya/next-api-router';

export const validateSchemaHandler = registerMiddleware(
  async (
    req: NextApiRequest,
    res: NextApiResponse,
    next: () => Promise<void>,
    payload: { [key: string]: any }
  ) => {
    const { schemaType, schema, data } = payload;

    try {
      await schema.validate(data);
      await next();
    } catch (error) {
      return res.status(422).send(error);
    }
  }
);

// this is middleware with selected options
export const validateLoginSchema = validateSchemaHandler.setPayload(
  (req: NextApiRequest) => {
    return {
      schema: loginSchema,
      data: req.body,
    };
  }
);

// this is middleware with selected options
export const validateCreatePostSchema = validateSchemaHandler.setPayload(
  (req: NextApiRequest) => {
    return {
      schema: createPostSchema,
      data: req.body,
    };
  }
);
```
