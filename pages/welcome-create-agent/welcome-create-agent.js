/**
 * 创建智能体引导页（新用户）
 * 对应 Kuikly: WelcomeCreateAgentScreen.kt + AgentCreateViewModel.kt
 *
 * 流程：
 * 1. 输入智能体名称（必填）
 * 2. 选择性格特点（可选）
 * 3. 选择性别（可选）
 * 4. 调用 POST /agent/create 创建智能体
 * 5. 创建成功 → 跳转聊天页
 */
const agentApi = require('../../apis/agent')

Page({
  data: {
    statusBarHeight: 0,
    hasAgent: false,
    // 表单数据
    agentName: '',
    agentDescription: '',
    agentGender: 'neutral',
    // 性别选项
    genderOptions: [
      { id: 'male', label: '男', icon: '👨' },
      { id: 'female', label: '女', icon: '👩' },
      { id: 'neutral', label: '中性', icon: '🧑' }
    ],
    // 性格预设
    personalityPresets: [
      { id: 'warm', label: '温柔', selected: false },
      { id: 'humorous', label: '幽默', selected: false },
      { id: 'professional', label: '专业', selected: false },
      { id: 'creative', label: '创意', selected: false },
      { id: 'calm', label: '沉稳', selected: false },
      { id: 'energetic', label: '活泼', selected: false }
    ],
    // 状态
    isCreating: false,
    currentStep: 1 // 1=名称, 2=性格, 3=确认
  },

  onLoad(options) {
    const sysInfo = wx.getSystemInfoSync()
    const hasAgent = options.hasAgent === 'true'
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20,
      hasAgent: hasAgent
    })
  },

  // ── 名称输入 ──
  onNameInput(e) {
    this.setData({ agentName: e.detail.value })
  },

  onDescInput(e) {
    this.setData({ agentDescription: e.detail.value })
  },

  // ── 性别选择 ──
  onGenderSelect(e) {
    this.setData({ agentGender: e.currentTarget.dataset.id })
  },

  // ── 性格预设切换 ──
  onTogglePersonality(e) {
    const id = e.currentTarget.dataset.id
    const presets = this.data.personalityPresets.map(p => {
      if (p.id === id) {
        return Object.assign({}, p, { selected: !p.selected })
      }
      return p
    })
    this.setData({ personalityPresets: presets })
  },

  // ── 步骤控制 ──
  onNextStep() {
    const { currentStep, agentName } = this.data
    if (currentStep === 1) {
      if (!agentName.trim()) {
        wx.showToast({ title: '请给你的智能体起个名字', icon: 'none' })
        return
      }
      this.setData({ currentStep: 2 })
    } else if (currentStep === 2) {
      this.setData({ currentStep: 3 })
    }
  },

  onPrevStep() {
    if (this.data.currentStep > 1) {
      this.setData({ currentStep: this.data.currentStep - 1 })
    }
  },

  // ── 创建智能体 ──
  // 对应 Kuikly: AgentCreateViewModel.createAgent()
  onCreateAgent() {
    const { agentName, agentDescription, agentGender, personalityPresets, isCreating } = this.data
    if (isCreating) return

    // 构建 systemPrompt：描述 + 选中的性格
    const selectedTraits = personalityPresets.filter(p => p.selected).map(p => p.label)
    let systemPrompt = agentDescription.trim()
    if (selectedTraits.length > 0) {
      systemPrompt += (systemPrompt ? '\n' : '') + '性格特点：' + selectedTraits.join('、')
    }

    this.setData({ isCreating: true })

    agentApi.createAgent({
      name: agentName.trim(),
      description: agentDescription.trim() || `我是${agentName.trim()}，很高兴认识你！`,
      systemPrompt: systemPrompt,
      gender: agentGender
    })
      .then((data) => {
        this.setData({ isCreating: false })
        wx.showToast({ title: '创建成功！', icon: 'success' })
        // 创建成功 → 跳转聊天页
        setTimeout(() => {
          wx.redirectTo({ url: '/pages/chat/chat' })
        }, 1000)
      })
      .catch((err) => {
        this.setData({ isCreating: false })
        wx.showToast({ title: err.message || '创建失败，请重试', icon: 'none' })
      })
  },

  // ── 直接进入聊天（已有智能体时） ──
  onEnterChat() {
    wx.redirectTo({ url: '/pages/chat/chat' })
  }
})
