/**
 * Sidebar component
 * Matches Kuikly: Sidebar.kt
 */
Component({
  properties: {
    visible: { type: Boolean, value: false },
    agents: { type: Array, value: [] },
    currentAgentId: { type: String, value: '' },
    userAvatar: { type: String, value: '' }
  },

  data: {
    statusBarHeight: 20,
    safeBottom: 0,
    selectedFunc: 'psych'
  },

  attached() {
    const sysInfo = wx.getSystemInfoSync()
    const safeArea = sysInfo.safeArea || {}
    const bottomInset = (sysInfo.screenHeight - safeArea.bottom) || 0
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20,
      safeBottom: bottomInset || 0
    })
  },

  onSelectFunc(e) {
    const func = e.currentTarget.dataset.func
    this.setData({ selectedFunc: func })
    const map = {
      psych: 'onFuncPsychTest',
      knowledge: 'onFuncKnowledge',
      circle: 'onFuncCircle',
      video: 'onFuncVideo',
      setting: 'onFuncSetting'
    }
    if (map[func]) this[map[func]]()
  },

  methods: {
    onMaskClick() {
      this.triggerEvent('close')
    },

    onSelectAgent(e) {
      const agentId = e.currentTarget.dataset.id
      const agent = this.data.agents.find(a => a.agentId === agentId)
      if (agent) {
        this.triggerEvent('select', { agent: agent })
      }
    },

    onNewChat() {
      this.triggerEvent('newchat')
    },

    stopPropagation() {},

    onSearchTap() {
      wx.showToast({ title: 'Search (dev)', icon: 'none' })
    },

    onFuncPsychTest() {
      wx.navigateTo({ url: '/pages/assessment/assessment' })
      this.triggerEvent('close')
    },

    onFuncKnowledge() {
      wx.navigateTo({ url: '/pages/knowledge/knowledge' })
      this.triggerEvent('close')
    },

    onFuncCircle() {
      wx.navigateTo({ url: '/pages/circle/circle' })
      this.triggerEvent('close')
    },

    onFuncVideo() {
      wx.navigateTo({ url: '/pages/ai-video/ai-video' })
      this.triggerEvent('close')
    },

    onFuncSetting() {
      wx.navigateTo({ url: '/pages/setting/setting' })
      this.triggerEvent('close')
    }
  }
})
