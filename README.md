# fastify-api

A **radically simple** API **routing and method injection plugin** for [Fastify](https://fastify.io).

Inject `fastify.api` with automatically mapped methods from route definitions, with _some caveats_:

1. You can only use **named functions** for your handlers, so it can infer their `name`.
2. You can only use **async functions** for your hooks, because it doesn't handle `done()` for simplicity.
3. You can only use `onRequest`, `preHandler`, `onSend` and `onResponse` when invoking routes.

## So how does it look like?

```js
const fastify = require('fastify')()
const fastifyApi = require('fastify-api')

async function main () {
  await fastify.register(fastifyApi)

  fastify.api(({ get }) => [
    get('/echo/:id', function echo ({ id }, req, reply) {
      reply.code(201)
      reply.send({ id, url: req.url })
    }),
  ])
```

The `fastify.api` decorator is a function that takes another function as parameter. This function takes a single parameter with an object containing `{ get, post, put, del }` for defining routes.

So in the example above you can see it destructuring only `get` and defining an `/echo/:id` route. Also notice how the function returns an array of calls. This array is used to determine the structure of the `fastify.api` injection. So if you return an array, it understands it should register all available functions as top-level methods under `fastify.api`.

This way you can invoke them on-the-fly as:

```js
fastify.get('/invoke-echo', async (req, reply) => {
  const result = await fastify.api.echo({ id: 456 })
  reply.send(result)
})
```

Notice how the first parameter is mapped to `req.params` **for convenience**.

## Nested

You can just return an object with nested arrays with route definition calls:

```js
const { content, session, users } = require('./handlers')

fastify.api(({ get, put, del }) => ({
  content: [
    get('/content', content.get),
  ],
  session: [
    get('/session/start', session.start),
    del('/session/end', session.end),
  ],
  users: {
    profiles: [
      get('/users/start', users.profiles.get),
      put('/users/end', users.profiles.update),
    ],
    setttings: [
      get('/users/settings/', users.settings.get),
      put('/users/settings/', users.settings.update),
    ] 
  }
})
```

This would make the following methods available:

- `fastify.api.content.get()`
- `fastify.api.session.start()`
- `fastify.api.session.end()`
- `fastify.api.users.profiles.get()`
- `fastify.api.users.profiles.update()`
- `fastify.api.users.settings.get()`
- `fastify.api.users.settings.update()`
