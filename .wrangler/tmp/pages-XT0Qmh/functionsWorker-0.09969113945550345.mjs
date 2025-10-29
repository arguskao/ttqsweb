const __create = Object.create
const __defProp = Object.defineProperty
const __getOwnPropDesc = Object.getOwnPropertyDescriptor
const __getOwnPropNames = Object.getOwnPropertyNames
const __getProtoOf = Object.getPrototypeOf
const __hasOwnProp = Object.prototype.hasOwnProperty
const __name = (target, value) => __defProp(target, 'name', { value, configurable: true })
const __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res
}
const __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports
}
const __export = (target, all) => {
  for (const name in all)
    __defProp(target, name, { get: all[name], enumerable: true })
}
const __copyProps = (to, from, except, desc) => {
  if (from && typeof from === 'object' || typeof from === 'function') {
    for (const key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable })
  }
  return to
}
const __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, 'default', { value: mod, enumerable: true }) : target,
  mod
))

// ../.wrangler/tmp/bundle-JSLPnp/checked-fetch.js
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === 'string' ? new Request(request, init) : request).url
  )
  if (url.port && url.port !== '443' && url.protocol === 'https:') {
    if (!urls.has(url.toString())) {
      urls.add(url.toString())
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      )
    }
  }
}
let urls
const init_checked_fetch = __esm({
  '../.wrangler/tmp/bundle-JSLPnp/checked-fetch.js'() {
    urls = /* @__PURE__ */ new Set()
    __name(checkURL, 'checkURL')
    globalThis.fetch = new Proxy(globalThis.fetch, {
      apply(target, thisArg, argArray) {
        const [request, init] = argArray
        checkURL(request, init)
        return Reflect.apply(target, thisArg, argArray)
      }
    })
  }
})

