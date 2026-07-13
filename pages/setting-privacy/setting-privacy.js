/**
 * 隐私与安全设置页面
 * 对应 Kuikly: SettingScreen/PrivacySetting.kt
 */
Page({
  data: {
    statusBarHeight: 0,
    items: [
      { id: 'data_collection', title: '数据收集', desc: '管理我们收集的数据类型', arrow: true },
      { id: 'third_party', title: '第三方共享', desc: '查看第三方数据共享策略', arrow: true },
      { id: 'location', title: '位置信息', desc: '管理位置权限', arrow: true },
      { id: 'analytics', title: '使用分析', desc: '帮助改进产品体验', arrow: true, switch: true, value: true },
      { id: 'clear_data', title: '清除本地数据', desc: '清除缓存和本地存储', arrow: true },
      { id: 'delete_account', title: '注销账号', desc: '永久删除账号及所有数据', arrow: true, danger: true }
    ]
  },
  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 })
  },
  onBack() { wx.navigateBack() },
  onItemClick(e) {
    const id = e.currentTarget.dataset.id
    if (id === 'clear_data') {
      wx.showModal({
        title: '清除本地数据',
        content: '确定要清除所有本地缓存数据吗？',
        success(res) {
          if (res.confirm) {
            wx.clearStorageSync()
            wx.showToast({ title: '已清除', icon: 'success' })
          }
        }
      })
    } else if (id === 'delete_account') {
      wx.showToast({ title: '请联系客服注销账号', icon: 'none' })
    } else {
      wx.showToast({ title: '功能开发中', icon: 'none' })
    }
  },
  onSwitchChange(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({ title: '设置已更新', icon: 'none' })
  }
})
