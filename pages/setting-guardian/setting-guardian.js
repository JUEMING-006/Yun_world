/**
 * 未成年人监管
 * 对应 Kuikly: GuardianSetting.kt
 */
const { post } = require('../../utils/request')
const { BASE_URL } = require('../../utils/config')

Page({
  data: {
    statusBarHeight: 0,
    showInvite: false,
    inviteRelation: 'parent',
    inviteType: 'phone',
    inviteContact: '',
    isSending: false,
    familyMembers: []
  },
  onLoad() {
    this.setData({ statusBarHeight: wx.getSystemInfoSync().statusBarHeight || 20 })
  },
  onBack() { wx.navigateBack() },

  onShowInvite() { this.setData({ showInvite: true }) },
  onCloseInvite() { this.setData({ showInvite: false, inviteContact: '' }) },
  onRelationSelect(e) { this.setData({ inviteRelation: e.currentTarget.dataset.id }) },
  onTypeSelect(e) { this.setData({ inviteType: e.currentTarget.dataset.id }) },
  onContactInput(e) { this.setData({ inviteContact: e.detail.value }) },

  onSendInvitation() {
    const { inviteRelation, inviteType, inviteContact, isSending } = this.data
    if (!inviteContact.trim()) { wx.showToast({ title: '请输入联系方式', icon: 'none' }); return }
    if (isSending) return
    this.setData({ isSending: true })

    post(`${BASE_URL}/family/invite`, {
      relation: inviteRelation,
      type: inviteType,
      contact: inviteContact.trim()
    }, { requiresAuth: true })
      .then(data => {
        this.setData({ isSending: false, showInvite: false, inviteContact: '' })
        wx.showToast({ title: '邀请已发送', icon: 'success' })
      })
      .catch(err => {
        this.setData({ isSending: false })
        wx.showToast({ title: err.message || '发送失败', icon: 'none' })
      })
  },

  goToRealName() {
    wx.navigateTo({ url: '/pages/setting-realname/setting-realname' })
  }
})
