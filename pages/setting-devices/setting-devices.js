/**
 * 登录设备管理
 * 对应 Kuikly: LoginDevicesSetting.kt
 */
const { get, post } = require('../../utils/request')
const { BASE_URL } = require('../../utils/config')

Page({
  data: { statusBarHeight: 0, devices: [], isLoading: false },
  onLoad() { this.setData({ statusBarHeight: wx.getSystemInfoSync().statusBarHeight || 20 }); this.loadDevices() },
  onBack() { wx.navigateBack() },
  loadDevices() {
    this.setData({ isLoading: true })
    get(`${BASE_URL}/user/devices/list`, {}, { requiresAuth: true })
      .then(data => { this.setData({ devices: data.devices || [], isLoading: false }) })
      .catch(() => { this.setData({ devices: [{ id: '1', deviceName: '当前设备', lastActive: '刚刚' }], isLoading: false }) })
  },
  onKickDevice(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({ title: '下线设备', content: '确定要将该设备下线吗？', success: (res) => {
      if (res.confirm) {
        post(`${BASE_URL}/user/devices/kick`, { deviceId: id }, { requiresAuth: true })
          .then(() => { this.setData({ devices: this.data.devices.filter(d => d.id !== id) }); wx.showToast({ title: '已下线', icon: 'success' }) })
          .catch(err => wx.showToast({ title: err.message || '操作失败', icon: 'none' }))
      }
    }})
  }
})
