
const fp = require('fastify-plugin')
const { assign } = Object

async function fastifyApi (fastify, options) {
  const api = function (setter) {
    const structure = setter({
      get: (...args) => registerMethod('get', ...args),
      post: (...args) => registerMethod('post', ...args),
      put: (...args) => registerMethod('put', ...args),
      del: (...args) => registerMethod('delete', ...args)
    })
    if (Array.isArray(structure)) {
      for (const [name, func] of structure) {
        api[name] = func.bind(fastify)
      }
    } else {
      const binder = func => func.bind(fastify)
      assign(api, recursiveRegister(structure, {}, binder))
    }
  }

  function registerMethod (method, url, options, handler) {
    // eslint-disable-next-line prefer-const
    let wrapper
    if (!handler) {
      handler = options
      fastify[method](url, function (req, reply) {
        return handler.call(this, req.params, req, reply)
      })
    } else {
      fastify[method](url, options, function (req, reply) {
        return handler.call(this, req.params, req, reply)
      })
    }
    // eslint-disable-next-line prefer-const
    wrapper = async function (params, reqOptions) {
      const reqURL = applyParams(url, params)
      if (!reqURL) {
        throw new Error('Provided params don\'t match this API method\'s URL format')
      }
      const virtualReq = {
        method: reqOptions.method || 'GET',
        query: reqOptions.query,
        headers: reqOptions.headders,
        payload: reqOptions.body,
        url: reqURL
      }
      const res = await fastify.inject(virtualReq)
      return {
        status: res.statusCode,
        headers: res.headers,
        body: JSON.parse(res.payload)
      }
    }
    return [handler.name, wrapper]
  }

  fastify.decorate(options.decorateAs || 'api', api)
}

module.exports = fp(fastifyApi)

function applyParams (template, params) {
  try {
    return template.replace(/:(\w+)/, (_, m) => {
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

function recursiveRegister (entries, result = {}, binder) {
  if (Array.isArray(entries)) {
    for (const [name, func] of entries) {
      result[name] = binder(func)
    }
  } else {
    for (const [name, def] of Object.entries(entries)) {
      result[name] = recursiveRegister(def, {}, binder)
    }
  }
  return result
}
