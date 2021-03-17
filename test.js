'use strict'

const tap = require('tap')
const { getServer } = require('./examples/flat')

getServer().then(async (fastify) => {
  await fastify.ready()
  tap.tearDown(() => {
    fastify.close()
  })
  tap.test('should register flat API methods', (t) => {
    t.plan(3)
    t.ok(typeof fastify.api.client.simple === 'function')
    t.ok(typeof fastify.api.client.echo === 'function')
    t.ok(typeof fastify.api.client.echoWithOnRequestHook === 'function')
  })
  tap.test('show know when there are no params', async (t) => {
    t.plan(2)
    const simpleInject = await fastify.inject({ url: '/simple' })
    const simpleMethod = await fastify.api.client.simple()
    t.strictEqual(simpleInject.body, 'ok')
    t.strictEqual(simpleMethod.body, 'ok')
  })
  tap.test('registered API routes should work when invoked', async (t) => {
    t.plan(5)
    const echo = await fastify.inject({ url: '/echo/123' })
    t.strictEqual(echo.statusCode, 201)
    t.strictSame(echo.body, JSON.stringify({ id: '123', url: '/echo/123' }))
    const echoWithOnRequestHook = await fastify.inject({
      url: '/echo-with-onRequest-hook/123',
      query: {
        foobar: 1
      }
    })
    t.strictEqual(echoWithOnRequestHook.statusCode, 201)
    t.strictSame(echoWithOnRequestHook.headers, {
      'x-on-request': 'true',
      'content-type': 'application/json; charset=utf-8',
      'content-length': '160',
      date: echoWithOnRequestHook.headers?.date,
      connection: 'keep-alive'
    })
    t.strictSame(echoWithOnRequestHook.body, JSON.stringify({
      id: '123',
      url: '/echo-with-onRequest-hook/123?foobar=1',
      requestHeaders: {
        'user-agent': 'lightMyRequest',
        host: 'localhost:80'
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
    t.strictSame(echo.json, { id: '123', url: '/echo/123' })
    const echoWithOnRequestHook = await fastify.api.client.echoWithOnRequestHook({ id: 123 }, {
      query: {
        foobar: 1
      }
    })
    t.strictEqual(echoWithOnRequestHook.status, 201)
    t.strictSame(echoWithOnRequestHook.headers, {
      'x-on-request': 'true',
      'content-type': 'application/json; charset=utf-8',
      'content-length': '160',
      date: echoWithOnRequestHook.headers?.date,
      connection: 'keep-alive'
    })
    t.strictSame(echoWithOnRequestHook.json, {
      id: '123',
      url: '/echo-with-onRequest-hook/123?foobar=1',
      requestHeaders: {
        'user-agent': 'lightMyRequest',
        host: 'localhost:80'
      },
      requestQuery: {
        foobar: '1'
      }
    })
  })
})
