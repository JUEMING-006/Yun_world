/**
 * 聊天消息气泡组件
 * 对应 Kuikly: ChatUserMessage.kt + ChatAIMessage.kt
 *
 * 支持两种角色：
 * - user: 用户消息（右侧，灰色背景）
 * - assistant: AI 消息（左侧，白色背景，支持 Markdown）
 *
 * 状态：
 * - streaming: 流式响应中（显示打字动画）
 * - thinking: 思考阶段（显示思考内容）
 */
Component({
  properties: {
    // 角色: 'user' | 'assistant'
    role: { type: String, value: 'assistant' },
    // 消息内容
    content: { type: String, value: '' },
    // 思考内容（仅 AI）
    thinking: { type: String, value: '' },
    // 消息时间
    createTime: { type: String, value: '' },
    // 是否流式输出中
    isStreaming: { type: Boolean, value: false },
    // 是否思考阶段
    isThinking: { type: Boolean, value: false },
    // 搜索结果列表
    searchResults: { type: Array, value: [] },
    // 图片列表
    images: { type: Array, value: [] },
    // 头像 URL
    avatarUrl: { type: String, value: '' }
  },

  data: {
    // 是否展开思考内容
    showThinking: false
  },

  methods: {
    toggleThinking() {
      this.setData({ showThinking: !this.data.showThinking })
    },

    // 预览图片
    onPreviewImage(e) {
      const url = e.currentTarget.dataset.url
      const urls = this.data.images.filter(u => u)
      wx.previewImage({ current: url, urls: urls })
    },

    // 复制内容
    onCopyContent() {
      wx.setClipboardData({
        data: this.data.content,
        success() {
          wx.showToast({ title: '已复制', icon: 'success' })
        }
      })
    },

    // 点击搜索结果链接
    onSearchResultClick(e) {
      const url = e.currentTarget.dataset.url
      if (url) {
        wx.setClipboardData({
          data: url,
          success() {
            wx.showToast({ title: '链接已复制', icon: 'none' })
          }
        })
      }
    }
  }
})