// ../node_modules/@neondatabase/serverless/index.mjs
const serverless_exports = {}
__export(serverless_exports, {
  Client: () => ut,
  DatabaseError: () => export_DatabaseError,
  NeonDbError: () => be,
  NeonQueryPromise: () => Ce,
  Pool: () => Mn,
  SqlTemplate: () => $e,
  UnsafeRawSql: () => Ge,
  _bundleExt: () => kp,
  defaults: () => export_defaults,
  escapeIdentifier: () => export_escapeIdentifier,
  escapeLiteral: () => export_escapeLiteral,
  neon: () => cs,
  neonConfig: () => ce,
  types: () => export_types,
  warnIfBrowser: () => bt
})
function ha(r) {
  return 0
}
function Yt(r, e = false) {
  let { protocol: t } = new URL(r), n = `http:${r.substring(
      t.length
    )}`, { username: i, password: s, host: o, hostname: u, port: c, pathname: l, search: f, searchParams: y, hash: g } = new URL(
      n
    )
  s = decodeURIComponent(s), i = decodeURIComponent(i), l = decodeURIComponent(l)
  const A = `${i}:${s}`, C = e ? Object.fromEntries(y.entries()) : f
  return {
    href: r,
    protocol: t,
    auth: A,
    username: i,
    password: s,
    host: o,
    hostname: u,
    port: c,
    pathname: l,
    search: f,
    query: C,
    hash: g
  }
}
function Xe(r) {
  let e = 1779033703, t = 3144134277, n = 1013904242, i = 2773480762, s = 1359893119, o = 2600822924, u = 528734635, c = 1541459225, l = 0, f = 0, y = [
      1116352408,
      1899447441,
      3049323471,
      3921009573,
      961987163,
      1508970993,
      2453635748,
      2870763221,
      3624381080,
      310598401,
      607225278,
      1426881987,
      1925078388,
      2162078206,
      2614888103,
      3248222580,
      3835390401,
      4022224774,
      264347078,
      604807628,
      770255983,
      1249150122,
      1555081692,
      1996064986,
      2554220882,
      2821834349,
      2952996808,
      3210313671,
      3336571891,
      3584528711,
      113926993,
      338241895,
      666307205,
      773529912,
      1294757372,
      1396182291,
      1695183700,
      1986661051,
      2177026350,
      2456956037,
      2730485921,
      2820302411,
      3259730800,
      3345764771,
      3516065817,
      3600352804,
      4094571909,
      275423344,
      430227734,
      506948616,
      659060556,
      883997877,
      958139571,
      1322822218,
      1537002063,
      1747873779,
      1955562222,
      2024104815,
      2227730452,
      2361852424,
      2428436474,
      2756734187,
      3204031479,
      3329325298
    ], g = a((I, w) => I >>> w | I << 32 - w, 'rrot'), A = new Uint32Array(64), C = new Uint8Array(64), D = a(() => {
      for (let R = 0, j = 0; R < 16; R++, j += 4) A[R] = C[j] << 24 | C[j + 1] << 16 | C[j + 2] << 8 | C[j + 3]
      for (let R = 16; R < 64; R++) {
        const j = g(A[R - 15], 7) ^ g(A[R - 15], 18) ^ A[R - 15] >>> 3, le = g(
          A[R - 2],
          17
        ) ^ g(A[R - 2], 19) ^ A[R - 2] >>> 10
        A[R] = A[R - 16] + j + A[R - 7] + le | 0
      }
      let I = e, w = t, Z = n, W = i, J = s, X = o, se = u, oe = c
      for (let R = 0; R < 64; R++) {
        const j = g(J, 6) ^ g(J, 11) ^ g(J, 25), le = J & X ^ ~J & se, de = oe + j + le + y[R] + A[R] | 0, We = g(I, 2) ^ g(
            I,
            13
          ) ^ g(I, 22), fe = I & w ^ I & Z ^ w & Z, _e = We + fe | 0
        oe = se, se = X, X = J, J = W + de | 0, W = Z, Z = w, w = I, I = de + _e | 0
      }
      e = e + I | 0, t = t + w | 0, n = n + Z | 0, i = i + W | 0, s = s + J | 0, o = o + X | 0, u = u + se | 0, c = c + oe | 0, f = 0
    }, 'process'), Y = a((I) => {
      typeof I == 'string' && (I = new TextEncoder().encode(I))
      for (let w = 0; w < I.length; w++) C[f++] = I[w], f === 64 && D()
      l += I.length
    }, 'add'), P = a(() => {
      if (C[f++] = 128, f == 64 && D(), f + 8 > 64) {
        while (f < 64) C[f++] = 0
        D()
      }
      while (f < 58) C[f++] = 0
      const I = l * 8
      C[f++] = I / 1099511627776 & 255, C[f++] = I / 4294967296 & 255, C[f++] = I >>> 24, C[f++] = I >>> 16 & 255, C[f++] = I >>> 8 & 255, C[f++] = I & 255, D()
      const w = new Uint8Array(
        32
      )
      return w[0] = e >>> 24, w[1] = e >>> 16 & 255, w[2] = e >>> 8 & 255, w[3] = e & 255, w[4] = t >>> 24, w[5] = t >>> 16 & 255, w[6] = t >>> 8 & 255, w[7] = t & 255, w[8] = n >>> 24, w[9] = n >>> 16 & 255, w[10] = n >>> 8 & 255, w[11] = n & 255, w[12] = i >>> 24, w[13] = i >>> 16 & 255, w[14] = i >>> 8 & 255, w[15] = i & 255, w[16] = s >>> 24, w[17] = s >>> 16 & 255, w[18] = s >>> 8 & 255, w[19] = s & 255, w[20] = o >>> 24, w[21] = o >>> 16 & 255, w[22] = o >>> 8 & 255, w[23] = o & 255, w[24] = u >>> 24, w[25] = u >>> 16 & 255, w[26] = u >>> 8 & 255, w[27] = u & 255, w[28] = c >>> 24, w[29] = c >>> 16 & 255, w[30] = c >>> 8 & 255, w[31] = c & 255, w
    }, 'digest')
  return r === void 0 ? { add: Y, digest: P } : (Y(r), P())
}
function gu(r) {
  return crypto.getRandomValues(d.alloc(r))
}
function bu(r) {
  if (r === 'sha256') return { update: a(function(e) {
    return { digest: a(
      function() {
        return d.from(Xe(e))
      },
      'digest'
    ) }
  }, 'update') }
  if (r === 'md5') return { update: a(function(e) {
    return {
      digest: a(function() {
        return typeof e == 'string' ? et.hashStr(e) : et.hashByteArray(e)
      }, 'digest')
    }
  }, 'update') }
  throw new Error(`Hash type '${r}' not supported`)
}
function vu(r, e) {
  if (r !== 'sha256') throw new Error(`Only sha256 is supported (requested: '${r}')`)
  return { update: a(function(t) {
    return { digest: a(
      function() {
        typeof e == 'string' && (e = new TextEncoder().encode(e)), typeof t == 'string' && (t = new TextEncoder().encode(
          t
        ))
        const n = e.length
        if (n > 64) e = Xe(e)
        else if (n < 64) {
          const c = new Uint8Array(64)
          c.set(e), e = c
        }
        const i = new Uint8Array(
            64
          ), s = new Uint8Array(64)
        for (let c = 0; c < 64; c++) i[c] = 54 ^ e[c], s[c] = 92 ^ e[c]
        const o = new Uint8Array(t.length + 64)
        o.set(i, 0), o.set(t, 64)
        const u = new Uint8Array(96)
        return u.set(s, 0), u.set(Xe(o), 64), d.from(Xe(u))
      },
      'digest'
    ) }
  }, 'update') }
}
function ju(...r) {
  return r.join('/')
}
function Hu(r, e) {
  e(new Error('No filesystem'))
}
function $c({ socket: r, servername: e }) {
  return r.startTls(e), r
}
function Ea(r, { alphabet: e, scratchArr: t } = {}) {
  if (!He) if (He = new Uint16Array(256), wt = new Uint16Array(256), xi) for (let C = 0; C < 256; C++) He[C] = yt[C & 15] << 8 | yt[C >>> 4], wt[C] = mt[C & 15] << 8 | mt[C >>> 4]
  else for (let C = 0; C < 256; C++) He[C] = yt[C & 15] | yt[C >>> 4] << 8, wt[C] = mt[C & 15] | mt[C >>> 4] << 8
  r.byteOffset % 4 !== 0 && (r = new Uint8Array(r))
  let n = r.length, i = n >>> 1, s = n >>> 2, o = t || new Uint16Array(n), u = new Uint32Array(
      r.buffer,
      r.byteOffset,
      s
    ), c = new Uint32Array(o.buffer, o.byteOffset, i), l = e === 'upper' ? wt : He, f = 0, y = 0, g
  if (xi)
    while (f < s) g = u[f++], c[y++] = l[g >>> 8 & 255] << 16 | l[g & 255], c[y++] = l[g >>> 24] << 16 | l[g >>> 16 & 255]
  else while (f < s)
    g = u[f++], c[y++] = l[g >>> 24] << 16 | l[g >>> 16 & 255], c[y++] = l[g >>> 8 & 255] << 16 | l[g & 255]
  for (f <<= 2; f < n; ) o[f] = l[r[f++]]
  return xa.decode(o.subarray(0, n))
}
function Aa(r, e = {}) {
  let t = '', n = r.length, i = va >>> 1, s = Math.ceil(n / i), o = new Uint16Array(s > 1 ? i : n)
  for (let u = 0; u < s; u++) {
    const c = u * i, l = c + i
    t += Ea(r.subarray(c, l), ba(ga(
      {},
      e
    ), { scratchArr: o }))
  }
  return t
}
function Ei(r, e = {}) {
  return e.alphabet !== 'upper' && typeof r.toHex == 'function' ? r.toHex() : Aa(r, e)
}
function bt() {
  typeof window < 'u' && typeof document < 'u' && typeof console < 'u' && typeof console.warn == 'function' && console.warn(`          
        ************************************************************
        *                                                          *
        *  WARNING: Running SQL directly from the browser can have *
        *  security implications. Even if your database is         *
        *  protected by Row-Level Security (RLS), use it at your   *
        *  own risk. This approach is great for fast prototyping,  *
        *  but ensure proper safeguards are in place to prevent    *
        *  misuse or execution of expensive SQL queries by your    *
        *  end users.                                              *
        *                                                          *
        *  If you've assessed the risks, suppress this message     *
        *  using the disableWarningInBrowsers configuration        *
        *  parameter.                                              *
        *                                                          *
        ************************************************************`)
}
function Lu(r) {
  return r instanceof d ? `\\x${Ei(r)}` : r
}
function ss(r) {
  const { query: e, params: t } = r instanceof $e ? r.toParameterizedQuery() : r
  return { query: e, params: t.map((n) => Lu((0, us.prepareValue)(n))) }
}
function cs(r, {
  arrayMode: e,
  fullResults: t,
  fetchOptions: n,
  isolationLevel: i,
  readOnly: s,
  deferrable: o,
  authToken: u,
  disableWarningInBrowsers: c
} = {}) {
  if (!r) throw new Error('No database connection string was provided to `neon()`. Perhaps an environment variable has not been set?')
  let l
  try {
    l = Yt(r)
  } catch {
    throw new Error(
      `Database connection string provided to \`neon()\` is not a valid URL. Connection string: ${String(r)}`
    )
  }
  const { protocol: f, username: y, hostname: g, port: A, pathname: C } = l
  if (f !== 'postgres:' && f !== 'postgresql:' || !y || !g || !C) throw new Error('Database connection string format for `neon()` should be: postgresql://user:password@host.tld/dbname?option=value')
  function D(P, ...I) {
    if (!(Array.isArray(P) && Array.isArray(P.raw) && Array.isArray(I))) throw new Error('This function can now be called only as a tagged-template function: sql`SELECT ${value}`, not sql("SELECT $1", [value], options). For a conventional function call with value placeholders ($1, $2, etc.), use sql.query("SELECT $1", [value], options).')
    return new Ce(
      Y,
      new $e(P, I)
    )
  }
  __name(D, 'D')
  a(D, 'templateFn'), D.query = (P, I, w) => new Ce(Y, { query: P, params: I ?? [] }, w), D.unsafe = (P) => new Ge(
    P
  ), D.transaction = async (P, I) => {
    if (typeof P == 'function' && (P = P(D)), !Array.isArray(P)) throw new Error(is)
    P.forEach((W) => {
      if (!(W instanceof Ce)) throw new Error(is)
    })
    const w = P.map((W) => W.queryData), Z = P.map((W) => W.opts ?? {})
    return Y(w, Z, I)
  }
  async function Y(P, I, w) {
    let { fetchEndpoint: Z, fetchFunction: W } = ce, J = Array.isArray(
        P
      ) ? { queries: P.map((ee) => ss(ee)) } : ss(P), X = n ?? {}, se = e ?? false, oe = t ?? false, R = i, j = s, le = o
    w !== void 0 && (w.fetchOptions !== void 0 && (X = { ...X, ...w.fetchOptions }), w.arrayMode !== void 0 && (se = w.arrayMode), w.fullResults !== void 0 && (oe = w.fullResults), w.isolationLevel !== void 0 && (R = w.isolationLevel), w.readOnly !== void 0 && (j = w.readOnly), w.deferrable !== void 0 && (le = w.deferrable)), I !== void 0 && !Array.isArray(I) && I.fetchOptions !== void 0 && (X = { ...X, ...I.fetchOptions })
    let de = u
    !Array.isArray(I) && I?.authToken !== void 0 && (de = I.authToken)
    const We = typeof Z == 'function' ? Z(g, A, { jwtAuth: de !== void 0 }) : Z, fe = { 'Neon-Connection-String': r, 'Neon-Raw-Text-Output': 'true', 'Neon-Array-Mode': 'true' }, _e = await Fu(de)
    _e && (fe.Authorization = `Bearer ${_e}`), Array.isArray(P) && (R !== void 0 && (fe['Neon-Batch-Isolation-Level'] = R), j !== void 0 && (fe['Neon-Batch-Read-Only'] = String(j)), le !== void 0 && (fe['Neon-Batch-Deferrable'] = String(le))), c || ce.disableWarningInBrowsers || bt()
    let ye
    try {
      ye = await (W ?? fetch)(We, { method: 'POST', body: JSON.stringify(J), headers: fe, ...X })
    } catch (ee) {
      const M = new be(
        `Error connecting to database: ${ee}`
      )
      throw M.sourceError = ee, M
    }
    if (ye.ok) {
      const ee = await ye.json()
      if (Array.isArray(P)) {
        const M = ee.results
        if (!Array.isArray(M)) throw new be('Neon internal error: unexpected result format')
        return M.map(($, me) => {
          const Ot = I[me] ?? {}, vo = Ot.arrayMode ?? se, xo = Ot.fullResults ?? oe
          return os(
            $,
            { arrayMode: vo, fullResults: xo, types: Ot.types }
          )
        })
      } else {
        const M = I ?? {}, $ = M.arrayMode ?? se, me = M.fullResults ?? oe
        return os(ee, { arrayMode: $, fullResults: me, types: M.types })
      }
    } else {
      const { status: ee } = ye
      if (ee === 400) {
        const M = await ye.json(), $ = new be(M.message)
        for (const me of Ru) $[me] = M[me] ?? void 0
        throw $
      } else {
        const M = await ye.text()
        throw new be(
          `Server error (HTTP status ${ee}): ${M}`
        )
      }
    }
  }
  __name(Y, 'Y')
  return a(Y, 'execute'), D
}
function os(r, {
  arrayMode: e,
  fullResults: t,
  types: n
}) {
  const i = new as.default(n), s = r.fields.map((c) => c.name), o = r.fields.map((c) => i.getTypeParser(
      c.dataTypeID
    )), u = e === true ? r.rows.map((c) => c.map((l, f) => l === null ? null : o[f](l))) : r.rows.map((c) => Object.fromEntries(
      c.map((l, f) => [s[f], l === null ? null : o[f](l)])
    ))
  return t ? (r.viaNeonFetch = true, r.rowAsArray = e, r.rows = u, r._parsers = o, r._types = i, r) : u
}
async function Fu(r) {
  if (typeof r == 'string') return r
  if (typeof r == 'function') try {
    return await Promise.resolve(r())
  } catch (e) {
    let t = new be('Error getting auth token.')
    throw e instanceof Error && (t = new be(`Error getting auth token: ${e.message}`)), t
  }
}
function vl(r, e) {
  if (e) return { callback: e, result: void 0 }
  let t, n, i = a(function(o, u) {
      o ? t(o) : n(u)
    }, 'cb'), s = new r(function(o, u) {
      n = o, t = u
    })
  return { callback: i, result: s }
}
let So, Ie, Eo, Ao, Co, _o, Io, a, G, T, ie, Dn, Se, O, E, Qn, Nn, ii, b, v, x, d, m, p, ge, wi, mi, yi, S, ce, Fe, gi, Zt, tr, rr, Ti, Bi, Fi, Mi, Wi, Hi, Ki, Zi, Je, At, es, U, et, ts, lr, fr, tt, rt, nt, ku, it, ds, mr, wr, gr, br, vr, $u, xr, ys, Er, Sr, ms, vs, Es, Cs, _s, cc, Is, Ps, Bt, Ms, qs, ln, Qs, Ws, js, Gs, vn, Vs, zs, En, eo, io, so, ol, oo, ao, lo, yo, Ln, ot, pa, da, ya, bi, ma, wa, vi, ga, ba, va, xi, xa, Jt, yt, mt, Sa, Si, He, wt, gt, $e, Xt, Ge, as, us, _t, be, is, Ru, dr, Ce, go, wo, kn, ut, bo, Un, Mn, ct, kp, export_DatabaseError, export_defaults, export_escapeIdentifier, export_escapeLiteral, export_types
const init_serverless = __esm({
  '../node_modules/@neondatabase/serverless/index.mjs'() {
    init_functionsRoutes_0_7735455656432807()
    init_checked_fetch()
    So = Object.create
    Ie = Object.defineProperty
    Eo = Object.getOwnPropertyDescriptor
    Ao = Object.getOwnPropertyNames
    Co = Object.getPrototypeOf
    _o = Object.prototype.hasOwnProperty
    Io = /* @__PURE__ */ __name((r, e, t) => e in r ? Ie(r, e, { enumerable: true, configurable: true, writable: true, value: t }) : r[e] = t, 'Io')
    a = /* @__PURE__ */ __name((r, e) => Ie(r, 'name', { value: e, configurable: true }), 'a')
    G = /* @__PURE__ */ __name((r, e) => () => (r && (e = r(r = 0)), e), 'G')
    T = /* @__PURE__ */ __name((r, e) => () => (e || r((e = { exports: {} }).exports, e), e.exports), 'T')
    ie = /* @__PURE__ */ __name((r, e) => {
      for (const t in e) Ie(r, t, {
        get: e[t],
        enumerable: true
      })
    }, 'ie')
    Dn = /* @__PURE__ */ __name((r, e, t, n) => {
      if (e && typeof e == 'object' || typeof e == 'function') for (const i of Ao(e)) !_o.call(r, i) && i !== t && Ie(r, i, { get: /* @__PURE__ */ __name(() => e[i], 'get'), enumerable: !(n = Eo(e, i)) || n.enumerable })
      return r
    }, 'Dn')
    Se = /* @__PURE__ */ __name((r, e, t) => (t = r != null ? So(Co(r)) : {}, Dn(e || !r || !r.__esModule ? Ie(t, 'default', { value: r, enumerable: true }) : t, r)), 'Se')
    O = /* @__PURE__ */ __name((r) => Dn(Ie({}, '__esModule', { value: true }), r), 'O')
    E = /* @__PURE__ */ __name((r, e, t) => Io(r, typeof e != 'symbol' ? `${e}` : e, t), 'E')
    Qn = T((lt) => {
      'use strict'
      p()
      lt.byteLength = Po
      lt.toByteArray = Ro
      lt.fromByteArray = ko
      const ae = [], te = [], To = typeof Uint8Array < 'u' ? Uint8Array : Array, qt = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
      for (Ee = 0, On = qt.length; Ee < On; ++Ee) ae[Ee] = qt[Ee], te[qt.charCodeAt(Ee)] = Ee
      let Ee, On
      te[45] = 62
      te[95] = 63
      function qn(r) {
        const e = r.length
        if (e % 4 > 0) throw new Error('Invalid string. Length must be a multiple of 4')
        let t = r.indexOf('=')
        t === -1 && (t = e)
        const n = t === e ? 0 : 4 - t % 4
        return [t, n]
      }
      __name(qn, 'qn')
      a(qn, 'getLens')
      function Po(r) {
        const e = qn(r), t = e[0], n = e[1]
        return (t + n) * 3 / 4 - n
      }
      __name(Po, 'Po')
      a(Po, 'byteLength')
      function Bo(r, e, t) {
        return (e + t) * 3 / 4 - t
      }
      __name(Bo, 'Bo')
      a(Bo, '_byteLength')
      function Ro(r) {
        let e, t = qn(r), n = t[0], i = t[1], s = new To(Bo(r, n, i)), o = 0, u = i > 0 ? n - 4 : n, c
        for (c = 0; c < u; c += 4) e = te[r.charCodeAt(c)] << 18 | te[r.charCodeAt(c + 1)] << 12 | te[r.charCodeAt(c + 2)] << 6 | te[r.charCodeAt(c + 3)], s[o++] = e >> 16 & 255, s[o++] = e >> 8 & 255, s[o++] = e & 255
        return i === 2 && (e = te[r.charCodeAt(
          c
        )] << 2 | te[r.charCodeAt(c + 1)] >> 4, s[o++] = e & 255), i === 1 && (e = te[r.charCodeAt(c)] << 10 | te[r.charCodeAt(c + 1)] << 4 | te[r.charCodeAt(c + 2)] >> 2, s[o++] = e >> 8 & 255, s[o++] = e & 255), s
      }
      __name(Ro, 'Ro')
      a(Ro, 'toByteArray')
      function Lo(r) {
        return ae[r >> 18 & 63] + ae[r >> 12 & 63] + ae[r >> 6 & 63] + ae[r & 63]
      }
      __name(Lo, 'Lo')
      a(Lo, 'tripletToBase64')
      function Fo(r, e, t) {
        for (var n, i = [], s = e; s < t; s += 3) n = (r[s] << 16 & 16711680) + (r[s + 1] << 8 & 65280) + (r[s + 2] & 255), i.push(Lo(n))
        return i.join('')
      }
      __name(Fo, 'Fo')
      a(Fo, 'encodeChunk')
      function ko(r) {
        for (var e, t = r.length, n = t % 3, i = [], s = 16383, o = 0, u = t - n; o < u; o += s) i.push(Fo(
          r,
          o,
          o + s > u ? u : o + s
        ))
        return n === 1 ? (e = r[t - 1], i.push(`${ae[e >> 2] + ae[e << 4 & 63]}==`)) : n === 2 && (e = (r[t - 2] << 8) + r[t - 1], i.push(`${ae[e >> 10] + ae[e >> 4 & 63] + ae[e << 2 & 63]}=`)), i.join('')
      }
      __name(ko, 'ko')
      a(ko, 'fromByteArray')
    })
    Nn = T((Qt) => {
      p()
      Qt.read = function(r, e, t, n, i) {
        let s, o, u = i * 8 - n - 1, c = (1 << u) - 1, l = c >> 1, f = -7, y = t ? i - 1 : 0, g = t ? -1 : 1, A = r[e + y]
        for (y += g, s = A & (1 << -f) - 1, A >>= -f, f += u; f > 0; s = s * 256 + r[e + y], y += g, f -= 8) ;
        for (o = s & (1 << -f) - 1, s >>= -f, f += n; f > 0; o = o * 256 + r[e + y], y += g, f -= 8) ;
        if (s === 0) s = 1 - l
        else {
          if (s === c) return o ? NaN : (A ? -1 : 1) * (1 / 0)
          o = o + Math.pow(2, n), s = s - l
        }
        return (A ? -1 : 1) * o * Math.pow(2, s - n)
      }
      Qt.write = function(r, e, t, n, i, s) {
        let o, u, c, l = s * 8 - i - 1, f = (1 << l) - 1, y = f >> 1, g = i === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0, A = n ? 0 : s - 1, C = n ? 1 : -1, D = e < 0 || e === 0 && 1 / e < 0 ? 1 : 0
        for (e = Math.abs(e), isNaN(e) || e === 1 / 0 ? (u = isNaN(e) ? 1 : 0, o = f) : (o = Math.floor(Math.log(e) / Math.LN2), e * (c = Math.pow(2, -o)) < 1 && (o--, c *= 2), o + y >= 1 ? e += g / c : e += g * Math.pow(2, 1 - y), e * c >= 2 && (o++, c /= 2), o + y >= f ? (u = 0, o = f) : o + y >= 1 ? (u = (e * c - 1) * Math.pow(2, i), o = o + y) : (u = e * Math.pow(2, y - 1) * Math.pow(2, i), o = 0)); i >= 8; r[t + A] = u & 255, A += C, u /= 256, i -= 8) ;
        for (o = o << i | u, l += i; l > 0; r[t + A] = o & 255, A += C, o /= 256, l -= 8) ;
        r[t + A - C] |= D * 128
      }
    })
    ii = T((Re) => {
      'use strict'
      p()
      const Nt = Qn(), Pe = Nn(), Wn = typeof Symbol == 'function' && typeof Symbol.for == 'function' ? Symbol.for('nodejs.util.inspect.custom') : null
      Re.Buffer = h
      Re.SlowBuffer = Qo
      Re.INSPECT_MAX_BYTES = 50
      const ft = 2147483647
      Re.kMaxLength = ft
      h.TYPED_ARRAY_SUPPORT = Mo()
      !h.TYPED_ARRAY_SUPPORT && typeof console < 'u' && typeof console.error == 'function' && console.error('This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support.')
      function Mo() {
        try {
          const r = new Uint8Array(1), e = { foo: a(function() {
            return 42
          }, 'foo') }
          return Object.setPrototypeOf(e, Uint8Array.prototype), Object.setPrototypeOf(r, e), r.foo() === 42
        } catch {
          return false
        }
      }
      __name(Mo, 'Mo')
      a(Mo, 'typedArraySupport')
      Object.defineProperty(h.prototype, 'parent', { enumerable: true, get: a(function() {
        if (h.isBuffer(this)) return this.buffer
      }, 'get') })
      Object.defineProperty(h.prototype, 'offset', { enumerable: true, get: a(function() {
        if (h.isBuffer(
          this
        )) return this.byteOffset
      }, 'get') })
      function he(r) {
        if (r > ft) throw new RangeError(`The value "${r}" is invalid for option "size"`)
        const e = new Uint8Array(r)
        return Object.setPrototypeOf(e, h.prototype), e
      }
      __name(he, 'he')
      a(he, 'createBuffer')
      function h(r, e, t) {
        if (typeof r == 'number') {
          if (typeof e == 'string') throw new TypeError(
            'The "string" argument must be of type string. Received type number'
          )
          return $t(r)
        }
        return Gn(r, e, t)
      }
      __name(h, 'h')
      a(h, 'Buffer')
      h.poolSize = 8192
      function Gn(r, e, t) {
        if (typeof r == 'string') return Do(r, e)
        if (ArrayBuffer.isView(r)) return Oo(r)
        if (r == null) throw new TypeError(`The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type ${typeof r}`)
        if (ue(r, ArrayBuffer) || r && ue(r.buffer, ArrayBuffer) || typeof SharedArrayBuffer < 'u' && (ue(r, SharedArrayBuffer) || r && ue(
          r.buffer,
          SharedArrayBuffer
        ))) return jt(r, e, t)
        if (typeof r == 'number') throw new TypeError('The "value" argument must not be of type number. Received type number')
        const n = r.valueOf && r.valueOf()
        if (n != null && n !== r) return h.from(n, e, t)
        const i = qo(r)
        if (i) return i
        if (typeof Symbol < 'u' && Symbol.toPrimitive != null && typeof r[Symbol.toPrimitive] == 'function') return h.from(r[Symbol.toPrimitive]('string'), e, t)
        throw new TypeError(`The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type ${typeof r}`)
      }
      __name(Gn, 'Gn')
      a(Gn, 'from')
      h.from = function(r, e, t) {
        return Gn(r, e, t)
      }
      Object.setPrototypeOf(
        h.prototype,
        Uint8Array.prototype
      )
      Object.setPrototypeOf(h, Uint8Array)
      function Vn(r) {
        if (typeof r != 'number') throw new TypeError(
          '"size" argument must be of type number'
        )
        if (r < 0) throw new RangeError(`The value "${r}" is invalid for option "size"`)
      }
      __name(Vn, 'Vn')
      a(Vn, 'assertSize')
      function Uo(r, e, t) {
        return Vn(r), r <= 0 ? he(r) : e !== void 0 ? typeof t == 'string' ? he(r).fill(e, t) : he(r).fill(e) : he(r)
      }
      __name(Uo, 'Uo')
      a(Uo, 'alloc')
      h.alloc = function(r, e, t) {
        return Uo(r, e, t)
      }
      function $t(r) {
        return Vn(r), he(r < 0 ? 0 : Gt(r) | 0)
      }
      __name($t, '$t')
      a($t, 'allocUnsafe')
      h.allocUnsafe = function(r) {
        return $t(
          r
        )
      }
      h.allocUnsafeSlow = function(r) {
        return $t(r)
      }
      function Do(r, e) {
        if ((typeof e != 'string' || e === '') && (e = 'utf8'), !h.isEncoding(e)) throw new TypeError(`Unknown encoding: ${e}`)
        let t = zn(r, e) | 0, n = he(t), i = n.write(
          r,
          e
        )
        return i !== t && (n = n.slice(0, i)), n
      }
      __name(Do, 'Do')
      a(Do, 'fromString')
      function Wt(r) {
        const e = r.length < 0 ? 0 : Gt(r.length) | 0, t = he(e)
        for (let n = 0; n < e; n += 1) t[n] = r[n] & 255
        return t
      }
      __name(Wt, 'Wt')
      a(Wt, 'fromArrayLike')
      function Oo(r) {
        if (ue(r, Uint8Array)) {
          const e = new Uint8Array(r)
          return jt(e.buffer, e.byteOffset, e.byteLength)
        }
        return Wt(r)
      }
      __name(Oo, 'Oo')
      a(Oo, 'fromArrayView')
      function jt(r, e, t) {
        if (e < 0 || r.byteLength < e) throw new RangeError('"offset" is outside of buffer bounds')
        if (r.byteLength < e + (t || 0)) throw new RangeError('"length" is outside of buffer bounds')
        let n
        return e === void 0 && t === void 0 ? n = new Uint8Array(r) : t === void 0 ? n = new Uint8Array(r, e) : n = new Uint8Array(
          r,
          e,
          t
        ), Object.setPrototypeOf(n, h.prototype), n
      }
      __name(jt, 'jt')
      a(jt, 'fromArrayBuffer')
      function qo(r) {
        if (h.isBuffer(r)) {
          const e = Gt(r.length) | 0, t = he(e)
          return t.length === 0 || r.copy(t, 0, 0, e), t
        }
        if (r.length !== void 0) return typeof r.length != 'number' || zt(r.length) ? he(0) : Wt(r)
        if (r.type === 'Buffer' && Array.isArray(r.data)) return Wt(r.data)
      }
      __name(qo, 'qo')
      a(qo, 'fromObject')
      function Gt(r) {
        if (r >= ft) throw new RangeError(`Attempt to allocate Buffer larger than maximum size: 0x${ft.toString(16)} bytes`)
        return r | 0
      }
      __name(Gt, 'Gt')
      a(Gt, 'checked')
      function Qo(r) {
        return +r != r && (r = 0), h.alloc(+r)
      }
      __name(Qo, 'Qo')
      a(Qo, 'SlowBuffer')
      h.isBuffer = a(function(e) {
        return e != null && e._isBuffer === true && e !== h.prototype
      }, 'isBuffer')
      h.compare = a(function(e, t) {
        if (ue(e, Uint8Array) && (e = h.from(e, e.offset, e.byteLength)), ue(t, Uint8Array) && (t = h.from(t, t.offset, t.byteLength)), !h.isBuffer(e) || !h.isBuffer(t)) throw new TypeError(
          'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
        )
        if (e === t) return 0
        let n = e.length, i = t.length
        for (let s = 0, o = Math.min(n, i); s < o; ++s) if (e[s] !== t[s]) {
          n = e[s], i = t[s]
          break
        }
        return n < i ? -1 : i < n ? 1 : 0
      }, 'compare')
      h.isEncoding = a(function(e) {
        switch (String(e).toLowerCase()) {
          case 'hex':
          case 'utf8':
          case 'utf-8':
          case 'ascii':
          case 'latin1':
          case 'binary':
          case 'base64':
          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return true
          default:
            return false
        }
      }, 'isEncoding')
      h.concat = a(function(e, t) {
        if (!Array.isArray(e)) throw new TypeError(
          '"list" argument must be an Array of Buffers'
        )
        if (e.length === 0) return h.alloc(0)
        let n
        if (t === void 0)
          for (t = 0, n = 0; n < e.length; ++n) t += e[n].length
        let i = h.allocUnsafe(t), s = 0
        for (n = 0; n < e.length; ++n) {
          let o = e[n]
          if (ue(o, Uint8Array)) s + o.length > i.length ? (h.isBuffer(o) || (o = h.from(o)), o.copy(i, s)) : Uint8Array.prototype.set.call(i, o, s)
          else if (h.isBuffer(o)) o.copy(i, s)
          else throw new TypeError('"list" argument must be an Array of Buffers')
          s += o.length
        }
        return i
      }, 'concat')
      function zn(r, e) {
        if (h.isBuffer(r)) return r.length
        if (ArrayBuffer.isView(r) || ue(r, ArrayBuffer)) return r.byteLength
        if (typeof r != 'string') throw new TypeError(
          `The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ${typeof r}`
        )
        const t = r.length, n = arguments.length > 2 && arguments[2] === true
        if (!n && t === 0) return 0
        let i = false
        for (; ; ) switch (e) {
          case 'ascii':
          case 'latin1':
          case 'binary':
            return t
          case 'utf8':
          case 'utf-8':
            return Ht(r).length
          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return t * 2
          case 'hex':
            return t >>> 1
          case 'base64':
            return ni(r).length
          default:
            if (i) return n ? -1 : Ht(r).length
            e = (`${e}`).toLowerCase(), i = true
        }
      }
      __name(zn, 'zn')
      a(zn, 'byteLength')
      h.byteLength = zn
      function No(r, e, t) {
        let n = false
        if ((e === void 0 || e < 0) && (e = 0), e > this.length || ((t === void 0 || t > this.length) && (t = this.length), t <= 0) || (t >>>= 0, e >>>= 0, t <= e)) return ''
        for (r || (r = 'utf8'); ; ) switch (r) {
          case 'hex':
            return Zo(this, e, t)
          case 'utf8':
          case 'utf-8':
            return Yn(this, e, t)
          case 'ascii':
            return Ko(this, e, t)
          case 'latin1':
          case 'binary':
            return Yo(
              this,
              e,
              t
            )
          case 'base64':
            return Vo(this, e, t)
          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return Jo(
              this,
              e,
              t
            )
          default:
            if (n) throw new TypeError(`Unknown encoding: ${r}`)
            r = (`${r}`).toLowerCase(), n = true
        }
      }
      __name(No, 'No')
      a(
        No,
        'slowToString'
      )
      h.prototype._isBuffer = true
      function Ae(r, e, t) {
        const n = r[e]
        r[e] = r[t], r[t] = n
      }
      __name(Ae, 'Ae')
      a(Ae, 'swap')
      h.prototype.swap16 = a(function() {
        const e = this.length
        if (e % 2 !== 0) throw new RangeError('Buffer size must be a multiple of 16-bits')
        for (let t = 0; t < e; t += 2) Ae(this, t, t + 1)
        return this
      }, 'swap16')
      h.prototype.swap32 = a(function() {
        const e = this.length
        if (e % 4 !== 0) throw new RangeError('Buffer size must be a multiple of 32-bits')
        for (let t = 0; t < e; t += 4) Ae(this, t, t + 3), Ae(this, t + 1, t + 2)
        return this
      }, 'swap32')
      h.prototype.swap64 = a(
        function() {
          const e = this.length
          if (e % 8 !== 0) throw new RangeError('Buffer size must be a multiple of 64-bits')
          for (let t = 0; t < e; t += 8) Ae(this, t, t + 7), Ae(this, t + 1, t + 6), Ae(this, t + 2, t + 5), Ae(this, t + 3, t + 4)
          return this
        },
        'swap64'
      )
      h.prototype.toString = a(function() {
        const e = this.length
        return e === 0 ? '' : arguments.length === 0 ? Yn(
          this,
          0,
          e
        ) : No.apply(this, arguments)
      }, 'toString')
      h.prototype.toLocaleString = h.prototype.toString
      h.prototype.equals = a(function(e) {
        if (!h.isBuffer(e)) throw new TypeError('Argument must be a Buffer')
        return this === e ? true : h.compare(this, e) === 0
      }, 'equals')
      h.prototype.inspect = a(function() {
        let e = '', t = Re.INSPECT_MAX_BYTES
        return e = this.toString('hex', 0, t).replace(/(.{2})/g, '$1 ').trim(), this.length > t && (e += ' ... '), `<Buffer ${e}>`
      }, 'inspect')
      Wn && (h.prototype[Wn] = h.prototype.inspect)
      h.prototype.compare = a(function(e, t, n, i, s) {
        if (ue(e, Uint8Array) && (e = h.from(e, e.offset, e.byteLength)), !h.isBuffer(e)) throw new TypeError(`The "target" argument must be one of type Buffer or Uint8Array. Received type ${typeof e}`)
        if (t === void 0 && (t = 0), n === void 0 && (n = e ? e.length : 0), i === void 0 && (i = 0), s === void 0 && (s = this.length), t < 0 || n > e.length || i < 0 || s > this.length) throw new RangeError('out of range index')
        if (i >= s && t >= n) return 0
        if (i >= s) return -1
        if (t >= n) return 1
        if (t >>>= 0, n >>>= 0, i >>>= 0, s >>>= 0, this === e) return 0
        let o = s - i, u = n - t, c = Math.min(o, u), l = this.slice(
            i,
            s
          ), f = e.slice(t, n)
        for (let y = 0; y < c; ++y) if (l[y] !== f[y]) {
          o = l[y], u = f[y]
          break
        }
        return o < u ? -1 : u < o ? 1 : 0
      }, 'compare')
      function Kn(r, e, t, n, i) {
        if (r.length === 0) return -1
        if (typeof t == 'string' ? (n = t, t = 0) : t > 2147483647 ? t = 2147483647 : t < -2147483648 && (t = -2147483648), t = +t, zt(t) && (t = i ? 0 : r.length - 1), t < 0 && (t = r.length + t), t >= r.length) {
          if (i) return -1
          t = r.length - 1
        } else if (t < 0) if (i) t = 0
        else return -1
        if (typeof e == 'string' && (e = h.from(
          e,
          n
        )), h.isBuffer(e)) return e.length === 0 ? -1 : jn(r, e, t, n, i)
        if (typeof e == 'number') return e = e & 255, typeof Uint8Array.prototype.indexOf == 'function' ? i ? Uint8Array.prototype.indexOf.call(r, e, t) : Uint8Array.prototype.lastIndexOf.call(r, e, t) : jn(r, [e], t, n, i)
        throw new TypeError('val must be string, number or Buffer')
      }
      __name(Kn, 'Kn')
      a(Kn, 'bidirectionalIndexOf')
      function jn(r, e, t, n, i) {
        let s = 1, o = r.length, u = e.length
        if (n !== void 0 && (n = String(n).toLowerCase(), n === 'ucs2' || n === 'ucs-2' || n === 'utf16le' || n === 'utf-16le')) {
          if (r.length < 2 || e.length < 2) return -1
          s = 2, o /= 2, u /= 2, t /= 2
        }
        function c(f, y) {
          return s === 1 ? f[y] : f.readUInt16BE(y * s)
        }
        __name(c, 'c')
        a(c, 'read')
        let l
        if (i) {
          let f = -1
          for (l = t; l < o; l++) if (c(r, l) === c(e, f === -1 ? 0 : l - f)) {
            if (f === -1 && (f = l), l - f + 1 === u) return f * s
          } else f !== -1 && (l -= l - f), f = -1
        } else for (t + u > o && (t = o - u), l = t; l >= 0; l--) {
          let f = true
          for (let y = 0; y < u; y++) if (c(r, l + y) !== c(e, y)) {
            f = false
            break
          }
          if (f) return l
        }
        return -1
      }
      __name(jn, 'jn')
      a(jn, 'arrayIndexOf')
      h.prototype.includes = a(function(e, t, n) {
        return this.indexOf(
          e,
          t,
          n
        ) !== -1
      }, 'includes')
      h.prototype.indexOf = a(function(e, t, n) {
        return Kn(this, e, t, n, true)
      }, 'indexOf')
      h.prototype.lastIndexOf = a(function(e, t, n) {
        return Kn(this, e, t, n, false)
      }, 'lastIndexOf')
      function Wo(r, e, t, n) {
        t = Number(t) || 0
        const i = r.length - t
        n ? (n = Number(n), n > i && (n = i)) : n = i
        const s = e.length
        n > s / 2 && (n = s / 2)
        let o
        for (o = 0; o < n; ++o) {
          const u = parseInt(e.substr(o * 2, 2), 16)
          if (zt(u)) return o
          r[t + o] = u
        }
        return o
      }
      __name(Wo, 'Wo')
      a(Wo, 'hexWrite')
      function jo(r, e, t, n) {
        return ht(Ht(e, r.length - t), r, t, n)
      }
      __name(jo, 'jo')
      a(jo, 'utf8Write')
      function Ho(r, e, t, n) {
        return ht(ra(e), r, t, n)
      }
      __name(Ho, 'Ho')
      a(
        Ho,
        'asciiWrite'
      )
      function $o(r, e, t, n) {
        return ht(ni(e), r, t, n)
      }
      __name($o, '$o')
      a($o, 'base64Write')
      function Go(r, e, t, n) {
        return ht(
          na(e, r.length - t),
          r,
          t,
          n
        )
      }
      __name(Go, 'Go')
      a(Go, 'ucs2Write')
      h.prototype.write = a(function(e, t, n, i) {
        if (t === void 0) i = 'utf8', n = this.length, t = 0
        else if (n === void 0 && typeof t == 'string') i = t, n = this.length, t = 0
        else if (isFinite(t))
          t = t >>> 0, isFinite(n) ? (n = n >>> 0, i === void 0 && (i = 'utf8')) : (i = n, n = void 0)
        else throw new Error('Buffer.write(string, encoding, offset[, length]) is no longer supported')
        const s = this.length - t
        if ((n === void 0 || n > s) && (n = s), e.length > 0 && (n < 0 || t < 0) || t > this.length) throw new RangeError('Attempt to write outside buffer bounds')
        i || (i = 'utf8')
        let o = false
        for (; ; ) switch (i) {
          case 'hex':
            return Wo(this, e, t, n)
          case 'utf8':
          case 'utf-8':
            return jo(this, e, t, n)
          case 'ascii':
          case 'latin1':
          case 'binary':
            return Ho(this, e, t, n)
          case 'base64':
            return $o(this, e, t, n)
          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return Go(this, e, t, n)
          default:
            if (o) throw new TypeError(`Unknown encoding: ${i}`)
            i = (`${i}`).toLowerCase(), o = true
        }
      }, 'write')
      h.prototype.toJSON = a(function() {
        return { type: 'Buffer', data: Array.prototype.slice.call(this._arr || this, 0) }
      }, 'toJSON')
      function Vo(r, e, t) {
        return e === 0 && t === r.length ? Nt.fromByteArray(r) : Nt.fromByteArray(r.slice(e, t))
      }
      __name(Vo, 'Vo')
      a(Vo, 'base64Slice')
      function Yn(r, e, t) {
        t = Math.min(r.length, t)
        let n = [], i = e
        while (i < t) {
          let s = r[i], o = null, u = s > 239 ? 4 : s > 223 ? 3 : s > 191 ? 2 : 1
          if (i + u <= t) {
            let c, l, f, y
            switch (u) {
              case 1:
                s < 128 && (o = s)
                break
              case 2:
                c = r[i + 1], (c & 192) === 128 && (y = (s & 31) << 6 | c & 63, y > 127 && (o = y))
                break
              case 3:
                c = r[i + 1], l = r[i + 2], (c & 192) === 128 && (l & 192) === 128 && (y = (s & 15) << 12 | (c & 63) << 6 | l & 63, y > 2047 && (y < 55296 || y > 57343) && (o = y))
                break
              case 4:
                c = r[i + 1], l = r[i + 2], f = r[i + 3], (c & 192) === 128 && (l & 192) === 128 && (f & 192) === 128 && (y = (s & 15) << 18 | (c & 63) << 12 | (l & 63) << 6 | f & 63, y > 65535 && y < 1114112 && (o = y))
            }
          }
          o === null ? (o = 65533, u = 1) : o > 65535 && (o -= 65536, n.push(o >>> 10 & 1023 | 55296), o = 56320 | o & 1023), n.push(o), i += u
        }
        return zo(n)
      }
      __name(Yn, 'Yn')
      a(Yn, 'utf8Slice')
      const Hn = 4096
      function zo(r) {
        const e = r.length
        if (e <= Hn) return String.fromCharCode.apply(String, r)
        let t = '', n = 0
        while (n < e) t += String.fromCharCode.apply(String, r.slice(n, n += Hn))
        return t
      }
      __name(zo, 'zo')
      a(zo, 'decodeCodePointsArray')
      function Ko(r, e, t) {
        let n = ''
        t = Math.min(r.length, t)
        for (let i = e; i < t; ++i) n += String.fromCharCode(r[i] & 127)
        return n
      }
      __name(Ko, 'Ko')
      a(Ko, 'asciiSlice')
      function Yo(r, e, t) {
        let n = ''
        t = Math.min(r.length, t)
        for (let i = e; i < t; ++i) n += String.fromCharCode(r[i])
        return n
      }
      __name(Yo, 'Yo')
      a(Yo, 'latin1Slice')
      function Zo(r, e, t) {
        const n = r.length;
        (!e || e < 0) && (e = 0), (!t || t < 0 || t > n) && (t = n)
        let i = ''
        for (let s = e; s < t; ++s) i += ia[r[s]]
        return i
      }
      __name(Zo, 'Zo')
      a(Zo, 'hexSlice')
      function Jo(r, e, t) {
        let n = r.slice(e, t), i = ''
        for (let s = 0; s < n.length - 1; s += 2) i += String.fromCharCode(n[s] + n[s + 1] * 256)
        return i
      }
      __name(Jo, 'Jo')
      a(Jo, 'utf16leSlice')
      h.prototype.slice = a(function(e, t) {
        const n = this.length
        e = ~~e, t = t === void 0 ? n : ~~t, e < 0 ? (e += n, e < 0 && (e = 0)) : e > n && (e = n), t < 0 ? (t += n, t < 0 && (t = 0)) : t > n && (t = n), t < e && (t = e)
        const i = this.subarray(e, t)
        return Object.setPrototypeOf(i, h.prototype), i
      }, 'slice')
      function q(r, e, t) {
        if (r % 1 !== 0 || r < 0) throw new RangeError('offset is not uint')
        if (r + e > t) throw new RangeError('Trying to access beyond buffer length')
      }
      __name(q, 'q')
      a(q, 'checkOffset')
      h.prototype.readUintLE = h.prototype.readUIntLE = a(
        function(e, t, n) {
          e = e >>> 0, t = t >>> 0, n || q(e, t, this.length)
          let i = this[e], s = 1, o = 0
          while (++o < t && (s *= 256)) i += this[e + o] * s
          return i
        },
        'readUIntLE'
      )
      h.prototype.readUintBE = h.prototype.readUIntBE = a(function(e, t, n) {
        e = e >>> 0, t = t >>> 0, n || q(
          e,
          t,
          this.length
        )
        let i = this[e + --t], s = 1
        while (t > 0 && (s *= 256)) i += this[e + --t] * s
        return i
      }, 'readUIntBE')
      h.prototype.readUint8 = h.prototype.readUInt8 = a(
        function(e, t) {
          return e = e >>> 0, t || q(e, 1, this.length), this[e]
        },
        'readUInt8'
      )
      h.prototype.readUint16LE = h.prototype.readUInt16LE = a(function(e, t) {
        return e = e >>> 0, t || q(
          e,
          2,
          this.length
        ), this[e] | this[e + 1] << 8
      }, 'readUInt16LE')
      h.prototype.readUint16BE = h.prototype.readUInt16BE = a(function(e, t) {
        return e = e >>> 0, t || q(e, 2, this.length), this[e] << 8 | this[e + 1]
      }, 'readUInt16BE')
      h.prototype.readUint32LE = h.prototype.readUInt32LE = a(function(e, t) {
        return e = e >>> 0, t || q(e, 4, this.length), (this[e] | this[e + 1] << 8 | this[e + 2] << 16) + this[e + 3] * 16777216
      }, 'readUInt32LE')
      h.prototype.readUint32BE = h.prototype.readUInt32BE = a(function(e, t) {
        return e = e >>> 0, t || q(e, 4, this.length), this[e] * 16777216 + (this[e + 1] << 16 | this[e + 2] << 8 | this[e + 3])
      }, 'readUInt32BE')
      h.prototype.readBigUInt64LE = we(a(function(e) {
        e = e >>> 0, Be(e, 'offset')
        const t = this[e], n = this[e + 7];
        (t === void 0 || n === void 0) && je(e, this.length - 8)
        const i = t + this[++e] * 2 ** 8 + this[++e] * 2 ** 16 + this[++e] * 2 ** 24, s = this[++e] + this[++e] * 2 ** 8 + this[++e] * 2 ** 16 + n * 2 ** 24
        return BigInt(i) + (BigInt(s) << BigInt(32))
      }, 'readBigUInt64LE'))
      h.prototype.readBigUInt64BE = we(a(function(e) {
        e = e >>> 0, Be(e, 'offset')
        const t = this[e], n = this[e + 7];
        (t === void 0 || n === void 0) && je(e, this.length - 8)
        const i = t * 2 ** 24 + this[++e] * 2 ** 16 + this[++e] * 2 ** 8 + this[++e], s = this[++e] * 2 ** 24 + this[++e] * 2 ** 16 + this[++e] * 2 ** 8 + n
        return (BigInt(i) << BigInt(
          32
        )) + BigInt(s)
      }, 'readBigUInt64BE'))
      h.prototype.readIntLE = a(function(e, t, n) {
        e = e >>> 0, t = t >>> 0, n || q(
          e,
          t,
          this.length
        )
        let i = this[e], s = 1, o = 0
        while (++o < t && (s *= 256)) i += this[e + o] * s
        return s *= 128, i >= s && (i -= Math.pow(2, 8 * t)), i
      }, 'readIntLE')
      h.prototype.readIntBE = a(function(e, t, n) {
        e = e >>> 0, t = t >>> 0, n || q(e, t, this.length)
        let i = t, s = 1, o = this[e + --i]
        while (i > 0 && (s *= 256)) o += this[e + --i] * s
        return s *= 128, o >= s && (o -= Math.pow(2, 8 * t)), o
      }, 'readIntBE')
      h.prototype.readInt8 = a(function(e, t) {
        return e = e >>> 0, t || q(e, 1, this.length), this[e] & 128 ? (255 - this[e] + 1) * -1 : this[e]
      }, 'readInt8')
      h.prototype.readInt16LE = a(function(e, t) {
        e = e >>> 0, t || q(
          e,
          2,
          this.length
        )
        const n = this[e] | this[e + 1] << 8
        return n & 32768 ? n | 4294901760 : n
      }, 'readInt16LE')
      h.prototype.readInt16BE = a(function(e, t) {
        e = e >>> 0, t || q(e, 2, this.length)
        const n = this[e + 1] | this[e] << 8
        return n & 32768 ? n | 4294901760 : n
      }, 'readInt16BE')
      h.prototype.readInt32LE = a(function(e, t) {
        return e = e >>> 0, t || q(e, 4, this.length), this[e] | this[e + 1] << 8 | this[e + 2] << 16 | this[e + 3] << 24
      }, 'readInt32LE')
      h.prototype.readInt32BE = a(function(e, t) {
        return e = e >>> 0, t || q(e, 4, this.length), this[e] << 24 | this[e + 1] << 16 | this[e + 2] << 8 | this[e + 3]
      }, 'readInt32BE')
      h.prototype.readBigInt64LE = we(a(function(e) {
        e = e >>> 0, Be(e, 'offset')
        const t = this[e], n = this[e + 7];
        (t === void 0 || n === void 0) && je(e, this.length - 8)
        const i = this[e + 4] + this[e + 5] * 2 ** 8 + this[e + 6] * 2 ** 16 + (n << 24)
        return (BigInt(i) << BigInt(
          32
        )) + BigInt(t + this[++e] * 2 ** 8 + this[++e] * 2 ** 16 + this[++e] * 2 ** 24)
      }, 'readBigInt64LE'))
      h.prototype.readBigInt64BE = we(a(function(e) {
        e = e >>> 0, Be(e, 'offset')
        const t = this[e], n = this[e + 7];
        (t === void 0 || n === void 0) && je(e, this.length - 8)
        const i = (t << 24) + this[++e] * 2 ** 16 + this[++e] * 2 ** 8 + this[++e]
        return (BigInt(i) << BigInt(32)) + BigInt(
          this[++e] * 2 ** 24 + this[++e] * 2 ** 16 + this[++e] * 2 ** 8 + n
        )
      }, 'readBigInt64BE'))
      h.prototype.readFloatLE = a(function(e, t) {
        return e = e >>> 0, t || q(e, 4, this.length), Pe.read(this, e, true, 23, 4)
      }, 'readFloatLE')
      h.prototype.readFloatBE = a(function(e, t) {
        return e = e >>> 0, t || q(e, 4, this.length), Pe.read(this, e, false, 23, 4)
      }, 'readFloatBE')
      h.prototype.readDoubleLE = a(function(e, t) {
        return e = e >>> 0, t || q(e, 8, this.length), Pe.read(this, e, true, 52, 8)
      }, 'readDoubleLE')
      h.prototype.readDoubleBE = a(function(e, t) {
        return e = e >>> 0, t || q(e, 8, this.length), Pe.read(
          this,
          e,
          false,
          52,
          8
        )
      }, 'readDoubleBE')
      function V(r, e, t, n, i, s) {
        if (!h.isBuffer(r)) throw new TypeError('"buffer" argument must be a Buffer instance')
        if (e > i || e < s) throw new RangeError('"value" argument is out of bounds')
        if (t + n > r.length) throw new RangeError('Index out of range')
      }
      __name(V, 'V')
      a(V, 'checkInt')
      h.prototype.writeUintLE = h.prototype.writeUIntLE = a(function(e, t, n, i) {
        if (e = +e, t = t >>> 0, n = n >>> 0, !i) {
          const u = Math.pow(2, 8 * n) - 1
          V(
            this,
            e,
            t,
            n,
            u,
            0
          )
        }
        let s = 1, o = 0
        for (this[t] = e & 255; ++o < n && (s *= 256); ) this[t + o] = e / s & 255
        return t + n
      }, 'writeUIntLE')
      h.prototype.writeUintBE = h.prototype.writeUIntBE = a(function(e, t, n, i) {
        if (e = +e, t = t >>> 0, n = n >>> 0, !i) {
          const u = Math.pow(2, 8 * n) - 1
          V(this, e, t, n, u, 0)
        }
        let s = n - 1, o = 1
        for (this[t + s] = e & 255; --s >= 0 && (o *= 256); ) this[t + s] = e / o & 255
        return t + n
      }, 'writeUIntBE')
      h.prototype.writeUint8 = h.prototype.writeUInt8 = a(function(e, t, n) {
        return e = +e, t = t >>> 0, n || V(this, e, t, 1, 255, 0), this[t] = e & 255, t + 1
      }, 'writeUInt8')
      h.prototype.writeUint16LE = h.prototype.writeUInt16LE = a(function(e, t, n) {
        return e = +e, t = t >>> 0, n || V(this, e, t, 2, 65535, 0), this[t] = e & 255, this[t + 1] = e >>> 8, t + 2
      }, 'writeUInt16LE')
      h.prototype.writeUint16BE = h.prototype.writeUInt16BE = a(function(e, t, n) {
        return e = +e, t = t >>> 0, n || V(this, e, t, 2, 65535, 0), this[t] = e >>> 8, this[t + 1] = e & 255, t + 2
      }, 'writeUInt16BE')
      h.prototype.writeUint32LE = h.prototype.writeUInt32LE = a(function(e, t, n) {
        return e = +e, t = t >>> 0, n || V(
          this,
          e,
          t,
          4,
          4294967295,
          0
        ), this[t + 3] = e >>> 24, this[t + 2] = e >>> 16, this[t + 1] = e >>> 8, this[t] = e & 255, t + 4
      }, 'writeUInt32LE')
      h.prototype.writeUint32BE = h.prototype.writeUInt32BE = a(function(e, t, n) {
        return e = +e, t = t >>> 0, n || V(
          this,
          e,
          t,
          4,
          4294967295,
          0
        ), this[t] = e >>> 24, this[t + 1] = e >>> 16, this[t + 2] = e >>> 8, this[t + 3] = e & 255, t + 4
      }, 'writeUInt32BE')
      function Zn(r, e, t, n, i) {
        ri(e, n, i, r, t, 7)
        let s = Number(e & BigInt(4294967295))
        r[t++] = s, s = s >> 8, r[t++] = s, s = s >> 8, r[t++] = s, s = s >> 8, r[t++] = s
        let o = Number(e >> BigInt(32) & BigInt(4294967295))
        return r[t++] = o, o = o >> 8, r[t++] = o, o = o >> 8, r[t++] = o, o = o >> 8, r[t++] = o, t
      }
      __name(Zn, 'Zn')
      a(Zn, 'wrtBigUInt64LE')
      function Jn(r, e, t, n, i) {
        ri(e, n, i, r, t, 7)
        let s = Number(e & BigInt(4294967295))
        r[t + 7] = s, s = s >> 8, r[t + 6] = s, s = s >> 8, r[t + 5] = s, s = s >> 8, r[t + 4] = s
        let o = Number(e >> BigInt(32) & BigInt(4294967295))
        return r[t + 3] = o, o = o >> 8, r[t + 2] = o, o = o >> 8, r[t + 1] = o, o = o >> 8, r[t] = o, t + 8
      }
      __name(Jn, 'Jn')
      a(Jn, 'wrtBigUInt64BE')
      h.prototype.writeBigUInt64LE = we(a(function(e, t = 0) {
        return Zn(this, e, t, BigInt(0), BigInt('0xffffffffffffffff'))
      }, 'writeBigUInt64LE'))
      h.prototype.writeBigUInt64BE = we(a(function(e, t = 0) {
        return Jn(this, e, t, BigInt(0), BigInt(
          '0xffffffffffffffff'
        ))
      }, 'writeBigUInt64BE'))
      h.prototype.writeIntLE = a(function(e, t, n, i) {
        if (e = +e, t = t >>> 0, !i) {
          const c = Math.pow(2, 8 * n - 1)
          V(this, e, t, n, c - 1, -c)
        }
        let s = 0, o = 1, u = 0
        for (this[t] = e & 255; ++s < n && (o *= 256); )
          e < 0 && u === 0 && this[t + s - 1] !== 0 && (u = 1), this[t + s] = (e / o >> 0) - u & 255
        return t + n
      }, 'writeIntLE')
      h.prototype.writeIntBE = a(function(e, t, n, i) {
        if (e = +e, t = t >>> 0, !i) {
          const c = Math.pow(2, 8 * n - 1)
          V(this, e, t, n, c - 1, -c)
        }
        let s = n - 1, o = 1, u = 0
        for (this[t + s] = e & 255; --s >= 0 && (o *= 256); ) e < 0 && u === 0 && this[t + s + 1] !== 0 && (u = 1), this[t + s] = (e / o >> 0) - u & 255
        return t + n
      }, 'writeIntBE')
      h.prototype.writeInt8 = a(function(e, t, n) {
        return e = +e, t = t >>> 0, n || V(this, e, t, 1, 127, -128), e < 0 && (e = 255 + e + 1), this[t] = e & 255, t + 1
      }, 'writeInt8')
      h.prototype.writeInt16LE = a(function(e, t, n) {
        return e = +e, t = t >>> 0, n || V(this, e, t, 2, 32767, -32768), this[t] = e & 255, this[t + 1] = e >>> 8, t + 2
      }, 'writeInt16LE')
      h.prototype.writeInt16BE = a(function(e, t, n) {
        return e = +e, t = t >>> 0, n || V(this, e, t, 2, 32767, -32768), this[t] = e >>> 8, this[t + 1] = e & 255, t + 2
      }, 'writeInt16BE')
      h.prototype.writeInt32LE = a(function(e, t, n) {
        return e = +e, t = t >>> 0, n || V(
          this,
          e,
          t,
          4,
          2147483647,
          -2147483648
        ), this[t] = e & 255, this[t + 1] = e >>> 8, this[t + 2] = e >>> 16, this[t + 3] = e >>> 24, t + 4
      }, 'writeInt32LE')
      h.prototype.writeInt32BE = a(function(e, t, n) {
        return e = +e, t = t >>> 0, n || V(
          this,
          e,
          t,
          4,
          2147483647,
          -2147483648
        ), e < 0 && (e = 4294967295 + e + 1), this[t] = e >>> 24, this[t + 1] = e >>> 16, this[t + 2] = e >>> 8, this[t + 3] = e & 255, t + 4
      }, 'writeInt32BE')
      h.prototype.writeBigInt64LE = we(a(function(e, t = 0) {
        return Zn(this, e, t, -BigInt('0x8000000000000000'), BigInt('0x7fffffffffffffff'))
      }, 'writeBigInt64LE'))
      h.prototype.writeBigInt64BE = we(
        a(function(e, t = 0) {
          return Jn(this, e, t, -BigInt('0x8000000000000000'), BigInt('0x7fffffffffffffff'))
        }, 'writeBigInt64BE')
      )
      function Xn(r, e, t, n, i, s) {
        if (t + n > r.length) throw new RangeError('Index out of range')
        if (t < 0) throw new RangeError('Index out of range')
      }
      __name(Xn, 'Xn')
      a(Xn, 'checkIEEE754')
      function ei(r, e, t, n, i) {
        return e = +e, t = t >>> 0, i || Xn(r, e, t, 4, 34028234663852886e22, -34028234663852886e22), Pe.write(r, e, t, n, 23, 4), t + 4
      }
      __name(ei, 'ei')
      a(
        ei,
        'writeFloat'
      )
      h.prototype.writeFloatLE = a(function(e, t, n) {
        return ei(this, e, t, true, n)
      }, 'writeFloatLE')
      h.prototype.writeFloatBE = a(function(e, t, n) {
        return ei(this, e, t, false, n)
      }, 'writeFloatBE')
      function ti(r, e, t, n, i) {
        return e = +e, t = t >>> 0, i || Xn(r, e, t, 8, 17976931348623157e292, -17976931348623157e292), Pe.write(
          r,
          e,
          t,
          n,
          52,
          8
        ), t + 8
      }
      __name(ti, 'ti')
      a(ti, 'writeDouble')
      h.prototype.writeDoubleLE = a(function(e, t, n) {
        return ti(this, e, t, true, n)
      }, 'writeDoubleLE')
      h.prototype.writeDoubleBE = a(function(e, t, n) {
        return ti(this, e, t, false, n)
      }, 'writeDoubleBE')
      h.prototype.copy = a(function(e, t, n, i) {
        if (!h.isBuffer(e)) throw new TypeError('argument should be a Buffer')
        if (n || (n = 0), !i && i !== 0 && (i = this.length), t >= e.length && (t = e.length), t || (t = 0), i > 0 && i < n && (i = n), i === n || e.length === 0 || this.length === 0) return 0
        if (t < 0) throw new RangeError('targetStart out of bounds')
        if (n < 0 || n >= this.length) throw new RangeError('Index out of range')
        if (i < 0) throw new RangeError('sourceEnd out of bounds')
        i > this.length && (i = this.length), e.length - t < i - n && (i = e.length - t + n)
        const s = i - n
        return this === e && typeof Uint8Array.prototype.copyWithin == 'function' ? this.copyWithin(t, n, i) : Uint8Array.prototype.set.call(e, this.subarray(n, i), t), s
      }, 'copy')
      h.prototype.fill = a(function(e, t, n, i) {
        if (typeof e == 'string') {
          if (typeof t == 'string' ? (i = t, t = 0, n = this.length) : typeof n == 'string' && (i = n, n = this.length), i !== void 0 && typeof i != 'string') throw new TypeError('encoding must be a string')
          if (typeof i == 'string' && !h.isEncoding(i)) throw new TypeError(
            `Unknown encoding: ${i}`
          )
          if (e.length === 1) {
            const o = e.charCodeAt(0);
            (i === 'utf8' && o < 128 || i === 'latin1') && (e = o)
          }
        } else typeof e == 'number' ? e = e & 255 : typeof e == 'boolean' && (e = Number(e))
        if (t < 0 || this.length < t || this.length < n) throw new RangeError('Out of range index')
        if (n <= t) return this
        t = t >>> 0, n = n === void 0 ? this.length : n >>> 0, e || (e = 0)
        let s
        if (typeof e == 'number') for (s = t; s < n; ++s) this[s] = e
        else {
          const o = h.isBuffer(e) ? e : h.from(
              e,
              i
            ), u = o.length
          if (u === 0) throw new TypeError(`The value "${e}" is invalid for argument "value"`)
          for (s = 0; s < n - t; ++s) this[s + t] = o[s % u]
        }
        return this
      }, 'fill')
      const Te = {}
      function Vt(r, e, t) {
        let n
        Te[r] = (n = class extends t {
          static {
            __name(this, 'n')
          }
          constructor() {
            super(), Object.defineProperty(this, 'message', { value: e.apply(this, arguments), writable: true, configurable: true }), this.name = `${this.name} [${r}]`, this.stack, delete this.name
          }
          get code() {
            return r
          }
          set code(s) {
            Object.defineProperty(
              this,
              'code',
              { configurable: true, enumerable: true, value: s, writable: true }
            )
          }
          toString() {
            return `${this.name} [${r}]: ${this.message}`
          }
        }, a(n, 'NodeError'), n)
      }
      __name(Vt, 'Vt')
      a(Vt, 'E')
      Vt('ERR_BUFFER_OUT_OF_BOUNDS', function(r) {
        return r ? `${r} is outside of buffer bounds` : 'Attempt to access memory outside buffer bounds'
      }, RangeError)
      Vt(
        'ERR_INVALID_ARG_TYPE',
        function(r, e) {
          return `The "${r}" argument must be of type number. Received type ${typeof e}`
        },
        TypeError
      )
      Vt('ERR_OUT_OF_RANGE', function(r, e, t) {
        let n = `The value of "${r}" is out of range.`, i = t
        return Number.isInteger(t) && Math.abs(t) > 2 ** 32 ? i = $n(String(t)) : typeof t == 'bigint' && (i = String(
          t
        ), (t > BigInt(2) ** BigInt(32) || t < -(BigInt(2) ** BigInt(32))) && (i = $n(i)), i += 'n'), n += ` It must be ${e}. Received ${i}`, n
      }, RangeError)
      function $n(r) {
        let e = '', t = r.length, n = r[0] === '-' ? 1 : 0
        for (; t >= n + 4; t -= 3) e = `_${r.slice(t - 3, t)}${e}`
        return `${r.slice(0, t)}${e}`
      }
      __name($n, '$n')
      a($n, 'addNumericalSeparator')
      function Xo(r, e, t) {
        Be(e, 'offset'), (r[e] === void 0 || r[e + t] === void 0) && je(e, r.length - (t + 1))
      }
      __name(Xo, 'Xo')
      a(Xo, 'checkBounds')
      function ri(r, e, t, n, i, s) {
        if (r > t || r < e) {
          let o = typeof e == 'bigint' ? 'n' : '', u
          throw s > 3 ? e === 0 || e === BigInt(0) ? u = `>= 0${o} and < 2${o} ** ${(s + 1) * 8}${o}` : u = `>= -(2${o} ** ${(s + 1) * 8 - 1}${o}) and < 2 ** ${(s + 1) * 8 - 1}${o}` : u = `>= ${e}${o} and <= ${t}${o}`, new Te.ERR_OUT_OF_RANGE('value', u, r)
        }
        Xo(n, i, s)
      }
      __name(ri, 'ri')
      a(ri, 'checkIntBI')
      function Be(r, e) {
        if (typeof r != 'number') throw new Te.ERR_INVALID_ARG_TYPE(e, 'number', r)
      }
      __name(Be, 'Be')
      a(Be, 'validateNumber')
      function je(r, e, t) {
        throw Math.floor(r) !== r ? (Be(r, t), new Te.ERR_OUT_OF_RANGE(t || 'offset', 'an integer', r)) : e < 0 ? new Te.ERR_BUFFER_OUT_OF_BOUNDS() : new Te.ERR_OUT_OF_RANGE(t || 'offset', `>= ${t ? 1 : 0} and <= ${e}`, r)
      }
      __name(je, 'je')
      a(je, 'boundsError')
      const ea = /[^+/0-9A-Za-z-_]/g
      function ta(r) {
        if (r = r.split('=')[0], r = r.trim().replace(ea, ''), r.length < 2) return ''
        while (r.length % 4 !== 0) r = `${r}=`
        return r
      }
      __name(ta, 'ta')
      a(ta, 'base64clean')
      function Ht(r, e) {
        e = e || 1 / 0
        let t, n = r.length, i = null, s = []
        for (let o = 0; o < n; ++o) {
          if (t = r.charCodeAt(o), t > 55295 && t < 57344) {
            if (!i) {
              if (t > 56319) {
                (e -= 3) > -1 && s.push(239, 191, 189)
                continue
              } else if (o + 1 === n) {
                (e -= 3) > -1 && s.push(239, 191, 189)
                continue
              }
              i = t
              continue
            }
            if (t < 56320) {
              (e -= 3) > -1 && s.push(239, 191, 189), i = t
              continue
            }
            t = (i - 55296 << 10 | t - 56320) + 65536
          } else i && (e -= 3) > -1 && s.push(239, 191, 189)
          if (i = null, t < 128) {
            if ((e -= 1) < 0) break
            s.push(t)
          } else if (t < 2048) {
            if ((e -= 2) < 0) break
            s.push(t >> 6 | 192, t & 63 | 128)
          } else if (t < 65536) {
            if ((e -= 3) < 0) break
            s.push(t >> 12 | 224, t >> 6 & 63 | 128, t & 63 | 128)
          } else if (t < 1114112) {
            if ((e -= 4) < 0) break
            s.push(t >> 18 | 240, t >> 12 & 63 | 128, t >> 6 & 63 | 128, t & 63 | 128)
          } else throw new Error('Invalid code point')
        }
        return s
      }
      __name(Ht, 'Ht')
      a(Ht, 'utf8ToBytes')
      function ra(r) {
        const e = []
        for (let t = 0; t < r.length; ++t) e.push(r.charCodeAt(t) & 255)
        return e
      }
      __name(ra, 'ra')
      a(
        ra,
        'asciiToBytes'
      )
      function na(r, e) {
        let t, n, i, s = []
        for (let o = 0; o < r.length && !((e -= 2) < 0); ++o) t = r.charCodeAt(
          o
        ), n = t >> 8, i = t % 256, s.push(i), s.push(n)
        return s
      }
      __name(na, 'na')
      a(na, 'utf16leToBytes')
      function ni(r) {
        return Nt.toByteArray(
          ta(r)
        )
      }
      __name(ni, 'ni')
      a(ni, 'base64ToBytes')
      function ht(r, e, t, n) {
        let i
        for (i = 0; i < n && !(i + t >= e.length || i >= r.length); ++i)
          e[i + t] = r[i]
        return i
      }
      __name(ht, 'ht')
      a(ht, 'blitBuffer')
      function ue(r, e) {
        return r instanceof e || r != null && r.constructor != null && r.constructor.name != null && r.constructor.name === e.name
      }
      __name(ue, 'ue')
      a(ue, 'isInstance')
      function zt(r) {
        return r !== r
      }
      __name(zt, 'zt')
      a(zt, 'numberIsNaN')
      var ia = function() {
        const r = '0123456789abcdef', e = new Array(256)
        for (let t = 0; t < 16; ++t) {
          const n = t * 16
          for (let i = 0; i < 16; ++i) e[n + i] = r[t] + r[i]
        }
        return e
      }()
      function we(r) {
        return typeof BigInt > 'u' ? sa : r
      }
      __name(we, 'we')
      a(we, 'defineBigIntMethod')
      function sa() {
        throw new Error('BigInt not supported')
      }
      __name(sa, 'sa')
      a(sa, 'BufferBigIntNotDefined')
    })
    p = G(() => {
      'use strict'
      b = globalThis, v = globalThis.setImmediate ?? ((r) => setTimeout(r, 0)), x = globalThis.clearImmediate ?? ((r) => clearTimeout(r)), d = typeof globalThis.Buffer == 'function' && typeof globalThis.Buffer.allocUnsafe == 'function' ? globalThis.Buffer : ii().Buffer, m = globalThis.process ?? {}
      m.env ?? (m.env = {})
      try {
        m.nextTick(() => {
        })
      } catch {
        const e = Promise.resolve()
        m.nextTick = e.then.bind(e)
      }
    })
    ge = T((Rl, Kt) => {
      'use strict'
      p()
      let Le = typeof Reflect == 'object' ? Reflect : null, si = Le && typeof Le.apply == 'function' ? Le.apply : a(function(e, t, n) {
          return Function.prototype.apply.call(e, t, n)
        }, 'ReflectApply'), pt
      Le && typeof Le.ownKeys == 'function' ? pt = Le.ownKeys : Object.getOwnPropertySymbols ? pt = a(function(e) {
        return Object.getOwnPropertyNames(e).concat(Object.getOwnPropertySymbols(e))
      }, 'ReflectOwnKeys') : pt = a(function(e) {
        return Object.getOwnPropertyNames(e)
      }, 'ReflectOwnKeys')
      function oa(r) {
        console && console.warn && console.warn(r)
      }
      __name(oa, 'oa')
      a(
        oa,
        'ProcessEmitWarning'
      )
      const ai = Number.isNaN || a(function(e) {
        return e !== e
      }, 'NumberIsNaN')
      function B() {
        B.init.call(this)
      }
      __name(B, 'B')
      a(B, 'EventEmitter')
      Kt.exports = B
      Kt.exports.once = la
      B.EventEmitter = B
      B.prototype._events = void 0
      B.prototype._eventsCount = 0
      B.prototype._maxListeners = void 0
      let oi = 10
      function dt(r) {
        if (typeof r != 'function') throw new TypeError(`The "listener" argument must be of type Function. Received type ${typeof r}`)
      }
      __name(dt, 'dt')
      a(dt, 'checkListener')
      Object.defineProperty(B, 'defaultMaxListeners', { enumerable: true, get: a(function() {
        return oi
      }, 'get'), set: a(
        function(r) {
          if (typeof r != 'number' || r < 0 || ai(r)) throw new RangeError(`The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ${r}.`)
          oi = r
        },
        'set'
      ) })
      B.init = function() {
        (this._events === void 0 || this._events === Object.getPrototypeOf(this)._events) && (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0), this._maxListeners = this._maxListeners || void 0
      }
      B.prototype.setMaxListeners = a(function(e) {
        if (typeof e != 'number' || e < 0 || ai(e)) throw new RangeError(`The value of "n" is out of range. It must be a non-negative number. Received ${e}.`)
        return this._maxListeners = e, this
      }, 'setMaxListeners')
      function ui(r) {
        return r._maxListeners === void 0 ? B.defaultMaxListeners : r._maxListeners
      }
      __name(ui, 'ui')
      a(ui, '_getMaxListeners')
      B.prototype.getMaxListeners = a(function() {
        return ui(this)
      }, 'getMaxListeners')
      B.prototype.emit = a(function(e) {
        for (var t = [], n = 1; n < arguments.length; n++) t.push(arguments[n])
        let i = e === 'error', s = this._events
        if (s !== void 0) i = i && s.error === void 0
        else if (!i) return false
        if (i) {
          let o
          if (t.length > 0 && (o = t[0]), o instanceof Error) throw o
          const u = new Error(`Unhandled error.${o ? ` (${o.message})` : ''}`)
          throw u.context = o, u
        }
        const c = s[e]
        if (c === void 0) return false
        if (typeof c == 'function') si(c, this, t)
        else for (var l = c.length, f = pi(c, l), n = 0; n < l; ++n) si(f[n], this, t)
        return true
      }, 'emit')
      function ci(r, e, t, n) {
        let i, s, o
        if (dt(
          t
        ), s = r._events, s === void 0 ? (s = r._events = /* @__PURE__ */ Object.create(null), r._eventsCount = 0) : (s.newListener !== void 0 && (r.emit('newListener', e, t.listener ? t.listener : t), s = r._events), o = s[e]), o === void 0) o = s[e] = t, ++r._eventsCount
        else if (typeof o == 'function' ? o = s[e] = n ? [t, o] : [o, t] : n ? o.unshift(t) : o.push(t), i = ui(r), i > 0 && o.length > i && !o.warned) {
          o.warned = true
          const u = new Error(`Possible EventEmitter memory leak detected. ${o.length} ${String(e)} listeners added. Use emitter.setMaxListeners() to increase limit`)
          u.name = 'MaxListenersExceededWarning', u.emitter = r, u.type = e, u.count = o.length, oa(u)
        }
        return r
      }
      __name(ci, 'ci')
      a(ci, '_addListener')
      B.prototype.addListener = a(function(e, t) {
        return ci(this, e, t, false)
      }, 'addListener')
      B.prototype.on = B.prototype.addListener
      B.prototype.prependListener = a(function(e, t) {
        return ci(this, e, t, true)
      }, 'prependListener')
      function aa() {
        if (!this.fired) return this.target.removeListener(this.type, this.wrapFn), this.fired = true, arguments.length === 0 ? this.listener.call(this.target) : this.listener.apply(this.target, arguments)
      }
      __name(aa, 'aa')
      a(aa, 'onceWrapper')
      function li(r, e, t) {
        const n = {
            fired: false,
            wrapFn: void 0,
            target: r,
            type: e,
            listener: t
          }, i = aa.bind(n)
        return i.listener = t, n.wrapFn = i, i
      }
      __name(li, 'li')
      a(li, '_onceWrap')
      B.prototype.once = a(function(e, t) {
        return dt(t), this.on(e, li(this, e, t)), this
      }, 'once')
      B.prototype.prependOnceListener = a(function(e, t) {
        return dt(t), this.prependListener(e, li(this, e, t)), this
      }, 'prependOnceListener')
      B.prototype.removeListener = a(function(e, t) {
        let n, i, s, o, u
        if (dt(t), i = this._events, i === void 0) return this
        if (n = i[e], n === void 0) return this
        if (n === t || n.listener === t) --this._eventsCount === 0 ? this._events = /* @__PURE__ */ Object.create(null) : (delete i[e], i.removeListener && this.emit('removeListener', e, n.listener || t))
        else if (typeof n != 'function') {
          for (s = -1, o = n.length - 1; o >= 0; o--) if (n[o] === t || n[o].listener === t) {
            u = n[o].listener, s = o
            break
          }
          if (s < 0) return this
          s === 0 ? n.shift() : ua(n, s), n.length === 1 && (i[e] = n[0]), i.removeListener !== void 0 && this.emit('removeListener', e, u || t)
        }
        return this
      }, 'removeListener')
      B.prototype.off = B.prototype.removeListener
      B.prototype.removeAllListeners = a(function(e) {
        let t, n, i
        if (n = this._events, n === void 0) return this
        if (n.removeListener === void 0) return arguments.length === 0 ? (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0) : n[e] !== void 0 && (--this._eventsCount === 0 ? this._events = /* @__PURE__ */ Object.create(null) : delete n[e]), this
        if (arguments.length === 0) {
          let s = Object.keys(n), o
          for (i = 0; i < s.length; ++i) o = s[i], o !== 'removeListener' && this.removeAllListeners(
            o
          )
          return this.removeAllListeners('removeListener'), this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0, this
        }
        if (t = n[e], typeof t == 'function') this.removeListener(e, t)
        else if (t !== void 0) for (i = t.length - 1; i >= 0; i--) this.removeListener(e, t[i])
        return this
      }, 'removeAllListeners')
      function fi(r, e, t) {
        const n = r._events
        if (n === void 0) return []
        const i = n[e]
        return i === void 0 ? [] : typeof i == 'function' ? t ? [i.listener || i] : [i] : t ? ca(i) : pi(i, i.length)
      }
      __name(fi, 'fi')
      a(fi, '_listeners')
      B.prototype.listeners = a(function(e) {
        return fi(this, e, true)
      }, 'listeners')
      B.prototype.rawListeners = a(function(e) {
        return fi(this, e, false)
      }, 'rawListeners')
      B.listenerCount = function(r, e) {
        return typeof r.listenerCount == 'function' ? r.listenerCount(e) : hi.call(r, e)
      }
      B.prototype.listenerCount = hi
      function hi(r) {
        const e = this._events
        if (e !== void 0) {
          const t = e[r]
          if (typeof t == 'function')
            return 1
          if (t !== void 0) return t.length
        }
        return 0
      }
      __name(hi, 'hi')
      a(hi, 'listenerCount')
      B.prototype.eventNames = a(function() {
        return this._eventsCount > 0 ? pt(this._events) : []
      }, 'eventNames')
      function pi(r, e) {
        for (var t = new Array(e), n = 0; n < e; ++n) t[n] = r[n]
        return t
      }
      __name(pi, 'pi')
      a(pi, 'arrayClone')
      function ua(r, e) {
        for (; e + 1 < r.length; e++) r[e] = r[e + 1]
        r.pop()
      }
      __name(ua, 'ua')
      a(ua, 'spliceOne')
      function ca(r) {
        for (var e = new Array(r.length), t = 0; t < e.length; ++t) e[t] = r[t].listener || r[t]
        return e
      }
      __name(ca, 'ca')
      a(ca, 'unwrapListeners')
      function la(r, e) {
        return new Promise(function(t, n) {
          function i(o) {
            r.removeListener(e, s), n(o)
          }
          __name(i, 'i')
          a(i, 'errorListener')
          function s() {
            typeof r.removeListener == 'function' && r.removeListener('error', i), t([].slice.call(arguments))
          }
          __name(s, 's')
          a(s, 'resolver'), di(r, e, s, { once: true }), e !== 'error' && fa(r, i, { once: true })
        })
      }
      __name(la, 'la')
      a(la, 'once')
      function fa(r, e, t) {
        typeof r.on == 'function' && di(r, 'error', e, t)
      }
      __name(fa, 'fa')
      a(
        fa,
        'addErrorHandlerIfEventEmitter'
      )
      function di(r, e, t, n) {
        if (typeof r.on == 'function') n.once ? r.once(e, t) : r.on(e, t)
        else if (typeof r.addEventListener == 'function') r.addEventListener(e, a(/* @__PURE__ */ __name(function i(s) {
          n.once && r.removeEventListener(e, i), t(s)
        }, 'i'), 'wrapListener'))
        else throw new TypeError(`The "emitter" argument must be of type EventEmitter. Received type ${typeof r}`)
      }
      __name(di, 'di')
      a(di, 'eventTargetAgnosticAddListener')
    })
    wi = {}
    ie(wi, { Socket: /* @__PURE__ */ __name(() => ce, 'Socket'), isIP: /* @__PURE__ */ __name(() => ha, 'isIP') })
    __name(ha, 'ha')
    Fe = G(() => {
      'use strict'
      p()
      mi = Se(ge(), 1)
      a(ha, 'isIP')
      yi = /^[^.]+\./, S = class S2 extends mi.EventEmitter {
        static {
          __name(this, 'S')
        }
        constructor() {
          super(...arguments)
          E(this, 'opts', {})
          E(this, 'connecting', false)
          E(this, 'pending', true)
          E(
            this,
            'writable',
            true
          )
          E(this, 'encrypted', false)
          E(this, 'authorized', false)
          E(this, 'destroyed', false)
          E(this, 'ws', null)
          E(this, 'writeBuffer')
          E(this, 'tlsState', 0)
          E(this, 'tlsRead')
          E(this, 'tlsWrite')
        }
        static get poolQueryViaFetch() {
          return S2.opts.poolQueryViaFetch ?? S2.defaults.poolQueryViaFetch
        }
        static set poolQueryViaFetch(t) {
          S2.opts.poolQueryViaFetch = t
        }
        static get fetchEndpoint() {
          return S2.opts.fetchEndpoint ?? S2.defaults.fetchEndpoint
        }
        static set fetchEndpoint(t) {
          S2.opts.fetchEndpoint = t
        }
        static get fetchConnectionCache() {
          return true
        }
        static set fetchConnectionCache(t) {
          console.warn('The `fetchConnectionCache` option is deprecated (now always `true`)')
        }
        static get fetchFunction() {
          return S2.opts.fetchFunction ?? S2.defaults.fetchFunction
        }
        static set fetchFunction(t) {
          S2.opts.fetchFunction = t
        }
        static get webSocketConstructor() {
          return S2.opts.webSocketConstructor ?? S2.defaults.webSocketConstructor
        }
        static set webSocketConstructor(t) {
          S2.opts.webSocketConstructor = t
        }
        get webSocketConstructor() {
          return this.opts.webSocketConstructor ?? S2.webSocketConstructor
        }
        set webSocketConstructor(t) {
          this.opts.webSocketConstructor = t
        }
        static get wsProxy() {
          return S2.opts.wsProxy ?? S2.defaults.wsProxy
        }
        static set wsProxy(t) {
          S2.opts.wsProxy = t
        }
        get wsProxy() {
          return this.opts.wsProxy ?? S2.wsProxy
        }
        set wsProxy(t) {
          this.opts.wsProxy = t
        }
        static get coalesceWrites() {
          return S2.opts.coalesceWrites ?? S2.defaults.coalesceWrites
        }
        static set coalesceWrites(t) {
          S2.opts.coalesceWrites = t
        }
        get coalesceWrites() {
          return this.opts.coalesceWrites ?? S2.coalesceWrites
        }
        set coalesceWrites(t) {
          this.opts.coalesceWrites = t
        }
        static get useSecureWebSocket() {
          return S2.opts.useSecureWebSocket ?? S2.defaults.useSecureWebSocket
        }
        static set useSecureWebSocket(t) {
          S2.opts.useSecureWebSocket = t
        }
        get useSecureWebSocket() {
          return this.opts.useSecureWebSocket ?? S2.useSecureWebSocket
        }
        set useSecureWebSocket(t) {
          this.opts.useSecureWebSocket = t
        }
        static get forceDisablePgSSL() {
          return S2.opts.forceDisablePgSSL ?? S2.defaults.forceDisablePgSSL
        }
        static set forceDisablePgSSL(t) {
          S2.opts.forceDisablePgSSL = t
        }
        get forceDisablePgSSL() {
          return this.opts.forceDisablePgSSL ?? S2.forceDisablePgSSL
        }
        set forceDisablePgSSL(t) {
          this.opts.forceDisablePgSSL = t
        }
        static get disableSNI() {
          return S2.opts.disableSNI ?? S2.defaults.disableSNI
        }
        static set disableSNI(t) {
          S2.opts.disableSNI = t
        }
        get disableSNI() {
          return this.opts.disableSNI ?? S2.disableSNI
        }
        set disableSNI(t) {
          this.opts.disableSNI = t
        }
        static get disableWarningInBrowsers() {
          return S2.opts.disableWarningInBrowsers ?? S2.defaults.disableWarningInBrowsers
        }
        static set disableWarningInBrowsers(t) {
          S2.opts.disableWarningInBrowsers = t
        }
        get disableWarningInBrowsers() {
          return this.opts.disableWarningInBrowsers ?? S2.disableWarningInBrowsers
        }
        set disableWarningInBrowsers(t) {
          this.opts.disableWarningInBrowsers = t
        }
        static get pipelineConnect() {
          return S2.opts.pipelineConnect ?? S2.defaults.pipelineConnect
        }
        static set pipelineConnect(t) {
          S2.opts.pipelineConnect = t
        }
        get pipelineConnect() {
          return this.opts.pipelineConnect ?? S2.pipelineConnect
        }
        set pipelineConnect(t) {
          this.opts.pipelineConnect = t
        }
        static get subtls() {
          return S2.opts.subtls ?? S2.defaults.subtls
        }
        static set subtls(t) {
          S2.opts.subtls = t
        }
        get subtls() {
          return this.opts.subtls ?? S2.subtls
        }
        set subtls(t) {
          this.opts.subtls = t
        }
        static get pipelineTLS() {
          return S2.opts.pipelineTLS ?? S2.defaults.pipelineTLS
        }
        static set pipelineTLS(t) {
          S2.opts.pipelineTLS = t
        }
        get pipelineTLS() {
          return this.opts.pipelineTLS ?? S2.pipelineTLS
        }
        set pipelineTLS(t) {
          this.opts.pipelineTLS = t
        }
        static get rootCerts() {
          return S2.opts.rootCerts ?? S2.defaults.rootCerts
        }
        static set rootCerts(t) {
          S2.opts.rootCerts = t
        }
        get rootCerts() {
          return this.opts.rootCerts ?? S2.rootCerts
        }
        set rootCerts(t) {
          this.opts.rootCerts = t
        }
        wsProxyAddrForHost(t, n) {
          const i = this.wsProxy
          if (i === void 0) throw new Error('No WebSocket proxy is configured. Please see https://github.com/neondatabase/serverless/blob/main/CONFIG.md#wsproxy-string--host-string-port-number--string--string')
          return typeof i == 'function' ? i(t, n) : `${i}?address=${t}:${n}`
        }
        setNoDelay() {
          return this
        }
        setKeepAlive() {
          return this
        }
        ref() {
          return this
        }
        unref() {
          return this
        }
        connect(t, n, i) {
          this.connecting = true, i && this.once('connect', i)
          let s = a(() => {
              this.connecting = false, this.pending = false, this.emit('connect'), this.emit('ready')
            }, 'handleWebSocketOpen'), o = a((c, l = false) => {
              c.binaryType = 'arraybuffer', c.addEventListener('error', (f) => {
                this.emit('error', f), this.emit('close')
              }), c.addEventListener('message', (f) => {
                if (this.tlsState === 0) {
                  const y = d.from(f.data)
                  this.emit('data', y)
                }
              }), c.addEventListener('close', () => {
                this.emit('close')
              }), l ? s() : c.addEventListener(
                'open',
                s
              )
            }, 'configureWebSocket'), u
          try {
            u = this.wsProxyAddrForHost(n, typeof t == 'string' ? parseInt(t, 10) : t)
          } catch (c) {
            this.emit('error', c), this.emit('close')
            return
          }
          try {
            const l = `${this.useSecureWebSocket ? 'wss:' : 'ws:'}//${u}`
            if (this.webSocketConstructor !== void 0) this.ws = new this.webSocketConstructor(l), o(this.ws)
            else try {
              this.ws = new WebSocket(l), o(this.ws)
            } catch {
              this.ws = new __unstable_WebSocket(l), o(this.ws)
            }
          } catch (c) {
            const f = `${this.useSecureWebSocket ? 'https:' : 'http:'}//${u}`
            fetch(f, { headers: { Upgrade: 'websocket' } }).then(
              (y) => {
                if (this.ws = y.webSocket, this.ws == null) throw c
                this.ws.accept(), o(this.ws, true)
              }
            ).catch((y) => {
              this.emit(
                'error',
                new Error(`All attempts to open a WebSocket to connect to the database failed. Please refer to https://github.com/neondatabase/serverless/blob/main/CONFIG.md#websocketconstructor-typeof-websocket--undefined. Details: ${y}`)
              ), this.emit('close')
            })
          }
        }
        async startTls(t) {
          if (this.subtls === void 0) throw new Error(
            'For Postgres SSL connections, you must set `neonConfig.subtls` to the subtls library. See https://github.com/neondatabase/serverless/blob/main/CONFIG.md for more information.'
          )
          this.tlsState = 1
          const n = await this.subtls.TrustedCert.databaseFromPEM(this.rootCerts), i = new this.subtls.WebSocketReadQueue(this.ws), s = i.read.bind(i), o = this.rawWrite.bind(this), { read: u, write: c } = await this.subtls.startTls(t, n, s, o, { useSNI: !this.disableSNI, expectPreData: this.pipelineTLS ? new Uint8Array([83]) : void 0 })
          this.tlsRead = u, this.tlsWrite = c, this.tlsState = 2, this.encrypted = true, this.authorized = true, this.emit('secureConnection', this), this.tlsReadLoop()
        }
        async tlsReadLoop() {
          for (; ; ) {
            const t = await this.tlsRead()
            if (t === void 0) break
            {
              const n = d.from(t)
              this.emit('data', n)
            }
          }
        }
        rawWrite(t) {
          if (!this.coalesceWrites) {
            this.ws && this.ws.send(t)
            return
          }
          if (this.writeBuffer === void 0) this.writeBuffer = t, setTimeout(() => {
            this.ws && this.ws.send(this.writeBuffer), this.writeBuffer = void 0
          }, 0)
          else {
            const n = new Uint8Array(
              this.writeBuffer.length + t.length
            )
            n.set(this.writeBuffer), n.set(t, this.writeBuffer.length), this.writeBuffer = n
          }
        }
        write(t, n = 'utf8', i = (s) => {
        }) {
          return t.length === 0 ? (i(), true) : (typeof t == 'string' && (t = d.from(t, n)), this.tlsState === 0 ? (this.rawWrite(t), i()) : this.tlsState === 1 ? this.once('secureConnection', () => {
            this.write(
              t,
              n,
              i
            )
          }) : (this.tlsWrite(t), i()), true)
        }
        end(t = d.alloc(0), n = 'utf8', i = () => {
        }) {
          return this.write(t, n, () => {
            this.ws.close(), i()
          }), this
        }
        destroy() {
          return this.destroyed = true, this.end()
        }
      }
      a(S, 'Socket'), E(S, 'defaults', {
        poolQueryViaFetch: false,
        fetchEndpoint: a((t, n, i) => {
          let s
          return i?.jwtAuth ? s = t.replace(yi, 'apiauth.') : s = t.replace(yi, 'api.'), `https://${s}/sql`
        }, 'fetchEndpoint'),
        fetchConnectionCache: true,
        fetchFunction: void 0,
        webSocketConstructor: void 0,
        wsProxy: a((t) => `${t}/v2`, 'wsProxy'),
        useSecureWebSocket: true,
        forceDisablePgSSL: true,
        coalesceWrites: true,
        pipelineConnect: 'password',
        subtls: void 0,
        rootCerts: '',
        pipelineTLS: false,
        disableSNI: false,
        disableWarningInBrowsers: false
      }), E(S, 'opts', {})
      ce = S
    })
    gi = {}
    ie(gi, { parse: /* @__PURE__ */ __name(() => Yt, 'parse') })
    __name(Yt, 'Yt')
    Zt = G(() => {
      'use strict'
      p()
      a(Yt, 'parse')
    })
    tr = T((Ai) => {
      'use strict'
      p()
      Ai.parse = function(r, e) {
        return new er(r, e).parse()
      }
      const vt = class vt2 {
        static {
          __name(this, 'vt')
        }
        constructor(e, t) {
          this.source = e, this.transform = t || Ca, this.position = 0, this.entries = [], this.recorded = [], this.dimension = 0
        }
        isEof() {
          return this.position >= this.source.length
        }
        nextCharacter() {
          const e = this.source[this.position++]
          return e === '\\' ? { value: this.source[this.position++], escaped: true } : { value: e, escaped: false }
        }
        record(e) {
          this.recorded.push(
            e
          )
        }
        newEntry(e) {
          let t;
          (this.recorded.length > 0 || e) && (t = this.recorded.join(''), t === 'NULL' && !e && (t = null), t !== null && (t = this.transform(t)), this.entries.push(t), this.recorded = [])
        }
        consumeDimensions() {
          if (this.source[0] === '[') while (!this.isEof()) {
            const e = this.nextCharacter()
            if (e.value === '=') break
          }
        }
        parse(e) {
          let t, n, i
          for (this.consumeDimensions(); !this.isEof(); ) if (t = this.nextCharacter(), t.value === '{' && !i) this.dimension++, this.dimension > 1 && (n = new vt2(this.source.substr(this.position - 1), this.transform), this.entries.push(n.parse(
            true
          )), this.position += n.position - 2)
          else if (t.value === '}' && !i) {
            if (this.dimension--, !this.dimension && (this.newEntry(), e)) return this.entries
          } else t.value === '"' && !t.escaped ? (i && this.newEntry(true), i = !i) : t.value === ',' && !i ? this.newEntry() : this.record(t.value)
          if (this.dimension !== 0) throw new Error('array dimension not balanced')
          return this.entries
        }
      }
      a(vt, 'ArrayParser')
      var er = vt
      function Ca(r) {
        return r
      }
      __name(Ca, 'Ca')
      a(Ca, 'identity')
    })
    rr = T((Zl, Ci) => {
      p()
      const _a = tr()
      Ci.exports = { create: a(function(r, e) {
        return { parse: a(function() {
          return _a.parse(r, e)
        }, 'parse') }
      }, 'create') }
    })
    Ti = T((ef, Ii) => {
      'use strict'
      p()
      const Ia = /(\d{1,})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(\.\d{1,})?.*?( BC)?$/, Ta = /^(\d{1,})-(\d{2})-(\d{2})( BC)?$/, Pa = /([Z+-])(\d{2})?:?(\d{2})?:?(\d{2})?/, Ba = /^-?infinity$/
      Ii.exports = a(function(e) {
        if (Ba.test(e)) return Number(e.replace('i', 'I'))
        const t = Ia.exec(e)
        if (!t) return Ra(
          e
        ) || null
        let n = !!t[8], i = parseInt(t[1], 10)
        n && (i = _i(i))
        let s = parseInt(t[2], 10) - 1, o = t[3], u = parseInt(
            t[4],
            10
          ), c = parseInt(t[5], 10), l = parseInt(t[6], 10), f = t[7]
        f = f ? 1e3 * parseFloat(f) : 0
        let y, g = La(e)
        return g != null ? (y = new Date(Date.UTC(i, s, o, u, c, l, f)), nr(i) && y.setUTCFullYear(i), g !== 0 && y.setTime(y.getTime() - g)) : (y = new Date(i, s, o, u, c, l, f), nr(i) && y.setFullYear(i)), y
      }, 'parseDate')
      function Ra(r) {
        const e = Ta.exec(r)
        if (e) {
          let t = parseInt(e[1], 10), n = !!e[4]
          n && (t = _i(t))
          const i = parseInt(e[2], 10) - 1, s = e[3], o = new Date(t, i, s)
          return nr(
            t
          ) && o.setFullYear(t), o
        }
      }
      __name(Ra, 'Ra')
      a(Ra, 'getDate')
      function La(r) {
        if (r.endsWith('+00')) return 0
        const e = Pa.exec(r.split(' ')[1])
        if (e) {
          const t = e[1]
          if (t === 'Z') return 0
          const n = t === '-' ? -1 : 1, i = parseInt(e[2], 10) * 3600 + parseInt(
            e[3] || 0,
            10
          ) * 60 + parseInt(e[4] || 0, 10)
          return i * n * 1e3
        }
      }
      __name(La, 'La')
      a(La, 'timeZoneOffset')
      function _i(r) {
        return -(r - 1)
      }
      __name(_i, '_i')
      a(_i, 'bcYearToNegativeYear')
      function nr(r) {
        return r >= 0 && r < 100
      }
      __name(nr, 'nr')
      a(nr, 'is0To99')
    })
    Bi = T((nf, Pi) => {
      p()
      Pi.exports = ka
      const Fa = Object.prototype.hasOwnProperty
      function ka(r) {
        for (let e = 1; e < arguments.length; e++) {
          const t = arguments[e]
          for (const n in t) Fa.call(t, n) && (r[n] = t[n])
        }
        return r
      }
      __name(ka, 'ka')
      a(ka, 'extend')
    })
    Fi = T((af, Li) => {
      'use strict'
      p()
      const Ma = Bi()
      Li.exports = ke
      function ke(r) {
        if (!(this instanceof ke))
          return new ke(r)
        Ma(this, Va(r))
      }
      __name(ke, 'ke')
      a(ke, 'PostgresInterval')
      const Ua = [
        'seconds',
        'minutes',
        'hours',
        'days',
        'months',
        'years'
      ]
      ke.prototype.toPostgres = function() {
        const r = Ua.filter(this.hasOwnProperty, this)
        return this.milliseconds && r.indexOf('seconds') < 0 && r.push('seconds'), r.length === 0 ? '0' : r.map(function(e) {
          let t = this[e] || 0
          return e === 'seconds' && this.milliseconds && (t = (t + this.milliseconds / 1e3).toFixed(6).replace(
            /\.?0+$/,
            ''
          )), `${t} ${e}`
        }, this).join(' ')
      }
      const Da = { years: 'Y', months: 'M', days: 'D', hours: 'H', minutes: 'M', seconds: 'S' }, Oa = ['years', 'months', 'days'], qa = ['hours', 'minutes', 'seconds']
      ke.prototype.toISOString = ke.prototype.toISO = function() {
        const r = Oa.map(t, this).join(''), e = qa.map(t, this).join('')
        return `P${r}T${e}`
        function t(n) {
          let i = this[n] || 0
          return n === 'seconds' && this.milliseconds && (i = (i + this.milliseconds / 1e3).toFixed(6).replace(
            /0+$/,
            ''
          )), i + Da[n]
        }
        __name(t, 't')
      }
      const ir = '([+-]?\\d+)', Qa = `${ir}\\s+years?`, Na = `${ir}\\s+mons?`, Wa = `${ir}\\s+days?`, ja = '([+-])?([\\d]*):(\\d\\d):(\\d\\d)\\.?(\\d{1,6})?', Ha = new RegExp([Qa, Na, Wa, ja].map(function(r) {
          return `(${r})?`
        }).join('\\s*')), Ri = { years: 2, months: 4, days: 6, hours: 9, minutes: 10, seconds: 11, milliseconds: 12 }, $a = ['hours', 'minutes', 'seconds', 'milliseconds']
      function Ga(r) {
        const e = r + '000000'.slice(r.length)
        return parseInt(
          e,
          10
        ) / 1e3
      }
      __name(Ga, 'Ga')
      a(Ga, 'parseMilliseconds')
      function Va(r) {
        if (!r) return {}
        const e = Ha.exec(r), t = e[8] === '-'
        return Object.keys(Ri).reduce(function(n, i) {
          let s = Ri[i], o = e[s]
          return !o || (o = i === 'milliseconds' ? Ga(o) : parseInt(o, 10), !o) || (t && ~$a.indexOf(i) && (o *= -1), n[i] = o), n
        }, {})
      }
      __name(Va, 'Va')
      a(Va, 'parse')
    })
    Mi = T((lf, ki) => {
      'use strict'
      p()
      ki.exports = a(function(e) {
        if (/^\\x/.test(e)) return new d(e.substr(
          2
        ), 'hex')
        for (var t = '', n = 0; n < e.length; ) if (e[n] !== '\\') t += e[n], ++n
        else if (/[0-7]{3}/.test(e.substr(n + 1, 3))) t += String.fromCharCode(parseInt(e.substr(n + 1, 3), 8)), n += 4
        else {
          for (var i = 1; n + i < e.length && e[n + i] === '\\'; ) i++
          for (let s = 0; s < Math.floor(i / 2); ++s) t += '\\'
          n += Math.floor(i / 2) * 2
        }
        return new d(t, 'binary')
      }, 'parseBytea')
    })
    Wi = T((pf, Ni) => {
      p()
      const Ve = tr(), ze = rr(), xt = Ti(), Di = Fi(), Oi = Mi()
      function St(r) {
        return a(function(t) {
          return t === null ? t : r(t)
        }, 'nullAllowed')
      }
      __name(St, 'St')
      a(St, 'allowNull')
      function qi(r) {
        return r === null ? r : r === 'TRUE' || r === 't' || r === 'true' || r === 'y' || r === 'yes' || r === 'on' || r === '1'
      }
      __name(qi, 'qi')
      a(qi, 'parseBool')
      function za(r) {
        return r ? Ve.parse(r, qi) : null
      }
      __name(za, 'za')
      a(za, 'parseBoolArray')
      function Ka(r) {
        return parseInt(r, 10)
      }
      __name(Ka, 'Ka')
      a(Ka, 'parseBaseTenInt')
      function sr(r) {
        return r ? Ve.parse(r, St(Ka)) : null
      }
      __name(sr, 'sr')
      a(sr, 'parseIntegerArray')
      function Ya(r) {
        return r ? Ve.parse(r, St(function(e) {
          return Qi(e).trim()
        })) : null
      }
      __name(Ya, 'Ya')
      a(Ya, 'parseBigIntegerArray')
      var Za = a(function(r) {
          if (!r) return null
          const e = ze.create(r, function(t) {
            return t !== null && (t = cr(t)), t
          })
          return e.parse()
        }, 'parsePointArray'), or = a(function(r) {
          if (!r) return null
          const e = ze.create(r, function(t) {
            return t !== null && (t = parseFloat(t)), t
          })
          return e.parse()
        }, 'parseFloatArray'), re = a(function(r) {
          if (!r) return null
          const e = ze.create(r)
          return e.parse()
        }, 'parseStringArray'), ar = a(function(r) {
          if (!r) return null
          const e = ze.create(
            r,
            function(t) {
              return t !== null && (t = xt(t)), t
            }
          )
          return e.parse()
        }, 'parseDateArray'), Ja = a(function(r) {
          if (!r)
            return null
          const e = ze.create(r, function(t) {
            return t !== null && (t = Di(t)), t
          })
          return e.parse()
        }, 'parseIntervalArray'), Xa = a(function(r) {
          return r ? Ve.parse(r, St(Oi)) : null
        }, 'parseByteAArray'), ur = a(function(r) {
          return parseInt(r, 10)
        }, 'parseInteger'), Qi = a(function(r) {
          const e = String(r)
          return /^\d+$/.test(e) ? e : r
        }, 'parseBigInteger'), Ui = a(function(r) {
          return r ? Ve.parse(r, St(JSON.parse)) : null
        }, 'parseJsonArray'), cr = a(
          function(r) {
            return r[0] !== '(' ? null : (r = r.substring(1, r.length - 1).split(','), { x: parseFloat(r[0]), y: parseFloat(
              r[1]
            ) })
          },
          'parsePoint'
        ), eu = a(function(r) {
          if (r[0] !== '<' && r[1] !== '(') return null
          for (var e = '(', t = '', n = false, i = 2; i < r.length - 1; i++) {
            if (n || (e += r[i]), r[i] === ')') {
              n = true
              continue
            } else if (!n) continue
            r[i] !== ',' && (t += r[i])
          }
          const s = cr(e)
          return s.radius = parseFloat(t), s
        }, 'parseCircle'), tu = a(function(r) {
          r(20, Qi), r(21, ur), r(23, ur), r(26, ur), r(700, parseFloat), r(701, parseFloat), r(16, qi), r(1082, xt), r(1114, xt), r(1184, xt), r(
            600,
            cr
          ), r(651, re), r(718, eu), r(1e3, za), r(1001, Xa), r(1005, sr), r(1007, sr), r(1028, sr), r(1016, Ya), r(1017, Za), r(1021, or), r(1022, or), r(1231, or), r(1014, re), r(1015, re), r(1008, re), r(1009, re), r(1040, re), r(1041, re), r(
            1115,
            ar
          ), r(1182, ar), r(1185, ar), r(1186, Di), r(1187, Ja), r(17, Oi), r(114, JSON.parse.bind(JSON)), r(3802, JSON.parse.bind(JSON)), r(199, Ui), r(3807, Ui), r(3907, re), r(2951, re), r(791, re), r(1183, re), r(1270, re)
        }, 'init')
      Ni.exports = { init: tu }
    })
    Hi = T((mf, ji) => {
      'use strict'
      p()
      const z = 1e6
      function ru(r) {
        let e = r.readInt32BE(0), t = r.readUInt32BE(
            4
          ), n = ''
        e < 0 && (e = ~e + (t === 0), t = ~t + 1 >>> 0, n = '-')
        let i = '', s, o, u, c, l, f
        {
          if (s = e % z, e = e / z >>> 0, o = 4294967296 * s + t, t = o / z >>> 0, u = `${o - z * t}`, t === 0 && e === 0) return n + u + i
          for (c = '', l = 6 - u.length, f = 0; f < l; f++) c += '0'
          i = c + u + i
        }
        {
          if (s = e % z, e = e / z >>> 0, o = 4294967296 * s + t, t = o / z >>> 0, u = `${o - z * t}`, t === 0 && e === 0) return n + u + i
          for (c = '', l = 6 - u.length, f = 0; f < l; f++) c += '0'
          i = c + u + i
        }
        {
          if (s = e % z, e = e / z >>> 0, o = 4294967296 * s + t, t = o / z >>> 0, u = `${o - z * t}`, t === 0 && e === 0) return n + u + i
          for (c = '', l = 6 - u.length, f = 0; f < l; f++) c += '0'
          i = c + u + i
        }
        return s = e % z, o = 4294967296 * s + t, u = `${o % z}`, n + u + i
      }
      __name(ru, 'ru')
      a(ru, 'readInt8')
      ji.exports = ru
    })
    Ki = T((bf, zi) => {
      p()
      const nu = Hi(), L = a(function(r, e, t, n, i) {
          t = t || 0, n = n || false, i = i || function(A, C, D) {
            return A * Math.pow(2, D) + C
          }
          let s = t >> 3, o = a(function(A) {
              return n ? ~A & 255 : A
            }, 'inv'), u = 255, c = 8 - t % 8
          e < c && (u = 255 << 8 - e & 255, c = e), t && (u = u >> t % 8)
          let l = 0
          t % 8 + e >= 8 && (l = i(0, o(r[s]) & u, c))
          for (var f = e + t >> 3, y = s + 1; y < f; y++) l = i(l, o(
            r[y]
          ), 8)
          const g = (e + t) % 8
          return g > 0 && (l = i(l, o(r[f]) >> 8 - g, g)), l
        }, 'parseBits'), Vi = a(function(r, e, t) {
          const n = Math.pow(2, t - 1) - 1, i = L(r, 1), s = L(r, t, 1)
          if (s === 0) return 0
          let o = 1, u = a(function(l, f, y) {
              l === 0 && (l = 1)
              for (let g = 1; g <= y; g++) o /= 2, (f & 1 << y - g) > 0 && (l += o)
              return l
            }, 'parsePrecisionBits'), c = L(r, e, t + 1, false, u)
          return s == Math.pow(
            2,
            t + 1
          ) - 1 ? c === 0 ? i === 0 ? 1 / 0 : -1 / 0 : NaN : (i === 0 ? 1 : -1) * Math.pow(2, s - n) * c
        }, 'parseFloatFromBits'), iu = a(function(r) {
          return L(r, 1) == 1 ? -1 * (L(r, 15, 1, true) + 1) : L(r, 15, 1)
        }, 'parseInt16'), $i = a(function(r) {
          return L(r, 1) == 1 ? -1 * (L(
            r,
            31,
            1,
            true
          ) + 1) : L(r, 31, 1)
        }, 'parseInt32'), su = a(function(r) {
          return Vi(r, 23, 8)
        }, 'parseFloat32'), ou = a(function(r) {
          return Vi(r, 52, 11)
        }, 'parseFloat64'), au = a(function(r) {
          const e = L(r, 16, 32)
          if (e == 49152) return NaN
          for (var t = Math.pow(1e4, L(r, 16, 16)), n = 0, i = [], s = L(r, 16), o = 0; o < s; o++) n += L(r, 16, 64 + 16 * o) * t, t /= 1e4
          const u = Math.pow(10, L(
            r,
            16,
            48
          ))
          return (e === 0 ? 1 : -1) * Math.round(n * u) / u
        }, 'parseNumeric'), Gi = a(function(r, e) {
          const t = L(e, 1), n = L(
              e,
              63,
              1
            ), i = new Date((t === 0 ? 1 : -1) * n / 1e3 + 9466848e5)
          return r || i.setTime(i.getTime() + i.getTimezoneOffset() * 6e4), i.usec = n % 1e3, i.getMicroSeconds = function() {
            return this.usec
          }, i.setMicroSeconds = function(s) {
            this.usec = s
          }, i.getUTCMicroSeconds = function() {
            return this.usec
          }, i
        }, 'parseDate'), Ke = a(
          function(r) {
            for (var e = L(
                r,
                32
              ), t = L(r, 32, 32), n = L(r, 32, 64), i = 96, s = [], o = 0; o < e; o++) s[o] = L(r, 32, i), i += 32, i += 32
            var u = a(function(l) {
                const f = L(r, 32, i)
                if (i += 32, f == 4294967295) return null
                let y
                if (l == 23 || l == 20) return y = L(r, f * 8, i), i += f * 8, y
                if (l == 25) return y = r.toString(this.encoding, i >> 3, (i += f << 3) >> 3), y
                console.log(`ERROR: ElementType not implemented: ${l}`)
              }, 'parseElement'), c = a(function(l, f) {
                let y = [], g
                if (l.length > 1) {
                  const A = l.shift()
                  for (g = 0; g < A; g++) y[g] = c(l, f)
                  l.unshift(A)
                } else for (g = 0; g < l[0]; g++) y[g] = u(f)
                return y
              }, 'parse')
            return c(s, n)
          },
          'parseArray'
        ), uu = a(function(r) {
          return r.toString('utf8')
        }, 'parseText'), cu = a(function(r) {
          return r === null ? null : L(r, 8) > 0
        }, 'parseBool'), lu = a(function(r) {
          r(20, nu), r(21, iu), r(23, $i), r(26, $i), r(1700, au), r(700, su), r(701, ou), r(16, cu), r(1114, Gi.bind(null, false)), r(1184, Gi.bind(null, true)), r(1e3, Ke), r(1007, Ke), r(1016, Ke), r(1008, Ke), r(1009, Ke), r(25, uu)
        }, 'init')
      zi.exports = { init: lu }
    })
    Zi = T((Sf, Yi) => {
      p()
      Yi.exports = {
        BOOL: 16,
        BYTEA: 17,
        CHAR: 18,
        INT8: 20,
        INT2: 21,
        INT4: 23,
        REGPROC: 24,
        TEXT: 25,
        OID: 26,
        TID: 27,
        XID: 28,
        CID: 29,
        JSON: 114,
        XML: 142,
        PG_NODE_TREE: 194,
        SMGR: 210,
        PATH: 602,
        POLYGON: 604,
        CIDR: 650,
        FLOAT4: 700,
        FLOAT8: 701,
        ABSTIME: 702,
        RELTIME: 703,
        TINTERVAL: 704,
        CIRCLE: 718,
        MACADDR8: 774,
        MONEY: 790,
        MACADDR: 829,
        INET: 869,
        ACLITEM: 1033,
        BPCHAR: 1042,
        VARCHAR: 1043,
        DATE: 1082,
        TIME: 1083,
        TIMESTAMP: 1114,
        TIMESTAMPTZ: 1184,
        INTERVAL: 1186,
        TIMETZ: 1266,
        BIT: 1560,
        VARBIT: 1562,
        NUMERIC: 1700,
        REFCURSOR: 1790,
        REGPROCEDURE: 2202,
        REGOPER: 2203,
        REGOPERATOR: 2204,
        REGCLASS: 2205,
        REGTYPE: 2206,
        UUID: 2950,
        TXID_SNAPSHOT: 2970,
        PG_LSN: 3220,
        PG_NDISTINCT: 3361,
        PG_DEPENDENCIES: 3402,
        TSVECTOR: 3614,
        TSQUERY: 3615,
        GTSVECTOR: 3642,
        REGCONFIG: 3734,
        REGDICTIONARY: 3769,
        JSONB: 3802,
        REGNAMESPACE: 4089,
        REGROLE: 4096
      }
    })
    Je = T((Ze) => {
      p()
      const fu = Wi(), hu = Ki(), pu = rr(), du = Zi()
      Ze.getTypeParser = yu
      Ze.setTypeParser = mu
      Ze.arrayParser = pu
      Ze.builtins = du
      const Ye = { text: {}, binary: {} }
      function Ji(r) {
        return String(r)
      }
      __name(Ji, 'Ji')
      a(Ji, 'noParse')
      function yu(r, e) {
        return e = e || 'text', Ye[e] && Ye[e][r] || Ji
      }
      __name(yu, 'yu')
      a(yu, 'getTypeParser')
      function mu(r, e, t) {
        typeof e == 'function' && (t = e, e = 'text'), Ye[e][r] = t
      }
      __name(mu, 'mu')
      a(mu, 'setTypeParser')
      fu.init(function(r, e) {
        Ye.text[r] = e
      })
      hu.init(function(r, e) {
        Ye.binary[r] = e
      })
    })
    At = T((If, Xi) => {
      'use strict'
      p()
      const wu = Je()
      function Et(r) {
        this._types = r || wu, this.text = {}, this.binary = {}
      }
      __name(Et, 'Et')
      a(Et, 'TypeOverrides')
      Et.prototype.getOverrides = function(r) {
        switch (r) {
          case 'text':
            return this.text
          case 'binary':
            return this.binary
          default:
            return {}
        }
      }
      Et.prototype.setTypeParser = function(r, e, t) {
        typeof e == 'function' && (t = e, e = 'text'), this.getOverrides(e)[r] = t
      }
      Et.prototype.getTypeParser = function(r, e) {
        return e = e || 'text', this.getOverrides(e)[r] || this._types.getTypeParser(r, e)
      }
      Xi.exports = Et
    })
    __name(Xe, 'Xe')
    es = G(() => {
      'use strict'
      p()
      a(Xe, 'sha256')
    })
    ts = G(() => {
      'use strict'
      p()
      U = class U2 {
        static {
          __name(this, 'U')
        }
        constructor() {
          E(this, '_dataLength', 0)
          E(this, '_bufferLength', 0)
          E(this, '_state', new Int32Array(4))
          E(this, '_buffer', new ArrayBuffer(68))
          E(this, '_buffer8')
          E(this, '_buffer32')
          this._buffer8 = new Uint8Array(this._buffer, 0, 68), this._buffer32 = new Uint32Array(this._buffer, 0, 17), this.start()
        }
        static hashByteArray(e, t = false) {
          return this.onePassHasher.start().appendByteArray(
            e
          ).end(t)
        }
        static hashStr(e, t = false) {
          return this.onePassHasher.start().appendStr(e).end(t)
        }
        static hashAsciiStr(e, t = false) {
          return this.onePassHasher.start().appendAsciiStr(e).end(t)
        }
        static _hex(e) {
          let t = U2.hexChars, n = U2.hexOut, i, s, o, u
          for (u = 0; u < 4; u += 1) for (s = u * 8, i = e[u], o = 0; o < 8; o += 2) n[s + 1 + o] = t.charAt(i & 15), i >>>= 4, n[s + 0 + o] = t.charAt(
            i & 15
          ), i >>>= 4
          return n.join('')
        }
        static _md5cycle(e, t) {
          let n = e[0], i = e[1], s = e[2], o = e[3]
          n += (i & s | ~i & o) + t[0] - 680876936 | 0, n = (n << 7 | n >>> 25) + i | 0, o += (n & i | ~n & s) + t[1] - 389564586 | 0, o = (o << 12 | o >>> 20) + n | 0, s += (o & n | ~o & i) + t[2] + 606105819 | 0, s = (s << 17 | s >>> 15) + o | 0, i += (s & o | ~s & n) + t[3] - 1044525330 | 0, i = (i << 22 | i >>> 10) + s | 0, n += (i & s | ~i & o) + t[4] - 176418897 | 0, n = (n << 7 | n >>> 25) + i | 0, o += (n & i | ~n & s) + t[5] + 1200080426 | 0, o = (o << 12 | o >>> 20) + n | 0, s += (o & n | ~o & i) + t[6] - 1473231341 | 0, s = (s << 17 | s >>> 15) + o | 0, i += (s & o | ~s & n) + t[7] - 45705983 | 0, i = (i << 22 | i >>> 10) + s | 0, n += (i & s | ~i & o) + t[8] + 1770035416 | 0, n = (n << 7 | n >>> 25) + i | 0, o += (n & i | ~n & s) + t[9] - 1958414417 | 0, o = (o << 12 | o >>> 20) + n | 0, s += (o & n | ~o & i) + t[10] - 42063 | 0, s = (s << 17 | s >>> 15) + o | 0, i += (s & o | ~s & n) + t[11] - 1990404162 | 0, i = (i << 22 | i >>> 10) + s | 0, n += (i & s | ~i & o) + t[12] + 1804603682 | 0, n = (n << 7 | n >>> 25) + i | 0, o += (n & i | ~n & s) + t[13] - 40341101 | 0, o = (o << 12 | o >>> 20) + n | 0, s += (o & n | ~o & i) + t[14] - 1502002290 | 0, s = (s << 17 | s >>> 15) + o | 0, i += (s & o | ~s & n) + t[15] + 1236535329 | 0, i = (i << 22 | i >>> 10) + s | 0, n += (i & o | s & ~o) + t[1] - 165796510 | 0, n = (n << 5 | n >>> 27) + i | 0, o += (n & s | i & ~s) + t[6] - 1069501632 | 0, o = (o << 9 | o >>> 23) + n | 0, s += (o & i | n & ~i) + t[11] + 643717713 | 0, s = (s << 14 | s >>> 18) + o | 0, i += (s & n | o & ~n) + t[0] - 373897302 | 0, i = (i << 20 | i >>> 12) + s | 0, n += (i & o | s & ~o) + t[5] - 701558691 | 0, n = (n << 5 | n >>> 27) + i | 0, o += (n & s | i & ~s) + t[10] + 38016083 | 0, o = (o << 9 | o >>> 23) + n | 0, s += (o & i | n & ~i) + t[15] - 660478335 | 0, s = (s << 14 | s >>> 18) + o | 0, i += (s & n | o & ~n) + t[4] - 405537848 | 0, i = (i << 20 | i >>> 12) + s | 0, n += (i & o | s & ~o) + t[9] + 568446438 | 0, n = (n << 5 | n >>> 27) + i | 0, o += (n & s | i & ~s) + t[14] - 1019803690 | 0, o = (o << 9 | o >>> 23) + n | 0, s += (o & i | n & ~i) + t[3] - 187363961 | 0, s = (s << 14 | s >>> 18) + o | 0, i += (s & n | o & ~n) + t[8] + 1163531501 | 0, i = (i << 20 | i >>> 12) + s | 0, n += (i & o | s & ~o) + t[13] - 1444681467 | 0, n = (n << 5 | n >>> 27) + i | 0, o += (n & s | i & ~s) + t[2] - 51403784 | 0, o = (o << 9 | o >>> 23) + n | 0, s += (o & i | n & ~i) + t[7] + 1735328473 | 0, s = (s << 14 | s >>> 18) + o | 0, i += (s & n | o & ~n) + t[12] - 1926607734 | 0, i = (i << 20 | i >>> 12) + s | 0, n += (i ^ s ^ o) + t[5] - 378558 | 0, n = (n << 4 | n >>> 28) + i | 0, o += (n ^ i ^ s) + t[8] - 2022574463 | 0, o = (o << 11 | o >>> 21) + n | 0, s += (o ^ n ^ i) + t[11] + 1839030562 | 0, s = (s << 16 | s >>> 16) + o | 0, i += (s ^ o ^ n) + t[14] - 35309556 | 0, i = (i << 23 | i >>> 9) + s | 0, n += (i ^ s ^ o) + t[1] - 1530992060 | 0, n = (n << 4 | n >>> 28) + i | 0, o += (n ^ i ^ s) + t[4] + 1272893353 | 0, o = (o << 11 | o >>> 21) + n | 0, s += (o ^ n ^ i) + t[7] - 155497632 | 0, s = (s << 16 | s >>> 16) + o | 0, i += (s ^ o ^ n) + t[10] - 1094730640 | 0, i = (i << 23 | i >>> 9) + s | 0, n += (i ^ s ^ o) + t[13] + 681279174 | 0, n = (n << 4 | n >>> 28) + i | 0, o += (n ^ i ^ s) + t[0] - 358537222 | 0, o = (o << 11 | o >>> 21) + n | 0, s += (o ^ n ^ i) + t[3] - 722521979 | 0, s = (s << 16 | s >>> 16) + o | 0, i += (s ^ o ^ n) + t[6] + 76029189 | 0, i = (i << 23 | i >>> 9) + s | 0, n += (i ^ s ^ o) + t[9] - 640364487 | 0, n = (n << 4 | n >>> 28) + i | 0, o += (n ^ i ^ s) + t[12] - 421815835 | 0, o = (o << 11 | o >>> 21) + n | 0, s += (o ^ n ^ i) + t[15] + 530742520 | 0, s = (s << 16 | s >>> 16) + o | 0, i += (s ^ o ^ n) + t[2] - 995338651 | 0, i = (i << 23 | i >>> 9) + s | 0, n += (s ^ (i | ~o)) + t[0] - 198630844 | 0, n = (n << 6 | n >>> 26) + i | 0, o += (i ^ (n | ~s)) + t[7] + 1126891415 | 0, o = (o << 10 | o >>> 22) + n | 0, s += (n ^ (o | ~i)) + t[14] - 1416354905 | 0, s = (s << 15 | s >>> 17) + o | 0, i += (o ^ (s | ~n)) + t[5] - 57434055 | 0, i = (i << 21 | i >>> 11) + s | 0, n += (s ^ (i | ~o)) + t[12] + 1700485571 | 0, n = (n << 6 | n >>> 26) + i | 0, o += (i ^ (n | ~s)) + t[3] - 1894986606 | 0, o = (o << 10 | o >>> 22) + n | 0, s += (n ^ (o | ~i)) + t[10] - 1051523 | 0, s = (s << 15 | s >>> 17) + o | 0, i += (o ^ (s | ~n)) + t[1] - 2054922799 | 0, i = (i << 21 | i >>> 11) + s | 0, n += (s ^ (i | ~o)) + t[8] + 1873313359 | 0, n = (n << 6 | n >>> 26) + i | 0, o += (i ^ (n | ~s)) + t[15] - 30611744 | 0, o = (o << 10 | o >>> 22) + n | 0, s += (n ^ (o | ~i)) + t[6] - 1560198380 | 0, s = (s << 15 | s >>> 17) + o | 0, i += (o ^ (s | ~n)) + t[13] + 1309151649 | 0, i = (i << 21 | i >>> 11) + s | 0, n += (s ^ (i | ~o)) + t[4] - 145523070 | 0, n = (n << 6 | n >>> 26) + i | 0, o += (i ^ (n | ~s)) + t[11] - 1120210379 | 0, o = (o << 10 | o >>> 22) + n | 0, s += (n ^ (o | ~i)) + t[2] + 718787259 | 0, s = (s << 15 | s >>> 17) + o | 0, i += (o ^ (s | ~n)) + t[9] - 343485551 | 0, i = (i << 21 | i >>> 11) + s | 0, e[0] = n + e[0] | 0, e[1] = i + e[1] | 0, e[2] = s + e[2] | 0, e[3] = o + e[3] | 0
        }
        start() {
          return this._dataLength = 0, this._bufferLength = 0, this._state.set(U2.stateIdentity), this
        }
        appendStr(e) {
          let t = this._buffer8, n = this._buffer32, i = this._bufferLength, s, o
          for (o = 0; o < e.length; o += 1) {
            if (s = e.charCodeAt(o), s < 128) t[i++] = s
            else if (s < 2048) t[i++] = (s >>> 6) + 192, t[i++] = s & 63 | 128
            else if (s < 55296 || s > 56319) t[i++] = (s >>> 12) + 224, t[i++] = s >>> 6 & 63 | 128, t[i++] = s & 63 | 128
            else {
              if (s = (s - 55296) * 1024 + (e.charCodeAt(++o) - 56320) + 65536, s > 1114111) throw new Error(
                'Unicode standard supports code points up to U+10FFFF'
              )
              t[i++] = (s >>> 18) + 240, t[i++] = s >>> 12 & 63 | 128, t[i++] = s >>> 6 & 63 | 128, t[i++] = s & 63 | 128
            }
            i >= 64 && (this._dataLength += 64, U2._md5cycle(this._state, n), i -= 64, n[0] = n[16])
          }
          return this._bufferLength = i, this
        }
        appendAsciiStr(e) {
          let t = this._buffer8, n = this._buffer32, i = this._bufferLength, s, o = 0
          for (; ; ) {
            for (s = Math.min(e.length - o, 64 - i); s--; ) t[i++] = e.charCodeAt(o++)
            if (i < 64) break
            this._dataLength += 64, U2._md5cycle(this._state, n), i = 0
          }
          return this._bufferLength = i, this
        }
        appendByteArray(e) {
          let t = this._buffer8, n = this._buffer32, i = this._bufferLength, s, o = 0
          for (; ; ) {
            for (s = Math.min(e.length - o, 64 - i); s--; ) t[i++] = e[o++]
            if (i < 64) break
            this._dataLength += 64, U2._md5cycle(this._state, n), i = 0
          }
          return this._bufferLength = i, this
        }
        getState() {
          const e = this._state
          return { buffer: String.fromCharCode.apply(null, Array.from(this._buffer8)), buflen: this._bufferLength, length: this._dataLength, state: [e[0], e[1], e[2], e[3]] }
        }
        setState(e) {
          let t = e.buffer, n = e.state, i = this._state, s
          for (this._dataLength = e.length, this._bufferLength = e.buflen, i[0] = n[0], i[1] = n[1], i[2] = n[2], i[3] = n[3], s = 0; s < t.length; s += 1) this._buffer8[s] = t.charCodeAt(s)
        }
        end(e = false) {
          const t = this._bufferLength, n = this._buffer8, i = this._buffer32, s = (t >> 2) + 1
          this._dataLength += t
          const o = this._dataLength * 8
          if (n[t] = 128, n[t + 1] = n[t + 2] = n[t + 3] = 0, i.set(U2.buffer32Identity.subarray(s), s), t > 55 && (U2._md5cycle(this._state, i), i.set(U2.buffer32Identity)), o <= 4294967295) i[14] = o
          else {
            const u = o.toString(16).match(/(.*?)(.{0,8})$/)
            if (u === null) return
            const c = parseInt(
                u[2],
                16
              ), l = parseInt(u[1], 16) || 0
            i[14] = c, i[15] = l
          }
          return U2._md5cycle(this._state, i), e ? this._state : U2._hex(
            this._state
          )
        }
      }
      a(U, 'Md5'), E(U, 'stateIdentity', new Int32Array([1732584193, -271733879, -1732584194, 271733878])), E(U, 'buffer32Identity', new Int32Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])), E(U, 'hexChars', '0123456789abcdef'), E(U, 'hexOut', []), E(U, 'onePassHasher', new U())
      et = U
    })
    lr = {}
    ie(lr, { createHash: /* @__PURE__ */ __name(() => bu, 'createHash'), createHmac: /* @__PURE__ */ __name(() => vu, 'createHmac'), randomBytes: /* @__PURE__ */ __name(() => gu, 'randomBytes') })
    __name(gu, 'gu')
    __name(bu, 'bu')
    __name(vu, 'vu')
    fr = G(() => {
      'use strict'
      p()
      es()
      ts()
      a(gu, 'randomBytes')
      a(bu, 'createHash')
      a(vu, 'createHmac')
    })
    tt = T((Qf, hr) => {
      'use strict'
      p()
      hr.exports = {
        host: 'localhost',
        user: m.platform === 'win32' ? m.env.USERNAME : m.env.USER,
        database: void 0,
        password: null,
        connectionString: void 0,
        port: 5432,
        rows: 0,
        binary: false,
        max: 10,
        idleTimeoutMillis: 3e4,
        client_encoding: '',
        ssl: false,
        application_name: void 0,
        fallback_application_name: void 0,
        options: void 0,
        parseInputDatesAsUTC: false,
        statement_timeout: false,
        lock_timeout: false,
        idle_in_transaction_session_timeout: false,
        query_timeout: false,
        connect_timeout: 0,
        keepalives: 1,
        keepalives_idle: 0
      }
      const Me = Je(), xu = Me.getTypeParser(20, 'text'), Su = Me.getTypeParser(
        1016,
        'text'
      )
      hr.exports.__defineSetter__('parseInt8', function(r) {
        Me.setTypeParser(20, 'text', r ? Me.getTypeParser(
          23,
          'text'
        ) : xu), Me.setTypeParser(1016, 'text', r ? Me.getTypeParser(1007, 'text') : Su)
      })
    })
    rt = T((Wf, ns) => {
      'use strict'
      p()
      const Eu = (fr(), O(lr)), Au = tt()
      function Cu(r) {
        const e = r.replace(
          /\\/g,
          '\\\\'
        ).replace(/"/g, '\\"')
        return `"${e}"`
      }
      __name(Cu, 'Cu')
      a(Cu, 'escapeElement')
      function rs(r) {
        for (var e = '{', t = 0; t < r.length; t++) t > 0 && (e = `${e},`), r[t] === null || typeof r[t] > 'u' ? e = `${e}NULL` : Array.isArray(r[t]) ? e = e + rs(r[t]) : r[t] instanceof d ? e += `\\\\x${r[t].toString('hex')}` : e += Cu(Ct(r[t]))
        return e = `${e}}`, e
      }
      __name(rs, 'rs')
      a(rs, 'arrayString')
      var Ct = a(function(r, e) {
        if (r == null) return null
        if (r instanceof d) return r
        if (ArrayBuffer.isView(r)) {
          const t = d.from(r.buffer, r.byteOffset, r.byteLength)
          return t.length === r.byteLength ? t : t.slice(r.byteOffset, r.byteOffset + r.byteLength)
        }
        return r instanceof Date ? Au.parseInputDatesAsUTC ? Tu(r) : Iu(r) : Array.isArray(r) ? rs(r) : typeof r == 'object' ? _u(r, e) : r.toString()
      }, 'prepareValue')
      function _u(r, e) {
        if (r && typeof r.toPostgres == 'function') {
          if (e = e || [], e.indexOf(r) !== -1) throw new Error(`circular reference detected while preparing "${r}" for query`)
          return e.push(r), Ct(r.toPostgres(Ct), e)
        }
        return JSON.stringify(r)
      }
      __name(_u, '_u')
      a(_u, 'prepareObject')
      function N(r, e) {
        for (r = `${r}`; r.length < e; ) r = `0${r}`
        return r
      }
      __name(N, 'N')
      a(N, 'pad')
      function Iu(r) {
        let e = -r.getTimezoneOffset(), t = r.getFullYear(), n = t < 1
        n && (t = Math.abs(t) + 1)
        let i = `${N(t, 4)}-${N(r.getMonth() + 1, 2)}-${N(r.getDate(), 2)}T${N(
          r.getHours(),
          2
        )}:${N(r.getMinutes(), 2)}:${N(r.getSeconds(), 2)}.${N(r.getMilliseconds(), 3)}`
        return e < 0 ? (i += '-', e *= -1) : i += '+', i += `${N(Math.floor(e / 60), 2)}:${N(e % 60, 2)}`, n && (i += ' BC'), i
      }
      __name(Iu, 'Iu')
      a(Iu, 'dateToString')
      function Tu(r) {
        let e = r.getUTCFullYear(), t = e < 1
        t && (e = Math.abs(e) + 1)
        let n = `${N(e, 4)}-${N(r.getUTCMonth() + 1, 2)}-${N(r.getUTCDate(), 2)}T${N(r.getUTCHours(), 2)}:${N(r.getUTCMinutes(), 2)}:${N(r.getUTCSeconds(), 2)}.${N(
          r.getUTCMilliseconds(),
          3
        )}`
        return n += '+00:00', t && (n += ' BC'), n
      }
      __name(Tu, 'Tu')
      a(Tu, 'dateToStringUTC')
      function Pu(r, e, t) {
        return r = typeof r == 'string' ? { text: r } : r, e && (typeof e == 'function' ? r.callback = e : r.values = e), t && (r.callback = t), r
      }
      __name(Pu, 'Pu')
      a(Pu, 'normalizeQueryConfig')
      const pr = a(function(r) {
          return Eu.createHash('md5').update(r, 'utf-8').digest('hex')
        }, 'md5'), Bu = a(
          function(r, e, t) {
            const n = pr(e + r), i = pr(d.concat([d.from(n), t]))
            return `md5${i}`
          },
          'postgresMd5PasswordHash'
        )
      ns.exports = {
        prepareValue: a(function(e) {
          return Ct(e)
        }, 'prepareValueWrapper'),
        normalizeQueryConfig: Pu,
        postgresMd5PasswordHash: Bu,
        md5: pr
      }
    })
    nt = {}
    ie(nt, { default: /* @__PURE__ */ __name(() => ku, 'default') })
    it = G(() => {
      'use strict'
      p()
      ku = {}
    })
    ds = T((th, ps) => {
      'use strict'
      p()
      const yr = (fr(), O(lr))
      function Mu(r) {
        if (r.indexOf('SCRAM-SHA-256') === -1) throw new Error('SASL: Only mechanism SCRAM-SHA-256 is currently supported')
        const e = yr.randomBytes(
          18
        ).toString('base64')
        return { mechanism: 'SCRAM-SHA-256', clientNonce: e, response: `n,,n=*,r=${e}`, message: 'SASLInitialResponse' }
      }
      __name(Mu, 'Mu')
      a(Mu, 'startSession')
      function Uu(r, e, t) {
        if (r.message !== 'SASLInitialResponse') throw new Error(
          'SASL: Last message was not SASLInitialResponse'
        )
        if (typeof e != 'string') throw new Error('SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string')
        if (typeof t != 'string') throw new Error('SASL: SCRAM-SERVER-FIRST-MESSAGE: serverData must be a string')
        const n = qu(t)
        if (n.nonce.startsWith(r.clientNonce)) {
          if (n.nonce.length === r.clientNonce.length) throw new Error('SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce is too short')
        } else throw new Error('SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce does not start with client nonce')
        const i = d.from(n.salt, 'base64'), s = Wu(e, i, n.iteration), o = Ue(s, 'Client Key'), u = Nu(
            o
          ), c = `n=*,r=${r.clientNonce}`, l = `r=${n.nonce},s=${n.salt},i=${n.iteration}`, f = `c=biws,r=${n.nonce}`, y = `${c},${l},${f}`, g = Ue(u, y), A = hs(o, g), C = A.toString('base64'), D = Ue(s, 'Server Key'), Y = Ue(D, y)
        r.message = 'SASLResponse', r.serverSignature = Y.toString('base64'), r.response = `${f},p=${C}`
      }
      __name(Uu, 'Uu')
      a(Uu, 'continueSession')
      function Du(r, e) {
        if (r.message !== 'SASLResponse') throw new Error('SASL: Last message was not SASLResponse')
        if (typeof e != 'string') throw new Error('SASL: SCRAM-SERVER-FINAL-MESSAGE: serverData must be a string')
        const { serverSignature: t } = Qu(
          e
        )
        if (t !== r.serverSignature) throw new Error('SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature does not match')
      }
      __name(Du, 'Du')
      a(Du, 'finalizeSession')
      function Ou(r) {
        if (typeof r != 'string') throw new TypeError('SASL: text must be a string')
        return r.split('').map((e, t) => r.charCodeAt(t)).every((e) => e >= 33 && e <= 43 || e >= 45 && e <= 126)
      }
      __name(Ou, 'Ou')
      a(Ou, 'isPrintableChars')
      function ls(r) {
        return /^(?:[a-zA-Z0-9+/]{4})*(?:[a-zA-Z0-9+/]{2}==|[a-zA-Z0-9+/]{3}=)?$/.test(r)
      }
      __name(ls, 'ls')
      a(ls, 'isBase64')
      function fs(r) {
        if (typeof r != 'string') throw new TypeError('SASL: attribute pairs text must be a string')
        return new Map(r.split(',').map((e) => {
          if (!/^.=/.test(e)) throw new Error('SASL: Invalid attribute pair entry')
          const t = e[0], n = e.substring(2)
          return [t, n]
        }))
      }
      __name(fs, 'fs')
      a(fs, 'parseAttributePairs')
      function qu(r) {
        const e = fs(r), t = e.get('r')
        if (t) {
          if (!Ou(t)) throw new Error('SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce must only contain printable characters')
        } else throw new Error('SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce missing')
        const n = e.get('s')
        if (n) {
          if (!ls(n)) throw new Error('SASL: SCRAM-SERVER-FIRST-MESSAGE: salt must be base64')
        } else throw new Error('SASL: SCRAM-SERVER-FIRST-MESSAGE: salt missing')
        const i = e.get('i')
        if (i) {
          if (!/^[1-9][0-9]*$/.test(i)) throw new Error('SASL: SCRAM-SERVER-FIRST-MESSAGE: invalid iteration count')
        } else throw new Error('SASL: SCRAM-SERVER-FIRST-MESSAGE: iteration missing')
        const s = parseInt(i, 10)
        return { nonce: t, salt: n, iteration: s }
      }
      __name(qu, 'qu')
      a(qu, 'parseServerFirstMessage')
      function Qu(r) {
        const t = fs(r).get('v')
        if (t) {
          if (!ls(t)) throw new Error('SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature must be base64')
        } else throw new Error('SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature is missing')
        return { serverSignature: t }
      }
      __name(Qu, 'Qu')
      a(Qu, 'parseServerFinalMessage')
      function hs(r, e) {
        if (!d.isBuffer(r)) throw new TypeError('first argument must be a Buffer')
        if (!d.isBuffer(e)) throw new TypeError(
          'second argument must be a Buffer'
        )
        if (r.length !== e.length) throw new Error('Buffer lengths must match')
        if (r.length === 0) throw new Error('Buffers cannot be empty')
        return d.from(r.map((t, n) => r[n] ^ e[n]))
      }
      __name(hs, 'hs')
      a(hs, 'xorBuffers')
      function Nu(r) {
        return yr.createHash('sha256').update(r).digest()
      }
      __name(Nu, 'Nu')
      a(Nu, 'sha256')
      function Ue(r, e) {
        return yr.createHmac('sha256', r).update(e).digest()
      }
      __name(Ue, 'Ue')
      a(Ue, 'hmacSha256')
      function Wu(r, e, t) {
        for (var n = Ue(
            r,
            d.concat([e, d.from([0, 0, 0, 1])])
          ), i = n, s = 0; s < t - 1; s++) n = Ue(r, n), i = hs(i, n)
        return i
      }
      __name(Wu, 'Wu')
      a(Wu, 'Hi')
      ps.exports = { startSession: Mu, continueSession: Uu, finalizeSession: Du }
    })
    mr = {}
    ie(mr, { join: /* @__PURE__ */ __name(() => ju, 'join') })
    __name(ju, 'ju')
    wr = G(() => {
      'use strict'
      p()
      a(
        ju,
        'join'
      )
    })
    gr = {}
    ie(gr, { stat: /* @__PURE__ */ __name(() => Hu, 'stat') })
    __name(Hu, 'Hu')
    br = G(() => {
      'use strict'
      p()
      a(Hu, 'stat')
    })
    vr = {}
    ie(vr, { default: /* @__PURE__ */ __name(() => $u, 'default') })
    xr = G(() => {
      'use strict'
      p()
      $u = {}
    })
    ys = {}
    ie(ys, { StringDecoder: /* @__PURE__ */ __name(() => Sr, 'StringDecoder') })
    ms = G(() => {
      'use strict'
      p()
      Er = class Er {
        static {
          __name(this, 'Er')
        }
        constructor(e) {
          E(this, 'td')
          this.td = new TextDecoder(e)
        }
        write(e) {
          return this.td.decode(e, { stream: true })
        }
        end(e) {
          return this.td.decode(e)
        }
      }
      a(Er, 'StringDecoder')
      Sr = Er
    })
    vs = T((fh, bs) => {
      'use strict'
      p()
      const { Transform: Gu } = (xr(), O(vr)), { StringDecoder: Vu } = (ms(), O(ys)), ve = Symbol(
          'last'
        ), It = Symbol('decoder')
      function zu(r, e, t) {
        let n
        if (this.overflow) {
          if (n = this[It].write(r).split(
            this.matcher
          ), n.length === 1) return t()
          n.shift(), this.overflow = false
        } else this[ve] += this[It].write(r), n = this[ve].split(this.matcher)
        this[ve] = n.pop()
        for (let i = 0; i < n.length; i++) try {
          gs(this, this.mapper(n[i]))
        } catch (s) {
          return t(s)
        }
        if (this.overflow = this[ve].length > this.maxLength, this.overflow && !this.skipOverflow) {
          t(new Error(
            'maximum buffer reached'
          ))
          return
        }
        t()
      }
      __name(zu, 'zu')
      a(zu, 'transform')
      function Ku(r) {
        if (this[ve] += this[It].end(), this[ve])
          try {
            gs(this, this.mapper(this[ve]))
          } catch (e) {
            return r(e)
          }
        r()
      }
      __name(Ku, 'Ku')
      a(Ku, 'flush')
      function gs(r, e) {
        e !== void 0 && r.push(e)
      }
      __name(gs, 'gs')
      a(gs, 'push')
      function ws(r) {
        return r
      }
      __name(ws, 'ws')
      a(ws, 'noop')
      function Yu(r, e, t) {
        switch (r = r || /\r?\n/, e = e || ws, t = t || {}, arguments.length) {
          case 1:
            typeof r == 'function' ? (e = r, r = /\r?\n/) : typeof r == 'object' && !(r instanceof RegExp) && !r[Symbol.split] && (t = r, r = /\r?\n/)
            break
          case 2:
            typeof r == 'function' ? (t = e, e = r, r = /\r?\n/) : typeof e == 'object' && (t = e, e = ws)
        }
        t = Object.assign({}, t), t.autoDestroy = true, t.transform = zu, t.flush = Ku, t.readableObjectMode = true
        const n = new Gu(t)
        return n[ve] = '', n[It] = new Vu('utf8'), n.matcher = r, n.mapper = e, n.maxLength = t.maxLength, n.skipOverflow = t.skipOverflow || false, n.overflow = false, n._destroy = function(i, s) {
          this._writableState.errorEmitted = false, s(i)
        }, n
      }
      __name(Yu, 'Yu')
      a(Yu, 'split')
      bs.exports = Yu
    })
    Es = T((dh, pe) => {
      'use strict'
      p()
      let xs = (wr(), O(mr)), Zu = (xr(), O(vr)).Stream, Ju = vs(), Ss = (it(), O(nt)), Xu = 5432, Tt = m.platform === 'win32', st = m.stderr, ec = 56, tc = 7, rc = 61440, nc = 32768
      function ic(r) {
        return (r & rc) == nc
      }
      __name(ic, 'ic')
      a(ic, 'isRegFile')
      const De = ['host', 'port', 'database', 'user', 'password'], Ar = De.length, sc = De[Ar - 1]
      function Cr() {
        const r = st instanceof Zu && st.writable === true
        if (r) {
          const e = Array.prototype.slice.call(arguments).concat(`
`)
          st.write(Ss.format.apply(Ss, e))
        }
      }
      __name(Cr, 'Cr')
      a(Cr, 'warn')
      Object.defineProperty(pe.exports, 'isWin', { get: a(function() {
        return Tt
      }, 'get'), set: a(function(r) {
        Tt = r
      }, 'set') })
      pe.exports.warnTo = function(r) {
        const e = st
        return st = r, e
      }
      pe.exports.getFileName = function(r) {
        const e = r || m.env, t = e.PGPASSFILE || (Tt ? xs.join(e.APPDATA || './', 'postgresql', 'pgpass.conf') : xs.join(e.HOME || './', '.pgpass'))
        return t
      }
      pe.exports.usePgPass = function(r, e) {
        return Object.prototype.hasOwnProperty.call(m.env, 'PGPASSWORD') ? false : Tt ? true : (e = e || '<unkn>', ic(r.mode) ? r.mode & (ec | tc) ? (Cr('WARNING: password file "%s" has group or world access; permissions should be u=rw (0600) or less', e), false) : true : (Cr('WARNING: password file "%s" is not a plain file', e), false))
      }
      const oc = pe.exports.match = function(r, e) {
        return De.slice(0, -1).reduce(function(t, n, i) {
          return i == 1 && Number(r[n] || Xu) === Number(
            e[n]
          ) ? t && true : t && (e[n] === '*' || e[n] === r[n])
        }, true)
      }
      pe.exports.getPassword = function(r, e, t) {
        let n, i = e.pipe(
          Ju()
        )
        function s(c) {
          const l = ac(c)
          l && uc(l) && oc(r, l) && (n = l[sc], i.end())
        }
        __name(s, 's')
        a(s, 'onLine')
        const o = a(function() {
            e.destroy(), t(n)
          }, 'onEnd'), u = a(function(c) {
            e.destroy(), Cr('WARNING: error on reading file: %s', c), t(
              void 0
            )
          }, 'onErr')
        e.on('error', u), i.on('data', s).on('end', o).on('error', u)
      }
      var ac = pe.exports.parseLine = function(r) {
          if (r.length < 11 || r.match(/^\s+#/)) return null
          for (var e = '', t = '', n = 0, i = 0, s = 0, o = {}, u = false, c = a(
              function(f, y, g) {
                let A = r.substring(y, g)
                Object.hasOwnProperty.call(m.env, 'PGPASS_NO_DEESCAPE') || (A = A.replace(/\\([:\\])/g, '$1')), o[De[f]] = A
              },
              'addToObj'
            ), l = 0; l < r.length - 1; l += 1) {
            if (e = r.charAt(l + 1), t = r.charAt(
              l
            ), u = n == Ar - 1, u) {
              c(n, i)
              break
            }
            l >= 0 && e == ':' && t !== '\\' && (c(n, i, l + 1), i = l + 2, n += 1)
          }
          return o = Object.keys(o).length === Ar ? o : null, o
        }, uc = pe.exports.isValidEntry = function(r) {
          for (let e = { 0: function(o) {
              return o.length > 0
            }, 1: function(o) {
              return o === '*' ? true : (o = Number(o), isFinite(o) && o > 0 && o < 9007199254740992 && Math.floor(o) === o)
            }, 2: function(o) {
              return o.length > 0
            }, 3: function(o) {
              return o.length > 0
            }, 4: function(o) {
              return o.length > 0
            } }, t = 0; t < De.length; t += 1) {
            const n = e[t], i = r[De[t]] || '', s = n(i)
            if (!s) return false
          }
          return true
        }
    })
    Cs = T((gh, _r) => {
      'use strict'
      p()
      const wh = (wr(), O(mr)), As = (br(), O(gr)), Pt = Es()
      _r.exports = function(r, e) {
        const t = Pt.getFileName()
        As.stat(t, function(n, i) {
          if (n || !Pt.usePgPass(i, t)) return e(void 0)
          const s = As.createReadStream(
            t
          )
          Pt.getPassword(r, s, e)
        })
      }
      _r.exports.warnTo = Pt.warnTo
    })
    _s = {}
    ie(_s, { default: /* @__PURE__ */ __name(() => cc, 'default') })
    Is = G(() => {
      'use strict'
      p()
      cc = {}
    })
    Ps = T((xh, Ts) => {
      'use strict'
      p()
      const lc = (Zt(), O(gi)), Ir = (br(), O(gr))
      function Tr(r) {
        if (r.charAt(0) === '/') {
          var t = r.split(' ')
          return { host: t[0], database: t[1] }
        }
        var e = lc.parse(/ |%[^a-f0-9]|%[a-f0-9][^a-f0-9]/i.test(r) ? encodeURI(r).replace(/\%25(\d\d)/g, '%$1') : r, true), t = e.query
        for (const n in t) Array.isArray(t[n]) && (t[n] = t[n][t[n].length - 1])
        const i = (e.auth || ':').split(':')
        if (t.user = i[0], t.password = i.splice(1).join(
          ':'
        ), t.port = e.port, e.protocol == 'socket:') return t.host = decodeURI(e.pathname), t.database = e.query.db, t.client_encoding = e.query.encoding, t
        t.host || (t.host = e.hostname)
        let s = e.pathname
        if (!t.host && s && /^%2f/i.test(s)) {
          const o = s.split('/')
          t.host = decodeURIComponent(o[0]), s = o.splice(1).join('/')
        }
        switch (s && s.charAt(
          0
        ) === '/' && (s = s.slice(1) || null), t.database = s && decodeURI(s), (t.ssl === 'true' || t.ssl === '1') && (t.ssl = true), t.ssl === '0' && (t.ssl = false), (t.sslcert || t.sslkey || t.sslrootcert || t.sslmode) && (t.ssl = {}), t.sslcert && (t.ssl.cert = Ir.readFileSync(t.sslcert).toString()), t.sslkey && (t.ssl.key = Ir.readFileSync(t.sslkey).toString()), t.sslrootcert && (t.ssl.ca = Ir.readFileSync(t.sslrootcert).toString()), t.sslmode) {
          case 'disable': {
            t.ssl = false
            break
          }
          case 'prefer':
          case 'require':
          case 'verify-ca':
          case 'verify-full':
            break
          case 'no-verify': {
            t.ssl.rejectUnauthorized = false
            break
          }
        }
        return t
      }
      __name(Tr, 'Tr')
      a(Tr, 'parse')
      Ts.exports = Tr
      Tr.parse = Tr
    })
    Bt = T((Ah, Ls) => {
      'use strict'
      p()
      const fc = (Is(), O(_s)), Rs = tt(), Bs = Ps().parse, H = a(function(r, e, t) {
          return t === void 0 ? t = m.env[`PG${r.toUpperCase()}`] : t === false || (t = m.env[t]), e[r] || t || Rs[r]
        }, 'val'), hc = a(function() {
          switch (m.env.PGSSLMODE) {
            case 'disable':
              return false
            case 'prefer':
            case 'require':
            case 'verify-ca':
            case 'verify-full':
              return true
            case 'no-verify':
              return { rejectUnauthorized: false }
          }
          return Rs.ssl
        }, 'readSSLConfigFromEnvironment'), Oe = a(function(r) {
          return `'${(`${r}`).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
        }, 'quoteParamValue'), ne = a(function(r, e, t) {
          const n = e[t]
          n != null && r.push(`${t}=${Oe(n)}`)
        }, 'add'), Br = class Br {
          static {
            __name(this, 'Br')
          }
          constructor(e) {
            e = typeof e == 'string' ? Bs(e) : e || {}, e.connectionString && (e = Object.assign({}, e, Bs(e.connectionString))), this.user = H('user', e), this.database = H('database', e), this.database === void 0 && (this.database = this.user), this.port = parseInt(H('port', e), 10), this.host = H('host', e), Object.defineProperty(this, 'password', {
              configurable: true,
              enumerable: false,
              writable: true,
              value: H('password', e)
            }), this.binary = H('binary', e), this.options = H('options', e), this.ssl = typeof e.ssl > 'u' ? hc() : e.ssl, typeof this.ssl == 'string' && this.ssl === 'true' && (this.ssl = true), this.ssl === 'no-verify' && (this.ssl = { rejectUnauthorized: false }), this.ssl && this.ssl.key && Object.defineProperty(this.ssl, 'key', { enumerable: false }), this.client_encoding = H('client_encoding', e), this.replication = H('replication', e), this.isDomainSocket = !(this.host || '').indexOf('/'), this.application_name = H('application_name', e, 'PGAPPNAME'), this.fallback_application_name = H('fallback_application_name', e, false), this.statement_timeout = H('statement_timeout', e, false), this.lock_timeout = H('lock_timeout', e, false), this.idle_in_transaction_session_timeout = H('idle_in_transaction_session_timeout', e, false), this.query_timeout = H('query_timeout', e, false), e.connectionTimeoutMillis === void 0 ? this.connect_timeout = m.env.PGCONNECT_TIMEOUT || 0 : this.connect_timeout = Math.floor(e.connectionTimeoutMillis / 1e3), e.keepAlive === false ? this.keepalives = 0 : e.keepAlive === true && (this.keepalives = 1), typeof e.keepAliveInitialDelayMillis == 'number' && (this.keepalives_idle = Math.floor(e.keepAliveInitialDelayMillis / 1e3))
          }
          getLibpqConnectionString(e) {
            const t = []
            ne(t, this, 'user'), ne(t, this, 'password'), ne(t, this, 'port'), ne(t, this, 'application_name'), ne(
              t,
              this,
              'fallback_application_name'
            ), ne(t, this, 'connect_timeout'), ne(t, this, 'options')
            const n = typeof this.ssl == 'object' ? this.ssl : this.ssl ? { sslmode: this.ssl } : {}
            if (ne(t, n, 'sslmode'), ne(t, n, 'sslca'), ne(t, n, 'sslkey'), ne(t, n, 'sslcert'), ne(t, n, 'sslrootcert'), this.database && t.push(`dbname=${Oe(this.database)}`), this.replication && t.push(`replication=${Oe(this.replication)}`), this.host && t.push(`host=${Oe(this.host)}`), this.isDomainSocket) return e(null, t.join(' '))
            this.client_encoding && t.push(`client_encoding=${Oe(this.client_encoding)}`), fc.lookup(this.host, function(i, s) {
              return i ? e(i, null) : (t.push(`hostaddr=${Oe(s)}`), e(null, t.join(' ')))
            })
          }
        }
      a(Br, 'ConnectionParameters')
      const Pr = Br
      Ls.exports = Pr
    })
    Ms = T((Ih, ks) => {
      'use strict'
      p()
      const pc = Je(), Fs = /^([A-Za-z]+)(?: (\d+))?(?: (\d+))?/, Lr = class Lr {
        static {
          __name(this, 'Lr')
        }
        constructor(e, t) {
          this.command = null, this.rowCount = null, this.oid = null, this.rows = [], this.fields = [], this._parsers = void 0, this._types = t, this.RowCtor = null, this.rowAsArray = e === 'array', this.rowAsArray && (this.parseRow = this._parseRowAsArray)
        }
        addCommandComplete(e) {
          let t
          e.text ? t = Fs.exec(e.text) : t = Fs.exec(e.command), t && (this.command = t[1], t[3] ? (this.oid = parseInt(
            t[2],
            10
          ), this.rowCount = parseInt(t[3], 10)) : t[2] && (this.rowCount = parseInt(t[2], 10)))
        }
        _parseRowAsArray(e) {
          for (var t = new Array(
              e.length
            ), n = 0, i = e.length; n < i; n++) {
            const s = e[n]
            s !== null ? t[n] = this._parsers[n](s) : t[n] = null
          }
          return t
        }
        parseRow(e) {
          for (var t = {}, n = 0, i = e.length; n < i; n++) {
            const s = e[n], o = this.fields[n].name
            s !== null ? t[o] = this._parsers[n](
              s
            ) : t[o] = null
          }
          return t
        }
        addRow(e) {
          this.rows.push(e)
        }
        addFields(e) {
          this.fields = e, this.fields.length && (this._parsers = new Array(e.length))
          for (let t = 0; t < e.length; t++) {
            const n = e[t]
            this._types ? this._parsers[t] = this._types.getTypeParser(n.dataTypeID, n.format || 'text') : this._parsers[t] = pc.getTypeParser(n.dataTypeID, n.format || 'text')
          }
        }
      }
      a(Lr, 'Result')
      const Rr = Lr
      ks.exports = Rr
    })
    qs = T((Bh, Os) => {
      'use strict'
      p()
      const { EventEmitter: dc } = ge(), Us = Ms(), Ds = rt(), kr = class kr extends dc {
        static {
          __name(this, 'kr')
        }
        constructor(e, t, n) {
          super(), e = Ds.normalizeQueryConfig(e, t, n), this.text = e.text, this.values = e.values, this.rows = e.rows, this.types = e.types, this.name = e.name, this.binary = e.binary, this.portal = e.portal || '', this.callback = e.callback, this._rowMode = e.rowMode, m.domain && e.callback && (this.callback = m.domain.bind(e.callback)), this._result = new Us(this._rowMode, this.types), this._results = this._result, this.isPreparedStatement = false, this._canceledDueToError = false, this._promise = null
        }
        requiresPreparation() {
          return this.name || this.rows ? true : !this.text || !this.values ? false : this.values.length > 0
        }
        _checkForMultirow() {
          this._result.command && (Array.isArray(this._results) || (this._results = [this._result]), this._result = new Us(this._rowMode, this.types), this._results.push(this._result))
        }
        handleRowDescription(e) {
          this._checkForMultirow(), this._result.addFields(e.fields), this._accumulateRows = this.callback || !this.listeners('row').length
        }
        handleDataRow(e) {
          let t
          if (!this._canceledDueToError) {
            try {
              t = this._result.parseRow(
                e.fields
              )
            } catch (n) {
              this._canceledDueToError = n
              return
            }
            this.emit('row', t, this._result), this._accumulateRows && this._result.addRow(t)
          }
        }
        handleCommandComplete(e, t) {
          this._checkForMultirow(), this._result.addCommandComplete(
            e
          ), this.rows && t.sync()
        }
        handleEmptyQuery(e) {
          this.rows && e.sync()
        }
        handleError(e, t) {
          if (this._canceledDueToError && (e = this._canceledDueToError, this._canceledDueToError = false), this.callback) return this.callback(e)
          this.emit('error', e)
        }
        handleReadyForQuery(e) {
          if (this._canceledDueToError) return this.handleError(
            this._canceledDueToError,
            e
          )
          if (this.callback) try {
            this.callback(null, this._results)
          } catch (t) {
            m.nextTick(() => {
              throw t
            })
          }
          this.emit(
            'end',
            this._results
          )
        }
        submit(e) {
          if (typeof this.text != 'string' && typeof this.name != 'string') return new Error(
            'A query must have either text or a name. Supplying neither is unsupported.'
          )
          const t = e.parsedStatements[this.name]
          return this.text && t && this.text !== t ? new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`) : this.values && !Array.isArray(this.values) ? new Error('Query values must be an array') : (this.requiresPreparation() ? this.prepare(e) : e.query(this.text), null)
        }
        hasBeenParsed(e) {
          return this.name && e.parsedStatements[this.name]
        }
        handlePortalSuspended(e) {
          this._getRows(e, this.rows)
        }
        _getRows(e, t) {
          e.execute({ portal: this.portal, rows: t }), t ? e.flush() : e.sync()
        }
        prepare(e) {
          this.isPreparedStatement = true, this.hasBeenParsed(e) || e.parse({ text: this.text, name: this.name, types: this.types })
          try {
            e.bind({ portal: this.portal, statement: this.name, values: this.values, binary: this.binary, valueMapper: Ds.prepareValue })
          } catch (t) {
            this.handleError(t, e)
            return
          }
          e.describe({ type: 'P', name: this.portal || '' }), this._getRows(e, this.rows)
        }
        handleCopyInResponse(e) {
          e.sendCopyFail('No source stream defined')
        }
        handleCopyData(e, t) {
        }
      }
      a(kr, 'Query')
      const Fr = kr
      Os.exports = Fr
    })
    ln = T((_) => {
      'use strict'
      p()
      Object.defineProperty(_, '__esModule', { value: true })
      _.NoticeMessage = _.DataRowMessage = _.CommandCompleteMessage = _.ReadyForQueryMessage = _.NotificationResponseMessage = _.BackendKeyDataMessage = _.AuthenticationMD5Password = _.ParameterStatusMessage = _.ParameterDescriptionMessage = _.RowDescriptionMessage = _.Field = _.CopyResponse = _.CopyDataMessage = _.DatabaseError = _.copyDone = _.emptyQuery = _.replicationStart = _.portalSuspended = _.noData = _.closeComplete = _.bindComplete = _.parseComplete = void 0
      _.parseComplete = { name: 'parseComplete', length: 5 }
      _.bindComplete = { name: 'bindComplete', length: 5 }
      _.closeComplete = { name: 'closeComplete', length: 5 }
      _.noData = { name: 'noData', length: 5 }
      _.portalSuspended = { name: 'portalSuspended', length: 5 }
      _.replicationStart = { name: 'replicationStart', length: 4 }
      _.emptyQuery = { name: 'emptyQuery', length: 4 }
      _.copyDone = { name: 'copyDone', length: 4 }
      const Kr = class Kr extends Error {
        static {
          __name(this, 'Kr')
        }
        constructor(e, t, n) {
          super(e), this.length = t, this.name = n
        }
      }
      a(Kr, 'DatabaseError')
      const Mr = Kr
      _.DatabaseError = Mr
      const Yr = class Yr {
        static {
          __name(this, 'Yr')
        }
        constructor(e, t) {
          this.length = e, this.chunk = t, this.name = 'copyData'
        }
      }
      a(Yr, 'CopyDataMessage')
      const Ur = Yr
      _.CopyDataMessage = Ur
      const Zr = class Zr {
        static {
          __name(this, 'Zr')
        }
        constructor(e, t, n, i) {
          this.length = e, this.name = t, this.binary = n, this.columnTypes = new Array(i)
        }
      }
      a(Zr, 'CopyResponse')
      const Dr = Zr
      _.CopyResponse = Dr
      const Jr = class Jr {
        static {
          __name(this, 'Jr')
        }
        constructor(e, t, n, i, s, o, u) {
          this.name = e, this.tableID = t, this.columnID = n, this.dataTypeID = i, this.dataTypeSize = s, this.dataTypeModifier = o, this.format = u
        }
      }
      a(Jr, 'Field')
      const Or = Jr
      _.Field = Or
      const Xr = class Xr {
        static {
          __name(this, 'Xr')
        }
        constructor(e, t) {
          this.length = e, this.fieldCount = t, this.name = 'rowDescription', this.fields = new Array(this.fieldCount)
        }
      }
      a(Xr, 'RowDescriptionMessage')
      const qr = Xr
      _.RowDescriptionMessage = qr
      const en = class en {
        static {
          __name(this, 'en')
        }
        constructor(e, t) {
          this.length = e, this.parameterCount = t, this.name = 'parameterDescription', this.dataTypeIDs = new Array(this.parameterCount)
        }
      }
      a(en, 'ParameterDescriptionMessage')
      const Qr = en
      _.ParameterDescriptionMessage = Qr
      const tn = class tn {
        static {
          __name(this, 'tn')
        }
        constructor(e, t, n) {
          this.length = e, this.parameterName = t, this.parameterValue = n, this.name = 'parameterStatus'
        }
      }
      a(tn, 'ParameterStatusMessage')
      const Nr = tn
      _.ParameterStatusMessage = Nr
      const rn = class rn {
        static {
          __name(this, 'rn')
        }
        constructor(e, t) {
          this.length = e, this.salt = t, this.name = 'authenticationMD5Password'
        }
      }
      a(rn, 'AuthenticationMD5Password')
      const Wr = rn
      _.AuthenticationMD5Password = Wr
      const nn = class nn {
        static {
          __name(this, 'nn')
        }
        constructor(e, t, n) {
          this.length = e, this.processID = t, this.secretKey = n, this.name = 'backendKeyData'
        }
      }
      a(nn, 'BackendKeyDataMessage')
      const jr = nn
      _.BackendKeyDataMessage = jr
      const sn = class sn {
        static {
          __name(this, 'sn')
        }
        constructor(e, t, n, i) {
          this.length = e, this.processId = t, this.channel = n, this.payload = i, this.name = 'notification'
        }
      }
      a(sn, 'NotificationResponseMessage')
      const Hr = sn
      _.NotificationResponseMessage = Hr
      const on = class on {
        static {
          __name(this, 'on')
        }
        constructor(e, t) {
          this.length = e, this.status = t, this.name = 'readyForQuery'
        }
      }
      a(on, 'ReadyForQueryMessage')
      const $r = on
      _.ReadyForQueryMessage = $r
      const an = class an {
        static {
          __name(this, 'an')
        }
        constructor(e, t) {
          this.length = e, this.text = t, this.name = 'commandComplete'
        }
      }
      a(an, 'CommandCompleteMessage')
      const Gr = an
      _.CommandCompleteMessage = Gr
      const un = class un {
        static {
          __name(this, 'un')
        }
        constructor(e, t) {
          this.length = e, this.fields = t, this.name = 'dataRow', this.fieldCount = t.length
        }
      }
      a(un, 'DataRowMessage')
      const Vr = un
      _.DataRowMessage = Vr
      const cn = class cn {
        static {
          __name(this, 'cn')
        }
        constructor(e, t) {
          this.length = e, this.message = t, this.name = 'notice'
        }
      }
      a(cn, 'NoticeMessage')
      const zr = cn
      _.NoticeMessage = zr
    })
    Qs = T((Rt) => {
      'use strict'
      p()
      Object.defineProperty(Rt, '__esModule', { value: true })
      Rt.Writer = void 0
      const hn = class hn {
        static {
          __name(this, 'hn')
        }
        constructor(e = 256) {
          this.size = e, this.offset = 5, this.headerPosition = 0, this.buffer = d.allocUnsafe(e)
        }
        ensure(e) {
          if (this.buffer.length - this.offset < e) {
            const n = this.buffer, i = n.length + (n.length >> 1) + e
            this.buffer = d.allocUnsafe(i), n.copy(
              this.buffer
            )
          }
        }
        addInt32(e) {
          return this.ensure(4), this.buffer[this.offset++] = e >>> 24 & 255, this.buffer[this.offset++] = e >>> 16 & 255, this.buffer[this.offset++] = e >>> 8 & 255, this.buffer[this.offset++] = e >>> 0 & 255, this
        }
        addInt16(e) {
          return this.ensure(2), this.buffer[this.offset++] = e >>> 8 & 255, this.buffer[this.offset++] = e >>> 0 & 255, this
        }
        addCString(e) {
          if (!e) this.ensure(1)
          else {
            const t = d.byteLength(e)
            this.ensure(t + 1), this.buffer.write(e, this.offset, 'utf-8'), this.offset += t
          }
          return this.buffer[this.offset++] = 0, this
        }
        addString(e = '') {
          const t = d.byteLength(e)
          return this.ensure(t), this.buffer.write(e, this.offset), this.offset += t, this
        }
        add(e) {
          return this.ensure(
            e.length
          ), e.copy(this.buffer, this.offset), this.offset += e.length, this
        }
        join(e) {
          if (e) {
            this.buffer[this.headerPosition] = e
            const t = this.offset - (this.headerPosition + 1)
            this.buffer.writeInt32BE(t, this.headerPosition + 1)
          }
          return this.buffer.slice(e ? 0 : 5, this.offset)
        }
        flush(e) {
          const t = this.join(e)
          return this.offset = 5, this.headerPosition = 0, this.buffer = d.allocUnsafe(this.size), t
        }
      }
      a(hn, 'Writer')
      const fn = hn
      Rt.Writer = fn
    })
    Ws = T((Ft) => {
      'use strict'
      p()
      Object.defineProperty(Ft, '__esModule', { value: true })
      Ft.serialize = void 0
      const pn = Qs(), F = new pn.Writer(), yc = a((r) => {
          F.addInt16(3).addInt16(0)
          for (const n of Object.keys(r)) F.addCString(
            n
          ).addCString(r[n])
          F.addCString('client_encoding').addCString('UTF8')
          const e = F.addCString('').flush(), t = e.length + 4
          return new pn.Writer().addInt32(t).add(e).flush()
        }, 'startup'), mc = a(() => {
          const r = d.allocUnsafe(
            8
          )
          return r.writeInt32BE(8, 0), r.writeInt32BE(80877103, 4), r
        }, 'requestSsl'), wc = a((r) => F.addCString(r).flush(
          112
        ), 'password'), gc = a(function(r, e) {
          return F.addCString(r).addInt32(d.byteLength(e)).addString(e), F.flush(112)
        }, 'sendSASLInitialResponseMessage'), bc = a(function(r) {
          return F.addString(r).flush(112)
        }, 'sendSCRAMClientFinalMessage'), vc = a((r) => F.addCString(r).flush(81), 'query'), Ns = [], xc = a((r) => {
          const e = r.name || ''
          e.length > 63 && (console.error('Warning! Postgres only supports 63 characters for query names.'), console.error('You supplied %s (%s)', e, e.length), console.error('This can cause conflicts and silent errors executing queries'))
          const t = r.types || Ns, n = t.length, i = F.addCString(e).addCString(r.text).addInt16(n)
          for (let s = 0; s < n; s++) i.addInt32(t[s])
          return F.flush(80)
        }, 'parse'), qe = new pn.Writer(), Sc = a(function(r, e) {
          for (let t = 0; t < r.length; t++) {
            const n = e ? e(r[t], t) : r[t]
            n == null ? (F.addInt16(0), qe.addInt32(-1)) : n instanceof d ? (F.addInt16(
              1
            ), qe.addInt32(n.length), qe.add(n)) : (F.addInt16(0), qe.addInt32(d.byteLength(n)), qe.addString(n))
          }
        }, 'writeValues'), Ec = a((r = {}) => {
          const e = r.portal || '', t = r.statement || '', n = r.binary || false, i = r.values || Ns, s = i.length
          return F.addCString(e).addCString(t), F.addInt16(s), Sc(i, r.valueMapper), F.addInt16(s), F.add(qe.flush()), F.addInt16(n ? 1 : 0), F.flush(66)
        }, 'bind'), Ac = d.from([69, 0, 0, 0, 9, 0, 0, 0, 0, 0]), Cc = a((r) => {
          if (!r || !r.portal && !r.rows) return Ac
          const e = r.portal || '', t = r.rows || 0, n = d.byteLength(e), i = 4 + n + 1 + 4, s = d.allocUnsafe(1 + i)
          return s[0] = 69, s.writeInt32BE(i, 1), s.write(e, 5, 'utf-8'), s[n + 5] = 0, s.writeUInt32BE(t, s.length - 4), s
        }, 'execute'), _c = a(
          (r, e) => {
            const t = d.allocUnsafe(16)
            return t.writeInt32BE(16, 0), t.writeInt16BE(1234, 4), t.writeInt16BE(
              5678,
              6
            ), t.writeInt32BE(r, 8), t.writeInt32BE(e, 12), t
          },
          'cancel'
        ), dn = a((r, e) => {
          const n = 4 + d.byteLength(e) + 1, i = d.allocUnsafe(1 + n)
          return i[0] = r, i.writeInt32BE(n, 1), i.write(e, 5, 'utf-8'), i[n] = 0, i
        }, 'cstringMessage'), Ic = F.addCString('P').flush(68), Tc = F.addCString('S').flush(68), Pc = a((r) => r.name ? dn(68, `${r.type}${r.name || ''}`) : r.type === 'P' ? Ic : Tc, 'describe'), Bc = a((r) => {
          const e = `${r.type}${r.name || ''}`
          return dn(67, e)
        }, 'close'), Rc = a((r) => F.add(r).flush(100), 'copyData'), Lc = a((r) => dn(102, r), 'copyFail'), Lt = a((r) => d.from([r, 0, 0, 0, 4]), 'codeOnlyBuffer'), Fc = Lt(72), kc = Lt(83), Mc = Lt(88), Uc = Lt(99), Dc = {
          startup: yc,
          password: wc,
          requestSsl: mc,
          sendSASLInitialResponseMessage: gc,
          sendSCRAMClientFinalMessage: bc,
          query: vc,
          parse: xc,
          bind: Ec,
          execute: Cc,
          describe: Pc,
          close: Bc,
          flush: a(
            () => Fc,
            'flush'
          ),
          sync: a(() => kc, 'sync'),
          end: a(() => Mc, 'end'),
          copyData: Rc,
          copyDone: a(() => Uc, 'copyDone'),
          copyFail: Lc,
          cancel: _c
        }
      Ft.serialize = Dc
    })
    js = T((kt) => {
      'use strict'
      p()
      Object.defineProperty(kt, '__esModule', { value: true })
      kt.BufferReader = void 0
      const Oc = d.allocUnsafe(0), mn = class mn {
        static {
          __name(this, 'mn')
        }
        constructor(e = 0) {
          this.offset = e, this.buffer = Oc, this.encoding = 'utf-8'
        }
        setBuffer(e, t) {
          this.offset = e, this.buffer = t
        }
        int16() {
          const e = this.buffer.readInt16BE(this.offset)
          return this.offset += 2, e
        }
        byte() {
          const e = this.buffer[this.offset]
          return this.offset++, e
        }
        int32() {
          const e = this.buffer.readInt32BE(
            this.offset
          )
          return this.offset += 4, e
        }
        uint32() {
          const e = this.buffer.readUInt32BE(this.offset)
          return this.offset += 4, e
        }
        string(e) {
          const t = this.buffer.toString(this.encoding, this.offset, this.offset + e)
          return this.offset += e, t
        }
        cstring() {
          let e = this.offset, t = e
          while (this.buffer[t++] !== 0) ;
          return this.offset = t, this.buffer.toString(this.encoding, e, t - 1)
        }
        bytes(e) {
          const t = this.buffer.slice(this.offset, this.offset + e)
          return this.offset += e, t
        }
      }
      a(mn, 'BufferReader')
      const yn = mn
      kt.BufferReader = yn
    })
    Gs = T((Mt) => {
      'use strict'
      p()
      Object.defineProperty(Mt, '__esModule', { value: true })
      Mt.Parser = void 0
      const k = ln(), qc = js(), wn = 1, Qc = 4, Hs = wn + Qc, $s = d.allocUnsafe(0), bn = class bn {
        static {
          __name(this, 'bn')
        }
        constructor(e) {
          if (this.buffer = $s, this.bufferLength = 0, this.bufferOffset = 0, this.reader = new qc.BufferReader(), e?.mode === 'binary') throw new Error('Binary mode not supported yet')
          this.mode = e?.mode || 'text'
        }
        parse(e, t) {
          this.mergeBuffer(e)
          let n = this.bufferOffset + this.bufferLength, i = this.bufferOffset
          while (i + Hs <= n) {
            const s = this.buffer[i], o = this.buffer.readUInt32BE(
                i + wn
              ), u = wn + o
            if (u + i <= n) {
              const c = this.handlePacket(i + Hs, s, o, this.buffer)
              t(c), i += u
            } else break
          }
          i === n ? (this.buffer = $s, this.bufferLength = 0, this.bufferOffset = 0) : (this.bufferLength = n - i, this.bufferOffset = i)
        }
        mergeBuffer(e) {
          if (this.bufferLength > 0) {
            const t = this.bufferLength + e.byteLength
            if (t + this.bufferOffset > this.buffer.byteLength) {
              let i
              if (t <= this.buffer.byteLength && this.bufferOffset >= this.bufferLength) i = this.buffer
              else {
                let s = this.buffer.byteLength * 2
                while (t >= s) s *= 2
                i = d.allocUnsafe(s)
              }
              this.buffer.copy(i, 0, this.bufferOffset, this.bufferOffset + this.bufferLength), this.buffer = i, this.bufferOffset = 0
            }
            e.copy(this.buffer, this.bufferOffset + this.bufferLength), this.bufferLength = t
          } else this.buffer = e, this.bufferOffset = 0, this.bufferLength = e.byteLength
        }
        handlePacket(e, t, n, i) {
          switch (t) {
            case 50:
              return k.bindComplete
            case 49:
              return k.parseComplete
            case 51:
              return k.closeComplete
            case 110:
              return k.noData
            case 115:
              return k.portalSuspended
            case 99:
              return k.copyDone
            case 87:
              return k.replicationStart
            case 73:
              return k.emptyQuery
            case 68:
              return this.parseDataRowMessage(e, n, i)
            case 67:
              return this.parseCommandCompleteMessage(
                e,
                n,
                i
              )
            case 90:
              return this.parseReadyForQueryMessage(e, n, i)
            case 65:
              return this.parseNotificationMessage(
                e,
                n,
                i
              )
            case 82:
              return this.parseAuthenticationResponse(e, n, i)
            case 83:
              return this.parseParameterStatusMessage(
                e,
                n,
                i
              )
            case 75:
              return this.parseBackendKeyData(e, n, i)
            case 69:
              return this.parseErrorMessage(e, n, i, 'error')
            case 78:
              return this.parseErrorMessage(e, n, i, 'notice')
            case 84:
              return this.parseRowDescriptionMessage(
                e,
                n,
                i
              )
            case 116:
              return this.parseParameterDescriptionMessage(e, n, i)
            case 71:
              return this.parseCopyInMessage(
                e,
                n,
                i
              )
            case 72:
              return this.parseCopyOutMessage(e, n, i)
            case 100:
              return this.parseCopyData(e, n, i)
            default:
              return new k.DatabaseError(`received invalid response: ${t.toString(16)}`, n, 'error')
          }
        }
        parseReadyForQueryMessage(e, t, n) {
          this.reader.setBuffer(e, n)
          const i = this.reader.string(1)
          return new k.ReadyForQueryMessage(t, i)
        }
        parseCommandCompleteMessage(e, t, n) {
          this.reader.setBuffer(e, n)
          const i = this.reader.cstring()
          return new k.CommandCompleteMessage(t, i)
        }
        parseCopyData(e, t, n) {
          const i = n.slice(e, e + (t - 4))
          return new k.CopyDataMessage(t, i)
        }
        parseCopyInMessage(e, t, n) {
          return this.parseCopyMessage(
            e,
            t,
            n,
            'copyInResponse'
          )
        }
        parseCopyOutMessage(e, t, n) {
          return this.parseCopyMessage(e, t, n, 'copyOutResponse')
        }
        parseCopyMessage(e, t, n, i) {
          this.reader.setBuffer(e, n)
          const s = this.reader.byte() !== 0, o = this.reader.int16(), u = new k.CopyResponse(t, i, s, o)
          for (let c = 0; c < o; c++) u.columnTypes[c] = this.reader.int16()
          return u
        }
        parseNotificationMessage(e, t, n) {
          this.reader.setBuffer(e, n)
          const i = this.reader.int32(), s = this.reader.cstring(), o = this.reader.cstring()
          return new k.NotificationResponseMessage(t, i, s, o)
        }
        parseRowDescriptionMessage(e, t, n) {
          this.reader.setBuffer(
            e,
            n
          )
          const i = this.reader.int16(), s = new k.RowDescriptionMessage(t, i)
          for (let o = 0; o < i; o++) s.fields[o] = this.parseField()
          return s
        }
        parseField() {
          const e = this.reader.cstring(), t = this.reader.uint32(), n = this.reader.int16(), i = this.reader.uint32(), s = this.reader.int16(), o = this.reader.int32(), u = this.reader.int16() === 0 ? 'text' : 'binary'
          return new k.Field(e, t, n, i, s, o, u)
        }
        parseParameterDescriptionMessage(e, t, n) {
          this.reader.setBuffer(e, n)
          const i = this.reader.int16(), s = new k.ParameterDescriptionMessage(t, i)
          for (let o = 0; o < i; o++)
            s.dataTypeIDs[o] = this.reader.int32()
          return s
        }
        parseDataRowMessage(e, t, n) {
          this.reader.setBuffer(e, n)
          const i = this.reader.int16(), s = new Array(i)
          for (let o = 0; o < i; o++) {
            const u = this.reader.int32()
            s[o] = u === -1 ? null : this.reader.string(u)
          }
          return new k.DataRowMessage(t, s)
        }
        parseParameterStatusMessage(e, t, n) {
          this.reader.setBuffer(e, n)
          const i = this.reader.cstring(), s = this.reader.cstring()
          return new k.ParameterStatusMessage(
            t,
            i,
            s
          )
        }
        parseBackendKeyData(e, t, n) {
          this.reader.setBuffer(e, n)
          const i = this.reader.int32(), s = this.reader.int32()
          return new k.BackendKeyDataMessage(t, i, s)
        }
        parseAuthenticationResponse(e, t, n) {
          this.reader.setBuffer(
            e,
            n
          )
          const i = this.reader.int32(), s = { name: 'authenticationOk', length: t }
          switch (i) {
            case 0:
              break
            case 3:
              s.length === 8 && (s.name = 'authenticationCleartextPassword')
              break
            case 5:
              if (s.length === 12) {
                s.name = 'authenticationMD5Password'
                const o = this.reader.bytes(4)
                return new k.AuthenticationMD5Password(t, o)
              }
              break
            case 10:
              {
                s.name = 'authenticationSASL', s.mechanisms = []
                let o
                do
                  o = this.reader.cstring(), o && s.mechanisms.push(o)
                while (o)
              }
              break
            case 11:
              s.name = 'authenticationSASLContinue', s.data = this.reader.string(t - 8)
              break
            case 12:
              s.name = 'authenticationSASLFinal', s.data = this.reader.string(t - 8)
              break
            default:
              throw new Error(`Unknown authenticationOk message type ${i}`)
          }
          return s
        }
        parseErrorMessage(e, t, n, i) {
          this.reader.setBuffer(e, n)
          let s = {}, o = this.reader.string(1)
          while (o !== '\0') s[o] = this.reader.cstring(), o = this.reader.string(1)
          const u = s.M, c = i === 'notice' ? new k.NoticeMessage(t, u) : new k.DatabaseError(u, t, i)
          return c.severity = s.S, c.code = s.C, c.detail = s.D, c.hint = s.H, c.position = s.P, c.internalPosition = s.p, c.internalQuery = s.q, c.where = s.W, c.schema = s.s, c.table = s.t, c.column = s.c, c.dataType = s.d, c.constraint = s.n, c.file = s.F, c.line = s.L, c.routine = s.R, c
        }
      }
      a(bn, 'Parser')
      const gn = bn
      Mt.Parser = gn
    })
    vn = T((xe) => {
      'use strict'
      p()
      Object.defineProperty(xe, '__esModule', { value: true })
      xe.DatabaseError = xe.serialize = xe.parse = void 0
      const Nc = ln()
      Object.defineProperty(xe, 'DatabaseError', { enumerable: true, get: a(
        function() {
          return Nc.DatabaseError
        },
        'get'
      ) })
      const Wc = Ws()
      Object.defineProperty(xe, 'serialize', {
        enumerable: true,
        get: a(function() {
          return Wc.serialize
        }, 'get')
      })
      const jc = Gs()
      function Hc(r, e) {
        const t = new jc.Parser()
        return r.on('data', (n) => t.parse(n, e)), new Promise((n) => r.on('end', () => n()))
      }
      __name(Hc, 'Hc')
      a(Hc, 'parse')
      xe.parse = Hc
    })
    Vs = {}
    ie(Vs, { connect: /* @__PURE__ */ __name(() => $c, 'connect') })
    __name($c, '$c')
    zs = G(
      () => {
        'use strict'
        p()
        a($c, 'connect')
      }
    )
    En = T((Xh, Zs) => {
      'use strict'
      p()
      const Ks = (Fe(), O(wi)), Gc = ge().EventEmitter, { parse: Vc, serialize: Q } = vn(), Ys = Q.flush(), zc = Q.sync(), Kc = Q.end(), Sn = class Sn extends Gc {
        static {
          __name(this, 'Sn')
        }
        constructor(e) {
          super(), e = e || {}, this.stream = e.stream || new Ks.Socket(), this._keepAlive = e.keepAlive, this._keepAliveInitialDelayMillis = e.keepAliveInitialDelayMillis, this.lastBuffer = false, this.parsedStatements = {}, this.ssl = e.ssl || false, this._ending = false, this._emitMessage = false
          const t = this
          this.on('newListener', function(n) {
            n === 'message' && (t._emitMessage = true)
          })
        }
        connect(e, t) {
          const n = this
          this._connecting = true, this.stream.setNoDelay(true), this.stream.connect(e, t), this.stream.once('connect', function() {
            n._keepAlive && n.stream.setKeepAlive(true, n._keepAliveInitialDelayMillis), n.emit('connect')
          })
          const i = a(function(s) {
            n._ending && (s.code === 'ECONNRESET' || s.code === 'EPIPE') || n.emit('error', s)
          }, 'reportStreamError')
          if (this.stream.on('error', i), this.stream.on('close', function() {
            n.emit('end')
          }), !this.ssl) return this.attachListeners(
            this.stream
          )
          this.stream.once('data', function(s) {
            const o = s.toString('utf8')
            switch (o) {
              case 'S':
                break
              case 'N':
                return n.stream.end(), n.emit('error', new Error('The server does not support SSL connections'))
              default:
                return n.stream.end(), n.emit('error', new Error('There was an error establishing an SSL connection'))
            }
            const u = (zs(), O(Vs))
            const c = { socket: n.stream }
            n.ssl !== true && (Object.assign(c, n.ssl), 'key' in n.ssl && (c.key = n.ssl.key)), Ks.isIP(t) === 0 && (c.servername = t)
            try {
              n.stream = u.connect(c)
            } catch (l) {
              return n.emit(
                'error',
                l
              )
            }
            n.attachListeners(n.stream), n.stream.on('error', i), n.emit('sslconnect')
          })
        }
        attachListeners(e) {
          e.on(
            'end',
            () => {
              this.emit('end')
            }
          ), Vc(e, (t) => {
            const n = t.name === 'error' ? 'errorMessage' : t.name
            this._emitMessage && this.emit('message', t), this.emit(n, t)
          })
        }
        requestSsl() {
          this.stream.write(Q.requestSsl())
        }
        startup(e) {
          this.stream.write(Q.startup(e))
        }
        cancel(e, t) {
          this._send(Q.cancel(e, t))
        }
        password(e) {
          this._send(Q.password(e))
        }
        sendSASLInitialResponseMessage(e, t) {
          this._send(Q.sendSASLInitialResponseMessage(e, t))
        }
        sendSCRAMClientFinalMessage(e) {
          this._send(Q.sendSCRAMClientFinalMessage(
            e
          ))
        }
        _send(e) {
          return this.stream.writable ? this.stream.write(e) : false
        }
        query(e) {
          this._send(Q.query(e))
        }
        parse(e) {
          this._send(Q.parse(e))
        }
        bind(e) {
          this._send(Q.bind(e))
        }
        execute(e) {
          this._send(Q.execute(e))
        }
        flush() {
          this.stream.writable && this.stream.write(Ys)
        }
        sync() {
          this._ending = true, this._send(Ys), this._send(zc)
        }
        ref() {
          this.stream.ref()
        }
        unref() {
          this.stream.unref()
        }
        end() {
          if (this._ending = true, !this._connecting || !this.stream.writable) {
            this.stream.end()
            return
          }
          return this.stream.write(Kc, () => {
            this.stream.end()
          })
        }
        close(e) {
          this._send(Q.close(e))
        }
        describe(e) {
          this._send(Q.describe(e))
        }
        sendCopyFromChunk(e) {
          this._send(Q.copyData(e))
        }
        endCopyFrom() {
          this._send(Q.copyDone())
        }
        sendCopyFail(e) {
          this._send(Q.copyFail(e))
        }
      }
      a(Sn, 'Connection')
      const xn = Sn
      Zs.exports = xn
    })
    eo = T((np, Xs) => {
      'use strict'
      p()
      const Yc = ge().EventEmitter, rp = (it(), O(nt)), Zc = rt(), An = ds(), Jc = Cs(), Xc = At(), el = Bt(), Js = qs(), tl = tt(), rl = En(), Cn = class Cn extends Yc {
        static {
          __name(this, 'Cn')
        }
        constructor(e) {
          super(), this.connectionParameters = new el(e), this.user = this.connectionParameters.user, this.database = this.connectionParameters.database, this.port = this.connectionParameters.port, this.host = this.connectionParameters.host, Object.defineProperty(
            this,
            'password',
            { configurable: true, enumerable: false, writable: true, value: this.connectionParameters.password }
          ), this.replication = this.connectionParameters.replication
          const t = e || {}
          this._Promise = t.Promise || b.Promise, this._types = new Xc(t.types), this._ending = false, this._connecting = false, this._connected = false, this._connectionError = false, this._queryable = true, this.connection = t.connection || new rl({ stream: t.stream, ssl: this.connectionParameters.ssl, keepAlive: t.keepAlive || false, keepAliveInitialDelayMillis: t.keepAliveInitialDelayMillis || 0, encoding: this.connectionParameters.client_encoding || 'utf8' }), this.queryQueue = [], this.binary = t.binary || tl.binary, this.processID = null, this.secretKey = null, this.ssl = this.connectionParameters.ssl || false, this.ssl && this.ssl.key && Object.defineProperty(this.ssl, 'key', { enumerable: false }), this._connectionTimeoutMillis = t.connectionTimeoutMillis || 0
        }
        _errorAllQueries(e) {
          const t = a((n) => {
            m.nextTick(() => {
              n.handleError(e, this.connection)
            })
          }, 'enqueueError')
          this.activeQuery && (t(this.activeQuery), this.activeQuery = null), this.queryQueue.forEach(t), this.queryQueue.length = 0
        }
        _connect(e) {
          const t = this, n = this.connection
          if (this._connectionCallback = e, this._connecting || this._connected) {
            const i = new Error('Client has already been connected. You cannot reuse a client.')
            m.nextTick(
              () => {
                e(i)
              }
            )
            return
          }
          this._connecting = true, this.connectionTimeoutHandle, this._connectionTimeoutMillis > 0 && (this.connectionTimeoutHandle = setTimeout(() => {
            n._ending = true, n.stream.destroy(new Error('timeout expired'))
          }, this._connectionTimeoutMillis)), this.host && this.host.indexOf('/') === 0 ? n.connect(`${this.host}/.s.PGSQL.${this.port}`) : n.connect(this.port, this.host), n.on('connect', function() {
            t.ssl ? n.requestSsl() : n.startup(t.getStartupConf())
          }), n.on('sslconnect', function() {
            n.startup(t.getStartupConf())
          }), this._attachListeners(
            n
          ), n.once('end', () => {
            const i = this._ending ? new Error('Connection terminated') : new Error('Connection terminated unexpectedly')
            clearTimeout(this.connectionTimeoutHandle), this._errorAllQueries(i), this._ending || (this._connecting && !this._connectionError ? this._connectionCallback ? this._connectionCallback(i) : this._handleErrorEvent(i) : this._connectionError || this._handleErrorEvent(i)), m.nextTick(() => {
              this.emit('end')
            })
          })
        }
        connect(e) {
          if (e) {
            this._connect(e)
            return
          }
          return new this._Promise((t, n) => {
            this._connect((i) => {
              i ? n(i) : t()
            })
          })
        }
        _attachListeners(e) {
          e.on('authenticationCleartextPassword', this._handleAuthCleartextPassword.bind(this)), e.on('authenticationMD5Password', this._handleAuthMD5Password.bind(this)), e.on('authenticationSASL', this._handleAuthSASL.bind(this)), e.on('authenticationSASLContinue', this._handleAuthSASLContinue.bind(this)), e.on('authenticationSASLFinal', this._handleAuthSASLFinal.bind(this)), e.on('backendKeyData', this._handleBackendKeyData.bind(this)), e.on('error', this._handleErrorEvent.bind(this)), e.on('errorMessage', this._handleErrorMessage.bind(this)), e.on('readyForQuery', this._handleReadyForQuery.bind(this)), e.on('notice', this._handleNotice.bind(this)), e.on('rowDescription', this._handleRowDescription.bind(this)), e.on('dataRow', this._handleDataRow.bind(this)), e.on('portalSuspended', this._handlePortalSuspended.bind(
            this
          )), e.on('emptyQuery', this._handleEmptyQuery.bind(this)), e.on('commandComplete', this._handleCommandComplete.bind(this)), e.on('parseComplete', this._handleParseComplete.bind(this)), e.on('copyInResponse', this._handleCopyInResponse.bind(this)), e.on('copyData', this._handleCopyData.bind(this)), e.on('notification', this._handleNotification.bind(this))
        }
        _checkPgPass(e) {
          const t = this.connection
          typeof this.password == 'function' ? this._Promise.resolve().then(() => this.password()).then((n) => {
            if (n !== void 0) {
              if (typeof n != 'string') {
                t.emit('error', new TypeError(
                  'Password must be a string'
                ))
                return
              }
              this.connectionParameters.password = this.password = n
            } else this.connectionParameters.password = this.password = null
            e()
          }).catch((n) => {
            t.emit('error', n)
          }) : this.password !== null ? e() : Jc(
            this.connectionParameters,
            (n) => {
              n !== void 0 && (this.connectionParameters.password = this.password = n), e()
            }
          )
        }
        _handleAuthCleartextPassword(e) {
          this._checkPgPass(() => {
            this.connection.password(this.password)
          })
        }
        _handleAuthMD5Password(e) {
          this._checkPgPass(
            () => {
              const t = Zc.postgresMd5PasswordHash(this.user, this.password, e.salt)
              this.connection.password(t)
            }
          )
        }
        _handleAuthSASL(e) {
          this._checkPgPass(() => {
            this.saslSession = An.startSession(e.mechanisms), this.connection.sendSASLInitialResponseMessage(
              this.saslSession.mechanism,
              this.saslSession.response
            )
          })
        }
        _handleAuthSASLContinue(e) {
          An.continueSession(
            this.saslSession,
            this.password,
            e.data
          ), this.connection.sendSCRAMClientFinalMessage(this.saslSession.response)
        }
        _handleAuthSASLFinal(e) {
          An.finalizeSession(this.saslSession, e.data), this.saslSession = null
        }
        _handleBackendKeyData(e) {
          this.processID = e.processID, this.secretKey = e.secretKey
        }
        _handleReadyForQuery(e) {
          this._connecting && (this._connecting = false, this._connected = true, clearTimeout(this.connectionTimeoutHandle), this._connectionCallback && (this._connectionCallback(null, this), this._connectionCallback = null), this.emit('connect'))
          const { activeQuery: t } = this
          this.activeQuery = null, this.readyForQuery = true, t && t.handleReadyForQuery(this.connection), this._pulseQueryQueue()
        }
        _handleErrorWhileConnecting(e) {
          if (!this._connectionError) {
            if (this._connectionError = true, clearTimeout(this.connectionTimeoutHandle), this._connectionCallback) return this._connectionCallback(e)
            this.emit('error', e)
          }
        }
        _handleErrorEvent(e) {
          if (this._connecting) return this._handleErrorWhileConnecting(e)
          this._queryable = false, this._errorAllQueries(e), this.emit('error', e)
        }
        _handleErrorMessage(e) {
          if (this._connecting) return this._handleErrorWhileConnecting(e)
          const t = this.activeQuery
          if (!t) {
            this._handleErrorEvent(e)
            return
          }
          this.activeQuery = null, t.handleError(
            e,
            this.connection
          )
        }
        _handleRowDescription(e) {
          this.activeQuery.handleRowDescription(e)
        }
        _handleDataRow(e) {
          this.activeQuery.handleDataRow(e)
        }
        _handlePortalSuspended(e) {
          this.activeQuery.handlePortalSuspended(this.connection)
        }
        _handleEmptyQuery(e) {
          this.activeQuery.handleEmptyQuery(this.connection)
        }
        _handleCommandComplete(e) {
          this.activeQuery.handleCommandComplete(e, this.connection)
        }
        _handleParseComplete(e) {
          this.activeQuery.name && (this.connection.parsedStatements[this.activeQuery.name] = this.activeQuery.text)
        }
        _handleCopyInResponse(e) {
          this.activeQuery.handleCopyInResponse(this.connection)
        }
        _handleCopyData(e) {
          this.activeQuery.handleCopyData(
            e,
            this.connection
          )
        }
        _handleNotification(e) {
          this.emit('notification', e)
        }
        _handleNotice(e) {
          this.emit('notice', e)
        }
        getStartupConf() {
          const e = this.connectionParameters, t = { user: e.user, database: e.database }, n = e.application_name || e.fallback_application_name
          return n && (t.application_name = n), e.replication && (t.replication = `${e.replication}`), e.statement_timeout && (t.statement_timeout = String(parseInt(e.statement_timeout, 10))), e.lock_timeout && (t.lock_timeout = String(parseInt(e.lock_timeout, 10))), e.idle_in_transaction_session_timeout && (t.idle_in_transaction_session_timeout = String(parseInt(e.idle_in_transaction_session_timeout, 10))), e.options && (t.options = e.options), t
        }
        cancel(e, t) {
          if (e.activeQuery === t) {
            const n = this.connection
            this.host && this.host.indexOf('/') === 0 ? n.connect(`${this.host}/.s.PGSQL.${this.port}`) : n.connect(this.port, this.host), n.on('connect', function() {
              n.cancel(
                e.processID,
                e.secretKey
              )
            })
          } else e.queryQueue.indexOf(t) !== -1 && e.queryQueue.splice(e.queryQueue.indexOf(t), 1)
        }
        setTypeParser(e, t, n) {
          return this._types.setTypeParser(e, t, n)
        }
        getTypeParser(e, t) {
          return this._types.getTypeParser(e, t)
        }
        escapeIdentifier(e) {
          return `"${e.replace(/"/g, '""')}"`
        }
        escapeLiteral(e) {
          for (var t = false, n = "'", i = 0; i < e.length; i++) {
            const s = e[i]
            s === "'" ? n += s + s : s === '\\' ? (n += s + s, t = true) : n += s
          }
          return n += "'", t === true && (n = ` E${n}`), n
        }
        _pulseQueryQueue() {
          if (this.readyForQuery === true) if (this.activeQuery = this.queryQueue.shift(), this.activeQuery) {
            this.readyForQuery = false, this.hasExecuted = true
            const e = this.activeQuery.submit(this.connection)
            e && m.nextTick(() => {
              this.activeQuery.handleError(e, this.connection), this.readyForQuery = true, this._pulseQueryQueue()
            })
          } else this.hasExecuted && (this.activeQuery = null, this.emit('drain'))
        }
        query(e, t, n) {
          let i, s, o, u, c
          if (e == null) throw new TypeError(
            'Client was passed a null or undefined query'
          )
          return typeof e.submit == 'function' ? (o = e.query_timeout || this.connectionParameters.query_timeout, s = i = e, typeof t == 'function' && (i.callback = i.callback || t)) : (o = this.connectionParameters.query_timeout, i = new Js(e, t, n), i.callback || (s = new this._Promise((l, f) => {
            i.callback = (y, g) => y ? f(y) : l(g)
          }))), o && (c = i.callback, u = setTimeout(() => {
            const l = new Error('Query read timeout')
            m.nextTick(
              () => {
                i.handleError(l, this.connection)
              }
            ), c(l), i.callback = () => {
            }
            const f = this.queryQueue.indexOf(i)
            f > -1 && this.queryQueue.splice(f, 1), this._pulseQueryQueue()
          }, o), i.callback = (l, f) => {
            clearTimeout(u), c(l, f)
          }), this.binary && !i.binary && (i.binary = true), i._result && !i._result._types && (i._result._types = this._types), this._queryable ? this._ending ? (m.nextTick(() => {
            i.handleError(new Error('Client was closed and is not queryable'), this.connection)
          }), s) : (this.queryQueue.push(i), this._pulseQueryQueue(), s) : (m.nextTick(() => {
            i.handleError(new Error('Client has encountered a connection error and is not queryable'), this.connection)
          }), s)
        }
        ref() {
          this.connection.ref()
        }
        unref() {
          this.connection.unref()
        }
        end(e) {
          if (this._ending = true, !this.connection._connecting) if (e) e()
          else return this._Promise.resolve()
          if (this.activeQuery || !this._queryable ? this.connection.stream.destroy() : this.connection.end(), e) this.connection.once('end', e)
          else return new this._Promise((t) => {
            this.connection.once('end', t)
          })
        }
      }
      a(Cn, 'Client')
      const Ut = Cn
      Ut.Query = Js
      Xs.exports = Ut
    })
    io = T((op, no) => {
      'use strict'
      p()
      const nl = ge().EventEmitter, to = a(function() {
        }, 'NOOP'), ro = a((r, e) => {
          const t = r.findIndex(e)
          return t === -1 ? void 0 : r.splice(t, 1)[0]
        }, 'removeWhere'), Tn = class Tn {
          static {
            __name(this, 'Tn')
          }
          constructor(e, t, n) {
            this.client = e, this.idleListener = t, this.timeoutId = n
          }
        }
      a(Tn, 'IdleItem')
      const _n = Tn, Pn = class Pn {
        static {
          __name(this, 'Pn')
        }
        constructor(e) {
          this.callback = e
        }
      }
      a(Pn, 'PendingItem')
      const Qe = Pn
      function il() {
        throw new Error('Release called on client which has already been released to the pool.')
      }
      __name(il, 'il')
      a(il, 'throwOnDoubleRelease')
      function Dt(r, e) {
        if (e)
          return { callback: e, result: void 0 }
        let t, n, i = a(function(o, u) {
            o ? t(o) : n(u)
          }, 'cb'), s = new r(function(o, u) {
            n = o, t = u
          }).catch((o) => {
            throw Error.captureStackTrace(o), o
          })
        return { callback: i, result: s }
      }
      __name(Dt, 'Dt')
      a(Dt, 'promisify')
      function sl(r, e) {
        return a(/* @__PURE__ */ __name(function t(n) {
          n.client = e, e.removeListener('error', t), e.on('error', () => {
            r.log(
              'additional client error after disconnection due to error',
              n
            )
          }), r._remove(e), r.emit('error', n, e)
        }, 't'), 'idleListener')
      }
      __name(sl, 'sl')
      a(sl, 'makeIdleListener')
      const Bn = class Bn extends nl {
        static {
          __name(this, 'Bn')
        }
        constructor(e, t) {
          super(), this.options = Object.assign({}, e), e != null && 'password' in e && Object.defineProperty(this.options, 'password', {
            configurable: true,
            enumerable: false,
            writable: true,
            value: e.password
          }), e != null && e.ssl && e.ssl.key && Object.defineProperty(this.options.ssl, 'key', { enumerable: false }), this.options.max = this.options.max || this.options.poolSize || 10, this.options.min = this.options.min || 0, this.options.maxUses = this.options.maxUses || 1 / 0, this.options.allowExitOnIdle = this.options.allowExitOnIdle || false, this.options.maxLifetimeSeconds = this.options.maxLifetimeSeconds || 0, this.log = this.options.log || function() {
          }, this.Client = this.options.Client || t || ot().Client, this.Promise = this.options.Promise || b.Promise, typeof this.options.idleTimeoutMillis > 'u' && (this.options.idleTimeoutMillis = 1e4), this._clients = [], this._idle = [], this._expired = /* @__PURE__ */ new WeakSet(), this._pendingQueue = [], this._endCallback = void 0, this.ending = false, this.ended = false
        }
        _isFull() {
          return this._clients.length >= this.options.max
        }
        _isAboveMin() {
          return this._clients.length > this.options.min
        }
        _pulseQueue() {
          if (this.log('pulse queue'), this.ended) {
            this.log('pulse queue ended')
            return
          }
          if (this.ending) {
            this.log('pulse queue on ending'), this._idle.length && this._idle.slice().map((t) => {
              this._remove(t.client)
            }), this._clients.length || (this.ended = true, this._endCallback())
            return
          }
          if (!this._pendingQueue.length) {
            this.log('no queued requests')
            return
          }
          if (!this._idle.length && this._isFull()) return
          const e = this._pendingQueue.shift()
          if (this._idle.length) {
            const t = this._idle.pop()
            clearTimeout(
              t.timeoutId
            )
            const n = t.client
            n.ref && n.ref()
            const i = t.idleListener
            return this._acquireClient(n, e, i, false)
          }
          if (!this._isFull()) return this.newClient(e)
          throw new Error('unexpected condition')
        }
        _remove(e) {
          const t = ro(
            this._idle,
            (n) => n.client === e
          )
          t !== void 0 && clearTimeout(t.timeoutId), this._clients = this._clients.filter(
            (n) => n !== e
          ), e.end(), this.emit('remove', e)
        }
        connect(e) {
          if (this.ending) {
            const i = new Error('Cannot use a pool after calling end on the pool')
            return e ? e(i) : this.Promise.reject(i)
          }
          const t = Dt(this.Promise, e), n = t.result
          if (this._isFull() || this._idle.length) {
            if (this._idle.length && m.nextTick(() => this._pulseQueue()), !this.options.connectionTimeoutMillis) return this._pendingQueue.push(new Qe(t.callback)), n
            const i = a((u, c, l) => {
                clearTimeout(o), t.callback(u, c, l)
              }, 'queueCallback'), s = new Qe(i), o = setTimeout(() => {
                ro(
                  this._pendingQueue,
                  (u) => u.callback === i
                ), s.timedOut = true, t.callback(new Error('timeout exceeded when trying to connect'))
              }, this.options.connectionTimeoutMillis)
            return o.unref && o.unref(), this._pendingQueue.push(s), n
          }
          return this.newClient(new Qe(t.callback)), n
        }
        newClient(e) {
          const t = new this.Client(this.options)
          this._clients.push(
            t
          )
          const n = sl(this, t)
          this.log('checking client timeout')
          let i, s = false
          this.options.connectionTimeoutMillis && (i = setTimeout(() => {
            this.log('ending client due to timeout'), s = true, t.connection ? t.connection.stream.destroy() : t.end()
          }, this.options.connectionTimeoutMillis)), this.log('connecting new client'), t.connect((o) => {
            if (i && clearTimeout(i), t.on('error', n), o) this.log('client failed to connect', o), this._clients = this._clients.filter((u) => u !== t), s && (o = new Error('Connection terminated due to connection timeout', { cause: o })), this._pulseQueue(), e.timedOut || e.callback(o, void 0, to)
            else {
              if (this.log('new client connected'), this.options.maxLifetimeSeconds !== 0) {
                const u = setTimeout(() => {
                  this.log('ending client due to expired lifetime'), this._expired.add(t), this._idle.findIndex((l) => l.client === t) !== -1 && this._acquireClient(
                    t,
                    new Qe((l, f, y) => y()),
                    n,
                    false
                  )
                }, this.options.maxLifetimeSeconds * 1e3)
                u.unref(), t.once('end', () => clearTimeout(u))
              }
              return this._acquireClient(t, e, n, true)
            }
          })
        }
        _acquireClient(e, t, n, i) {
          i && this.emit('connect', e), this.emit('acquire', e), e.release = this._releaseOnce(e, n), e.removeListener('error', n), t.timedOut ? i && this.options.verify ? this.options.verify(e, e.release) : e.release() : i && this.options.verify ? this.options.verify(e, (s) => {
            if (s) return e.release(s), t.callback(s, void 0, to)
            t.callback(void 0, e, e.release)
          }) : t.callback(void 0, e, e.release)
        }
        _releaseOnce(e, t) {
          let n = false
          return (i) => {
            n && il(), n = true, this._release(e, t, i)
          }
        }
        _release(e, t, n) {
          if (e.on('error', t), e._poolUseCount = (e._poolUseCount || 0) + 1, this.emit('release', n, e), n || this.ending || !e._queryable || e._ending || e._poolUseCount >= this.options.maxUses) {
            e._poolUseCount >= this.options.maxUses && this.log('remove expended client'), this._remove(e), this._pulseQueue()
            return
          }
          if (this._expired.has(e)) {
            this.log('remove expired client'), this._expired.delete(e), this._remove(e), this._pulseQueue()
            return
          }
          let s
          this.options.idleTimeoutMillis && this._isAboveMin() && (s = setTimeout(() => {
            this.log('remove idle client'), this._remove(e)
          }, this.options.idleTimeoutMillis), this.options.allowExitOnIdle && s.unref()), this.options.allowExitOnIdle && e.unref(), this._idle.push(new _n(
            e,
            t,
            s
          )), this._pulseQueue()
        }
        query(e, t, n) {
          if (typeof e == 'function') {
            const s = Dt(this.Promise, e)
            return v(function() {
              return s.callback(new Error('Passing a function as the first parameter to pool.query is not supported'))
            }), s.result
          }
          typeof t == 'function' && (n = t, t = void 0)
          const i = Dt(this.Promise, n)
          return n = i.callback, this.connect((s, o) => {
            if (s) return n(s)
            let u = false, c = a((l) => {
              u || (u = true, o.release(l), n(l))
            }, 'onError')
            o.once('error', c), this.log('dispatching query')
            try {
              o.query(e, t, (l, f) => {
                if (this.log('query dispatched'), o.removeListener(
                  'error',
                  c
                ), !u) return u = true, o.release(l), l ? n(l) : n(void 0, f)
              })
            } catch (l) {
              return o.release(l), n(l)
            }
          }), i.result
        }
        end(e) {
          if (this.log('ending'), this.ending) {
            const n = new Error('Called end on pool more than once')
            return e ? e(n) : this.Promise.reject(n)
          }
          this.ending = true
          const t = Dt(this.Promise, e)
          return this._endCallback = t.callback, this._pulseQueue(), t.result
        }
        get waitingCount() {
          return this._pendingQueue.length
        }
        get idleCount() {
          return this._idle.length
        }
        get expiredCount() {
          return this._clients.reduce((e, t) => e + (this._expired.has(t) ? 1 : 0), 0)
        }
        get totalCount() {
          return this._clients.length
        }
      }
      a(Bn, 'Pool')
      const In = Bn
      no.exports = In
    })
    so = {}
    ie(so, { default: /* @__PURE__ */ __name(() => ol, 'default') })
    oo = G(() => {
      'use strict'
      p()
      ol = {}
    })
    ao = T((lp, al) => {
      al.exports = { name: 'pg', version: '8.8.0', description: 'PostgreSQL client - pure javascript & libpq with the same API', keywords: [
        'database',
        'libpq',
        'pg',
        'postgre',
        'postgres',
        'postgresql',
        'rdbms'
      ], homepage: 'https://github.com/brianc/node-postgres', repository: { type: 'git', url: 'git://github.com/brianc/node-postgres.git', directory: 'packages/pg' }, author: 'Brian Carlson <brian.m.carlson@gmail.com>', main: './lib', dependencies: { 'buffer-writer': '2.0.0', 'packet-reader': '1.0.0', 'pg-connection-string': '^2.5.0', 'pg-pool': '^3.5.2', 'pg-protocol': '^1.5.0', 'pg-types': '^2.1.0', pgpass: '1.x' }, devDependencies: {
        async: '2.6.4',
        bluebird: '3.5.2',
        co: '4.6.0',
        'pg-copy-streams': '0.3.0'
      }, peerDependencies: { 'pg-native': '>=3.0.1' }, peerDependenciesMeta: { 'pg-native': { optional: true } }, scripts: { test: 'make test-all' }, files: ['lib', 'SPONSORS.md'], license: 'MIT', engines: { node: '>= 8.0.0' }, gitHead: 'c99fb2c127ddf8d712500db2c7b9a5491a178655' }
    })
    lo = T((fp, co) => {
      'use strict'
      p()
      const uo = ge().EventEmitter, ul = (it(), O(nt)), Rn = rt(), Ne = co.exports = function(r, e, t) {
        uo.call(this), r = Rn.normalizeQueryConfig(r, e, t), this.text = r.text, this.values = r.values, this.name = r.name, this.callback = r.callback, this.state = 'new', this._arrayMode = r.rowMode === 'array', this._emitRowEvents = false, this.on('newListener', function(n) {
          n === 'row' && (this._emitRowEvents = true)
        }.bind(this))
      }
      ul.inherits(Ne, uo)
      const cl = { sqlState: 'code', statementPosition: 'position', messagePrimary: 'message', context: 'where', schemaName: 'schema', tableName: 'table', columnName: 'column', dataTypeName: 'dataType', constraintName: 'constraint', sourceFile: 'file', sourceLine: 'line', sourceFunction: 'routine' }
      Ne.prototype.handleError = function(r) {
        const e = this.native.pq.resultErrorFields()
        if (e) for (const t in e) {
          const n = cl[t] || t
          r[n] = e[t]
        }
        this.callback ? this.callback(r) : this.emit('error', r), this.state = 'error'
      }
      Ne.prototype.then = function(r, e) {
        return this._getPromise().then(
          r,
          e
        )
      }
      Ne.prototype.catch = function(r) {
        return this._getPromise().catch(r)
      }
      Ne.prototype._getPromise = function() {
        return this._promise ? this._promise : (this._promise = new Promise(function(r, e) {
          this._once('end', r), this._once('error', e)
        }.bind(this)), this._promise)
      }
      Ne.prototype.submit = function(r) {
        this.state = 'running'
        const e = this
        this.native = r.native, r.native.arrayMode = this._arrayMode
        let t = a(function(s, o, u) {
          if (r.native.arrayMode = false, v(function() {
            e.emit('_done')
          }), s) return e.handleError(s)
          e._emitRowEvents && (u.length > 1 ? o.forEach(
            (c, l) => {
              c.forEach((f) => {
                e.emit('row', f, u[l])
              })
            }
          ) : o.forEach(function(c) {
            e.emit('row', c, u)
          })), e.state = 'end', e.emit('end', u), e.callback && e.callback(null, u)
        }, 'after')
        if (m.domain && (t = m.domain.bind(t)), this.name) {
          this.name.length > 63 && (console.error('Warning! Postgres only supports 63 characters for query names.'), console.error('You supplied %s (%s)', this.name, this.name.length), console.error('This can cause conflicts and silent errors executing queries'))
          const n = (this.values || []).map(Rn.prepareValue)
          if (r.namedQueries[this.name]) {
            if (this.text && r.namedQueries[this.name] !== this.text) {
              const s = new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`)
              return t(s)
            }
            return r.native.execute(this.name, n, t)
          }
          return r.native.prepare(this.name, this.text, n.length, function(s) {
            return s ? t(s) : (r.namedQueries[e.name] = e.text, e.native.execute(e.name, n, t))
          })
        } else if (this.values) {
          if (!Array.isArray(
            this.values
          )) {
            const s = new Error('Query values must be an array')
            return t(s)
          }
          const i = this.values.map(Rn.prepareValue)
          r.native.query(this.text, i, t)
        } else r.native.query(this.text, t)
      }
    })
    yo = T((yp, po) => {
      'use strict'
      p()
      const ll = (oo(), O(so)), fl = At(), dp = ao(), fo = ge().EventEmitter, hl = (it(), O(nt)), pl = Bt(), ho = lo(), K = po.exports = function(r) {
        fo.call(this), r = r || {}, this._Promise = r.Promise || b.Promise, this._types = new fl(r.types), this.native = new ll({ types: this._types }), this._queryQueue = [], this._ending = false, this._connecting = false, this._connected = false, this._queryable = true
        const e = this.connectionParameters = new pl(r)
        this.user = e.user, Object.defineProperty(this, 'password', { configurable: true, enumerable: false, writable: true, value: e.password }), this.database = e.database, this.host = e.host, this.port = e.port, this.namedQueries = {}
      }
      K.Query = ho
      hl.inherits(K, fo)
      K.prototype._errorAllQueries = function(r) {
        const e = a((t) => {
          m.nextTick(() => {
            t.native = this.native, t.handleError(r)
          })
        }, 'enqueueError')
        this._hasActiveQuery() && (e(this._activeQuery), this._activeQuery = null), this._queryQueue.forEach(e), this._queryQueue.length = 0
      }
      K.prototype._connect = function(r) {
        const e = this
        if (this._connecting) {
          m.nextTick(() => r(new Error('Client has already been connected. You cannot reuse a client.')))
          return
        }
        this._connecting = true, this.connectionParameters.getLibpqConnectionString(function(t, n) {
          if (t) return r(t)
          e.native.connect(n, function(i) {
            if (i) return e.native.end(), r(i)
            e._connected = true, e.native.on('error', function(s) {
              e._queryable = false, e._errorAllQueries(s), e.emit('error', s)
            }), e.native.on('notification', function(s) {
              e.emit('notification', { channel: s.relname, payload: s.extra })
            }), e.emit('connect'), e._pulseQueryQueue(true), r()
          })
        })
      }
      K.prototype.connect = function(r) {
        if (r) {
          this._connect(r)
          return
        }
        return new this._Promise((e, t) => {
          this._connect((n) => {
            n ? t(n) : e()
          })
        })
      }
      K.prototype.query = function(r, e, t) {
        let n, i, s, o, u
        if (r == null) throw new TypeError('Client was passed a null or undefined query')
        if (typeof r.submit == 'function') s = r.query_timeout || this.connectionParameters.query_timeout, i = n = r, typeof e == 'function' && (r.callback = e)
        else if (s = this.connectionParameters.query_timeout, n = new ho(r, e, t), !n.callback) {
          let c, l
          i = new this._Promise((f, y) => {
            c = f, l = y
          }), n.callback = (f, y) => f ? l(f) : c(y)
        }
        return s && (u = n.callback, o = setTimeout(() => {
          const c = new Error(
            'Query read timeout'
          )
          m.nextTick(() => {
            n.handleError(c, this.connection)
          }), u(c), n.callback = () => {
          }
          const l = this._queryQueue.indexOf(n)
          l > -1 && this._queryQueue.splice(l, 1), this._pulseQueryQueue()
        }, s), n.callback = (c, l) => {
          clearTimeout(o), u(c, l)
        }), this._queryable ? this._ending ? (n.native = this.native, m.nextTick(() => {
          n.handleError(
            new Error('Client was closed and is not queryable')
          )
        }), i) : (this._queryQueue.push(n), this._pulseQueryQueue(), i) : (n.native = this.native, m.nextTick(() => {
          n.handleError(new Error('Client has encountered a connection error and is not queryable'))
        }), i)
      }
      K.prototype.end = function(r) {
        const e = this
        this._ending = true, this._connected || this.once('connect', this.end.bind(this, r))
        let t
        return r || (t = new this._Promise(function(n, i) {
          r = a((s) => s ? i(s) : n(), 'cb')
        })), this.native.end(function() {
          e._errorAllQueries(new Error('Connection terminated')), m.nextTick(() => {
            e.emit('end'), r && r()
          })
        }), t
      }
      K.prototype._hasActiveQuery = function() {
        return this._activeQuery && this._activeQuery.state !== 'error' && this._activeQuery.state !== 'end'
      }
      K.prototype._pulseQueryQueue = function(r) {
        if (this._connected && !this._hasActiveQuery()) {
          const e = this._queryQueue.shift()
          if (!e) {
            r || this.emit('drain')
            return
          }
          this._activeQuery = e, e.submit(this)
          const t = this
          e.once('_done', function() {
            t._pulseQueryQueue()
          })
        }
      }
      K.prototype.cancel = function(r) {
        this._activeQuery === r ? this.native.cancel(function() {
        }) : this._queryQueue.indexOf(r) !== -1 && this._queryQueue.splice(this._queryQueue.indexOf(r), 1)
      }
      K.prototype.ref = function() {
      }
      K.prototype.unref = function() {
      }
      K.prototype.setTypeParser = function(r, e, t) {
        return this._types.setTypeParser(
          r,
          e,
          t
        )
      }
      K.prototype.getTypeParser = function(r, e) {
        return this._types.getTypeParser(r, e)
      }
    })
    Ln = T((gp, mo) => {
      'use strict'
      p()
      mo.exports = yo()
    })
    ot = T((vp, at) => {
      'use strict'
      p()
      const dl = eo(), yl = tt(), ml = En(), wl = io(), { DatabaseError: gl } = vn(), bl = a(
          (r) => {
            let e
            return e = class extends wl {
              static {
                __name(this, 'e')
              }
              constructor(n) {
                super(n, r)
              }
            }, a(e, 'BoundPool'), e
          },
          'poolFactory'
        ), Fn = a(
          function(r) {
            this.defaults = yl, this.Client = r, this.Query = this.Client.Query, this.Pool = bl(this.Client), this._pools = [], this.Connection = ml, this.types = Je(), this.DatabaseError = gl
          },
          'PG'
        )
      typeof m.env.NODE_PG_FORCE_NATIVE < 'u' ? at.exports = new Fn(Ln()) : (at.exports = new Fn(dl), Object.defineProperty(at.exports, 'native', {
        configurable: true,
        enumerable: false,
        get() {
          let r = null
          try {
            r = new Fn(Ln())
          } catch (e) {
            if (e.code !== 'MODULE_NOT_FOUND') throw e
          }
          return Object.defineProperty(at.exports, 'native', { value: r }), r
        }
      }))
    })
    p()
    p()
    Fe()
    Zt()
    p()
    pa = Object.defineProperty
    da = Object.defineProperties
    ya = Object.getOwnPropertyDescriptors
    bi = Object.getOwnPropertySymbols
    ma = Object.prototype.hasOwnProperty
    wa = Object.prototype.propertyIsEnumerable
    vi = a(
      (r, e, t) => e in r ? pa(r, e, { enumerable: true, configurable: true, writable: true, value: t }) : r[e] = t,
      '__defNormalProp'
    )
    ga = a((r, e) => {
      for (var t in e || (e = {})) ma.call(e, t) && vi(r, t, e[t])
      if (bi) for (var t of bi(e)) wa.call(e, t) && vi(r, t, e[t])
      return r
    }, '__spreadValues')
    ba = a((r, e) => da(r, ya(e)), '__spreadProps')
    va = 1008e3
    xi = new Uint8Array(
      new Uint16Array([258]).buffer
    )[0] === 2
    xa = new TextDecoder()
    Jt = new TextEncoder()
    yt = Jt.encode('0123456789abcdef')
    mt = Jt.encode('0123456789ABCDEF')
    Sa = Jt.encode('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/')
    Si = Sa.slice()
    Si[62] = 45
    Si[63] = 95
    __name(Ea, 'Ea')
    a(Ea, '_toHex')
    __name(Aa, 'Aa')
    a(Aa, '_toHexChunked')
    __name(Ei, 'Ei')
    a(Ei, 'toHex')
    p()
    gt = class gt2 {
      static {
        __name(this, 'gt')
      }
      constructor(e, t) {
        this.strings = e
        this.values = t
      }
      toParameterizedQuery(e = { query: '', params: [] }) {
        const { strings: t, values: n } = this
        for (let i = 0, s = t.length; i < s; i++) if (e.query += t[i], i < n.length) {
          const o = n[i]
          if (o instanceof Ge) e.query += o.sql
          else if (o instanceof Ce) if (o.queryData instanceof gt2) o.queryData.toParameterizedQuery(
            e
          )
          else {
            if (o.queryData.params?.length) throw new Error('This query is not composable')
            e.query += o.queryData.query
          }
          else {
            const { params: u } = e
            u.push(o), e.query += `$${u.length}`, (o instanceof d || ArrayBuffer.isView(o)) && (e.query += '::bytea')
          }
        }
        return e
      }
    }
    a(gt, 'SqlTemplate')
    $e = gt
    Xt = class Xt2 {
      static {
        __name(this, 'Xt')
      }
      constructor(e) {
        this.sql = e
      }
    }
    a(Xt, 'UnsafeRawSql')
    Ge = Xt
    p()
    __name(bt, 'bt')
    a(bt, 'warnIfBrowser')
    Fe()
    as = Se(At())
    us = Se(rt())
    _t = class _t2 extends Error {
      static {
        __name(this, '_t')
      }
      constructor(t) {
        super(t)
        E(this, 'name', 'NeonDbError')
        E(this, 'severity')
        E(this, 'code')
        E(this, 'detail')
        E(this, 'hint')
        E(this, 'position')
        E(this, 'internalPosition')
        E(
          this,
          'internalQuery'
        )
        E(this, 'where')
        E(this, 'schema')
        E(this, 'table')
        E(this, 'column')
        E(this, 'dataType')
        E(this, 'constraint')
        E(this, 'file')
        E(this, 'line')
        E(this, 'routine')
        E(this, 'sourceError')
        'captureStackTrace' in Error && typeof Error.captureStackTrace == 'function' && Error.captureStackTrace(this, _t2)
      }
    }
    a(
      _t,
      'NeonDbError'
    )
    be = _t
    is = 'transaction() expects an array of queries, or a function returning an array of queries'
    Ru = ['severity', 'code', 'detail', 'hint', 'position', 'internalPosition', 'internalQuery', 'where', 'schema', 'table', 'column', 'dataType', 'constraint', 'file', 'line', 'routine']
    __name(Lu, 'Lu')
    a(Lu, 'encodeBuffersAsBytea')
    __name(ss, 'ss')
    a(ss, 'prepareQuery')
    __name(cs, 'cs')
    a(cs, 'neon')
    dr = class dr2 {
      static {
        __name(this, 'dr')
      }
      constructor(e, t, n) {
        this.execute = e
        this.queryData = t
        this.opts = n
      }
      then(e, t) {
        return this.execute(this.queryData, this.opts).then(e, t)
      }
      catch(e) {
        return this.execute(this.queryData, this.opts).catch(e)
      }
      finally(e) {
        return this.execute(
          this.queryData,
          this.opts
        ).finally(e)
      }
    }
    a(dr, 'NeonQueryPromise')
    Ce = dr
    __name(os, 'os')
    a(os, 'processQueryResult')
    __name(Fu, 'Fu')
    a(Fu, 'getAuthToken')
    p()
    go = Se(ot())
    p()
    wo = Se(ot())
    kn = class kn2 extends wo.Client {
      static {
        __name(this, 'kn')
      }
      constructor(t) {
        super(t)
        this.config = t
      }
      get neonConfig() {
        return this.connection.stream
      }
      connect(t) {
        const { neonConfig: n } = this
        n.forceDisablePgSSL && (this.ssl = this.connection.ssl = false), this.ssl && n.useSecureWebSocket && console.warn('SSL is enabled for both Postgres (e.g. ?sslmode=require in the connection string + forceDisablePgSSL = false) and the WebSocket tunnel (useSecureWebSocket = true). Double encryption will increase latency and CPU usage. It may be appropriate to disable SSL in the Postgres connection parameters or set forceDisablePgSSL = true.')
        const i = typeof this.config != 'string' && this.config?.host !== void 0 || typeof this.config != 'string' && this.config?.connectionString !== void 0 || m.env.PGHOST !== void 0, s = m.env.USER ?? m.env.USERNAME
        if (!i && this.host === 'localhost' && this.user === s && this.database === s && this.password === null) throw new Error(`No database host or connection string was set, and key parameters have default values (host: localhost, user: ${s}, db: ${s}, password: null). Is an environment variable missing? Alternatively, if you intended to connect with these parameters, please set the host to 'localhost' explicitly.`)
        const o = super.connect(t), u = n.pipelineTLS && this.ssl, c = n.pipelineConnect === 'password'
        if (!u && !n.pipelineConnect) return o
        const l = this.connection
        if (u && l.on(
          'connect',
          () => l.stream.emit('data', 'S')
        ), c) {
          l.removeAllListeners('authenticationCleartextPassword'), l.removeAllListeners('readyForQuery'), l.once('readyForQuery', () => l.on('readyForQuery', this._handleReadyForQuery.bind(this)))
          const f = this.ssl ? 'sslconnect' : 'connect'
          l.on(f, () => {
            this.neonConfig.disableWarningInBrowsers || bt(), this._handleAuthCleartextPassword(), this._handleReadyForQuery()
          })
        }
        return o
      }
      async _handleAuthSASLContinue(t) {
        if (typeof crypto > 'u' || crypto.subtle === void 0 || crypto.subtle.importKey === void 0) throw new Error('Cannot use SASL auth when `crypto.subtle` is not defined')
        const n = crypto.subtle, i = this.saslSession, s = this.password, o = t.data
        if (i.message !== 'SASLInitialResponse' || typeof s != 'string' || typeof o != 'string') throw new Error(
          'SASL: protocol error'
        )
        const u = Object.fromEntries(o.split(',').map((M) => {
            if (!/^.=/.test(M)) throw new Error(
              'SASL: Invalid attribute pair entry'
            )
            const $ = M[0], me = M.substring(2)
            return [$, me]
          })), c = u.r, l = u.s, f = u.i
        if (!c || !/^[!-+--~]+$/.test(c)) throw new Error('SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce missing/unprintable')
        if (!l || !/^(?:[a-zA-Z0-9+/]{4})*(?:[a-zA-Z0-9+/]{2}==|[a-zA-Z0-9+/]{3}=)?$/.test(l)) throw new Error(
          'SASL: SCRAM-SERVER-FIRST-MESSAGE: salt missing/not base64'
        )
        if (!f || !/^[1-9][0-9]*$/.test(f)) throw new Error(
          'SASL: SCRAM-SERVER-FIRST-MESSAGE: missing/invalid iteration count'
        )
        if (!c.startsWith(i.clientNonce))
          throw new Error('SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce does not start with client nonce')
        if (c.length === i.clientNonce.length) throw new Error('SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce is too short')
        let y = parseInt(f, 10), g = d.from(l, 'base64'), A = new TextEncoder(), C = A.encode(s), D = await n.importKey(
            'raw',
            C,
            { name: 'HMAC', hash: { name: 'SHA-256' } },
            false,
            ['sign']
          ), Y = new Uint8Array(await n.sign('HMAC', D, d.concat(
            [g, d.from([0, 0, 0, 1])]
          ))), P = Y
        for (let I = 0; I < y - 1; I++) Y = new Uint8Array(await n.sign('HMAC', D, Y)), P = d.from(
          P.map((M, $) => P[$] ^ Y[$])
        )
        const w = P, Z = await n.importKey(
            'raw',
            w,
            { name: 'HMAC', hash: { name: 'SHA-256' } },
            false,
            ['sign']
          ), W = new Uint8Array(await n.sign('HMAC', Z, A.encode('Client Key'))), J = await n.digest(
            'SHA-256',
            W
          ), X = `n=*,r=${i.clientNonce}`, se = `r=${c},s=${l},i=${y}`, oe = `c=biws,r=${c}`, R = `${X},${se},${oe}`, j = await n.importKey(
            'raw',
            J,
            { name: 'HMAC', hash: { name: 'SHA-256' } },
            false,
            ['sign']
          )
        const le = new Uint8Array(await n.sign(
            'HMAC',
            j,
            A.encode(R)
          )), de = d.from(W.map((M, $) => W[$] ^ le[$])), We = de.toString('base64')
        const fe = await n.importKey(
            'raw',
            w,
            { name: 'HMAC', hash: { name: 'SHA-256' } },
            false,
            ['sign']
          ), _e = await n.sign('HMAC', fe, A.encode('Server Key')), ye = await n.importKey('raw', _e, { name: 'HMAC', hash: { name: 'SHA-256' } }, false, ['sign'])
        const ee = d.from(
          await n.sign('HMAC', ye, A.encode(R))
        )
        i.message = 'SASLResponse', i.serverSignature = ee.toString('base64'), i.response = `${oe},p=${We}`, this.connection.sendSCRAMClientFinalMessage(this.saslSession.response)
      }
    }
    a(
      kn,
      'NeonClient'
    )
    ut = kn
    Fe()
    bo = Se(Bt())
    __name(vl, 'vl')
    a(vl, 'promisify')
    Un = class Un2 extends go.Pool {
      static {
        __name(this, 'Un')
      }
      constructor() {
        super(...arguments)
        E(this, 'Client', ut)
        E(this, 'hasFetchUnsupportedListeners', false)
        E(this, 'addListener', this.on)
      }
      on(t, n) {
        return t !== 'error' && (this.hasFetchUnsupportedListeners = true), super.on(t, n)
      }
      query(t, n, i) {
        if (!ce.poolQueryViaFetch || this.hasFetchUnsupportedListeners || typeof t == 'function') return super.query(
          t,
          n,
          i
        )
        typeof n == 'function' && (i = n, n = void 0)
        const s = vl(this.Promise, i)
        i = s.callback
        try {
          const o = new bo.default(
              this.options
            ), u = encodeURIComponent, c = encodeURI, l = `postgresql://${u(o.user)}:${u(o.password)}@${u(o.host)}/${c(o.database)}`, f = typeof t == 'string' ? t : t.text, y = n ?? t.values ?? []
          cs(l, { fullResults: true, arrayMode: t.rowMode === 'array' }).query(f, y, { types: t.types ?? this.options?.types }).then((A) => i(void 0, A)).catch((A) => i(
            A
          ))
        } catch (o) {
          i(o)
        }
        return s.result
      }
    }
    a(Un, 'NeonPool')
    Mn = Un
    Fe()
    ct = Se(ot())
    kp = 'mjs'
    export_DatabaseError = ct.DatabaseError
    export_defaults = ct.defaults
    export_escapeIdentifier = ct.escapeIdentifier
    export_escapeLiteral = ct.escapeLiteral
    export_types = ct.types
  }
})

// api/v1/courses.ts
async function onRequestGet(context) {
  const { request, env } = context
  try {
    console.log('[Courses] \u67E5\u8A62\u8AB2\u7A0B\u5217\u8868')
    const { neon } = await Promise.resolve().then(() => (init_serverless(), serverless_exports))
    const databaseUrl = env.DATABASE_URL
    if (!databaseUrl) {
      console.log('[Courses] DATABASE_URL \u672A\u914D\u7F6E')
      return new Response(
        JSON.stringify({ success: false, message: 'Database URL not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }
    const sql = neon(databaseUrl)
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const limit = parseInt(url.searchParams.get('limit') || '12', 10)
    const offset = (page - 1) * limit
    const courseType = url.searchParams.get('course_type')
    const search = url.searchParams.get('search')
    console.log('[Courses] \u67E5\u8A62\u53C3\u6578:', { page, limit, courseType, search })
    const courseTypeMapping = {
      'basic': '\u57FA\u790E\u8AB2\u7A0B',
      'advanced': '\u9032\u968E\u8AB2\u7A0B',
      'internship': '\u5BE6\u7FD2\u8AB2\u7A0B'
    }
    try {
      const countResult = await sql`SELECT COUNT(*) as count FROM courses WHERE is_active = true`
      const total = parseInt(countResult[0]?.count || '0', 10)
      console.log('[Courses] \u7E3D\u8AB2\u7A0B\u6578:', total)
      const courses = await sql`
        SELECT * FROM courses 
        WHERE is_active = true
        ORDER BY created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `
      console.log('[Courses] \u67E5\u8A62\u5230\u7684\u8AB2\u7A0B\u6578:', courses.length)
      const courseTypeReverseMapping = {
        '\u57FA\u790E\u8AB2\u7A0B': 'basic',
        '\u9032\u968E\u8AB2\u7A0B': 'advanced',
        '\u5BE6\u7FD2\u8AB2\u7A0B': 'internship',
        '\u5BE6\u52D9\u8AB2\u7A0B': 'internship'
        // 添加實務課程的映射
      }
      const processedCourses = courses.map((course) => ({
        ...course,
        course_type: courseTypeReverseMapping[course.course_type] || course.course_type
      }))
      console.log('[Courses] \u8655\u7406\u5F8C\u7684\u8AB2\u7A0B:', processedCourses.map((c) => ({ id: c.id, title: c.title, type: c.course_type })))
      return new Response(
        JSON.stringify({
          success: true,
          data: processedCourses,
          meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    } catch (dbError) {
      console.error('[Courses] \u6578\u64DA\u5EAB\u67E5\u8A62\u5931\u6557:', dbError)
      return new Response(
        JSON.stringify({
          success: false,
          message: '\u6578\u64DA\u5EAB\u67E5\u8A62\u5931\u6557',
          details: dbError.message
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }
  } catch (error) {
    console.error('[Courses] \u67E5\u8A62\u8AB2\u7A0B\u5217\u8868\u5931\u6557:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: '\u7372\u53D6\u8AB2\u7A0B\u5217\u8868\u5931\u6557',
        details: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    )
  }
}
async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}
const init_courses = __esm({
  'api/v1/courses.ts'() {
    init_functionsRoutes_0_7735455656432807()
    init_checked_fetch()
    __name(onRequestGet, 'onRequestGet')
    __name(onRequestOptions, 'onRequestOptions')
  }
})

// api/v1/[[path]].ts
let onRequest
const init_path = __esm({
  'api/v1/[[path]].ts'() {
    init_functionsRoutes_0_7735455656432807()
    init_checked_fetch()
    onRequest = /* @__PURE__ */ __name(async (context) => {
      const { request } = context
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
            'Access-Control-Max-Age': '86400'
          }
        })
      }
      const url = new URL(request.url)
      const path = url.pathname.replace('/api/v1', '')
      if (path === '/health') {
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              status: 'healthy',
              timestamp: (/* @__PURE__ */ new Date()).toISOString(),
              version: '1.0.0',
              environment: context.env.ENVIRONMENT || 'production',
              database: context.env.DATABASE_URL ? 'connected' : 'not configured'
            }
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        )
      }
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'API endpoint not found',
            path
          }
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }, 'onRequest')
  }
})

// api/v1/index.ts
let onRequest2
const init_v1 = __esm({
  'api/v1/index.ts'() {
    init_functionsRoutes_0_7735455656432807()
    init_checked_fetch()
    onRequest2 = /* @__PURE__ */ __name(async (context) => {
      const { request } = context
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
            'Access-Control-Max-Age': '86400'
          }
        })
      }
      const url = new URL(request.url)
      const path = url.pathname.replace('/api/v1', '')
      if (path === '/health') {
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              status: 'healthy',
              timestamp: (/* @__PURE__ */ new Date()).toISOString(),
              version: '1.0.0',
              environment: context.env.ENVIRONMENT || 'production',
              database: context.env.DATABASE_URL ? 'connected' : 'not configured'
            }
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        )
      }
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'API endpoint not found',
            path
          }
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }, 'onRequest')
  }
})

