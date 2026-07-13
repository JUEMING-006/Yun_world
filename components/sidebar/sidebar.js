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
