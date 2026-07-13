/**
 * 网络请求封装
 * 对应 Kuikly: BaseViewModel.kt 中的 doGet / doPost 逻辑
 *
 * 核心功能：
 * 1. wx.request Promise 化
 * 2. 自动注入 Authorization: Bearer token
 * 3. 响应拦截: code=200 成功 / code=401 自动刷新 Token 重试 / 其他 reject
 * 4. 主动刷新: Token 剩余 < 5 分钟时提前刷新
 */

const auth = require('./auth')
const { BASE_URL, AGENT_BASE_URL } = require('./config')

// Token 刷新锁，防止并发刷新
let isRefreshing = false
let refreshSubscribers = []

function onTokenRefreshed(newToken) {
  refreshSubscribers.forEach(cb => cb(newToken))
  refreshSubscribers = []
}

function addRefreshSubscriber(cb) {
  refreshSubscribers.push(cb)
}

/**
 * 构建完整 URL
 * 对应 Kuikly: BaseViewModel.doPostImpl 中的 fullUrl 逻辑
 * @param {string} url 接口路径
 * @returns {string} 完整 URL
 */
function buildFullUrl(url) {
  if (url.startsWith('http')) return url
  if (url.startsWith('/v1o5') || url.startsWith(AGENT_BASE_URL)) {
    return AGENT_BASE_URL + url.replace(/^\/v1o5/, '')
  }
  return BASE_URL + url
}

/**
 * 构建请求头
 * @param {boolean} requiresAuth 是否需要认证
 */
function buildHeaders(requiresAuth) {
  const headers = {
    'Content-Type': 'application/json'
  }
  if (requiresAuth) {
    const token = auth.getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }
  return headers
}

/**
 * 刷新 Token（独立方法，供 auth API 和拦截器共用）
 * @returns {Promise<string>} 新的 access_token
 */
