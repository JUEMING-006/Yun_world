/**
 * 发布朋友圈动态
 * 对应 Kuikly: PublishCircle.kt
 */
const { post } = require('../../utils/request')
const { BASE_URL } = require('../../utils/config')

Page({
  data: { statusBarHeight: 0, content: '', images: [], isPublishing: false },
  onLoad() { this.setData({ statusBarHeight: wx.getSystemInfoSync().statusBarHeight || 20 }) },
  onBack() { wx.navigateBack() },
  onContentInput(e) { this.setData({ content: e.detail.value }) },
  onChooseImages() {
    wx.chooseMedia({ count: 9 - this.data.images.length, mediaType: ['image'],
      success: (res) => { this.setData({ images: this.data.images.concat(res.tempFiles.map(f => f.tempFilePath)).slice(0, 9) }) }
    })
  },
  onRemoveImage(e) { const idx = e.currentTarget.dataset.idx; this.setData({ images: this.data.images.filter((_, i) => i !== idx) }) },
  onPublish() {
    const { content, images, isPublishing } = this.data
    if (!content.trim()) { wx.showToast({ title: '请输入内容', icon: 'none' }); return }
    if (isPublishing) return
    this.setData({ isPublishing: true })
    post(`${BASE_URL}/ms/post`, { content: content.trim(), images }, { requiresAuth: true })
      .then(() => { this.setData({ isPublishing: false }); wx.showToast({ title: '发布成功', icon: 'success' }); setTimeout(() => wx.navigateBack(), 1000) })
      .catch(err => { this.setData({ isPublishing: false }); wx.showToast({ title: err.message || '发布失败', icon: 'none' }) })
  }
})
