/**
 * AI 聊天主页（增强版）
 * 对应 Kuikly: ChatScreenV2.kt + ChatViewModel.kt + ChatScreenViewModelV2.kt
 *
 * 已实现功能：
 * 1. 消息列表展示（用户 + AI，含 Markdown 渲染）
 * 2. SSE 流式对话（支持 thinking/search/content/done/error 事件）
 * 3. 侧边栏 Agent 切换
 * 4. 输入栏（文本 + 附件 + 模式切换）
 * 5. 聊天历史分页（上拉加载更多）
 * 6. 图片消息发送（上传后附加到消息）
 * 7. 消息重试（失败后重新发送）
 * 8. Agent 操作菜单（记忆/历史/风格）
 * 9. Agent 列表本地缓存（1小时TTL）
 * 10. 搜索结果渲染
 */
const auth = require('../../utils/auth')
const agentApi = require('../../apis/agent')
const chatApi = require('../../apis/chat')

Page({
  data: {
    // UI 状态
    statusBarHeight: 0,
    // 消息列表
    messages: [],
    // 滚动定位
    scrollToView: '',
    // Agent 列表
    agents: [],
    currentAgent: null,
    // 侧边栏
    isSidebarVisible: false,
    // 输入栏状态
    isSending: false,
    isThinkingMode: false,
    isSearchMode: false,
    keyboardHeight: 0,
    // 流式状态
    isStreaming: false,
    streamingContent: '',
    streamingThinking: '',
    // 空状态
    isEmpty: true,
    // 发送按钮弹性动画状态
    isJellyBounce: false,
    // 导航按钮果冻动画状态
    isMenuJelly: false,
    isAgentJelly: false,
    // 历史分页
    isLoadingMore: false,
    hasMore: true,
    historyPage: 0,
    // Agent 操作弹窗
    isShowAgentActions: false,
    // 导航栏右侧按钮
    rightNavBtns: [
      { icon: 'setting', text: '' },
      { icon: 'view-list', text: '' }
    ],
    // Agent 列表缓存
    agentListCacheTime: 0,
    // 待发送的图片 URL（上传成功后）
    pendingImageUrl: '',
    // 输入框值（内联输入，不再使用 chat-bottom-bar 组件）
    inputValue: ''
  },

  // ── 内部状态（不参与 setData） ──
  _sseRequestTask: null,
  _streamBuilder: '',
  _streamGeneration: 0,
  _lastStreamUiNotifyTime: 0,
  _currentAgentId: '',
  _CACHE_KEY: 'agent_list_cache',
  _CACHE_TIME_KEY: 'agent_list_cache_time',
  _CACHE_DURATION_MS: 60 * 60 * 1000, // 1小时

  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20
    })
    this.initChat()
  },

  onUnload() {
    this.cancelStreaming()
  },

  // ═══════════════════════════════════════════
  // 初始化
  // ═══════════════════════════════════════════

  initChat() {
    // 优先从本地缓存加载 Agent 列表
    if (this.loadAgentListFromCache()) {
      const agents = this.data.agents
      if (agents.length > 0) {
        const firstAgent = agents[0]
        this.setData({ currentAgent: firstAgent })
        this._currentAgentId = firstAgent.agentId
        this.loadChatHistory(firstAgent.agentId, 0)
        return
      }
    }

    // 缓存未命中，从服务器加载
    wx.showLoading({ title: '加载中...' })
    agentApi.getAgentList(0, 10)
      .then((data) => {
        wx.hideLoading()
        let agents = data.agents || []
        if (agents.length === 0 && data.agent) {
          agents = [data.agent]
        }
        this.setData({ agents })
        this.saveAgentListToCache(agents)

        if (agents.length > 0) {
          const firstAgent = agents[0]
          this.setData({ currentAgent: firstAgent })
          this._currentAgentId = firstAgent.agentId
          this.loadChatHistory(firstAgent.agentId, 0)
        } else {
          this.startNewChat(null)
        }
      })
      .catch((err) => {
        wx.hideLoading()
        console.error('[Chat] 加载 Agent 列表失败:', err)
        this.showWelcomeMessage()
      })
  },

  // ═══════════════════════════════════════════
  // Agent 列表本地缓存
  // 对应 Kuikly: ChatViewModel.saveAgentListToStorage / loadAgentListFromStorage
  // ═══════════════════════════════════════════

  saveAgentListToCache(agents) {
    try {
      wx.setStorageSync(this._CACHE_KEY, JSON.stringify(agents))
      wx.setStorageSync(this._CACHE_TIME_KEY, Date.now().toString())
    } catch (e) {
      console.error('[Chat] 缓存 Agent 列表失败:', e)
    }
  },

  loadAgentListFromCache() {
    try {
      const cacheTimeStr = wx.getStorageSync(this._CACHE_TIME_KEY)
      if (!cacheTimeStr) return false
      const cacheTime = parseInt(cacheTimeStr, 10)
      if (Date.now() - cacheTime > this._CACHE_DURATION_MS) return false

      const json = wx.getStorageSync(this._CACHE_KEY)
      if (!json) return false

      const agents = JSON.parse(json)
      if (!Array.isArray(agents) || agents.length === 0) return false

      this.setData({ agents })
      return true
    } catch (e) {
      return false
    }
  },

  // ═══════════════════════════════════════════
  // 聊天历史加载 + 分页
  // 对应 Kuikly: ChatViewModel.loadChatHistory / loadMoreHistory
  // ═══════════════════════════════════════════

  loadChatHistory(agentId, page) {
    if (page > 0) this.setData({ isLoadingMore: true })

    chatApi.getChatHistory(agentId, page)
      .then((data) => {
        const messages = (data.messages || []).map(m => this.formatMessage(m))
        const hasMore = messages.length >= 100

        if (page === 0) {
          // 首次加载
          if (messages.length > 0) {
            this.setData({ messages, isEmpty: false, historyPage: 0, hasMore })
          } else {
            this.showWelcomeMessage()
          }
          this.scrollToBottom()
        } else {
          // 加载更多：插入到列表头部
          const existing = this.data.messages
          const merged = messages.concat(existing)
          this.setData({
            messages: merged,
            isLoadingMore: false,
            historyPage: page,
            hasMore
          })
        }
      })
      .catch((err) => {
        console.error('[Chat] 加载历史失败:', err)
        if (page === 0) this.showWelcomeMessage()
        this.setData({ isLoadingMore: false })
      })
  },

  // 上拉加载更多
  onLoadMore() {
    if (this.data.isLoadingMore || !this.data.hasMore) return
    const agentId = this._currentAgentId
    if (!agentId) return
    this.loadChatHistory(agentId, this.data.historyPage + 1)
  },

  // 滚动到顶部触发加载更多
  onScrollToUpper() {
    this.onLoadMore()
  },

  // ═══════════════════════════════════════════
  // 新对话
  // 对应 Kuikly: ChatViewModel.startNewChat
  // ═══════════════════════════════════════════

  startNewChat(agent) {
    this.cancelStreaming()
    const welcomeContent = agent
      ? `你好！我是 ${agent.name}，${agent.description}`
      : '你好！我是 Lumina，有什么需要我的帮助吗？'

    this.setData({
      messages: [{
        messageId: '',
        role: 'assistant',
        content: welcomeContent,
        createTime: '',
        thinking: '',
        searchResults: [],
        images: []
      }],
      isEmpty: false,
      currentAgent: agent,
      historyPage: 0,
      hasMore: true
    })
    if (agent) this._currentAgentId = agent.agentId
    this.scrollToBottom()
  },

  showWelcomeMessage() {
    const agent = this.data.currentAgent
    const welcome = agent
      ? `你好！我是 ${agent.name}，${agent.description}`
      : '你好！我是 Lumina，有什么需要我的帮助吗？'

    this.setData({
      messages: [{
        messageId: '',
        role: 'assistant',
        content: welcome,
        createTime: '',
        thinking: '',
        searchResults: [],
        images: []
      }],
      isEmpty: false,
      historyPage: 0,
      hasMore: false
    })
    this.scrollToBottom()
  },

  // ═══════════════════════════════════════════
  // 发送消息（SSE 流式）
  // 对应 Kuikly: ChatViewModel.sendMessage
  // ═══════════════════════════════════════════

  onSend(e) {
    // Support both input confirm and button tap
    let text = (this.data.inputValue || '').trim()
    // If triggered by input confirm, also check e.detail.value
    if (!text && e && e.detail && e.detail.value) {
      text = e.detail.value.trim()
    }
    if (!text && !this.data.pendingImageUrl) return

    const agentId = this._currentAgentId || (this.data.currentAgent && this.data.currentAgent.agentId)
    if (!agentId) {
      wx.showToast({ title: '无可用智能体', icon: 'none' })
      return
    }

    this.cancelStreaming()

    // 用户消息（可能附带图片）
    const userMsg = {
      messageId: 'user_' + Date.now(),
      role: 'user',
      content: text,
      createTime: '',
      images: this.data.pendingImageUrl ? [this.data.pendingImageUrl] : []
    }

    // 占位 AI 消息
    const aiMsg = {
      messageId: 'ai_' + Date.now(),
      role: 'assistant',
      content: '',
      createTime: '',
      thinking: '',
      searchResults: [],
      images: [],
      isStreaming: true
    }

    const messages = this.data.messages.concat([userMsg, aiMsg])
    this.setData({ messages, isSending: true, isStreaming: true, isEmpty: false })
    this.scrollToBottom()

    this._streamBuilder = ''
    this._streamGeneration++
    const currentGeneration = this._streamGeneration

    const result = chatApi.sendChatMessage({
      agentId: agentId,
      message: text,
      thinking: this.data.isThinkingMode,
      search: this.data.isSearchMode,
      images: this.data.pendingImageUrl ? [this.data.pendingImageUrl] : undefined,
      onEvent: (eventData) => this.onSseEvent(eventData, currentGeneration),
      onComplete: () => this.onSseComplete(currentGeneration),
      onError: (err) => this.onSseError(err, currentGeneration)
    })

    this._sseRequestTask = result.requestTask

    // 清除输入框和待发送图片 + 触发弹性动画（对标 Kuikly: playJellyBounce()）
    this.setData({ pendingImageUrl: '', inputValue: '', isJellyBounce: true })
  },

  // 弹性动画结束回调（对标 Kuikly: jellyGeneration 防并发）
  onJellyEnd() {
    this.setData({ isJellyBounce: false })
  },

  // ═══════════════════════════════════════════
  // SSE 事件处理
  // 对应 Kuikly: ChatViewModel.onSseEvent
  // ═══════════════════════════════════════════

  onSseEvent(eventData, generation) {
    if (generation !== this._streamGeneration) return

    try {
      const json = JSON.parse(eventData)

      if (json.type) {
        switch (json.type) {
          case 'thinking_start':
            this.updateStreamingMessage({ isThinking: true }, generation)
            return
          case 'thinking':
            if (json.content) {
              this.setData({ streamingThinking: this.data.streamingThinking + json.content })
              this.updateStreamingMessage({ thinking: this.data.streamingThinking }, generation)
            }
            return
          case 'thinking_end':
            this.updateStreamingMessage({ isThinking: false }, generation)
            return
          case 'content':
            if (json.content) this.appendStreamContent(json.content, generation)
            return
          case 'search':
            // ✅ 搜索结果渲染（之前缺失，现已实现）
            this.handleSearchResult(json, generation)
            return
          case 'done':
            this.finalizeStreaming(json.messageId || '', json.createTime || '', generation)
            return
          case 'error':
            this.finalizeStreamingWithError(json.content || '服务异常，请重试', generation)
            return
        }
      }

      if (json.chunk) { this.appendStreamContent(json.chunk, generation); return }
      if (json.done) { this.finalizeStreaming(json.messageId || '', json.createTime || '', generation); return }
      if (json.error) { this.finalizeStreamingWithError(json.error, generation); return }
      if (json.content) { this.appendStreamContent(json.content, generation); return }
    } catch (e) {
      if (eventData && eventData.trim()) {
        this.appendStreamContent(eventData, generation)
      }
    }
  },

  // ✅ 搜索结果处理（新增）
  handleSearchResult(json, generation) {
    if (generation !== this._streamGeneration) return
    const keyword = json.keyword || ''
    const results = json.results || []
    const group = { keyword, results }

    const messages = this.data.messages
    if (messages.length === 0) return
    const lastIndex = messages.length - 1
    const lastMsg = messages[lastIndex]
    const existingResults = lastMsg.searchResults || []
    messages[lastIndex] = Object.assign({}, lastMsg, {
      searchResults: existingResults.concat([group])
    })
    this.setData({ messages })
  },

  appendStreamContent(content, generation) {
    if (generation !== this._streamGeneration) return
    this._streamBuilder += content
    const fullContent = this._streamBuilder

    const now = Date.now()
    if (now - this._lastStreamUiNotifyTime >= 50) {
      this._lastStreamUiNotifyTime = now
      this.updateStreamingMessage({ content: fullContent }, generation)
    }
  },

  updateStreamingMessage(updates, generation) {
    if (generation !== this._streamGeneration) return
    const messages = this.data.messages
    if (messages.length === 0) return
    const lastIndex = messages.length - 1
    messages[lastIndex] = Object.assign({}, messages[lastIndex], updates)
    this.setData({ messages })
    this.scrollToBottom()
  },

  finalizeStreaming(messageId, createTime, generation) {
    if (generation !== this._streamGeneration) return
    if (!this.data.isStreaming) return

    const fullContent = this._streamBuilder || '（未收到回复，请重试）'
    this.updateStreamingMessage({
      content: fullContent,
      messageId, createTime,
      thinking: this.data.streamingThinking,
      isStreaming: false
    }, generation)

    this._streamBuilder = ''
    this.setData({ isStreaming: false, isSending: false, streamingContent: '', streamingThinking: '' })
  },

  finalizeStreamingWithError(errorMsg, generation) {
    if (generation !== this._streamGeneration) return
    this.updateStreamingMessage({ content: errorMsg, isStreaming: false, isError: true }, generation)
    this._streamBuilder = ''
    this.setData({ isStreaming: false, isSending: false, streamingContent: '', streamingThinking: '' })
  },

  onSseComplete(generation) {
    if (generation !== this._streamGeneration) return
    if (this.data.isStreaming) this.finalizeStreaming('', '', generation)
  },

  onSseError(error, generation) {
    if (generation !== this._streamGeneration) return
    if (!this.data.isStreaming) return
    this.finalizeStreamingWithError('请求失败: ' + error, generation)
  },

  cancelStreaming() {
    if (this._sseRequestTask) {
      try { this._sseRequestTask.abort() } catch (e) {}
      this._sseRequestTask = null
    }
    this._streamBuilder = ''
    this._streamGeneration++
    this.setData({ isStreaming: false, isSending: false, streamingContent: '', streamingThinking: '' })
  },

  // ═══════════════════════════════════════════
  // 消息重试
  // 对应 Kuikly: ChatScreenViewModelV2.retryLastMessage
  // ═══════════════════════════════════════════

  onRetryMessage(e) {
    const msgIndex = e.detail.index
    const messages = this.data.messages
    if (!messages || msgIndex < 0) return

    // 找到最后一条用户消息
    let userMsg = null
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userMsg = messages[i]
        break
      }
    }
    if (!userMsg) return

    // 移除最后的错误 AI 消息
    if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      messages.pop()
    }
    this.setData({ messages })

    // 重新发送
    this.onSend({ detail: { text: userMsg.content } })
  },

  // ═══════════════════════════════════════════
  // 图片消息发送
  // 对应 Kuikly: ChatViewModel.uploadImage
  // ═══════════════════════════════════════════

  onAttach() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.uploadImage(tempFilePath)
      }
    })
  },

  uploadImage(filePath) {
    wx.showLoading({ title: '上传中...' })
    chatApi.uploadImage(filePath)
      .then((data) => {
        wx.hideLoading()
        if (data.success && data.url) {
          this.setData({ pendingImageUrl: data.url })
          wx.showToast({ title: '图片已添加，输入消息后发送', icon: 'none' })
        } else {
          wx.showToast({ title: '上传失败', icon: 'none' })
        }
      })
      .catch((err) => {
        wx.hideLoading()
        wx.showToast({ title: err.message || '上传失败', icon: 'none' })
      })
  },

  // 移除待发送图片
  onRemovePendingImage() {
    this.setData({ pendingImageUrl: '' })
  },

  // ═══════════════════════════════════════════
  // 侧边栏
  // ═══════════════════════════════════════════

  onToggleSidebar() {
    this.setData({ isSidebarVisible: !this.data.isSidebarVisible, isMenuJelly: true })
  },
  onMenuJellyEnd() {
    this.setData({ isMenuJelly: false })
  },
  onCloseSidebar() {
    this.setData({ isSidebarVisible: false })
  },
  onSelectAgent(e) {
    const agent = e.detail.agent
    this.setData({ currentAgent: agent, isSidebarVisible: false })
    this._currentAgentId = agent.agentId
    this.cancelStreaming()
    this.setData({ messages: [] })
    this.loadChatHistory(agent.agentId, 0)
  },
  onNewChat() {
    const agent = this.data.currentAgent
    this.setData({ isSidebarVisible: false })
    this.startNewChat(agent)
  },

  // ═══════════════════════════════════════════
  // Agent 操作菜单
  // 对应 Kuikly: AgentActionBottomSheet
  // ═══════════════════════════════════════════

  onShowAgentActions() {
    this.setData({ isShowAgentActions: true, isAgentJelly: true })
  },
  onAgentJellyEnd() {
    this.setData({ isAgentJelly: false })
  },
  onCloseAgentActions() {
    this.setData({ isShowAgentActions: false })
  },
  onAgentAction(e) {
    const action = e.detail.action
    switch (action) {
      case 'memory':
        wx.navigateTo({ url: '/pages/agent-memory/agent-memory?agentId=' + this._currentAgentId })
        break
      case 'history':
        // 重新加载历史对话
        this.loadChatHistory(this._currentAgentId, 0)
        wx.showToast({ title: '已刷新聊天记录', icon: 'none' })
        break
      case 'style':
        wx.showToast({ title: '聊天风格设置（开发中）', icon: 'none' })
        break
    }
  },

  // ═══════════════════════════════════════════
  // 输入栏事件
  // ═══════════════════════════════════════════

  // TDesign t-input events (bind:change passes e.detail.value)
  onInput(e) {
    const val = (e && e.detail) ? e.detail.value : ''
    this.setData({ inputValue: val })
  },
  onInputFocus() { this.scrollToBottom() },
  onInputBlur() {},
  onToggleThinking() { this.setData({ isThinkingMode: !this.data.isThinkingMode }) },
  onToggleSearch() { this.setData({ isSearchMode: !this.data.isSearchMode }) },

  // ═══════════════════════════════════════════
  // 导航栏事件
  // ═══════════════════════════════════════════

  onRightBtn(e) {
    const index = e.detail.index
    if (index === 0) this.onGoToSetting()
    else if (index === 1) this.onToggleSidebar()
  },
  onGoToSetting() {
    wx.navigateTo({ url: '/pages/setting/setting' })
  },

  // ═══════════════════════════════════════════
  // 工具方法
  // ═══════════════════════════════════════════

  formatMessage(m) {
    return {
      messageId: m.messageId || '',
      role: m.role || '',
      content: m.content || '',
      createTime: m.createTime || '',
      thinking: m.reasoningContent || m.thinking || '',
      searchResults: m.searchResults || [],
      images: m.images || [],
      isError: false
    }
  },

  scrollToBottom() {
    const messages = this.data.messages
    if (messages.length > 0) {
      this.setData({ scrollToView: 'msg-' + (messages.length - 1) })
    }
  }
})
