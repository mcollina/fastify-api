
async function getServer () {
  const fastify = require('fastify')()
  await fastify.register(require('../index'))

  fastify.api(({ get }) => ({
    top: {
      echo: get('/echo/:id', ({ id }, req, reply) => {
        reply.code(201)
        reply.send({ id, url: req.url })
      }),
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
    },
    other: get('/other/:id', function ({ id }, req, reply) {
      reply.send({ id })
    })
  }))

  fastify.get('/invoke-namespaced-echo', async (req, reply) => {
    const result = await fastify.api.client.top.inner.echoWithOnResponseHook({ id: 456 }, {
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
