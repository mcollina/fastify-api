'use strict'

const tap = require('tap')
const { getServer } = require('./example')

getServer().then(async (fastify) => {
  await fastify.ready()
  tap.tearDown(() => {
    fastify.close()
  })
  tap.test('should register all API methods', (t) => {
    t.plan(10)
    t.ok(typeof fastify.api.client.method === 'function')
    t.ok(typeof fastify.api.client.methodWithParams === 'function')
    t.ok(typeof fastify.api.client.nested.method === 'function')
    t.ok(typeof fastify.api.client.methodFromNamedFunction === 'function')
    t.ok(typeof fastify.api.client.topLevelMethod === 'function')
    t.ok(typeof fastify.api.client.nestedMethods.method === 'function')
    t.ok(typeof fastify.api.client.nestedMethods.otherMethod === 'function')
    t.ok(typeof fastify.api.client.nestedMethods.deeplyNestedMethods.method === 'function')
    t.ok(typeof fastify.api.client.nestedMethods.deeplyNestedMethods.otherMethod === 'function')
    t.ok(typeof fastify.api.client.methodWithOptions === 'function')
  })
  tap.test('should register all API metadata', (t) => {
    t.plan(1)
    t.strictSame(fastify.api.meta, {
      methodFromNamedFunction: [
        'GET',
        '/4/method'
      ],
      topLevelMethod: [
        'GET',
        '/5/top-level-method/:id'
      ],
      nestedMethods: {
        method: [
          'GET',
          '/5/nested-methods/method/:id'
        ],
        otherMethod: [
          'GET',
          '/5/nested-methods/other-method/:id'
        ],
        deeplyNestedMethods: {
          method: [
            'GET',
            '/5/nested-methods/deeply-nested-methods/method/:id'
          ],
          otherMethod: [
            'GET',
            '/5/nested-methods/deeply-nested-methods/other-method/:id'
          ]
        }
      },
      method: [
        'GET',
        '/1/method'
      ],
      methodWithParams: [
        'GET',
        '/2/method/:id'
      ],
      nested: {
        method: [
          'GET',
          '/3/nested/method/:id'
        ]
      },
      methodWithOptions: [
        'GET',
        '/6/method'
      ]
    })
  })
  // tap.test('show know when there are no params', async (t) => {
  //   t.plan(2)
  //   const simpleInject = await fastify.inject({ url: '/simple' })
  //   const simpleMethod = await fastify.api.client.simple()
  //   t.strictEqual(simpleInject.body, 'ok')
  //   t.strictEqual(simpleMethod.body, 'ok')
  // })
  // tap.test('registered API routes should work when invoked', async (t) => {
  //   t.plan(5)
  //   const echo = await fastify.inject({ url: '/echo/123' })
  //   t.strictEqual(echo.statusCode, 201)
  //   t.strictSame(echo.body, JSON.stringify({ id: '123', url: '/echo/123' }))
  //   const echoWithOnRequestHook = await fastify.inject({
  //     url: '/echo-with-onRequest-hook/123',
  //     query: {
  //       foobar: 1
  //     }
  //   })
  //   t.strictEqual(echoWithOnRequestHook.statusCode, 201)
  //   t.strictSame(echoWithOnRequestHook.headers, {
  //     'x-on-request': 'true',
  //     'content-type': 'application/json; charset=utf-8',
  //     'content-length': '160',
  //     date: echoWithOnRequestHook.headers?.date,
  //     connection: 'keep-alive'
  //   })
  //   t.strictSame(echoWithOnRequestHook.body, JSON.stringify({
  //     id: '123',
  //     url: '/echo-with-onRequest-hook/123?foobar=1',
  //     requestHeaders: {
  //       'user-agent': 'lightMyRequest',
  //       host: 'localhost:80'
  //     },
  //     requestQuery: {
  //       foobar: '1'
  //     }
  //   }))
  // })
})