function doRefreshToken() {
  const refreshToken = auth.getRefreshToken()
  if (!refreshToken) {
    return Promise.reject(new Error('无 RefreshToken'))
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}/pass/token/refresh`,
      method: 'POST',
      data: { refresh_token: refreshToken },
      header: { 'Content-Type': 'application/json' },
      success(res) {
        const data = res.data || {}
        if (data.code === 200 && data.data) {
          const newToken = data.data.token || ''
          const newRefreshToken = data.data.refreshToken || ''
          const expiresIn = data.data.expires_in || 7200

          if (newToken) {
            if (newRefreshToken) auth.saveRefreshToken(newRefreshToken)
            auth.saveToken(newToken, newRefreshToken)
            auth.saveExpiresAt(expiresIn)
            resolve(newToken)
          } else {
            auth.clearAuth()
            reject(new Error('刷新返回 token 为空'))
          }
        } else {
          auth.clearAuth()
          reject(new Error(data.msg || 'Token 刷新失败'))
        }
      },
      fail(err) {
        console.error('[Request] Token 刷新网络失败:', err)
        auth.clearAuth()
        reject(new Error('网络请求失败'))
      }
    })
  })
}

/**
 * 主动刷新 Token 后重试
 * 对应 Kuikly: BaseViewModel.proactiveRefreshAndRetry()
 * @param {Function} retryFn 刷新成功后执行的请求函数
 * @returns {Promise}
 */
function proactiveRefreshAndRetry(retryFn) {
  const refreshToken = auth.getRefreshToken()
  if (!refreshToken) {
    auth.clearAuth()
    return Promise.reject(new Error('登录已过期，请重新登录'))
  }

  return doRefreshToken().then(() => {
    return retryFn()
  }).catch(err => {
    auth.clearAuth()
    return Promise.reject(err)
  })
}

/**
 * GET 请求
 * 对应 Kuikly: BaseViewModel.doGet()
 * @param {string} url 请求路径
 * @param {Object} data 查询参数
 * @param {Object} options 配置项
 * @param {boolean} options.requiresAuth 是否需要认证（默认 true）
 * @param {boolean} options.skipRefresh 是否跳过主动刷新
 * @returns {Promise<Object>} 响应 data 字段
 */
function get(url, data = {}, options = {}) {
  const { requiresAuth = true, skipRefresh = false } = options

  // 主动刷新：token 剩余时间 < 5 分钟时提前刷新
  if (requiresAuth && !skipRefresh && auth.isTokenExpiringSoon()) {
    console.log('[Request] Token 即将过期，主动刷新后重试 GET')
    return proactiveRefreshAndRetry(() => get(url, data, { ...options, skipRefresh: true }))
  }

  return doRequest('GET', url, data, requiresAuth)
}

/**
 * POST 请求
 * 对应 Kuikly: BaseViewModel.doPost()
 * @param {string} url 请求路径
 * @param {Object} data 请求体
 * @param {Object} options 配置项
 * @param {boolean} options.requiresAuth 是否需要认证（默认 true）
 * @param {boolean} options.skipRefresh 是否跳过主动刷新
 * @returns {Promise<Object>} 响应 data 字段
 */
function post(url, data = {}, options = {}) {
  const { requiresAuth = true, skipRefresh = false } = options

  // 主动刷新：token 剩余时间 < 5 分钟时提前刷新
  if (requiresAuth && !skipRefresh && auth.isTokenExpiringSoon()) {
    console.log('[Request] Token 即将过期，主动刷新后重试 POST')
    return proactiveRefreshAndRetry(() => post(url, data, { ...options, skipRefresh: true }))
  }

  return doRequest('POST', url, data, requiresAuth)
}

/**
 * 核心请求方法
 * @param {string} method
 * @param {string} url
 * @param {Object} data
 * @param {boolean} requiresAuth
 * @returns {Promise<Object>}
 */
function doRequest(method, url, data, requiresAuth) {
  const fullUrl = buildFullUrl(url)
  const headers = buildHeaders(requiresAuth)

  return new Promise((resolve, reject) => {
    wx.request({
      url: fullUrl,
      method: method,
      data: data,
      header: headers,
      success(res) {
        const responseData = res.data || {}

        if (res.statusCode === 401 || responseData.code === 401) {
          if (requiresAuth) {
            // 收到 401，尝试刷新 Token 重试
            if (isRefreshing) {
              // 其他请求等待刷新完成后用新 token 重试
              addRefreshSubscriber((newToken) => {
                doRequest(method, url, data, true).then(resolve).catch(reject)
              })
              return
            }
            isRefreshing = true
            doRefreshToken()
              .then(() => {
                isRefreshing = false
                onTokenRefreshed(auth.getToken())
                // 用新 token 重试原请求
                doRequest(method, url, data, true).then(resolve).catch(reject)
              })
              .catch(err => {
                isRefreshing = false
                reject(err)
              })
            return
          }
          reject(new Error(responseData.msg || '未授权'))
          return
        }

        const code = responseData.code
        const msg = responseData.msg || ''

        if (code === 200) {
          resolve(responseData.data || {})
        } else {
          console.error(`[Request] ${method} ${fullUrl} error: code=${code}, msg=${msg}`)
          const error = new Error(msg || '请求失败')
          error.code = code
          reject(error)
        }
      },
      fail(err) {
        console.error(`[Request] ${method} ${fullUrl} network fail:`, err)
        reject(new Error('网络请求失败'))
      }
    })
  })
}

/**
 * SSE 流式请求（用于 AI 聊天）
 * 对应 Kuikly: SseClient.startStreaming()
 *
 * 使用 wx.request + enableChunked + onChunkReceived
 * @param {Object} options
 * @param {string} options.url 请求路径
 * @param {Object} options.data 请求体
 * @param {Object} options.headers 请求头
 * @param {Function} options.onEvent 收到事件回调: (eventData: string) => void
 * @param {Function} options.onComplete 完成回调: () => void
 * @param {Function} options.onError 错误回调: (errorMsg: string) => void
 * @returns {Object} { requestTask } 可调用 requestTask.abort() 取消请求
 */
function streamRequest(options) {
  const fullUrl = buildFullUrl(options.url)
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  // 注入 Token
  const token = auth.getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const requestTask = wx.request({
    url: fullUrl,
    method: 'POST',
    data: options.data,
    header: headers,
    enableChunked: true,
    responseType: 'arraybuffer',
    success(res) {
      console.log('[Request] SSE success, statusCode:', res.statusCode)
      options.onComplete && options.onComplete()
    },
    fail(err) {
      console.error('[Request] SSE fail:', err)
      options.onError && options.onError('网络请求失败')
    }
  })

  // 监听分块数据
  // 手动 UTF-8 解码器（微信小程序不支持 TextDecoder）
  function decodeUTF8(buffer) {
    const bytes = new Uint8Array(buffer)
    let result = ''
    let i = 0
    while (i < bytes.length) {
      const b0 = bytes[i]
      if (b0 < 0x80) {
        result += String.fromCharCode(b0)
        i++
      } else if ((b0 & 0xE0) === 0xC0) {
        result += String.fromCharCode(((b0 & 0x1F) << 6) | (bytes[i + 1] & 0x3F))
        i += 2
      } else if ((b0 & 0xF0) === 0xE0) {
        result += String.fromCharCode(((b0 & 0x0F) << 12) | ((bytes[i + 1] & 0x3F) << 6) | (bytes[i + 2] & 0x3F))
        i += 3
      } else if ((b0 & 0xF8) === 0xF0) {
        const cp = ((b0 & 0x07) << 18) | ((bytes[i + 1] & 0x3F) << 12) | ((bytes[i + 2] & 0x3F) << 6) | (bytes[i + 3] & 0x3F)
        result += String.fromCodePoint(cp)
        i += 4
      } else {
        result += String.fromCharCode(b0)
        i++
      }
    }
    return result
  }
  let pendingText = '' // 缓存不完整的行

  if (requestTask && requestTask.onChunkReceived) {
    requestTask.onChunkReceived((res) => {
      try {
        const arrayBuffer = res.data
        const text = decodeUTF8(arrayBuffer)
        const fullText = pendingText + text
        // SSE 格式: "data: {...}\n\n" 或 "data: ...\n\n"
        const lines = fullText.split('\n')
        // 最后一个元素可能是不完整的行，缓存到下次处理
        pendingText = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          if (trimmed.startsWith('data:')) {
            const eventData = trimmed.substring(5).trim()
            if (eventData) {
              options.onEvent && options.onEvent(eventData)
            }
          } else if (trimmed.startsWith('event:')) {
            // SSE event 类型标记，跳过（后续 data 行会携带数据）
            continue
          }
        }
      } catch (e) {
        console.error('[Request] SSE chunk parse error:', e)
      }
    })
  }

  return { requestTask }
}

module.exports = {
  get,
  post,
  streamRequest,
  doRefreshToken,
  buildFullUrl
}
