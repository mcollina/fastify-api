
async function getServer () {
  const fastify = require('fastify')()
  await fastify.register(require('../index'))

  fastify.api(({ get }) => ({
    top: [
      get('/echo/:id', function echo ({ id }, req, reply) {
        reply.code(201)
        reply.send({ id, url: req.url })
      })
    ],
    nested: {
      inner: [
        get('/echo-with-onResponse-hook/:id', {
          async onResponse (req, reply) {
            console.log(`Running for onResponse for ${req.url}`)
          }
        }, function echoWithOnResponseHook ({ id }, req, reply) {
          reply.code(201)
          reply.send({ id, url: req.url, requestHeaders: req.headers, requestQuery: req.query })
        })
      ]
    }
  }))

  fastify.get('/invoke-namespaced-echo', async (req, reply) => {
    const result = await fastify.api.client.nested.inner.echoWithOnResponseHook({ id: 456 }, {
      query: {
        foobar: 1
      },
      headers: {
        'x-foobar': 2
      }
    })
    reply.send(result)
  })
  fastify.get('/', (_, reply) => reply.send('ok'))

  return fastify
}

function listen (fastify) {
  fastify.listen(3000, (_, addr) => console.log(addr))
}

module.exports = { getServer, listen }

if (require.main === module) {
  getServer().then(listen)
}