// (disabled):crypto
const require_crypto = __commonJS({
  '(disabled):crypto'() {
    init_functionsRoutes_0_7735455656432807()
    init_checked_fetch()
  }
})

// ../node_modules/bcryptjs/index.js
function randomBytes(len) {
  try {
    return crypto.getRandomValues(new Uint8Array(len))
  } catch {
  }
  try {
    return import_crypto.default.randomBytes(len)
  } catch {
  }
  if (!randomFallback) {
    throw Error(
      'Neither WebCryptoAPI nor a crypto module is available. Use bcrypt.setRandomFallback to set an alternative'
    )
  }
  return randomFallback(len)
}
function setRandomFallback(random) {
  randomFallback = random
}
function genSaltSync(rounds, seed_length) {
  rounds = rounds || GENSALT_DEFAULT_LOG2_ROUNDS
  if (typeof rounds !== 'number')
    throw Error(
      `Illegal arguments: ${typeof rounds}, ${typeof seed_length}`
    )
  if (rounds < 4) rounds = 4
  else if (rounds > 31) rounds = 31
  const salt = []
  salt.push('$2b$')
  if (rounds < 10) salt.push('0')
  salt.push(rounds.toString())
  salt.push('$')
  salt.push(base64_encode(randomBytes(BCRYPT_SALT_LEN), BCRYPT_SALT_LEN))
  return salt.join('')
}
function genSalt(rounds, seed_length, callback) {
  if (typeof seed_length === 'function')
    callback = seed_length, seed_length = void 0
  if (typeof rounds === 'function') callback = rounds, rounds = void 0
  if (typeof rounds === 'undefined') rounds = GENSALT_DEFAULT_LOG2_ROUNDS
  else if (typeof rounds !== 'number')
    throw Error(`illegal arguments: ${typeof rounds}`)
  function _async(callback2) {
    nextTick(function() {
      try {
        callback2(null, genSaltSync(rounds))
      } catch (err) {
        callback2(err)
      }
    })
  }
  __name(_async, '_async')
  if (callback) {
    if (typeof callback !== 'function')
      throw Error(`Illegal callback: ${typeof callback}`)
    _async(callback)
  } else
    return new Promise(function(resolve, reject) {
      _async(function(err, res) {
        if (err) {
          reject(err)
          return
        }
        resolve(res)
      })
    })
}
function hashSync(password, salt) {
  if (typeof salt === 'undefined') salt = GENSALT_DEFAULT_LOG2_ROUNDS
  if (typeof salt === 'number') salt = genSaltSync(salt)
  if (typeof password !== 'string' || typeof salt !== 'string')
    throw Error(`Illegal arguments: ${typeof password}, ${typeof salt}`)
  return _hash(password, salt)
}
function hash(password, salt, callback, progressCallback) {
  function _async(callback2) {
    if (typeof password === 'string' && typeof salt === 'number')
      genSalt(salt, function(err, salt2) {
        _hash(password, salt2, callback2, progressCallback)
      })
    else if (typeof password === 'string' && typeof salt === 'string')
      _hash(password, salt, callback2, progressCallback)
    else
      nextTick(
        callback2.bind(
          this,
          Error(`Illegal arguments: ${typeof password}, ${typeof salt}`)
        )
      )
  }
  __name(_async, '_async')
  if (callback) {
    if (typeof callback !== 'function')
      throw Error(`Illegal callback: ${typeof callback}`)
    _async(callback)
  } else
    return new Promise(function(resolve, reject) {
      _async(function(err, res) {
        if (err) {
          reject(err)
          return
        }
        resolve(res)
      })
    })
}
function safeStringCompare(known, unknown) {
  let diff = known.length ^ unknown.length
  for (let i = 0; i < known.length; ++i) {
    diff |= known.charCodeAt(i) ^ unknown.charCodeAt(i)
  }
  return diff === 0
}
function compareSync(password, hash2) {
  if (typeof password !== 'string' || typeof hash2 !== 'string')
    throw Error(`Illegal arguments: ${typeof password}, ${typeof hash2}`)
  if (hash2.length !== 60) return false
  return safeStringCompare(
    hashSync(password, hash2.substring(0, hash2.length - 31)),
    hash2
  )
}
function compare(password, hashValue, callback, progressCallback) {
  function _async(callback2) {
    if (typeof password !== 'string' || typeof hashValue !== 'string') {
      nextTick(
        callback2.bind(
          this,
          Error(
            `Illegal arguments: ${typeof password}, ${typeof hashValue}`
          )
        )
      )
      return
    }
    if (hashValue.length !== 60) {
      nextTick(callback2.bind(this, null, false))
      return
    }
    hash(
      password,
      hashValue.substring(0, 29),
      function(err, comp) {
        if (err) callback2(err)
        else callback2(null, safeStringCompare(comp, hashValue))
      },
      progressCallback
    )
  }
  __name(_async, '_async')
  if (callback) {
    if (typeof callback !== 'function')
      throw Error(`Illegal callback: ${typeof callback}`)
    _async(callback)
  } else
    return new Promise(function(resolve, reject) {
      _async(function(err, res) {
        if (err) {
          reject(err)
          return
        }
        resolve(res)
      })
    })
}
function getRounds(hash2) {
  if (typeof hash2 !== 'string')
    throw Error(`Illegal arguments: ${typeof hash2}`)
  return parseInt(hash2.split('$')[2], 10)
}
function getSalt(hash2) {
  if (typeof hash2 !== 'string')
    throw Error(`Illegal arguments: ${typeof hash2}`)
  if (hash2.length !== 60)
    throw Error(`Illegal hash length: ${hash2.length} != 60`)
  return hash2.substring(0, 29)
}
function truncates(password) {
  if (typeof password !== 'string')
    throw Error(`Illegal arguments: ${typeof password}`)
  return utf8Length(password) > 72
}
function utf8Length(string) {
  let len = 0, c = 0
  for (let i = 0; i < string.length; ++i) {
    c = string.charCodeAt(i)
    if (c < 128) len += 1
    else if (c < 2048) len += 2
    else if ((c & 64512) === 55296 && (string.charCodeAt(i + 1) & 64512) === 56320) {
      ++i
      len += 4
    } else len += 3
  }
  return len
}
function utf8Array(string) {
  let offset = 0, c1, c2
  const buffer = new Array(utf8Length(string))
  for (let i = 0, k = string.length; i < k; ++i) {
    c1 = string.charCodeAt(i)
    if (c1 < 128) {
      buffer[offset++] = c1
    } else if (c1 < 2048) {
      buffer[offset++] = c1 >> 6 | 192
      buffer[offset++] = c1 & 63 | 128
    } else if ((c1 & 64512) === 55296 && ((c2 = string.charCodeAt(i + 1)) & 64512) === 56320) {
      c1 = 65536 + ((c1 & 1023) << 10) + (c2 & 1023)
      ++i
      buffer[offset++] = c1 >> 18 | 240
      buffer[offset++] = c1 >> 12 & 63 | 128
      buffer[offset++] = c1 >> 6 & 63 | 128
      buffer[offset++] = c1 & 63 | 128
    } else {
      buffer[offset++] = c1 >> 12 | 224
      buffer[offset++] = c1 >> 6 & 63 | 128
      buffer[offset++] = c1 & 63 | 128
    }
  }
  return buffer
}
function base64_encode(b2, len) {
  let off = 0, rs = [], c1, c2
  if (len <= 0 || len > b2.length) throw Error(`Illegal len: ${len}`)
  while (off < len) {
    c1 = b2[off++] & 255
    rs.push(BASE64_CODE[c1 >> 2 & 63])
    c1 = (c1 & 3) << 4
    if (off >= len) {
      rs.push(BASE64_CODE[c1 & 63])
      break
    }
    c2 = b2[off++] & 255
    c1 |= c2 >> 4 & 15
    rs.push(BASE64_CODE[c1 & 63])
    c1 = (c2 & 15) << 2
    if (off >= len) {
      rs.push(BASE64_CODE[c1 & 63])
      break
    }
    c2 = b2[off++] & 255
    c1 |= c2 >> 6 & 3
    rs.push(BASE64_CODE[c1 & 63])
    rs.push(BASE64_CODE[c2 & 63])
  }
  return rs.join('')
}
function base64_decode(s, len) {
  let off = 0, slen = s.length, olen = 0, rs = [], c1, c2, c3, c4, o, code
  if (len <= 0) throw Error(`Illegal len: ${len}`)
  while (off < slen - 1 && olen < len) {
    code = s.charCodeAt(off++)
    c1 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1
    code = s.charCodeAt(off++)
    c2 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1
    if (c1 == -1 || c2 == -1) break
    o = c1 << 2 >>> 0
    o |= (c2 & 48) >> 4
    rs.push(String.fromCharCode(o))
    if (++olen >= len || off >= slen) break
    code = s.charCodeAt(off++)
    c3 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1
    if (c3 == -1) break
    o = (c2 & 15) << 4 >>> 0
    o |= (c3 & 60) >> 2
    rs.push(String.fromCharCode(o))
    if (++olen >= len || off >= slen) break
    code = s.charCodeAt(off++)
    c4 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1
    o = (c3 & 3) << 6 >>> 0
    o |= c4
    rs.push(String.fromCharCode(o))
    ++olen
  }
  const res = []
  for (off = 0; off < olen; off++) res.push(rs[off].charCodeAt(0))
  return res
}
function _encipher(lr2, off, P, S2) {
  let n, l = lr2[off], r = lr2[off + 1]
  l ^= P[0]
  n = S2[l >>> 24]
  n += S2[256 | l >> 16 & 255]
  n ^= S2[512 | l >> 8 & 255]
  n += S2[768 | l & 255]
  r ^= n ^ P[1]
  n = S2[r >>> 24]
  n += S2[256 | r >> 16 & 255]
  n ^= S2[512 | r >> 8 & 255]
  n += S2[768 | r & 255]
  l ^= n ^ P[2]
  n = S2[l >>> 24]
  n += S2[256 | l >> 16 & 255]
  n ^= S2[512 | l >> 8 & 255]
  n += S2[768 | l & 255]
  r ^= n ^ P[3]
  n = S2[r >>> 24]
  n += S2[256 | r >> 16 & 255]
  n ^= S2[512 | r >> 8 & 255]
  n += S2[768 | r & 255]
  l ^= n ^ P[4]
  n = S2[l >>> 24]
  n += S2[256 | l >> 16 & 255]
  n ^= S2[512 | l >> 8 & 255]
  n += S2[768 | l & 255]
  r ^= n ^ P[5]
  n = S2[r >>> 24]
  n += S2[256 | r >> 16 & 255]
  n ^= S2[512 | r >> 8 & 255]
  n += S2[768 | r & 255]
  l ^= n ^ P[6]
  n = S2[l >>> 24]
  n += S2[256 | l >> 16 & 255]
  n ^= S2[512 | l >> 8 & 255]
  n += S2[768 | l & 255]
  r ^= n ^ P[7]
  n = S2[r >>> 24]
  n += S2[256 | r >> 16 & 255]
  n ^= S2[512 | r >> 8 & 255]
  n += S2[768 | r & 255]
  l ^= n ^ P[8]
  n = S2[l >>> 24]
  n += S2[256 | l >> 16 & 255]
  n ^= S2[512 | l >> 8 & 255]
  n += S2[768 | l & 255]
  r ^= n ^ P[9]
  n = S2[r >>> 24]
  n += S2[256 | r >> 16 & 255]
  n ^= S2[512 | r >> 8 & 255]
  n += S2[768 | r & 255]
  l ^= n ^ P[10]
  n = S2[l >>> 24]
  n += S2[256 | l >> 16 & 255]
  n ^= S2[512 | l >> 8 & 255]
  n += S2[768 | l & 255]
  r ^= n ^ P[11]
  n = S2[r >>> 24]
  n += S2[256 | r >> 16 & 255]
  n ^= S2[512 | r >> 8 & 255]
  n += S2[768 | r & 255]
  l ^= n ^ P[12]
  n = S2[l >>> 24]
  n += S2[256 | l >> 16 & 255]
  n ^= S2[512 | l >> 8 & 255]
  n += S2[768 | l & 255]
  r ^= n ^ P[13]
  n = S2[r >>> 24]
  n += S2[256 | r >> 16 & 255]
  n ^= S2[512 | r >> 8 & 255]
  n += S2[768 | r & 255]
  l ^= n ^ P[14]
  n = S2[l >>> 24]
  n += S2[256 | l >> 16 & 255]
  n ^= S2[512 | l >> 8 & 255]
  n += S2[768 | l & 255]
  r ^= n ^ P[15]
  n = S2[r >>> 24]
  n += S2[256 | r >> 16 & 255]
  n ^= S2[512 | r >> 8 & 255]
  n += S2[768 | r & 255]
  l ^= n ^ P[16]
  lr2[off] = r ^ P[BLOWFISH_NUM_ROUNDS + 1]
  lr2[off + 1] = l
  return lr2
}
function _streamtoword(data, offp) {
  for (var i = 0, word = 0; i < 4; ++i)
    word = word << 8 | data[offp] & 255, offp = (offp + 1) % data.length
  return { key: word, offp }
}
function _key(key, P, S2) {
  let offset = 0, lr2 = [0, 0], plen = P.length, slen = S2.length, sw
  for (var i = 0; i < plen; i++)
    sw = _streamtoword(key, offset), offset = sw.offp, P[i] = P[i] ^ sw.key
  for (i = 0; i < plen; i += 2)
    lr2 = _encipher(lr2, 0, P, S2), P[i] = lr2[0], P[i + 1] = lr2[1]
  for (i = 0; i < slen; i += 2)
    lr2 = _encipher(lr2, 0, P, S2), S2[i] = lr2[0], S2[i + 1] = lr2[1]
}
function _ekskey(data, key, P, S2) {
  let offp = 0, lr2 = [0, 0], plen = P.length, slen = S2.length, sw
  for (var i = 0; i < plen; i++)
    sw = _streamtoword(key, offp), offp = sw.offp, P[i] = P[i] ^ sw.key
  offp = 0
  for (i = 0; i < plen; i += 2)
    sw = _streamtoword(data, offp), offp = sw.offp, lr2[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr2[1] ^= sw.key, lr2 = _encipher(lr2, 0, P, S2), P[i] = lr2[0], P[i + 1] = lr2[1]
  for (i = 0; i < slen; i += 2)
    sw = _streamtoword(data, offp), offp = sw.offp, lr2[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr2[1] ^= sw.key, lr2 = _encipher(lr2, 0, P, S2), S2[i] = lr2[0], S2[i + 1] = lr2[1]
}
function _crypt(b2, salt, rounds, callback, progressCallback) {
  let cdata = C_ORIG.slice(), clen = cdata.length, err
  if (rounds < 4 || rounds > 31) {
    err = Error(`Illegal number of rounds (4-31): ${rounds}`)
    if (callback) {
      nextTick(callback.bind(this, err))
      return
    } else throw err
  }
  if (salt.length !== BCRYPT_SALT_LEN) {
    err = Error(
      `Illegal salt length: ${salt.length} != ${BCRYPT_SALT_LEN}`
    )
    if (callback) {
      nextTick(callback.bind(this, err))
      return
    } else throw err
  }
  rounds = 1 << rounds >>> 0
  let P, S2, i = 0, j
  if (typeof Int32Array === 'function') {
    P = new Int32Array(P_ORIG)
    S2 = new Int32Array(S_ORIG)
  } else {
    P = P_ORIG.slice()
    S2 = S_ORIG.slice()
  }
  _ekskey(salt, b2, P, S2)
  function next() {
    if (progressCallback) progressCallback(i / rounds)
    if (i < rounds) {
      const start = Date.now()
      while (i < rounds) {
        i = i + 1
        _key(b2, P, S2)
        _key(salt, P, S2)
        if (Date.now() - start > MAX_EXECUTION_TIME) break
      }
    } else {
      for (i = 0; i < 64; i++)
        for (j = 0; j < clen >> 1; j++) _encipher(cdata, j << 1, P, S2)
      const ret = []
      for (i = 0; i < clen; i++)
        ret.push((cdata[i] >> 24 & 255) >>> 0), ret.push((cdata[i] >> 16 & 255) >>> 0), ret.push((cdata[i] >> 8 & 255) >>> 0), ret.push((cdata[i] & 255) >>> 0)
      if (callback) {
        callback(null, ret)
        return
      } else return ret
    }
    if (callback) nextTick(next)
  }
  __name(next, 'next')
  if (typeof callback !== 'undefined') {
    next()
  } else {
    let res
    while (true) if (typeof (res = next()) !== 'undefined') return res || []
  }
}
function _hash(password, salt, callback, progressCallback) {
  let err
  if (typeof password !== 'string' || typeof salt !== 'string') {
    err = Error('Invalid string / salt: Not a string')
    if (callback) {
      nextTick(callback.bind(this, err))
      return
    } else throw err
  }
  let minor, offset
  if (salt.charAt(0) !== '$' || salt.charAt(1) !== '2') {
    err = Error(`Invalid salt version: ${salt.substring(0, 2)}`)
    if (callback) {
      nextTick(callback.bind(this, err))
      return
    } else throw err
  }
  if (salt.charAt(2) === '$') minor = String.fromCharCode(0), offset = 3
  else {
    minor = salt.charAt(2)
    if (minor !== 'a' && minor !== 'b' && minor !== 'y' || salt.charAt(3) !== '$') {
      err = Error(`Invalid salt revision: ${salt.substring(2, 4)}`)
      if (callback) {
        nextTick(callback.bind(this, err))
        return
      } else throw err
    }
    offset = 4
  }
  if (salt.charAt(offset + 2) > '$') {
    err = Error('Missing salt rounds')
    if (callback) {
      nextTick(callback.bind(this, err))
      return
    } else throw err
  }
  const r1 = parseInt(salt.substring(offset, offset + 1), 10) * 10, r2 = parseInt(salt.substring(offset + 1, offset + 2), 10), rounds = r1 + r2, real_salt = salt.substring(offset + 3, offset + 25)
  password += minor >= 'a' ? '\0' : ''
  const passwordb = utf8Array(password), saltb = base64_decode(real_salt, BCRYPT_SALT_LEN)
  function finish(bytes) {
    const res = []
    res.push('$2')
    if (minor >= 'a') res.push(minor)
    res.push('$')
    if (rounds < 10) res.push('0')
    res.push(rounds.toString())
    res.push('$')
    res.push(base64_encode(saltb, saltb.length))
    res.push(base64_encode(bytes, C_ORIG.length * 4 - 1))
    return res.join('')
  }
  __name(finish, 'finish')
  if (typeof callback == 'undefined')
    return finish(_crypt(passwordb, saltb, rounds))
  else {
    _crypt(
      passwordb,
      saltb,
      rounds,
      function(err2, bytes) {
        if (err2) callback(err2, null)
        else callback(null, finish(bytes))
      },
      progressCallback
    )
  }
}
function encodeBase64(bytes, length) {
  return base64_encode(bytes, length)
}
function decodeBase64(string, length) {
  return base64_decode(string, length)
}
let import_crypto, randomFallback, nextTick, BASE64_CODE, BASE64_INDEX, BCRYPT_SALT_LEN, GENSALT_DEFAULT_LOG2_ROUNDS, BLOWFISH_NUM_ROUNDS, MAX_EXECUTION_TIME, P_ORIG, S_ORIG, C_ORIG, bcryptjs_default
const init_bcryptjs = __esm({
  '../node_modules/bcryptjs/index.js'() {
    init_functionsRoutes_0_7735455656432807()
    init_checked_fetch()
    import_crypto = __toESM(require_crypto(), 1)
    randomFallback = null
    __name(randomBytes, 'randomBytes')
    __name(setRandomFallback, 'setRandomFallback')
    __name(genSaltSync, 'genSaltSync')
    __name(genSalt, 'genSalt')
    __name(hashSync, 'hashSync')
    __name(hash, 'hash')
    __name(safeStringCompare, 'safeStringCompare')
    __name(compareSync, 'compareSync')
    __name(compare, 'compare')
    __name(getRounds, 'getRounds')
    __name(getSalt, 'getSalt')
    __name(truncates, 'truncates')
    nextTick = typeof process !== 'undefined' && process && typeof process.nextTick === 'function' ? typeof setImmediate === 'function' ? setImmediate : process.nextTick : setTimeout
    __name(utf8Length, 'utf8Length')
    __name(utf8Array, 'utf8Array')
    BASE64_CODE = './ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split('')
    BASE64_INDEX = [
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      0,
      1,
      54,
      55,
      56,
      57,
      58,
      59,
      60,
      61,
      62,
      63,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19,
      20,
      21,
      22,
      23,
      24,
      25,
      26,
      27,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      28,
      29,
      30,
      31,
      32,
      33,
      34,
      35,
      36,
      37,
      38,
      39,
      40,
      41,
      42,
      43,
      44,
      45,
      46,
      47,
      48,
      49,
      50,
      51,
      52,
      53,
      -1,
      -1,
      -1,
      -1,
      -1
    ]
    __name(base64_encode, 'base64_encode')
    __name(base64_decode, 'base64_decode')
    BCRYPT_SALT_LEN = 16
    GENSALT_DEFAULT_LOG2_ROUNDS = 10
    BLOWFISH_NUM_ROUNDS = 16
    MAX_EXECUTION_TIME = 100
    P_ORIG = [
      608135816,
      2242054355,
      320440878,
      57701188,
      2752067618,
      698298832,
      137296536,
      3964562569,
      1160258022,
      953160567,
      3193202383,
      887688300,
      3232508343,
      3380367581,
      1065670069,
      3041331479,
      2450970073,
      2306472731
    ]
    S_ORIG = [
      3509652390,
      2564797868,
      805139163,
      3491422135,
      3101798381,
      1780907670,
      3128725573,
      4046225305,
      614570311,
      3012652279,
      134345442,
      2240740374,
      1667834072,
      1901547113,
      2757295779,
      4103290238,
      227898511,
      1921955416,
      1904987480,
      2182433518,
      2069144605,
      3260701109,
      2620446009,
      720527379,
      3318853667,
      677414384,
      3393288472,
      3101374703,
      2390351024,
      1614419982,
      1822297739,
      2954791486,
      3608508353,
      3174124327,
      2024746970,
      1432378464,
      3864339955,
      2857741204,
      1464375394,
      1676153920,
      1439316330,
      715854006,
      3033291828,
      289532110,
      2706671279,
      2087905683,
      3018724369,
      1668267050,
      732546397,
      1947742710,
      3462151702,
      2609353502,
      2950085171,
      1814351708,
      2050118529,
      680887927,
      999245976,
      1800124847,
      3300911131,
      1713906067,
      1641548236,
      4213287313,
      1216130144,
      1575780402,
      4018429277,
      3917837745,
      3693486850,
      3949271944,
      596196993,
      3549867205,
      258830323,
      2213823033,
      772490370,
      2760122372,
      1774776394,
      2652871518,
      566650946,
      4142492826,
      1728879713,
      2882767088,
      1783734482,
      3629395816,
      2517608232,
      2874225571,
      1861159788,
      326777828,
      3124490320,
      2130389656,
      2716951837,
      967770486,
      1724537150,
      2185432712,
      2364442137,
      1164943284,
      2105845187,
      998989502,
      3765401048,
      2244026483,
      1075463327,
      1455516326,
      1322494562,
      910128902,
      469688178,
      1117454909,
      936433444,
      3490320968,
      3675253459,
      1240580251,
      122909385,
      2157517691,
      634681816,
      4142456567,
      3825094682,
      3061402683,
      2540495037,
      79693498,
      3249098678,
      1084186820,
      1583128258,
      426386531,
      1761308591,
      1047286709,
      322548459,
      995290223,
      1845252383,
      2603652396,
      3431023940,
      2942221577,
      3202600964,
      3727903485,
      1712269319,
      422464435,
      3234572375,
      1170764815,
      3523960633,
      3117677531,
      1434042557,
      442511882,
      3600875718,
      1076654713,
      1738483198,
      4213154764,
      2393238008,
      3677496056,
      1014306527,
      4251020053,
      793779912,
      2902807211,
      842905082,
      4246964064,
      1395751752,
      1040244610,
      2656851899,
      3396308128,
      445077038,
      3742853595,
      3577915638,
      679411651,
      2892444358,
      2354009459,
      1767581616,
      3150600392,
      3791627101,
      3102740896,
      284835224,
      4246832056,
      1258075500,
      768725851,
      2589189241,
      3069724005,
      3532540348,
      1274779536,
      3789419226,
      2764799539,
      1660621633,
      3471099624,
      4011903706,
      913787905,
      3497959166,
      737222580,
      2514213453,
      2928710040,
      3937242737,
      1804850592,
      3499020752,
      2949064160,
      2386320175,
      2390070455,
      2415321851,
      4061277028,
      2290661394,
      2416832540,
      1336762016,
      1754252060,
      3520065937,
      3014181293,
      791618072,
      3188594551,
      3933548030,
      2332172193,
      3852520463,
      3043980520,
      413987798,
      3465142937,
      3030929376,
      4245938359,
      2093235073,
      3534596313,
      375366246,
      2157278981,
      2479649556,
      555357303,
      3870105701,
      2008414854,
      3344188149,
      4221384143,
      3956125452,
      2067696032,
      3594591187,
      2921233993,
      2428461,
      544322398,
      577241275,
      1471733935,
      610547355,
      4027169054,
      1432588573,
      1507829418,
      2025931657,
      3646575487,
      545086370,
      48609733,
      2200306550,
      1653985193,
      298326376,
      1316178497,
      3007786442,
      2064951626,
      458293330,
      2589141269,
      3591329599,
      3164325604,
      727753846,
      2179363840,
      146436021,
      1461446943,
      4069977195,
      705550613,
      3059967265,
      3887724982,
      4281599278,
      3313849956,
      1404054877,
      2845806497,
      146425753,
      1854211946,
      1266315497,
      3048417604,
      3681880366,
      3289982499,
      290971e4,
      1235738493,
      2632868024,
      2414719590,
      3970600049,
      1771706367,
      1449415276,
      3266420449,
      422970021,
      1963543593,
      2690192192,
      3826793022,
      1062508698,
      1531092325,
      1804592342,
      2583117782,
      2714934279,
      4024971509,
      1294809318,
      4028980673,
      1289560198,
      2221992742,
      1669523910,
      35572830,
      157838143,
      1052438473,
      1016535060,
      1802137761,
      1753167236,
      1386275462,
      3080475397,
      2857371447,
      1040679964,
      2145300060,
      2390574316,
      1461121720,
      2956646967,
      4031777805,
      4028374788,
      33600511,
      2920084762,
      1018524850,
      629373528,
      3691585981,
      3515945977,
      2091462646,
      2486323059,
      586499841,
      988145025,
      935516892,
      3367335476,
      2599673255,
      2839830854,
      265290510,
      3972581182,
      2759138881,
      3795373465,
      1005194799,
      847297441,
      406762289,
      1314163512,
      1332590856,
      1866599683,
      4127851711,
      750260880,
      613907577,
      1450815602,
      3165620655,
      3734664991,
      3650291728,
      3012275730,
      3704569646,
      1427272223,
      778793252,
      1343938022,
      2676280711,
      2052605720,
      1946737175,
      3164576444,
      3914038668,
      3967478842,
      3682934266,
      1661551462,
      3294938066,
      4011595847,
      840292616,
      3712170807,
      616741398,
      312560963,
      711312465,
      1351876610,
      322626781,
      1910503582,
      271666773,
      2175563734,
      1594956187,
      70604529,
      3617834859,
      1007753275,
      1495573769,
      4069517037,
      2549218298,
      2663038764,
      504708206,
      2263041392,
      3941167025,
      2249088522,
      1514023603,
      1998579484,
      1312622330,
      694541497,
      2582060303,
      2151582166,
      1382467621,
      776784248,
      2618340202,
      3323268794,
      2497899128,
      2784771155,
      503983604,
      4076293799,
      907881277,
      423175695,
      432175456,
      1378068232,
      4145222326,
      3954048622,
      3938656102,
      3820766613,
      2793130115,
      2977904593,
      26017576,
      3274890735,
      3194772133,
      1700274565,
      1756076034,
      4006520079,
      3677328699,
      720338349,
      1533947780,
      354530856,
      688349552,
      3973924725,
      1637815568,
      332179504,
      3949051286,
      53804574,
      2852348879,
      3044236432,
      1282449977,
      3583942155,
      3416972820,
      4006381244,
      1617046695,
      2628476075,
      3002303598,
      1686838959,
      431878346,
      2686675385,
      1700445008,
      1080580658,
      1009431731,
      832498133,
      3223435511,
      2605976345,
      2271191193,
      2516031870,
      1648197032,
      4164389018,
      2548247927,
      300782431,
      375919233,
      238389289,
      3353747414,
      2531188641,
      2019080857,
      1475708069,
      455242339,
      2609103871,
      448939670,
      3451063019,
      1395535956,
      2413381860,
      1841049896,
      1491858159,
      885456874,
      4264095073,
      4001119347,
      1565136089,
      3898914787,
      1108368660,
      540939232,
      1173283510,
      2745871338,
      3681308437,
      4207628240,
      3343053890,
      4016749493,
      1699691293,
      1103962373,
      3625875870,
      2256883143,
      3830138730,
      1031889488,
      3479347698,
      1535977030,
      4236805024,
      3251091107,
      2132092099,
      1774941330,
      1199868427,
      1452454533,
      157007616,
      2904115357,
      342012276,
      595725824,
      1480756522,
      206960106,
      497939518,
      591360097,
      863170706,
      2375253569,
      3596610801,
      1814182875,
      2094937945,
      3421402208,
      1082520231,
      3463918190,
      2785509508,
      435703966,
      3908032597,
      1641649973,
      2842273706,
      3305899714,
      1510255612,
      2148256476,
      2655287854,
      3276092548,
      4258621189,
      236887753,
      3681803219,
      274041037,
      1734335097,
      3815195456,
      3317970021,
      1899903192,
      1026095262,
      4050517792,
      356393447,
      2410691914,
      3873677099,
      3682840055,
      3913112168,
      2491498743,
      4132185628,
      2489919796,
      1091903735,
      1979897079,
      3170134830,
      3567386728,
      3557303409,
      857797738,
      1136121015,
      1342202287,
      507115054,
      2535736646,
      337727348,
      3213592640,
      1301675037,
      2528481711,
      1895095763,
      1721773893,
      3216771564,
      62756741,
      2142006736,
      835421444,
      2531993523,
      1442658625,
      3659876326,
      2882144922,
      676362277,
      1392781812,
      170690266,
      3921047035,
      1759253602,
      3611846912,
      1745797284,
      664899054,
      1329594018,
      3901205900,
      3045908486,
      2062866102,
      2865634940,
      3543621612,
      3464012697,
      1080764994,
      553557557,
      3656615353,
      3996768171,
      991055499,
      499776247,
      1265440854,
      648242737,
      3940784050,
      980351604,
      3713745714,
      1749149687,
      3396870395,
      4211799374,
      3640570775,
      1161844396,
      3125318951,
      1431517754,
      545492359,
      4268468663,
      3499529547,
      1437099964,
      2702547544,
      3433638243,
      2581715763,
      2787789398,
      1060185593,
      1593081372,
      2418618748,
      4260947970,
      69676912,
      2159744348,
      86519011,
      2512459080,
      3838209314,
      1220612927,
      3339683548,
      133810670,
      1090789135,
      1078426020,
      1569222167,
      845107691,
      3583754449,
      4072456591,
      1091646820,
      628848692,
      1613405280,
      3757631651,
      526609435,
      236106946,
      48312990,
      2942717905,
      3402727701,
      1797494240,
      859738849,
      992217954,
      4005476642,
      2243076622,
      3870952857,
      3732016268,
      765654824,
      3490871365,
      2511836413,
      1685915746,
      3888969200,
      1414112111,
      2273134842,
      3281911079,
      4080962846,
      172450625,
      2569994100,
      980381355,
      4109958455,
      2819808352,
      2716589560,
      2568741196,
      3681446669,
      3329971472,
      1835478071,
      660984891,
      3704678404,
      4045999559,
      3422617507,
      3040415634,
      1762651403,
      1719377915,
      3470491036,
      2693910283,
      3642056355,
      3138596744,
      1364962596,
      2073328063,
      1983633131,
      926494387,
      3423689081,
      2150032023,
      4096667949,
      1749200295,
      3328846651,
      309677260,
      2016342300,
      1779581495,
      3079819751,
      111262694,
      1274766160,
      443224088,
      298511866,
      1025883608,
      3806446537,
      1145181785,
      168956806,
      3641502830,
      3584813610,
      1689216846,
      3666258015,
      3200248200,
      1692713982,
      2646376535,
      4042768518,
      1618508792,
      1610833997,
      3523052358,
      4130873264,
      2001055236,
      3610705100,
      2202168115,
      4028541809,
      2961195399,
      1006657119,
      2006996926,
      3186142756,
      1430667929,
      3210227297,
      1314452623,
      4074634658,
      4101304120,
      2273951170,
      1399257539,
      3367210612,
      3027628629,
      1190975929,
      2062231137,
      2333990788,
      2221543033,
      2438960610,
      1181637006,
      548689776,
      2362791313,
      3372408396,
      3104550113,
      3145860560,
      296247880,
      1970579870,
      3078560182,
      3769228297,
      1714227617,
      3291629107,
      3898220290,
      166772364,
      1251581989,
      493813264,
      448347421,
      195405023,
      2709975567,
      677966185,
      3703036547,
      1463355134,
      2715995803,
      1338867538,
      1343315457,
      2802222074,
      2684532164,
      233230375,
      2599980071,
      2000651841,
      3277868038,
      1638401717,
      4028070440,
      3237316320,
      6314154,
      819756386,
      300326615,
      590932579,
      1405279636,
      3267499572,
      3150704214,
      2428286686,
      3959192993,
      3461946742,
      1862657033,
      1266418056,
      963775037,
      2089974820,
      2263052895,
      1917689273,
      448879540,
      3550394620,
      3981727096,
      150775221,
      3627908307,
      1303187396,
      508620638,
      2975983352,
      2726630617,
      1817252668,
      1876281319,
      1457606340,
      908771278,
      3720792119,
      3617206836,
      2455994898,
      1729034894,
      1080033504,
      976866871,
      3556439503,
      2881648439,
      1522871579,
      1555064734,
      1336096578,
      3548522304,
      2579274686,
      3574697629,
      3205460757,
      3593280638,
      3338716283,
      3079412587,
      564236357,
      2993598910,
      1781952180,
      1464380207,
      3163844217,
      3332601554,
      1699332808,
      1393555694,
      1183702653,
      3581086237,
      1288719814,
      691649499,
      2847557200,
      2895455976,
      3193889540,
      2717570544,
      1781354906,
      1676643554,
      2592534050,
      3230253752,
      1126444790,
      2770207658,
      2633158820,
      2210423226,
      2615765581,
      2414155088,
      3127139286,
      673620729,
      2805611233,
      1269405062,
      4015350505,
      3341807571,
      4149409754,
      1057255273,
      2012875353,
      2162469141,
      2276492801,
      2601117357,
      993977747,
      3918593370,
      2654263191,
      753973209,
      36408145,
      2530585658,
      25011837,
      3520020182,
      2088578344,
      530523599,
      2918365339,
      1524020338,
      1518925132,
      3760827505,
      3759777254,
      1202760957,
      3985898139,
      3906192525,
      674977740,
      4174734889,
      2031300136,
      2019492241,
      3983892565,
      4153806404,
      3822280332,
      352677332,
      2297720250,
      60907813,
      90501309,
      3286998549,
      1016092578,
      2535922412,
      2839152426,
      457141659,
      509813237,
      4120667899,
      652014361,
      1966332200,
      2975202805,
      55981186,
      2327461051,
      676427537,
      3255491064,
      2882294119,
      3433927263,
      1307055953,
      942726286,
      933058658,
      2468411793,
      3933900994,
      4215176142,
      1361170020,
      2001714738,
      2830558078,
      3274259782,
      1222529897,
      1679025792,
      2729314320,
      3714953764,
      1770335741,
      151462246,
      3013232138,
      1682292957,
      1483529935,
      471910574,
      1539241949,
      458788160,
      3436315007,
      1807016891,
      3718408830,
      978976581,
      1043663428,
      3165965781,
      1927990952,
      4200891579,
      2372276910,
      3208408903,
      3533431907,
      1412390302,
      2931980059,
      4132332400,
      1947078029,
      3881505623,
      4168226417,
      2941484381,
      1077988104,
      1320477388,
      886195818,
      18198404,
      3786409e3,
      2509781533,
      112762804,
      3463356488,
      1866414978,
      891333506,
      18488651,
      661792760,
      1628790961,
      3885187036,
      3141171499,
      876946877,
      2693282273,
      1372485963,
      791857591,
      2686433993,
      3759982718,
      3167212022,
      3472953795,
      2716379847,
      445679433,
      3561995674,
      3504004811,
      3574258232,
      54117162,
      3331405415,
      2381918588,
      3769707343,
      4154350007,
      1140177722,
      4074052095,
      668550556,
      3214352940,
      367459370,
      261225585,
      2610173221,
      4209349473,
      3468074219,
      3265815641,
      314222801,
      3066103646,
      3808782860,
      282218597,
      3406013506,
      3773591054,
      379116347,
      1285071038,
      846784868,
      2669647154,
      3771962079,
      3550491691,
      2305946142,
      453669953,
      1268987020,
      3317592352,
      3279303384,
      3744833421,
      2610507566,
      3859509063,
      266596637,
      3847019092,
      517658769,
      3462560207,
      3443424879,
      370717030,
      4247526661,
      2224018117,
      4143653529,
      4112773975,
      2788324899,
      2477274417,
      1456262402,
      2901442914,
      1517677493,
      1846949527,
      2295493580,
      3734397586,
      2176403920,
      1280348187,
      1908823572,
      3871786941,
      846861322,
      1172426758,
      3287448474,
      3383383037,
      1655181056,
      3139813346,
      901632758,
      1897031941,
      2986607138,
      3066810236,
      3447102507,
      1393639104,
      373351379,
      950779232,
      625454576,
      3124240540,
      4148612726,
      2007998917,
      544563296,
      2244738638,
      2330496472,
      2058025392,
      1291430526,
      424198748,
      50039436,
      29584100,
      3605783033,
      2429876329,
      2791104160,
      1057563949,
      3255363231,
      3075367218,
      3463963227,
      1469046755,
      985887462
    ]
    C_ORIG = [
      1332899944,
      1700884034,
      1701343084,
      1684370003,
      1668446532,
      1869963892
    ]
    __name(_encipher, '_encipher')
    __name(_streamtoword, '_streamtoword')
    __name(_key, '_key')
    __name(_ekskey, '_ekskey')
    __name(_crypt, '_crypt')
    __name(_hash, '_hash')
    __name(encodeBase64, 'encodeBase64')
    __name(decodeBase64, 'decodeBase64')
    bcryptjs_default = {
      setRandomFallback,
      genSaltSync,
      genSalt,
      hashSync,
      hash,
      compareSync,
      compare,
      getRounds,
      getSalt,
      truncates,
      encodeBase64,
      decodeBase64
    }
  }
})

// migrate.ts
let onRequestPost
const init_migrate = __esm({
  'migrate.ts'() {
    init_functionsRoutes_0_7735455656432807()
    init_checked_fetch()
    init_serverless()
    init_bcryptjs()
    onRequestPost = /* @__PURE__ */ __name(async (context) => {
      const { request, env } = context
      try {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader || authHeader !== `Bearer ${env.JWT_SECRET}`) {
          return new Response('Unauthorized', { status: 401 })
        }
        const sql = cs(env.DATABASE_URL)
        console.log('\u{1F680} \u958B\u59CB\u57F7\u884C\u7DDA\u4E0A\u74B0\u5883\u7528\u6236\u89D2\u8272\u7CFB\u7D71\u9077\u79FB...')
        await sql`
      CREATE TABLE IF NOT EXISTS migrations (
        id VARCHAR(255) PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
        const existingMigrations = await sql`
      SELECT id FROM migrations 
      WHERE id = 'roles_migration_production'
    `
        const migrationResult = {
          alreadyMigrated: false,
          adminCreated: false,
          userStats: null
        }
        if (existingMigrations.length > 0) {
          migrationResult.alreadyMigrated = true
        } else {
          try {
            await sql`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check`
          } catch (error) {
          }
          const invalidUsers = await sql`
        SELECT id, email, user_type 
        FROM users 
        WHERE user_type NOT IN ('admin', 'instructor', 'employer', 'job_seeker')
      `
          if (invalidUsers.length > 0) {
            for (const user of invalidUsers) {
              await sql`
            UPDATE users 
            SET user_type = 'job_seeker' 
            WHERE id = ${user.id}
          `
            }
          }
          await sql`
        ALTER TABLE users 
        ADD CONSTRAINT users_user_type_check 
        CHECK (user_type IN ('admin', 'instructor', 'employer', 'job_seeker'))
      `
          await sql`
        INSERT INTO migrations (id, filename) 
        VALUES ('roles_migration_production', 'roles_migration_production.sql')
      `
        }
        const adminCheck = await sql`
      SELECT COUNT(*) as count FROM users WHERE user_type = 'admin'
    `
        const adminCount = parseInt(adminCheck[0]?.count || '0')
        if (adminCount === 0) {
          const existingUser = await sql`
        SELECT id FROM users WHERE email = 'admin@ttqs.com'
      `
          if (existingUser.length > 0) {
            await sql`
          UPDATE users 
          SET user_type = 'admin', 
              first_name = '系統', 
              last_name = '管理員',
              updated_at = CURRENT_TIMESTAMP
          WHERE email = 'admin@ttqs.com'
        `
            migrationResult.adminCreated = true
          } else {
            const defaultPassword = 'admin123'
            const hashedPassword = await bcryptjs_default.hash(defaultPassword, 10)
            await sql`
          INSERT INTO users (email, password_hash, user_type, first_name, last_name, phone)
          VALUES (
            'admin@ttqs.com',
            ${hashedPassword},
            'admin',
            '系統',
            '管理員',
            '0900000000'
          )
        `
            migrationResult.adminCreated = true
          }
        }
        const userStats = await sql`
      SELECT 
        user_type,
        COUNT(*) as count,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
      FROM users 
      GROUP BY user_type
      ORDER BY 
        CASE user_type 
          WHEN 'admin' THEN 1 
          WHEN 'instructor' THEN 2 
          WHEN 'employer' THEN 3 
          WHEN 'job_seeker' THEN 4 
          ELSE 5 
        END
    `
        migrationResult.userStats = userStats
        return Response.json({
          success: true,
          message: '\u7528\u6236\u89D2\u8272\u7CFB\u7D71\u9077\u79FB\u5B8C\u6210',
          data: migrationResult
        })
      } catch (error) {
        console.error('\u9077\u79FB\u5931\u6557:', error)
        return Response.json(
          {
            success: false,
            message: '\u9077\u79FB\u5931\u6557',
            error: error instanceof Error ? error.message : String(error)
          },
          { status: 500 }
        )
      }
    }, 'onRequestPost')
  }
})

// _middleware.ts
async function onRequest3(context) {
  const response = await context.next()
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  if (context.request.url.includes('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Request-ID'
    )
    response.headers.set('Access-Control-Expose-Headers', 'X-Request-ID')
  }
  return response
}
const init_middleware = __esm({
  '_middleware.ts'() {
    init_functionsRoutes_0_7735455656432807()
    init_checked_fetch()
    __name(onRequest3, 'onRequest')
  }
})

// ../.wrangler/tmp/pages-XT0Qmh/functionsRoutes-0.7735455656432807.mjs
let routes
var init_functionsRoutes_0_7735455656432807 = __esm({
  '../.wrangler/tmp/pages-XT0Qmh/functionsRoutes-0.7735455656432807.mjs'() {
    init_courses()
    init_courses()
    init_path()
    init_v1()
    init_migrate()
    init_middleware()
    routes = [
      {
        routePath: '/api/v1/courses',
        mountPath: '/api/v1',
        method: 'GET',
        middlewares: [],
        modules: [onRequestGet]
      },
      {
        routePath: '/api/v1/courses',
        mountPath: '/api/v1',
        method: 'OPTIONS',
        middlewares: [],
        modules: [onRequestOptions]
      },
      {
        routePath: '/api/v1/:path*',
        mountPath: '/api/v1',
        method: '',
        middlewares: [],
        modules: [onRequest]
      },
      {
        routePath: '/api/v1',
        mountPath: '/api/v1',
        method: '',
        middlewares: [],
        modules: [onRequest2]
      },
      {
        routePath: '/migrate',
        mountPath: '/',
        method: 'POST',
        middlewares: [],
        modules: [onRequestPost]
      },
      {
        routePath: '/',
        mountPath: '/',
        method: '',
        middlewares: [onRequest3],
        modules: []
      }
    ]
  }
})

// ../.wrangler/tmp/bundle-JSLPnp/middleware-loader.entry.ts
init_functionsRoutes_0_7735455656432807()
init_checked_fetch()

// ../.wrangler/tmp/bundle-JSLPnp/middleware-insertion-facade.js
init_functionsRoutes_0_7735455656432807()
init_checked_fetch()

// ../node_modules/wrangler/templates/pages-template-worker.ts
init_functionsRoutes_0_7735455656432807()
init_checked_fetch()

// ../node_modules/path-to-regexp/dist.es2015/index.js
init_functionsRoutes_0_7735455656432807()
init_checked_fetch()
function lexer(str) {
  const tokens = []
  let i = 0
  while (i < str.length) {
    const char = str[i]
    if (char === '*' || char === '+' || char === '?') {
      tokens.push({ type: 'MODIFIER', index: i, value: str[i++] })
      continue
    }
    if (char === '\\') {
      tokens.push({ type: 'ESCAPED_CHAR', index: i++, value: str[i++] })
      continue
    }
    if (char === '{') {
      tokens.push({ type: 'OPEN', index: i, value: str[i++] })
      continue
    }
    if (char === '}') {
      tokens.push({ type: 'CLOSE', index: i, value: str[i++] })
      continue
    }
    if (char === ':') {
      let name = ''
      var j = i + 1
      while (j < str.length) {
        const code = str.charCodeAt(j)
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++]
          continue
        }
        break
      }
      if (!name)
        throw new TypeError('Missing parameter name at '.concat(i))
      tokens.push({ type: 'NAME', index: i, value: name })
      i = j
      continue
    }
    if (char === '(') {
      let count = 1
      let pattern = ''
      var j = i + 1
      if (str[j] === '?') {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j))
      }
      while (j < str.length) {
        if (str[j] === '\\') {
          pattern += str[j++] + str[j++]
          continue
        }
        if (str[j] === ')') {
          count--
          if (count === 0) {
            j++
            break
          }
        } else if (str[j] === '(') {
          count++
          if (str[j + 1] !== '?') {
            throw new TypeError('Capturing groups are not allowed at '.concat(j))
          }
        }
        pattern += str[j++]
      }
      if (count)
        throw new TypeError('Unbalanced pattern at '.concat(i))
      if (!pattern)
        throw new TypeError('Missing pattern at '.concat(i))
      tokens.push({ type: 'PATTERN', index: i, value: pattern })
      i = j
      continue
    }
    tokens.push({ type: 'CHAR', index: i, value: str[i++] })
  }
  tokens.push({ type: 'END', index: i, value: '' })
  return tokens
}
__name(lexer, 'lexer')
function parse(str, options) {
  if (options === void 0) {
    options = {}
  }
  const tokens = lexer(str)
  const _a = options.prefixes, prefixes = _a === void 0 ? './' : _a, _b = options.delimiter, delimiter = _b === void 0 ? '/#?' : _b
  const result = []
  let key = 0
  let i = 0
  let path = ''
  const tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value
  }, 'tryConsume')
  const mustConsume = /* @__PURE__ */ __name(function(type) {
    const value2 = tryConsume(type)
    if (value2 !== void 0)
      return value2
    const _a2 = tokens[i], nextType = _a2.type, index = _a2.index
    throw new TypeError('Unexpected '.concat(nextType, ' at ').concat(index, ', expected ').concat(type))
  }, 'mustConsume')
  const consumeText = /* @__PURE__ */ __name(function() {
    let result2 = ''
    let value2
    while (value2 = tryConsume('CHAR') || tryConsume('ESCAPED_CHAR')) {
      result2 += value2
    }
    return result2
  }, 'consumeText')
  const isSafe = /* @__PURE__ */ __name(function(value2) {
    for (let _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      const char2 = delimiter_1[_i]
      if (value2.indexOf(char2) > -1)
        return true
    }
    return false
  }, 'isSafe')
  const safePattern = /* @__PURE__ */ __name(function(prefix2) {
    const prev = result[result.length - 1]
    const prevText = prefix2 || (prev && typeof prev === 'string' ? prev : '')
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'))
    }
    if (!prevText || isSafe(prevText))
      return '[^'.concat(escapeString(delimiter), ']+?')
    return '(?:(?!'.concat(escapeString(prevText), ')[^').concat(escapeString(delimiter), '])+?')
  }, 'safePattern')
  while (i < tokens.length) {
    const char = tryConsume('CHAR')
    const name = tryConsume('NAME')
    const pattern = tryConsume('PATTERN')
    if (name || pattern) {
      var prefix = char || ''
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix
        prefix = ''
      }
      if (path) {
        result.push(path)
        path = ''
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: '',
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume('MODIFIER') || ''
      })
      continue
    }
    const value = char || tryConsume('ESCAPED_CHAR')
    if (value) {
      path += value
      continue
    }
    if (path) {
      result.push(path)
      path = ''
    }
    const open = tryConsume('OPEN')
    if (open) {
      var prefix = consumeText()
      const name_1 = tryConsume('NAME') || ''
      const pattern_1 = tryConsume('PATTERN') || ''
      const suffix = consumeText()
      mustConsume('CLOSE')
      result.push({
        name: name_1 || (pattern_1 ? key++ : ''),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume('MODIFIER') || ''
      })
      continue
    }
    mustConsume('END')
  }
  return result
}
__name(parse, 'parse')
function match(str, options) {
  const keys = []
  const re = pathToRegexp(str, keys, options)
  return regexpToFunction(re, keys, options)
}
__name(match, 'match')
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {}
  }
  const _a = options.decode, decode = _a === void 0 ? function(x2) {
    return x2
  } : _a
  return function(pathname) {
    const m2 = re.exec(pathname)
    if (!m2)
      return false
    const path = m2[0], index = m2.index
    const params = /* @__PURE__ */ Object.create(null)
    const _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m2[i2] === void 0)
        return 'continue'
      const key = keys[i2 - 1]
      if (key.modifier === '*' || key.modifier === '+') {
        params[key.name] = m2[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key)
        })
      } else {
        params[key.name] = decode(m2[i2], key)
      }
    }, '_loop_1')
    for (let i = 1; i < m2.length; i++) {
      _loop_1(i)
    }
    return { path, index, params }
  }
}
__name(regexpToFunction, 'regexpToFunction')
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1')
}
__name(escapeString, 'escapeString')
function flags(options) {
  return options && options.sensitive ? '' : 'i'
}
__name(flags, 'flags')
function regexpToRegexp(path, keys) {
  if (!keys)
    return path
  const groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g
  let index = 0
  let execResult = groupsRegex.exec(path.source)
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: '',
      suffix: '',
      modifier: '',
      pattern: ''
    })
    execResult = groupsRegex.exec(path.source)
  }
  return path
}
__name(regexpToRegexp, 'regexpToRegexp')
function arrayToRegexp(paths, keys, options) {
  const parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source
  })
  return new RegExp('(?:'.concat(parts.join('|'), ')'), flags(options))
}
__name(arrayToRegexp, 'arrayToRegexp')
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options)
}
__name(stringToRegexp, 'stringToRegexp')
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {}
  }
  const _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x2) {
      return x2
    } : _d, _e = options.delimiter, delimiter = _e === void 0 ? '/#?' : _e, _f = options.endsWith, endsWith = _f === void 0 ? '' : _f
  const endsWithRe = '['.concat(escapeString(endsWith), ']|$')
  const delimiterRe = '['.concat(escapeString(delimiter), ']')
  let route = start ? '^' : ''
  for (let _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    const token = tokens_1[_i]
    if (typeof token === 'string') {
      route += escapeString(encode(token))
    } else {
      const prefix = escapeString(encode(token.prefix))
      const suffix = escapeString(encode(token.suffix))
      if (token.pattern) {
        if (keys)
          keys.push(token)
        if (prefix || suffix) {
          if (token.modifier === '+' || token.modifier === '*') {
            const mod = token.modifier === '*' ? '?' : ''
            route += '(?:'.concat(prefix, '((?:').concat(token.pattern, ')(?:').concat(suffix).concat(prefix, '(?:').concat(token.pattern, '))*)').concat(suffix, ')').concat(mod)
          } else {
            route += '(?:'.concat(prefix, '(').concat(token.pattern, ')').concat(suffix, ')').concat(token.modifier)
          }
        } else {
          if (token.modifier === '+' || token.modifier === '*') {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'))
          }
          route += '('.concat(token.pattern, ')').concat(token.modifier)
        }
      } else {
        route += '(?:'.concat(prefix).concat(suffix, ')').concat(token.modifier)
      }
    }
  }
  if (end) {
    if (!strict)
      route += ''.concat(delimiterRe, '?')
    route += !options.endsWith ? '$' : '(?='.concat(endsWithRe, ')')
  } else {
    const endToken = tokens[tokens.length - 1]
    const isEndDelimited = typeof endToken === 'string' ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0
    if (!strict) {
      route += '(?:'.concat(delimiterRe, '(?=').concat(endsWithRe, '))?')
    }
    if (!isEndDelimited) {
      route += '(?='.concat(delimiterRe, '|').concat(endsWithRe, ')')
    }
  }
  return new RegExp(route, flags(options))
}
__name(tokensToRegexp, 'tokensToRegexp')
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys)
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options)
  return stringToRegexp(path, keys, options)
}
__name(pathToRegexp, 'pathToRegexp')

// ../node_modules/wrangler/templates/pages-template-worker.ts
const escapeRegex = /[.+?^${}()|[\]\\]/g
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, '\\$&'), {
      end: false
    })
    const mountMatcher = match(route.mountPath.replace(escapeRegex, '\\$&'), {
      end: false
    })
    const matchResult = routeMatcher(requestPath)
    const mountMatchResult = mountMatcher(requestPath)
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        }
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, '\\$&'), {
      end: true
    })
    const mountMatcher = match(route.mountPath.replace(escapeRegex, '\\$&'), {
      end: false
    })
    const matchResult = routeMatcher(requestPath)
    const mountMatchResult = mountMatcher(requestPath)
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        }
      }
      break
    }
  }
}
__name(executeRequest, 'executeRequest')
const pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest
    const handlerIterator = executeRequest(request)
    let data = {}
    let isFailOpen = false
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input
        if (typeof input === 'string') {
          url = new URL(input, request.url).toString()
        }
        request = new Request(url, init)
      }
      const result = handlerIterator.next()
      if (result.done === false) {
        const { handler, params, path } = result.value
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data
          },
          set data(value) {
            if (typeof value !== 'object' || value === null) {
              throw new Error('context.data must be an object')
            }
            data = value
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true
          }, 'passThroughOnException')
        }
        const response = await handler(context)
        if (!(response instanceof Response)) {
          throw new Error('Your Pages function should return a Response')
        }
        return cloneResponse(response)
      } else if ('ASSETS') {
        const response = await env['ASSETS'].fetch(request)
        return cloneResponse(response)
      } else {
        const response = await fetch(request)
        return cloneResponse(response)
      }
    }, 'next')
    try {
      return await next()
    } catch (error) {
      if (isFailOpen) {
        const response = await env['ASSETS'].fetch(request)
        return cloneResponse(response)
      }
      throw error
    }
  }
}
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), 'cloneResponse')

// ../node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
init_functionsRoutes_0_7735455656432807()
init_checked_fetch()
const drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env)
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader()
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error('Failed to drain the unused request body.', e)
    }
  }
}, 'drainBody')
const middleware_ensure_req_body_drained_default = drainBody

// ../node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
init_functionsRoutes_0_7735455656432807()
init_checked_fetch()
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  }
}
__name(reduceError, 'reduceError')
const jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env)
  } catch (e) {
    const error = reduceError(e)
    return Response.json(error, {
      status: 500,
      headers: { 'MF-Experimental-Error-Stack': 'true' }
    })
  }
}, 'jsonError')
const middleware_miniflare3_json_error_default = jsonError

// ../.wrangler/tmp/bundle-JSLPnp/middleware-insertion-facade.js
const __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
]
const middleware_insertion_facade_default = pages_template_worker_default

// ../node_modules/wrangler/templates/middleware/common.ts
init_functionsRoutes_0_7735455656432807()
init_checked_fetch()
const __facade_middleware__ = []
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat())
}
__name(__facade_register__, '__facade_register__')
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail)
    }
  }
  return head(request, env, ctx, middlewareCtx)
}
__name(__facade_invokeChain__, '__facade_invokeChain__')
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ])
}
__name(__facade_invoke__, '__facade_invoke__')

// ../.wrangler/tmp/bundle-JSLPnp/middleware-loader.entry.ts
const __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime
    this.cron = cron
    this.#noRetry = noRetry
  }
  static {
    __name(this, '__Facade_ScheduledController__')
  }
  #noRetry
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError('Illegal invocation')
    }
    this.#noRetry()
  }
}
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware)
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error('Handler does not export a fetch() function.')
    }
    return worker.fetch(request, env, ctx)
  }, 'fetchDispatcher')
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === 'scheduled' && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? '',
            () => {
            }
          )
          return worker.scheduled(controller, env, ctx)
        }
      }, 'dispatcher')
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher)
    }
  }
}
__name(wrapExportedHandler, 'wrapExportedHandler')
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware)
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env
      this.ctx = ctx
      if (super.fetch === void 0) {
        throw new Error('Entrypoint class does not define a fetch() function.')
      }
      return super.fetch(request)
    }, '#fetchDispatcher')
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === 'scheduled' && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? '',
          () => {
          }
        )
        return super.scheduled(controller)
      }
    }, '#dispatcher')
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      )
    }
  }
}
__name(wrapWorkerEntrypoint, 'wrapWorkerEntrypoint')
let WRAPPED_ENTRY
if (typeof middleware_insertion_facade_default === 'object') {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default)
} else if (typeof middleware_insertion_facade_default === 'function') {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default)
}
const middleware_loader_entry_default = WRAPPED_ENTRY
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
}
/*! Bundled license information:

@neondatabase/serverless/index.mjs:
  (*! Bundled license information:

  ieee754/index.js:
    (*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> *)

  buffer/index.js:
    (*!
     * The buffer module from node.js, for the browser.
     *
     * @author   Feross Aboukhadijeh <https://feross.org>
     * @license  MIT
     *)
  *)
*/
//# sourceMappingURL=functionsWorker-0.09969113945550345.mjs.map
