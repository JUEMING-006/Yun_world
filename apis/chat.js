/**
 * 聊天相关 API
 * 对应 Kuikly: ChatViewModel.kt
 *
 * 接口清单：
 * - POST /chat/:agentId          AI 对话（SSE 流式）
 * - POST /chat/:agentId/history  获取聊天历史
 * - POST /chat/upload            上传图片
 *
 * SSE 流式请求使用 wx.request + enableChunked + onChunkReceived
 */

const { post, streamRequest } = require('../utils/request')
const { AGENT_BASE_URL } = require('../utils/config')

/**
 * 发送聊天消息（SSE 流式）
 * 对应 Kuikly: ChatViewModel.sendMessage()
 *
 * @param {Object} options
 * @param {string} options.agentId 智能体 ID
 * @param {string} options.message 用户消息
 * @param {boolean} options.thinking 是否开启思考模式
 * @param {boolean} options.search 是否开启联网搜索
 * @param {Array<string>} options.images 图片 URL 数组
 * @param {Function} options.onEvent SSE 事件回调: (eventData: string) => void
 * @param {Function} options.onComplete 完成回调
 * @param {Function} options.onError 错误回调: (errorMsg: string) => void
 * @returns {Object} { requestTask } 可调用 abort() 取消请求
 */
function sendChatMessage(options) {
  const body = {
    message: options.message,
    stream: true
  }

  if (options.thinking) body.thinking = true
  if (options.search) body.search = true
  if (options.images && options.images.length > 0) {
    body.images = options.images
  }

  return streamRequest({
    url: `${AGENT_BASE_URL}/chat/${options.agentId}`,
    data: body,
    onEvent: options.onEvent,
    onComplete: options.onComplete,
    onError: options.onError
  })
}

/**
 * 获取聊天历史
 * 对应 Kuikly: ChatViewModel.loadChatHistory()
 * @param {string} agentId 智能体 ID
 * @param {number} page 页码
 * @returns {Promise<Object>} { total, page, messages: [{ messageId, role, content, ... }] }
 */
function getChatHistory(agentId, page = 0) {
  return post(`${AGENT_BASE_URL}/chat/${agentId}/history`, { page })
}

/**
 * 上传图片
 * 对应 Kuikly: ChatViewModel.uploadImage()
 * @param {string} filePath 本地文件路径（wx.chooseMedia 返回的 tempFilePath）
 * @returns {Promise<Object>} { success, url }
 */
function uploadImage(filePath) {
  return new Promise((resolve, reject) => {
    const token = require('../utils/auth').getToken()
    wx.uploadFile({
      url: `${AGENT_BASE_URL}/chat/upload`,
      filePath: filePath,
      name: 'avatar',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success(res) {
        try {
          const data = JSON.parse(res.data)
          resolve(data)
        } catch (e) {
          reject(new Error('图片上传响应解析失败'))
        }
      },
      fail(err) {
        console.error('[Chat] 图片上传失败:', err)
        reject(new Error('图片上传失败'))
      }
    })
  })
}

module.exports = {
  sendChatMessage,
  getChatHistory,
  uploadImage
}
