# fastify-api

A **radically simple** API **routing and method injection plugin** for [Fastify](https://fastify.io).

Uses [`fastify.inject`](https://github.com/fastify/light-my-request) under the hood, with _developer ergonomics_ in mind.

Injects `fastify.api` with automatically mapped methods from route definitions.

## Basic usage

```js
fastify.api.get('/echo/:id', function echo ({ id }, req, reply) {
  reply.code(201)
  reply.send({ id, url: req.url })
})
```

In addition to registering the route as expected, this will also **automatically register an API client method** that lets you **make requests to this route as if you were calling a function**. 

In other words, it's what `fastify.inject()` does out of the box (and makes things like [fastify-aws-lambda](https://github.com/fastify/aws-lambda-fastify) super fast too). But with the added convenience of:

- a) **receving `req.params` as the first parameter (if there are any)**
- b) **using the function's name to register a method for it**

If there are no params in your route URL, don't set a `params` first argument:

```js
fastify.api.get('/simple', function simple (req, reply) {
  reply.code(201)
  reply.send({ msg: 'hello world' })
})
```


So for the definition above, where the handler is a _named function_ `simple()`, you'd get **`fastify.api.client.simple()`** automatically registered for you. Likewise for `echo()` earlier:

```js
fastify.get('/some-other-endpoint', (req, reply) => {
  const { json: echoResponse } = await fastify.api.client.echo({ id: 123 })
  const { json: simpleResponse } = await fastify.api.client.simple()
  reply.send({ echoResponse, simpleResponse })
})
```

## Grouped definitions

You can also use `fastify.api` as a function that takes another function as parameter. This function takes a single parameter with an object containing `{ get, post, put, del }` for defining routes.

This is particularly useful if you want to define your route handlers in external files, and just want to map all of them into their corresponding API methods and routes in one place:

```js
const { group, other } = require('./handlers')

fastify.api(({ get }) => ({
  group: [
    get('/group/method1', group.method1),
    get('/group/method2', group.method2),
  ],
  other: [
    get('/other/method1', other.method1),
    get('/other/method2', other.method2),
  ]
})
```

This makes these methods available:

- `fastify.api.client.group.method1({ id })`
- `fastify.api.client.group.method2({ id })`
- `fastify.api.client.other.method1({ param })`
- `fastify.api.client.other.method2({ param })`

Notice that above we just return an array to define API methods at the same level.

## Mixed definitions

The idiom presented above has the limitation that you can't mix inner groups and methods at the same level, because you can't have a named property mixed within an array literal. But if you do want to have _groups and methods mixed at the same level_, you can also return an object!

```js
fastify.api(({ get }) => ({
  mixed: {
    method: get('/mixed/method/:id', (req, reply) => {}),
    inner: [
      get('/mixed/inner/method1/:param', function method1 (req, reply) {}),
      get('/mixed/inner/method2/:param', function method2 (req, reply) {}),
    ]
  }
})
```

This makes these methods available:

- `fastify.api.client.mixed.method({ id })`
- `fastify.api.client.mixed.inner.method1({ param })`
- `fastify.api.client.mixed.inner.method2({ param })`

Notice how for `method`, the function didn't have to be named because we are making a direct assignment there. If you do name the function, it would be ignored in this specific case.

## API responses

If you call a route via HTTP, it'll operate normally as if weren't using the plugin. If you use `fastify.api.client.xyz()` to invoke it from another handler, you'll get an object containing `{ json, body, status, headers }` as response. If it's unable to parse a JSON document out of `body`, `json` is undefined.

