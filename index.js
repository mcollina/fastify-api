'use strict'

const fp = require('fastify-plugin')
const set = require('fast-path-set')
const { assign } = Object

async function fastifyApi (fastify, options) {
  const get = (...args) => registerMethod('get', ...args)
  const post = (...args) => registerMethod('post', ...args)
  const put = (...args) => registerMethod('put', ...args)
  const del = (...args) => registerMethod('delete', ...args)

  const api = function (setter) {
    const structure = setter({ get, post, put, del })
    const binder = func => func.bind(fastify)
    const [methods, meta] = recursiveRegister(structure, binder)
    assign(api.meta, meta)
    assign(api.client, methods)
  }

  api.meta = {}
  api.client = {}

  function topLeverSetter (setter) {
    return (...args) => {
      const method = setter(...args)
      api.client[method.name] = method.func
      api.meta[method.name] = [method.method, method.url]
    }
  }

  api.get = topLeverSetter(get)
  api.post = topLeverSetter(post)
  api.put = topLeverSetter(put)
  api.del = topLeverSetter(del)

  function registerMethod (method, url, options, handler, returnWrappers = false) {
    // eslint-disable-next-line prefer-const
    let injector
    let wrapper
    const hasParams = url.match(/\/:(\w+)/)
    if (hasParams) {
      if (!handler) {
        handler = options
        wrapper = function (req, reply) {
          return handler.call(this, req.params, req, reply)
        }
        if (!returnWrappers) {
          fastify[method](url, wrapper)
        }
      } else {
        wrapper = function (req, reply) {
          return handler.call(this, req.params, req, reply)
        }
        if (!returnWrappers) {
          fastify[method](url, options, wrapper)
        }
      }
    } else {
      if (!handler) {
        handler = options
        wrapper = function (req, reply) {
          return handler.call(this, req, reply)
        }
        if (!returnWrappers) {
          fastify[method](url, wrapper)
        }
      } else {
        wrapper = function (req, reply) {
          return handler.call(this, req, reply)
        }
        if (!returnWrappers) {
          fastify[method](url, options, wrapper)
        }
      }
    }
    const ucMethod = method.toUpperCase()
    // eslint-disable-next-line prefer-const
    injector = async function (...args) {
      let reqURL = url
      let reqOptions = {}
      let params = {}
      if (hasParams) {
        reqOptions = args[1] || reqOptions
        params = args[0]
        reqURL = applyParams(url, params)
        if (!reqURL) {
          throw new Error('Provided params don\'t match this API method\'s URL format')
        }
      } else {
        reqOptions = args[0] || reqOptions
      }
      const virtualReq = {
        method: ucMethod,
        query: reqOptions.query,
        headers: reqOptions.headers,
        payload: reqOptions.body,
        url: reqURL
      }
      const res = await fastify.inject(virtualReq)
      return {
        status: res.statusCode,
        headers: res.headers,
        query: res.query,
        body: res.payload,
        get json () {
          return tryJSONParse(res.payload)
        }
      }
    }
    const apiMethod = new APIMethod(handler.name, injector, ucMethod, url)
    if (returnWrappers) {
      return [wrapper, apiMethod]
    } else {
      return apiMethod
    }
  }

  function registerFromRegularRoute (route) {
    if (!route.exposeAs) {
      return
    }
    const { exposeAs } = route
    const lcMethod = route.method.toLowerCase()
    const [wrapper, apiMethod] = registerMethod(lcMethod, route.url, route, route.handler, true)
    set(api.client, exposeAs, apiMethod.func)
    set(api.meta, exposeAs, [apiMethod.method, apiMethod.url])
    route.handler = wrapper
    return route
  }

  fastify.addHook('onRoute', registerFromRegularRoute)
  fastify.decorate(options.decorateAs || 'api', api)
}

module.exports = fp(fastifyApi)

function APIMethod (name, func, method, url) {
  this.name = name || null
  this.func = func
  this.method = method
  this.url = url
}

function applyParams (template, params) {
  try {
    return template.replace(/:(\w+)/g, (_, m) => {
      if (params[m]) {
        return params[m]
      } else {
        // eslint-disable-next-line no-throw-literal
        throw null
      }
    })
  } catch (err) {
    return null
  }
}

function recursiveRegister (obj, binder, methods = {}, meta = {}) {
  for (const p in obj) {
    if (obj[p] instanceof APIMethod) {
      methods[obj[p].name || p] = obj[p].func
      meta[obj[p].name || p] = [obj[p].method, obj[p].url]
    } else if (obj[p] && typeof obj[p] === 'object') {
      const [childMethods, childMeta] = recursiveRegister(obj[p], binder)
      methods[p] = childMethods
      meta[p] = childMeta
    }
  }
  return [methods, meta]
}

function tryJSONParse (str) {
  try {
    return JSON.parse(str)
  } catch (_) {
    return undefined
  }
}
