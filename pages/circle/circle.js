/**
 * 朋友圈页面
 * 严格对照 Kuikly: pages/Circle.kt
 *
 * Kuikly 实现细节：
 * - @Page("Circle")
 * - 从 /api/circle/ai/messages (GET) 加载 AI 发布的消息
 * - 从本地缓存加载用户自己的帖子
 * - CirclePost 数据结构: id, userId, userName, userAvatar, content, images, timestamp, likes, comments
 * - CircleComment 数据结构: id, userId, userName, content, timestamp
 * - 使用 CirclePostItem 组件渲染
 */
const { get, post } = require('../../utils/request')
const { BASE_URL } = require('../../utils/config')
const auth = require('../../utils/auth')

Page({
  data: {
    statusBarHeight: 0,
    circlePosts: [],
    userAvatar: '',
    isLoading: false,
    // 发布弹窗
    showPublish: false,
    publishContent: '',
    publishImages: [],
    isPublishing: false
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 })
  },

  onShow() {
    this.loadUserInfo()
    this.loadCirclePosts()
  },

  onBack() { wx.navigateBack() },

  // ── 加载用户信息 ──
  // 对应 Kuikly: Circle.loadUserInfo()
  loadUserInfo() {
    const userAvatar = wx.getStorageSync('user_avatar_uri') || ''
    this.setData({ userAvatar })
  },

  // ── 加载朋友圈帖子 ──
  // 对应 Kuikly: Circle.loadCirclePosts()
  loadCirclePosts() {
    if (this.data.isLoading) return
    this.setData({ isLoading: true, circlePosts: [] })

    // 从后端加载 AI 发布的消息
    this.loadAiMessagesFromServer()
    // 加载用户自己的帖子（从本地缓存）
    this.loadUserCirclePosts()
  },

  // ── 从后端加载 AI 消息 ──
  // 对应 Kuikly: Circle.loadAiMessagesFromServer()
  // Kuikly 使用: GET /api/circle/ai/messages
  loadAiMessagesFromServer() {
    get(`${BASE_URL}/api/circle/ai/messages`, {}, { requiresAuth: true })
      .then(data => {
        const messages = data.messages || []
        const posts = messages
          .map(m => this.parsePostFromJson(m))
          .filter(p => p && p.userId === 'ai')

        this.setData({
          circlePosts: this.data.circlePosts.concat(posts),
          isLoading: false
        })
      })
      .catch(err => {
        console.error('[Circle] 加载 AI 消息失败:', err)
        this.setData({ isLoading: false })
        // 失败时加载本地缓存
        this.loadUserCirclePosts()
      })
  },

  // ── 加载用户本地帖子 ──
  // 对应 Kuikly: Circle.loadUserCirclePosts()
  loadUserCirclePosts() {
    try {
      const cached = wx.getStorageSync('user_circle_posts')
      if (cached) {
        const posts = JSON.parse(cached)
        if (Array.isArray(posts) && posts.length > 0) {
          this.setData({
            circlePosts: posts.concat(this.data.circlePosts)
          })
        }
      }
    } catch (e) {
      console.error('[Circle] 加载本地帖子失败:', e)
    }
  },

  // ── 解析帖子 JSON ──
  // 对应 Kuikly: Circle.parsePostFromJson()
  parsePostFromJson(jsonObj) {
    if (!jsonObj) return null
    try {
      const images = []
      const imagesArray = jsonObj.images || []
      if (Array.isArray(imagesArray)) {
        imagesArray.forEach(img => { if (img) images.push(img) })
      }

      const likes = []
      const likesArray = jsonObj.likes || []
      if (Array.isArray(likesArray)) {
        likesArray.forEach(like => { if (like) likes.push(like) })
      }

      const comments = []
      const commentsArray = jsonObj.comments || []
      if (Array.isArray(commentsArray)) {
        commentsArray.forEach(c => {
          comments.push({
            id: c.id || '',
            userId: c.userId || '',
            userName: c.userName || '',
            content: c.content || '',
            timestamp: c.timestamp || 0
          })
        })
      }

      return {
        id: jsonObj.id || '',
        userId: jsonObj.userId || '',
        userName: jsonObj.userName || '匿名用户',
        userAvatar: jsonObj.userAvatar || '',
        content: jsonObj.content || '',
        images: images,
        timestamp: jsonObj.timestamp || 0,
        likes: likes,
        comments: comments,
        isLiked: likes.includes(auth.getLuminaId()),
        likeCount: likes.length,
        commentCount: comments.length,
        createTime: jsonObj.timestamp ? this.formatTime(jsonObj.timestamp) : ''
      }
    } catch (e) {
      return null
    }
  },

  formatTime(ts) {
    const d = new Date(ts)
    const now = new Date()
    const diff = now - d
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
    return `${d.getMonth() + 1}/${d.getDate()}`
  },

  // ── 点赞 ──
  onLike(e) {
    const id = e.currentTarget.dataset.id
    const luminaId = auth.getLuminaId()
    const posts = this.data.circlePosts.map(p => {
      if (p.id === id) {
        const isLiked = !p.isLiked
        const likes = isLiked ? p.likes.concat([luminaId]) : p.likes.filter(l => l !== luminaId)
        return Object.assign({}, p, { isLiked, likes, likeCount: likes.length })
      }
      return p
    })
    this.setData({ circlePosts: posts })
    // 调用后端反馈接口
    post(`${BASE_URL}/ms/feedback/${id}`, { type: 'like' }, { requiresAuth: true }).catch(() => {})
  },

  // ── 发布动态 ──
  onShowPublish() { this.setData({ showPublish: true }) },
  onClosePublish() { this.setData({ showPublish: false, publishContent: '', publishImages: [] }) },
  onPublishInput(e) { this.setData({ publishContent: e.detail.value }) },

  onChooseImages() {
    wx.chooseMedia({
      count: 9 - this.data.publishImages.length,
      mediaType: ['image'],
      success: (res) => {
        const newImages = res.tempFiles.map(f => f.tempFilePath)
        this.setData({ publishImages: this.data.publishImages.concat(newImages).slice(0, 9) })
      }
    })
  },

  onRemoveImage(e) {
    const idx = e.currentTarget.dataset.idx
    const images = this.data.publishImages.filter((_, i) => i !== idx)
    this.setData({ publishImages: images })
  },

  onPublish() {
    const content = this.data.publishContent.trim()
    if (!content) { wx.showToast({ title: '请输入内容', icon: 'none' }); return }
    if (this.data.isPublishing) return
    this.setData({ isPublishing: true })

    // 对应 Kuikly: POST /ms/post
    post(`${BASE_URL}/ms/post`, { content, images: this.data.publishImages }, { requiresAuth: true })
      .then(() => {
        // 保存到本地缓存
        const newPost = {
          id: 'local_' + Date.now(),
          userId: auth.getLuminaId(),
          userName: '我',
          userAvatar: this.data.userAvatar,
          content,
          images: this.data.publishImages,
          timestamp: Date.now(),
          likes: [],
          comments: [],
          isLiked: false,
          likeCount: 0,
          commentCount: 0,
          createTime: '刚刚'
        }
        try {
          const cached = wx.getStorageSync('user_circle_posts')
          const posts = cached ? JSON.parse(cached) : []
          posts.unshift(newPost)
          wx.setStorageSync('user_circle_posts', JSON.stringify(posts))
        } catch (e) {}

        this.setData({ isPublishing: false, showPublish: false, publishContent: '', publishImages: [] })
        wx.showToast({ title: '发布成功', icon: 'success' })
        this.loadCirclePosts()
      })
      .catch(err => {
        this.setData({ isPublishing: false })
        wx.showToast({ title: err.message || '发布失败', icon: 'none' })
      })
  },

  onPreviewImage(e) {
    const current = e.currentTarget.dataset.current
    const urls = e.currentTarget.dataset.urls || [current]
    wx.previewImage({ current, urls })
  }
})
