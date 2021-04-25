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
  tap.test('show know when there are no params', async (t) => {
    t.plan(3)
    const direct = await fastify.inject({ url: '/1/method' })
    const proxied = await fastify.inject({ url: '/invoke/1/method' })
    const internal = await fastify.api.client.method()
    t.equal(direct.body, 'Hello from /1/method')
    t.equal(proxied.json().body, 'Hello from /1/method')
    t.equal(internal.body, 'Hello from /1/method')
  })
  tap.test('top-level methods defined via api() helper should work', async (t) => {
    t.plan(3)
    const direct = await fastify.inject({ url: '/5/top-level-method/123' })
    const proxied = await fastify.inject({ url: '/invoke/5/top-level-method' })
    const internal = await fastify.api.client.topLevelMethod({ id: 123 })
    t.strictSame(direct.json(), {"id":"123"})
    t.strictSame(proxied.json().body, '{"id":"123"}')
    t.strictSame(internal.json, {"id":"123"})
  })
  tap.test('deeply-nested methods defined via api() helper should work', async (t) => {
    t.plan(3)
    const direct = await fastify.inject({ url: '/5/nested-methods/deeply-nested-methods/method/123' })
    const proxied = await fastify.inject({ url: '/invoke/5/nested-methods/deeply-nested-methods/method' })
    const internal = await fastify.api.client.nestedMethods.deeplyNestedMethods.method({ id: 123 })
    t.strictSame(direct.json(), {"id":"123"})
    t.strictSame(proxied.json().body, '{"id":"123"}')
    t.strictSame(internal.json, {"id":"123"})
  })
  tap.test('should capture additional options', async (t) => {
    t.plan(1)
    const internal = await fastify.api.client.methodWithOptions({
      query: {
        arg: 1
      },
      headers: {
        'x-foobar': 1
      }
    })
    t.equal(internal.body, 'Hello from /6/method/ with query.arg 1 and the x-foobar header 1')
  })
})
