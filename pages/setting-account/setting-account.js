/**
 * Lumina 账号管理
 * 对应 Kuikly: LuminaAccountSetting.kt
 */
const auth = require('../../utils/auth')
const { post } = require('../../utils/request')
const { BASE_URL } = require('../../utils/config')

Page({
  data: { statusBarHeight: 0, luminaId: '', showDeleteConfirm: false, deleteStep: 1, deletePhone: '', deleteCode: '', isSending: false, countdown: 0, isDeleting: false, _timer: null },
  onLoad() { this.setData({ statusBarHeight: wx.getSystemInfoSync().statusBarHeight || 20, luminaId: auth.getLuminaId() }) },
  onUnload() { if (this.data._timer) clearInterval(this.data._timer) },
  onBack() { wx.navigateBack() },

  // 实名认证
  goToRealName() { wx.navigateTo({ url: '/pages/setting-realname/setting-realname' }) },
  // 登录设备
  goToDevices() { wx.navigateTo({ url: '/pages/setting-devices/setting-devices' }) },

  // 账号注销
  onDeleteAccount() { this.setData({ showDeleteConfirm: true, deleteStep: 1 }) },
  onCloseDelete() { this.setData({ showDeleteConfirm: false, deleteStep: 1, deletePhone: '', deleteCode: '' }) },
  onDeletePhoneInput(e) { this.setData({ deletePhone: e.detail.value }) },
  onDeleteCodeInput(e) { this.setData({ deleteCode: e.detail.value }) },

  onSendDeleteCode() {
    const phone = this.data.deletePhone.trim()
    if (!phone) { wx.showToast({ title: '请输入手机号', icon: 'none' }); return }
    this.setData({ isSending: true })
    post(`${BASE_URL}/account/send-delete-code`, { phone }, { requiresAuth: true })
      .then(() => { this.setData({ isSending: false, deleteStep: 2, countdown: 120 }); this.startCountdown() })
      .catch(err => { this.setData({ isSending: false }); wx.showToast({ title: err.message || '发送失败', icon: 'none' }) })
  },

  startCountdown() {
    if (this.data._timer) clearInterval(this.data._timer)
    this._timer = setInterval(() => {
      if (this.data.countdown > 0) this.setData({ countdown: this.data.countdown - 1 })
      else { clearInterval(this._timer); this._timer = null }
    }, 1000)
  },

  onConfirmDelete() {
    const { deletePhone, deleteCode, isDeleting } = this.data
    if (!deleteCode.trim()) { wx.showToast({ title: '请输入验证码', icon: 'none' }); return }
    if (isDeleting) return
    this.setData({ isDeleting: true })
    post(`${BASE_URL}/account/verify-delete`, { phone: deletePhone.trim(), code: deleteCode.trim() }, { requiresAuth: true })
      .then(() => { this.setData({ isDeleting: false }); auth.clearAuth(); wx.reLaunch({ url: '/pages/login/login' }) })
      .catch(err => { this.setData({ isDeleting: false }); wx.showToast({ title: err.message || '注销失败', icon: 'none' }) })
  }
})
