/**
 * 错误反馈
 * 对应 Kuikly: ErrorSetting.kt
 */
const { post } = require('../../utils/request')
const { BASE_URL } = require('../../utils/config')

Page({
  data: { statusBarHeight: 0, feedbackType: 'error_report', content: '', isSubmitting: false },
  onLoad() { this.setData({ statusBarHeight: wx.getSystemInfoSync().statusBarHeight || 20 }) },
  onBack() { wx.navigateBack() },
  onTypeSelect(e) { this.setData({ feedbackType: e.currentTarget.dataset.type }) },
  onContentInput(e) { this.setData({ content: e.detail.value }) },
  onSubmit() {
    const { content, feedbackType, isSubmitting } = this.data
    if (!content.trim()) { wx.showToast({ title: '请输入反馈内容', icon: 'none' }); return }
    if (isSubmitting) return
    this.setData({ isSubmitting: true })
    post(`${BASE_URL}/feedback/submit`, { content: content.trim(), type: feedbackType }, { requiresAuth: true })
      .then(() => { this.setData({ isSubmitting: false }); wx.showToast({ title: '感谢您的反馈', icon: 'success' }); setTimeout(() => wx.navigateBack(), 1000) })
      .catch(err => { this.setData({ isSubmitting: false }); wx.showToast({ title: err.message || '提交失败', icon: 'none' }) })
  }
})
