/**
 * 个性化设置页面
 * 对应 Kuikly: SettingScreen/PersonalizationSettingScreen.kt
 */
const auth = require('../../utils/auth')
const userApi = require('../../apis/user')

Page({
  data: {
    statusBarHeight: 0,
    nickname: '',
    bio: '',
    gender: 'unknown',
    genderOptions: [
      { id: 'male', label: '男' },
      { id: 'female', label: '女' },
      { id: 'unknown', label: '保密' }
    ],
    isSaving: false
  },
  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 })
    this.loadUserInfo()
  },
  onBack() { wx.navigateBack() },

  loadUserInfo() {
    const luminaId = auth.getLuminaId()
    if (!luminaId) return
    userApi.getUserInfo(luminaId).then(data => {
      this.setData({
        nickname: data.nickname || '',
        bio: data.bio || '',
        gender: data.gender || 'unknown'
      })
    }).catch(() => {})
  },

  onNicknameInput(e) { this.setData({ nickname: e.detail.value }) },
  onBioInput(e) { this.setData({ bio: e.detail.value }) },
  onGenderSelect(e) { this.setData({ gender: e.currentTarget.dataset.id }) },

  onSave() {
    if (this.data.isSaving) return
    this.setData({ isSaving: true })
    userApi.updateUserInfo({
      nickname: this.data.nickname,
      bio: this.data.bio,
      gender: this.data.gender
    }).then(() => {
      this.setData({ isSaving: false })
      wx.showToast({ title: '保存成功', icon: 'success' })
    }).catch(err => {
      this.setData({ isSaving: false })
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    })
  }
})
