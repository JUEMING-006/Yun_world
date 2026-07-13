/**
 * 智能体记忆页面
 * 对应 Kuikly: AgentMemoryScreen.kt + AgentMemoryViewModel.kt
 * 功能：查看指定智能体的记忆列表（话题、时间、反馈）
 */
const agentApi = require('../../apis/agent')

Page({
  data: {
    statusBarHeight: 0,
    agentId: '',
    memories: [],
    total: 0,
    page: 0,
    pageSize: 20,
    isLoading: false,
    hasMore: true
  },
  onLoad(options) {
    const sysInfo = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20, agentId: options.agentId || '' })
    if (this.data.agentId) this.loadMemories(0)
  },
  onBack() { wx.navigateBack() },

  loadMemories(page) {
    this.setData({ isLoading: true })
    agentApi.getAgentMemories(this.data.agentId, page, this.data.pageSize)
      .then(data => {
        const memories = (data.memories || []).map(m => ({
          memoryId: m.memoryId,
          memory: m.memory,
          topics: m.topics || [],
          createdAt: m.createdAt ? this.formatTime(m.createdAt) : '',
          updatedAt: m.updatedAt ? this.formatTime(m.updatedAt) : ''
        }))
        const hasMore = memories.length >= this.data.pageSize
        if (page === 0) {
          this.setData({ memories, total: data.total || memories.length, page: 0, hasMore, isLoading: false })
        } else {
          this.setData({ memories: this.data.memories.concat(memories), page, hasMore, isLoading: false })
        }
      })
      .catch(() => { this.setData({ isLoading: false }) })
  },

  onLoadMore() {
    if (this.data.isLoading || !this.data.hasMore) return
    this.loadMemories(this.data.page + 1)
  },

  formatTime(ts) {
    const d = new Date(ts)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  },

  onCopyMemory(e) {
    const content = e.currentTarget.dataset.content
    wx.setClipboardData({ data: content, success() { wx.showToast({ title: '已复制', icon: 'success' }) } })
  }
})
