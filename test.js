'use strict'

const tap = require('tap')
const { getServer } = require('./examples/flat')

getServer().then(async (fastify) => {
  await fastify.ready()
  tap.tearDown(() => {
    fastify.close()
  })
  tap.test('should register flat API methods', (t) => {
    t.plan(2)
    t.ok(typeof fastify.api.client.echo === 'function')
    t.ok(typeof fastify.api.client.echoWithOnRequestHook === 'function')
  })
  tap.test('registered API routes should work when invoked', async (t) => {
    t.plan(5)
    const echo = await fastify.inject({ url: '/echo/123' })
    t.strictEqual(echo.statusCode, 201)
    t.strictSame(echo.body, JSON.stringify({ id: '123', url: '/echo/123' }))
    const echoWithOnRequestHook = await fastify.inject({ url: '/echo-with-onRequest-hook/123' }, {
      query: {
        foobar: 1
      },
    })
    t.strictEqual(echoWithOnRequestHook.statusCode, 201)
    t.strictSame(echoWithOnRequestHook.headers, {
      'x-on-request': 'true',
      'content-type': 'application/json; charset=utf-8',
      'content-length': '139',
      'date': echoWithOnRequestHook.headers?.date,
      'connection': 'keep-alive',
    })
    t.strictSame(echoWithOnRequestHook.body, JSON.stringify({
      id: '123',
      url: '/echo-with-onRequest-hook/123',
      requestHeaders: {
        'user-agent': 'lightMyRequest',
        'host': 'localhost:80',
      },
      requestQuery: {
        foobar: '1'
      }
    }))
  })
  tap.test('registered API methods should work when invoked', async (t) => {
    t.plan(5)
    const echo = await fastify.api.client.echo({ id: 123 })
    t.strictEqual(echo.status, 201)
    t.strictSame(echo.body, { id: '123', url: '/echo/123' })
    const echoWithOnRequestHook = await fastify.api.client.echoWithOnRequestHook({ id: 123 }, {
      query: {
        foobar: 1
      },
    })
    t.strictEqual(echoWithOnRequestHook.status, 201)
    t.strictSame(echoWithOnRequestHook.headers, {
      'x-on-request': 'true',
      'content-type': 'application/json; charset=utf-8',
      'content-length': '160',
      'date': echoWithOnRequestHook.headers?.date,
      'connection': 'keep-alive',
    })
    t.strictSame(echoWithOnRequestHook.body, {
      id: '123',
      url: '/echo-with-onRequest-hook/123?foobar=1',
      requestHeaders: {
        'user-agent': 'lightMyRequest',
        'host': 'localhost:80',
      },
      requestQuery: {
        foobar: '1'
      }
    })
  })
})
