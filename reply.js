
const kVirtualReq = Symbol('kVirtualReq')
const kReply = Symbol('kReply')
const kOnSend = Symbol('kOnSend')
const kOnResponse = Symbol('kOnResponse')
const kResolve = Symbol('kResolve')

class VirtualReply {
  constructor (virtualReq, reply, onSend, onResponse, resolve) {
    this.headers = undefined
    this.status = undefined
    this[kVirtualReq] = virtualReq
    this[kReply] = reply
    this[kOnSend] = onSend
    this[kOnResponse] = onResponse
    this[kResolve] = resolve
  }

  header (key, value) {
    if (this[kReply]) {
      this[kReply].header(key, value)
    } else {
      this.headers[key] = value
    }
  }

  code (status) {
    if (this[kReply]) {
      this[kReply].code(status)
    } else {
      this.status = status
    }
  }

  async send (body) {
    if (!this[kReply] && this[kOnSend]) {
      for (const hook of this[kOnSend]) {
        body = await hook(this[kVirtualReq], this, body)
      }
    }
    if (this[kReply]) {
      this[kReply].send(body)
    } else {
      this[kResolve]({
        body,
        headers: this.headers,
        status: this.status
      })
    }
    if (!this[kReply] && this[kOnResponse]) {
      for (const hook of this[kOnResponse]) {
        await hook(this[kVirtualReq], this)
      }
    }
  }
}

module.exports = { VirtualReply }
