
const fp = require('fastify-plugin')
const { VirtualReply } = require('./reply')
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
        try {
          return wrapper.call(this, req.params, req, reply)
        } catch (err) {
          console.error(err)
          throw err
        }
      })
    } else {
      fastify[method](url, options, function (req, reply) {
        try {
          return wrapper.call(this, req.params, req, reply)
        } catch (err) {
          console.error(err)
          throw err
        }
      })
    }
    let onRequest
    let preHandler
    let onSend
    let onResponse
    if (options) {
      onRequest = getHooks(options, 'onRequest')
      preHandler = getHooks(options, 'preHandler')
      onSend = getHooks(options, 'onSend')
      onResponse = getHooks(options, 'onResponse')
    }
    wrapper = function (params, reqOverride, reply) {
      // Here we actually need an async promise executor and we're doing it safely
      //
      // eslint-disable-next-line no-async-promise-executor
      return new Promise(async (resolve, reject) => {
        try {
          const virtualReq = reply
            ? reqOverride
            : assign(
              getVirtualRequest(url, method),
              reqOverride
            )
          const virtualReply = new VirtualReply(
            virtualReq,
            reply,
            onSend,
            onResponse,
            resolve
          )
          if (!reply) {
            if (onRequest) {
              for (const hook of onRequest) {
                if (!virtualReply.hijacked) {
                  await hook(virtualReq, virtualReply)
                }
              }
            }
            if (preHandler) {
              for (const hook of preHandler) {
                if (!virtualReply.hijacked) {
                  await hook(virtualReq, virtualReply)
                }
              }
            }
          }
          if (!virtualReply.hijacked) {
            await handler(
              params,
              virtualReq,
              virtualReply
            )
          }
        } catch (err) {
          console.error(err)
          reject(err)
        }
      })
    }
    return [handler.name, wrapper]
  }

  fastify.decorate(options.decorateAs || 'api', api)
}

module.exports = fp(fastifyApi)

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

function getVirtualRequest (url, method) {
  return {
    url,
    method: method.toUpperCase()
  }
}

function getHooks (options, type) {
  if (!options[type]) {
    return
  }
  return Array.isArray(options[type]) ? options[type] : [options[type]]
}
