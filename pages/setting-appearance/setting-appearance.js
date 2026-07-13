/**
 * 外观设置页面
 * 对应 Kuikly: SettingScreen/AppearanceSetting.kt
 */
Page({
  data: {
    statusBarHeight: 0,
    themeMode: 'LIGHT',
    accentColor: '#4A90D9',
    themes: [
      { id: 'LIGHT', label: '浅色', icon: '☀️' },
      { id: 'DARK', label: '深色', icon: '🌙' },
      { id: 'SYSTEM', label: '跟随系统', icon: '📱' }
    ],
    accentColors: [
      { id: '默认蓝', color: '#4A90D9' },
      { id: '活力橙', color: '#FF6B35' },
      { id: '清新绿', color: '#34C759' },
      { id: '优雅紫', color: '#6E29F6' }
    ]
  },
  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    const savedTheme = wx.getStorageSync('theme_mode') || 'LIGHT'
    const savedColor = wx.getStorageSync('app_theme_color') || '默认蓝'
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20, themeMode: savedTheme, accentColor: savedColor })
  },
  onBack() { wx.navigateBack() },
  onSelectTheme(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ themeMode: id })
    wx.setStorageSync('theme_mode', id)
    wx.showToast({ title: '主题已切换', icon: 'success' })
  },
  onSelectColor(e) {
    const id = e.currentTarget.dataset.id
    const color = e.currentTarget.dataset.color
    this.setData({ accentColor: id })
    wx.setStorageSync('app_theme_color', id)
    wx.showToast({ title: '主题色已切换', icon: 'success' })
  }
})
