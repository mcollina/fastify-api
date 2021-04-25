# fastify-api

A **radically simple** API **routing and method injection plugin** for [Fastify](https://fastify.io).

Uses [`fastify.inject`](https://github.com/fastify/light-my-request) under the hood, with _developer ergonomics_ in mind.

Injects `fastify.api.client` with automatically mapped methods from route definitions.

## Usage

1. **Original fastify.{method}() with `exposeAs` option, without params:**

```js
fastify.get('/1/method', { exposeAs: 'method' }, (_, reply) => {
  reply.send('Hello from /1/method')
})
fastify.get('/invoke/1/method', async (_, reply) => {
  const result = await fastify.api.client.method()
  reply.send(result)
})
```

2. **Original fastify.{method}() with `exposeAs` option, with params:**

```js
fastify.get('/2/method/:id', { exposeAs: 'methodWithParams' }, ({ id }, _, reply) => {
  reply.send(`Hello from /2/method/ with id ${id}`)
})
fastify.get('/invoke/2/method', async (req, reply) => {
  const result = await fastify.api.client.methodWithParams({ id: 123 })
  reply.send(result)
})
```

3. **Will automatically create a nested structure too, if needed:**

```js
fastify.get('/3/nested/method/:id', { exposeAs: 'nested.method' }, ({ id }, _, reply) => {
  reply.send(`Hello from /3/nested/method/ with id ${id}`)
})
fastify.get('/invoke/3/nested/method', async (req, reply) => {
  const result = await fastify.api.client.nested.method({ id: 123 })
  reply.send(result)
})
```

4. **Modified fastify.api.{method}() setter if the handler is a named function:**

```js
fastify.api.get('/4/method', function methodFromNamedFunction ({ id }, _, reply) {
  reply.send(`Hello from /4/method with id ${id}`)
})
fastify.get('/invoke/4/method', async (req, reply) => {
  const result = await fastify.api.client.methodFromNamedFunction({ id: 123 })
  reply.send(result)
})
```

5. **Modified fastify.api(setter) helper to quickly define multiple methods:**

_Makes more sense if the setter function is coming from another file._

```js
fastify.api(({ get }) => ({
  topLevelMethod: get('/5/top-level-method/:id', function ({ id }, _, reply) {
    reply.send({ id })
  }),
  nestedMethods: {
    method: get('/5/nested-methods/method/:id', ({ id }, _, reply) => {
      reply.send({ id })
    }),
    otherMethod: get('/5/nested-methods/other-method/:id', ({ id }, _, reply) => {
      reply.send({ id })
    }),
    deeplyNestedMethods: {
      method: get('/5/nested-methods/deeply-nested-methods/method/:id', ({ id }, _, reply) => {
        reply.send({ id })
      }),
      otherMethod: get('/5/nested-methods/deeply-nested-methods/other-method/:id', ({ id }, _, reply) => {
        reply.send({ id })
      })
    }
  }
}))

fastify.get('/invoke/5/top-level-method', async (req, reply) => {
  const result = await fastify.api.client.topLevelMethod({ id: 123 })
  reply.send(result)
})
fastify.get('/invoke/5/nested-methods/method', async (_, reply) => {
  const result = await fastify.api.client.nestedMethods.method({ id: 123 })
  reply.send(result)
})
fastify.get('/invoke/5/nested-methods/other-method', async (_, reply) => {
  const result = await fastify.api.client.nestedMethods.otherMethod({ id: 123 })
  reply.send(result)
})
fastify.get('/invoke/5/nested-methods/deeply-nested-methods/method', async (_, reply) => {
  const result = await fastify.api.client.nestedMethods.deeplyNestedMethods.method({ id: 123 })
  reply.send(result)
})
fastify.get('/invoke/5/nested-methods/deeply-nested-methods/other-method', async (_, reply) => {
  const result = await fastify.api.client.nestedMethods.deeplyNestedMethods.otherMethod({ id: 123 })
  reply.send(result)
})
```

6. **Any API method exposed in fastify.api.client can take options:**

```js
fastify.get('/6/method', { exposeAs: 'methodWithOptions' }, (req, reply) => {
  reply.send(`Hello from /6/method/ with query.arg ${
    req.query.arg
  } and the x-foobar header ${
    req.headers['x-foobar']
  }`)
})
fastify.get('/invoke/6/method', async (_, reply) => {
  const result = await fastify.api.client.methodWithOptions({
    query: {
      arg: 1
    },
    headers: {
      'x-foobar': 1
    }
  })
  reply.send(result)
})
```

## API responses

If you call a route via HTTP, it'll operate normally as if weren't using the plugin. If you use `fastify.api.client.xyz()` to invoke it from another handler, you'll get an object containing `{ json, body, status, headers }` as response. If it's unable to parse a JSON document out of `body`, `json` is undefined.

