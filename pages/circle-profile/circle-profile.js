/**
 * 我的朋友圈主页
 * 对应 Kuikly: MyCircleProfile.kt
 */
const { post } = require('../../utils/request')
const { BASE_URL } = require('../../utils/config')
const auth = require('../../utils/auth')

Page({
  data: { statusBarHeight: 0, posts: [], isLoading: false, nickname: '', avatarUrl: '' },
  onLoad() {
    this.setData({ statusBarHeight: wx.getSystemInfoSync().statusBarHeight || 20, nickname: wx.getStorageSync('user_nickname') || '我', avatarUrl: wx.getStorageSync('user_avatar_uri') || '' })
    this.loadMyPosts()
  },
  onBack() { wx.navigateBack() },

  loadMyPosts() {
    this.setData({ isLoading: true })
    // 从本地缓存加载
    try {
      const cached = wx.getStorageSync('user_circle_posts')
      if (cached) this.setData({ posts: JSON.parse(cached), isLoading: false })
      else this.setData({ posts: [], isLoading: false })
    } catch (e) { this.setData({ isLoading: false }) }
  },

  onDeletePost(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({ title: '删除动态', content: '确定要删除吗？', success: (res) => {
      if (res.confirm) {
        const posts = this.data.posts.filter(p => p.id !== id)
        this.setData({ posts })
        wx.setStorageSync('user_circle_posts', JSON.stringify(posts))
        post(`${BASE_URL}/ms/feedback/${id}`, { type: 'delete' }, { requiresAuth: true }).catch(() => {})
        wx.showToast({ title: '已删除', icon: 'success' })
      }
    }})
  },

  onPreviewImage(e) {
    wx.previewImage({ current: e.currentTarget.dataset.current, urls: e.currentTarget.dataset.urls || [] })
  },

  goToPublish() { wx.navigateTo({ url: '/pages/circle-publish/circle-publish' }) }
})
