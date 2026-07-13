/**
 * 验证码登录页
 * 对应 Kuikly: LoginCodeScreen.kt
 *
 * 功能：
 * 1. 显示已发送验证码的目标账号
 * 2. 6位验证码输入
 * 3. 120秒倒计时
 * 4. 登录验证 → 保存 Token → checkUserStatus → 路由分发
 */
const authApi = require('../../apis/auth')
const auth = require('../../utils/auth')
const userApi = require('../../apis/user')
const agentApi = require('../../apis/agent')

Page({
  data: {
    statusBarHeight: 0,
    // 从登录页传入
    account: '',
    accountType: '短信', // '短信' 或 '邮箱'
    userCity: '',
    // 验证码
    codeInput: '',
    // 状态
    isVerifying: false,
    codeError: '',
    // 倒计时
    countdownSeconds: 0,
    isCountingDown: false,
    // 信息弹窗
    showInfoSheet: false,
    // 已登录（用于阻止返回）
    isLoggedIn: false
  },

  // 倒计时定时器
  _countdownTimer: null,

  onLoad(options) {
    const account = decodeURIComponent(options.account || '')
    const city = decodeURIComponent(options.city || '')
    const accountType = account.includes('@') ? '邮箱' : '短信'

    const sysInfo = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20,
      account: account,
      accountType: accountType,
      userCity: city
    })

    // 启动倒计时
    this.startCountdown()
  },

  onUnload() {
    this.stopCountdown()
  },

  // ── 倒计时 ──
  // 对应 Kuikly: LoginViewModel.startCountdown() / stopCountdown()

  startCountdown() {
    this.stopCountdown()
    this.setData({ countdownSeconds: 120, isCountingDown: true })

    this._countdownTimer = setInterval(() => {
      const seconds = this.data.countdownSeconds
      if (seconds > 0) {
        this.setData({ countdownSeconds: seconds - 1 })
      } else {
        this.stopCountdown()
      }
    }, 1000)
  },

  stopCountdown() {
    if (this._countdownTimer) {
      clearInterval(this._countdownTimer)
      this._countdownTimer = null
    }
    this.setData({ isCountingDown: false })
  },

  // ── 验证码输入 ──

  onCodeInput(e) {
    this.setData({ codeInput: e.detail.value, codeError: '' })
  },

  onCodeConfirm(e) {
    const code = (e.detail.value || '').trim()
    if (code.length >= 4) {
      this.doLogin(code)
    }
  },

  // 按钮点击事件（对应 WXML 中的 bind:tap="onLoginTap"）
  onLoginTap() {
    this.doLogin(this.data.codeInput)
  },

  // ── 登录验证 ──
  // 对应 Kuikly: LoginViewModel.signForCode()

  doLogin(code) {
    if (!code) code = this.data.codeInput
    code = (code || '').trim()

    if (!code) {
      this.setData({ codeError: '请输入验证码' })
      return
    }

    if (this.data.isVerifying) return
    this.setData({ isVerifying: true, codeError: '' })

    authApi.signForCode(this.data.account, code, this.data.userCity)
      .then((data) => {
        // 解析登录响应 — 与 Kuikly LoginViewModel 完全一致
        const token = data.token || ''
        const refreshToken = data.refreshToken || ''
        const expiresIn = data.expires_in || 7200
        const luminaId = data.lumina_id || ''
        const passId = data.pass_id || ''

        if (token) {
          // 保存登录信息
          auth.saveLoginData({
            token,
            refreshToken,
            lumina_id: luminaId,
            pass_id: passId,
            expires_in: expiresIn,
            account: this.data.account
          })

          this.setData({ isLoggedIn: true })
          this.stopCountdown()

          console.log('[LoginCode] 登录成功, luminaId:', luminaId)

          // 登录成功后检查用户状态：是否有生日、是否有智能体
          this.checkUserStatus(luminaId)
        } else {
          this.setData({ isVerifying: false, codeError: '登录失败，未获取到 Token' })
        }
      })
      .catch((err) => {
        this.setData({ isVerifying: false, codeError: err.message || '验证码错误' })
      })
  },

  // ── 检查用户状态 ──
  // 对应 Kuikly: LoginViewModel.checkUserStatus()

  checkUserStatus(luminaId) {
    let userInfoChecked = false
    let agentListChecked = false

    const checkComplete = () => {
      if (userInfoChecked && agentListChecked) {
        this.navigateByStatus()
      }
    }

    // 检查用户信息（生日）
    userApi.getUserInfo(luminaId)
      .then((data) => {
        const birthday = data.birthday || ''
        this.setData({ hasBirthday: birthday.length > 0 })
        userInfoChecked = true
        checkComplete()
      })
      .catch(() => {
        this.setData({ hasBirthday: false })
        userInfoChecked = true
        checkComplete()
      })

    // 检查智能体列表
    agentApi.getAgentList(0, 10)
      .then((data) => {
        const agents = data.agents || []
        const hasAgentNow = data.agent && Object.keys(data.agent).length > 0
        this.setData({ hasAgent: hasAgentNow || agents.length > 0 })
        agentListChecked = true
        checkComplete()
      })
      .catch(() => {
        this.setData({ hasAgent: false })
        agentListChecked = true
        checkComplete()
      })
  },

  // ── 路由分发 ──
  // 对应 Kuikly: LoginViewModel.navigateToMainPage()

  navigateByStatus() {
    const { hasBirthday, hasAgent } = this.data

    if (hasBirthday && hasAgent) {
      // 老用户 → 直接进入聊天
      wx.redirectTo({ url: '/pages/chat/chat' })
    } else if (hasBirthday) {
      // 有生日无智能体 → 创建智能体
      wx.redirectTo({
        url: `/pages/welcome-create-agent/welcome-create-agent?hasAgent=false`
      })
    } else {
      // 新用户 → 欢迎页（年龄验证）
      wx.redirectTo({
        url: `/pages/welcome/welcome?hasBirthday=false&hasAgent=${!!hasAgent}`
      })
    }
  },

  // ── 重发验证码 ──

  onResendCode() {
    if (this.data.isCountingDown || this.data.isVerifying) return

    wx.showToast({ title: '验证码已发送', icon: 'none' })
    authApi.sendCode(this.data.account, 'wx_miniprogram_001', this.data.userCity)
      .then(() => {
        this.startCountdown()
      })
      .catch((err) => {
        wx.showToast({ title: err.message || '发送失败', icon: 'none' })
      })
  },

  // ── 更改账号 ──

  onChangeAccount() {
    wx.navigateBack()
  },

  // ── 信息弹窗 ──

  onShowInfo() {
    this.setData({ showInfoSheet: true })
  },

  onCloseInfo() {
    this.setData({ showInfoSheet: false })
  },

  onInfoKnown() {
    this.setData({ showInfoSheet: false })
  }
})
