
async function getServer () {
  const fastify = require('fastify')()
  await fastify.register(require('../index'))

  fastify.api.get('/simple', function simple (req, reply) {
    reply.send('ok')
  })

  fastify.api(({ get }) => [
    get('/echo/:id', function echo ({ id }, req, reply) {
      reply.code(201)
      reply.send({ id, url: req.url })
    }),
    get('/echo-with-onRequest-hook/:id', {
      async onRequest (_, reply) {
        reply.header('x-on-request', 'true')
      }
    }, function echoWithOnRequestHook ({ id }, req, reply) {
      reply.code(201)
      reply.send({ id, url: req.url, requestHeaders: req.headers, requestQuery: req.query })
    })
  ])

  fastify.get('/invoke-echo', async (req, reply) => {
    const result = await fastify.api.client.echo({ id: 456 }, {
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
