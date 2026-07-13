/**
 * 数据管理
 * 对应 Kuikly: DataManagementSetting.kt
 */
Page({
  data: { statusBarHeight: 0, cacheSize: '计算中...', storageKeys: 0 },
  onLoad() { this.setData({ statusBarHeight: wx.getSystemInfoSync().statusBarHeight || 20 }); this.calcStorage() },
  onBack() { wx.navigateBack() },
  calcStorage() {
    try {
      const info = wx.getStorageInfoSync()
      this.setData({ cacheSize: (info.currentSize / 1024).toFixed(2) + ' MB', storageKeys: info.keys.length })
    } catch (e) { this.setData({ cacheSize: '未知' }) }
  },
  onClearCache() {
    wx.showModal({ title: '清除缓存', content: `确定要清除所有本地缓存数据吗？当前占用 ${this.data.cacheSize}`, success: (res) => {
      if (res.confirm) {
        wx.clearStorageSync()
        this.calcStorage()
        wx.showToast({ title: '已清除', icon: 'success' })
      }
    }})
  }
})
