/**
 * Agent 操作底部弹窗组件
 * 对应 Kuikly: AgentActionBottomSheet.kt
 *
 * 功能项：记忆、聊天记录、聊天风格
 */
Component({
  properties: {
    visible: { type: Boolean, value: false },
    agentName: { type: String, value: '' }
  },

  data: {
    actions: [
      { id: 'memory', icon: 'bookmark', title: '记忆', desc: '查看 AI 记住的内容' },
      { id: 'history', icon: 'time', title: '聊天记录', desc: '查看历史对话' },
      { id: 'style', icon: 'palette', title: '聊天风格', desc: '调整对话风格' }
    ]
  },

  methods: {
    onClose() {
      this.triggerEvent('close')
    },

    onActionClick(e) {
      const id = e.currentTarget.dataset.id
      this.triggerEvent('action', { action: id })
      this.triggerEvent('close')
    },

    onMaskClick() {
      this.triggerEvent('close')
    },

    stopPropagation() {}
  }
})
