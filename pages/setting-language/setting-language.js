/**
 * 语言设置页面
 * 对应 Kuikly: SettingScreen/LanguageSetting.kt
 */
Page({
  data: {
    statusBarHeight: 0,
    currentLanguage: '简体中文',
    languages: [
      { id: '简体中文', label: '简体中文', native: '简体中文' },
      { id: '繁體中文', label: '繁體中文', native: '繁體中文' },
      { id: 'English', label: 'English', native: 'English' },
      { id: '日本語', label: '日本語', native: '日本語' },
      { id: '한국어', label: '한국어', native: '한국어' },
      { id: 'Français', label: 'Français', native: 'Français' },
      { id: 'Deutsch', label: 'Deutsch', native: 'Deutsch' },
      { id: 'Español', label: 'Español', native: 'Español' }
    ]
  },
  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    const saved = wx.getStorageSync('app_language') || '简体中文'
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20, currentLanguage: saved })
  },
  onBack() { wx.navigateBack() },
  onSelectLanguage(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ currentLanguage: id })
    wx.setStorageSync('app_language', id)
    getApp().globalData.language = id
    wx.showToast({ title: '语言已切换', icon: 'success' })
  }
})
