/**
 * 记忆设置页面
 * 对应 Kuikly: SettingScreen/memorySetting.kt
 * 功能：查看 AI 记忆列表、开关记忆功能
 */
const { post, get } = require('../../utils/request')
const { BASE_URL } = require('../../utils/config')

Page({
  data: {
    statusBarHeight: 0,
    memoryEnabled: true,
    isLoading: false,
    memoryItems: [],
    total: 0
  },
  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 })
    this.fetchMemoryStatus()
    this.fetchMemoryItems()
  },
  onBack() { wx.navigateBack() },

  fetchMemoryStatus() {
    get(`${BASE_URL}/user/memory/status`, {}, { requiresAuth: true })
      .then(data => { this.setData({ memoryEnabled: data.memoryEnabled !== false }) })
      .catch(() => {})
  },

  fetchMemoryItems() {
    this.setData({ isLoading: true })
    get(`${BASE_URL}/user/memory/items`, {}, { requiresAuth: true })
      .then(data => {
        const items = data.items || []
        this.setData({ memoryItems: items.map((m, i) => ({ id: i, content: m })), total: items.length, isLoading: false })
      })
      .catch(() => { this.setData({ isLoading: false }) })
  },

  onToggleMemory() {
    const newVal = !this.data.memoryEnabled
    this.setData({ memoryEnabled: newVal })
    post(`${BASE_URL}/user/memory/toggle`, { memoryEnabled: newVal }, { requiresAuth: true })
      .then(() => { wx.showToast({ title: newVal ? '记忆已开启' : '记忆已关闭', icon: 'none' }) })
      .catch(() => { this.setData({ memoryEnabled: !newVal }) })
  },

  onDeleteMemory(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除记忆',
      content: '确定要删除这条记忆吗？',
      success: (res) => {
        if (res.confirm) {
          const items = this.data.memoryItems.filter(m => m.id !== id)
          this.setData({ memoryItems: items, total: items.length })
        }
      }
    })
  }
})
