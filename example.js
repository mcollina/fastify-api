
async function getServer () {
  const fastify = require('fastify')()
  await fastify.register(require('./index'))

  // Original fastify.{method}() with `exposeAs` option, without params:

  fastify.get('/1/method', { exposeAs: 'method' }, (_, reply) => {
    reply.send('Hello from /1/method')
  })
  fastify.get('/invoke/1/method', async (_, reply) => {
    try {
      const result = await fastify.api.client.method()
      reply.send(result)
    } catch (err) {
      console.error(err)
    }
  })

  // Original fastify.<method>() with `exposeAs` option, with params:

  fastify.get('/2/method/:id', { exposeAs: 'methodWithParams' }, ({ id }, _, reply) => {
    reply.send(`Hello from /2/method/ with id ${id}`)
  })
  fastify.get('/invoke/2/method', async (req, reply) => {
    const result = await fastify.api.client.methodWithParams({ id: 123 })
    reply.send(result)
  })

  // Will automatically create a nested structure too, if needed:

  fastify.get('/3/nested/method/:id', { exposeAs: 'nested.method' }, ({ id }, _, reply) => {
    reply.send(`Hello from /3/nested/method/ with id ${id}`)
  })
  fastify.get('/invoke/3/nested/method', async (req, reply) => {
    const result = await fastify.api.client.nested.method({ id: 123 })
    reply.send(result)
  })

  // Modified fastify.api.<method>() setter if the handler is a named function:

  fastify.api.get('/4/method', function methodFromNamedFunction ({ id }, _, reply) {
    reply.send(`Hello from /4/method with id ${id}`)
  })
  fastify.get('/invoke/4/method', async (req, reply) => {
    const result = await fastify.api.client.methodFromNamedFunction({ id: 123 })
    reply.send(result)
  })

  // Modified fastify.api(setter) helper to quickly define multiple methods.
  // Makes more sense if the setter function is coming from another file.

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

  // Any API method exposed in fastify.api.client can take options:

  fastify.get('/6/method', { exposeAs: 'methodWithOptions' }, (req, reply) => {
    console.log(req.query)
    console.log(req.headers)
    reply.send('Hello from /6/method/ with query and headers')
  })
  fastify.get('/invoke/6/method', async (_, reply) => {
    const result = await fastify.api.client.methodWithOptions({ id: 123 }, {
      query: {
        arg: 1
      },
      headers: {
        'x-foobar': 1
      }
    })
    reply.send(result)
  })

  fastify.get('/', (_, reply) => reply.send(fastify.api.meta))

  return fastify
}

function listen (fastify) {
  fastify.listen(3000, (_, addr) => console.log(addr))
}

module.exports = { getServer, listen }

if (require.main === module) {
  getServer().then(listen)
}
