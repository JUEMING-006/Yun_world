/**
 * 聊天底部输入栏组件
 * 对应 Kuikly: ChatBottomBar.kt
 *
 * 功能：
 * 1. 文本输入
 * 2. 发送按钮
 * 3. 附件按钮（图片选择）
 * 4. 模式切换（思考、联网搜索）
 */
Component({
  properties: {
    // 占位提示文字
    placeholder: { type: String, value: '输入消息...' },
    // 是否正在发送
    isSending: { type: Boolean, value: false },
    // 是否思考模式
    isThinkingMode: { type: Boolean, value: false },
    // 是否联网搜索模式
    isSearchMode: { type: Boolean, value: false },
    // 键盘高度
    keyboardHeight: { type: Number, value: 0 }
  },

  data: {
    inputValue: '',
    isFocused: false
  },

  methods: {
    onInput(e) {
      this.setData({ inputValue: e.detail.value })
      this.triggerEvent('inputchange', { value: e.detail.value })
    },

    onFocus(e) {
      this.setData({ isFocused: true })
      this.triggerEvent('inputfocus', { height: e.detail.height || 0 })
    },

    onBlur() {
      this.setData({ isFocused: false })
      this.triggerEvent('inputblur')
    },

    onSend() {
      const text = this.data.inputValue.trim()
      if (!text || this.data.isSending) return

      this.triggerEvent('send', { text: text })
      this.setData({ inputValue: '' })
    },

    onAttach() {
      this.triggerEvent('attach')
    },

    onToggleThinking() {
      this.triggerEvent('togglethinking')
    },

    onToggleSearch() {
      this.triggerEvent('togglesearch')
    },

    // 外部调用：清空输入
    clearInput() {
      this.setData({ inputValue: '' })
    }
  }
})
