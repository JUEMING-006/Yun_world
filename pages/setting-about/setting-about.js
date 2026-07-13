/**
 * 关于页面
 * 对应 Kuikly: SettingScreen/AboutSetting.kt
 */
const { BASE_URL } = require('../../utils/config')

Page({
  data: {
    statusBarHeight: 0,
    version: '1.0.0',
    buildNumber: '20260713',
    serverUrl: BASE_URL,
    privacyUrl: 'https://user.hypergryph.com/protocol/plain/user',
    registrationUrl: 'https://user.hypergryph.com/protocol/plain/registration'
  },
  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20, version: sysInfo.version || '1.0.0' })
  },
  onBack() { wx.navigateBack() },
  onCopyServerUrl() {
    wx.setClipboardData({ data: this.data.serverUrl, success() { wx.showToast({ title: '已复制', icon: 'success' }) } })
  },
  onOpenPrivacy() {
    wx.setClipboardData({ data: this.data.privacyUrl, success() { wx.showToast({ title: '链接已复制', icon: 'none' }) } })
  },
  onOpenRegistration() {
    wx.setClipboardData({ data: this.data.registrationUrl, success() { wx.showToast({ title: '链接已复制', icon: 'none' }) } })
  }
})
