/**
 * 欢迎页（新用户引导 — 年龄验证 + 昵称）
 * 对应 Kuikly: WelcomeScreen.kt
 */
const userApi = require('../../apis/user')
const auth = require('../../utils/auth')

Page({
  data: {
    statusBarHeight: 0,
    // 从验证码页传入
    hasBirthday: false,
    hasAgent: false,
    // 昵称
    nickname: '',
    // 生日输入
    birthdayYear: '',
    birthdayMonth: '',
    birthdayDay: '',
    // 状态
    isAgeConfirmed: false,
    isUpdating: false,
    updateError: '',
    showModal: true
  },

  onLoad(options) {
    const sysInfo = wx.getSystemInfoSync()
    const hasBirthday = options.hasBirthday === 'true'
    const hasAgent = options.hasAgent === 'true'

    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20,
      hasBirthday: hasBirthday,
      hasAgent: hasAgent
    })

    // 已有生日 → 跳过年龄验证，直接跳转创建智能体
    if (hasBirthday) {
      wx.redirectTo({
        url: `/pages/welcome-create-agent/welcome-create-agent?hasAgent=${hasAgent}`
      })
    }
  },

  // ── 输入事件 ──

  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value })
  },

  onYearInput(e) {
    this.setData({ birthdayYear: e.detail.value })
  },

  onMonthInput(e) {
    let val = e.detail.value
    if (parseInt(val) > 12) val = '12'
    this.setData({ birthdayMonth: val })
  },

  onDayInput(e) {
    let val = e.detail.value
    if (parseInt(val) > 31) val = '31'
    this.setData({ birthdayDay: val })
  },

  // ── 提交 ──

  onConfirmAge() {
    const { birthdayYear, birthdayMonth, birthdayDay, nickname } = this.data

    // 验证年份
    const year = parseInt(birthdayYear)
    if (!year || year < 1920 || year > 2020) {
      wx.showToast({ title: '请输入有效的出生年份', icon: 'none' })
      return
    }

    // 验证月份
    const month = parseInt(birthdayMonth)
    if (!month || month < 1 || month > 12) {
      wx.showToast({ title: '请输入有效的月份', icon: 'none' })
      return
    }

    // 验证日期
    const day = parseInt(birthdayDay)
    if (!day || day < 1 || day > 31) {
      wx.showToast({ title: '请输入有效的日期', icon: 'none' })
      return
    }

    this.setData({ isAgeConfirmed: true })
  },

  onSubmit() {
    if (!this.data.isAgeConfirmed) {
      this.onConfirmAge()
      return
    }

    if (this.data.isUpdating) return
    this.setData({ isUpdating: true, updateError: '' })

    const birthday = `${this.data.birthdayYear}-${this.data.birthdayMonth.padStart(2, '0')}-${this.data.birthdayDay.padStart(2, '0')}`
    const luminaId = auth.getLuminaId()

    const updateData = { birthday }
    if (this.data.nickname) updateData.nickname = this.data.nickname

    userApi.updateUserInfo(updateData)
      .then(() => {
        this.setData({ isUpdating: false })

        // 根据是否有智能体跳转
        if (this.data.hasAgent) {
          wx.redirectTo({ url: '/pages/chat/chat' })
        } else {
          wx.redirectTo({
            url: '/pages/welcome-create-agent/welcome-create-agent?hasAgent=false'
          })
        }
      })
      .catch((err) => {
        this.setData({ isUpdating: false, updateError: err.message || '提交失败' })
        wx.showToast({ title: err.message || '提交失败', icon: 'none' })
      })
  },

  // 跳过功能已移除 — 新用户必须完成年龄验证
})
