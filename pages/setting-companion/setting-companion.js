/**
 * AI 伴侣风格设置
 * 对应 Kuikly: UserInformationSetting.kt
 */
const { post } = require('../../utils/request')
const { BASE_URL } = require('../../utils/config')

Page({
  data: {
    statusBarHeight: 0,
    currentStyle: 'default',
    styles: [
      { id: 'default', name: '默认', desc: '平衡的对话风格' },
      { id: 'gentle', name: '温柔', desc: '温和体贴的语气' },
      { id: 'professional', name: '专业', desc: '严谨专业的回答' },
      { id: 'humorous', name: '幽默', desc: '轻松有趣的互动' },
      { id: 'calm', name: '沉稳', desc: '冷静理性的分析' }
    ],
    isSaving: false
  },
  onLoad() {
    this.setData({ statusBarHeight: wx.getSystemInfoSync().statusBarHeight || 20 })
    const saved = wx.getStorageSync('companion_style') || 'default'
    this.setData({ currentStyle: saved })
  },
  onBack() { wx.navigateBack() },
  onStyleSelect(e) { this.setData({ currentStyle: e.currentTarget.dataset.id }) },
  onSave() {
    if (this.data.isSaving) return
    this.setData({ isSaving: true })
    post(`${BASE_URL}/user/ai-settings`, { companionStyle: this.data.currentStyle }, { requiresAuth: true })
      .then(() => { this.setData({ isSaving: false }); wx.setStorageSync('companion_style', this.data.currentStyle); wx.showToast({ title: '已保存', icon: 'success' }) })
      .catch(err => { this.setData({ isSaving: false }); wx.showToast({ title: err.message || '保存失败', icon: 'none' }) })
  }
})
