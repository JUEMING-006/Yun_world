/**
 * Plus 订阅页面
 * 对应 Kuikly: PlusSetting.kt
 */
Page({
  data: {
    statusBarHeight: 0,
    features: [
      { name: '每日对话次数', free: '20次', plus: '无限' },
      { name: '上下文记忆长度', free: '短期', plus: '长期' },
      { name: '优先响应速度', free: '标准', plus: '极速' },
      { name: '专属客服通道', free: '❌', plus: '✅' },
      { name: '个性化语音库', free: '❌', plus: '✅' },
      { name: '无广告体验', free: '❌', plus: '✅' },
      { name: '多设备同步', free: '❌', plus: '✅' },
      { name: '情绪分析报告', free: '❌', plus: '✅' }
    ]
  },
  onLoad() { this.setData({ statusBarHeight: wx.getSystemInfoSync().statusBarHeight || 20 }) },
  onBack() { wx.navigateBack() },
  onSubscribe() { wx.showToast({ title: '订阅功能开发中', icon: 'none' }) }
})
