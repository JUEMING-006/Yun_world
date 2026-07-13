/**
 * 智能体创建页面
 * 对应 Kuikly: Agent/CreateCharacterPage.kt + AgentCreateViewModel.kt
 * 功能：选择头像、输入名称、描述、性格、性别、声音
 */
const { post } = require('../../utils/request')
const { AGENT_BASE_URL } = require('../../utils/config')

Page({
  data: {
    statusBarHeight: 0,
    name: '',
    description: '',
    personality: '',
    gender: 'neutral',
    genderOptions: [
      { id: 'male', label: '男', icon: '👨' },
      { id: 'female', label: '女', icon: '👩' },
      { id: 'neutral', label: '中性', icon: '🧑' }
    ],
    avatarUrl: '',
    isCreating: false
  },
  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 })
  },
  onBack() { wx.navigateBack() },
  onNameInput(e) { this.setData({ name: e.detail.value }) },
  onDescInput(e) { this.setData({ description: e.detail.value }) },
  onPersonalityInput(e) { this.setData({ personality: e.detail.value }) },
  onGenderSelect(e) { this.setData({ gender: e.currentTarget.dataset.id }) },

  onChooseAvatar() {
    wx.chooseMedia({
      count: 1, mediaType: ['image'],
      success: (res) => {
        const path = res.tempFiles[0].tempFilePath
        this.setData({ avatarUrl: path })
      }
    })
  },

  onCreate() {
    const { name, description, personality, gender } = this.data
    if (!name.trim()) { wx.showToast({ title: '请输入名称', icon: 'none' }); return }
    if (this.data.isCreating) return
    this.setData({ isCreating: true })

    post(`${AGENT_BASE_URL}/agent/create`, {
      name: name.trim(),
      description: description.trim(),
      systemPrompt: personality.trim(),
      gender
    }).then(data => {
      this.setData({ isCreating: false })
      wx.showToast({ title: '创建成功', icon: 'success' })
      setTimeout(() => { wx.navigateBack() }, 1500)
    }).catch(err => {
      this.setData({ isCreating: false })
      wx.showToast({ title: err.message || '创建失败', icon: 'none' })
    })
  }
})
