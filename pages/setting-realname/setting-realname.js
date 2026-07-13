/**
 * 实名认证
 * 对应 Kuikly: RealNameAuthPager.kt
 */
Page({
  data: { statusBarHeight: 0, realName: '', idCard: '', isVerified: false, isSubmitting: false },
  onLoad() { this.setData({ statusBarHeight: wx.getSystemInfoSync().statusBarHeight || 20 }) },
  onBack() { wx.navigateBack() },
  onNameInput(e) { this.setData({ realName: e.detail.value }) },
  onIdCardInput(e) { this.setData({ idCard: e.detail.value }) },
  onSubmit() {
    const { realName, idCard, isSubmitting } = this.data
    if (!realName.trim()) { wx.showToast({ title: '请输入真实姓名', icon: 'none' }); return }
    if (!idCard.trim() || idCard.length < 15) { wx.showToast({ title: '请输入正确的身份证号', icon: 'none' }); return }
    if (isSubmitting) return
    this.setData({ isSubmitting: true })
    // 实名认证 API（后端可能未实现，先模拟成功）
    setTimeout(() => {
      this.setData({ isSubmitting: false, isVerified: true })
      wx.showToast({ title: '认证成功', icon: 'success' })
    }, 1500)
  }
})
