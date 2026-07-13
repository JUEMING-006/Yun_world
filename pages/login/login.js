/**
 * 登录页
 * 对应 Kuikly: LoginPager.kt (LoginScreen.kt)
 *
 * UI 还原：Logo + "Lumina" 标题 + "云相伴 心归岸" 副标题 + 手机号/邮箱输入框 + 协议勾选
 * 小程序端跳过地理定位权限（Kuikly is_wx_mp 逻辑的简化版）
 */
const authApi = require('../../apis/auth')

Page({
  data: {
    // 状态栏高度
    statusBarHeight: 0,
    // 协议弹窗
    showAgreement: false,
    isAgreeRead: false,
    // 输入
    accountInput: '',
    isSubmitting: false,
    // 地理位置信息（小程序端跳过，直接允许）
    userCity: '',
    // 协议列表
    agreements: [
      { id: 0, title: 'AIIRA通行证用户注册协议', url: 'https://user.hypergryph.com/protocol/plain/registration' },
      { id: 1, title: 'AIIRA用户隐私协议', url: 'https://user.hypergryph.com/protocol/plain/user' },
      { id: 2, title: '云岸儿童隐私保护指引', url: 'https://user.hypergryph.com/protocol/plain/user' }
    ]
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20
    })
  },

  onShow() {
    // 每次页面显示时重置 isSubmitting，防止从验证码页返回后无法重新发送
    this.setData({ isSubmitting: false })
  },

  // ── 输入事件 ──

  onAccountInput(e) {
    this.setData({ accountInput: e.detail.value })
  },

  onAccountConfirm(e) {
    this.handleSubmit(e.detail.value)
  },

  // 按钮点击事件（对应 WXML 中的 bind:tap="onSubmitTap"）
  onSubmitTap() {
    this.handleSubmit(this.data.accountInput)
  },

  handleSubmit(account) {
    if (!account) account = this.data.accountInput
    account = (account || '').trim()

    if (!account) {
      wx.showToast({ title: '请输入手机号或邮箱', icon: 'none' })
      return
    }

    if (!this.data.isAgreeRead) {
      this.setData({ showAgreement: true })
      return
    }

    if (this.data.isSubmitting) return
    this.setData({ isSubmitting: true })

    // 调用发送验证码接口
    authApi.sendCode(account, 'wx_miniprogram_001', this.data.userCity)
      .then((data) => {
        this.setData({ isSubmitting: false })
        console.log('[Login] 发送验证码成功:', data)

        // 跳转验证码页面
        wx.navigateTo({
          url: `/pages/login-code/login-code?account=${encodeURIComponent(account)}&city=${encodeURIComponent(this.data.userCity)}`
        })
      })
      .catch((err) => {
        this.setData({ isSubmitting: false })
        wx.showToast({ title: err.message || '发送验证码失败', icon: 'none' })
      })
  },

  // ── 协议相关 ──

  onAgreeAll() {
    this.setData({
      isAgreeRead: true,
      showAgreement: false
    })
  },

  onCloseAgreement() {
    this.setData({ showAgreement: false })
  },

  onOpenAgreementDetail(e) {
    const url = e.currentTarget.dataset.url
    const title = e.currentTarget.dataset.title
    // 小程序中协议内容通过复制链接或微信内置 web-view 打开
    // 首期简化：复制链接到剪贴板
    wx.setClipboardData({
      data: url,
      success() {
        wx.showToast({ title: '协议链接已复制', icon: 'none' })
      }
    })
  },

  onShowAgreement() {
    this.setData({ showAgreement: true })
  }
})
