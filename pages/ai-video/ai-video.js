/**
 * AI 视频创作页面
 * 对应 Kuikly: AIVideoScreen.kt + VideoCreationViewModel.kt
 */
const videoApi = require('../../apis/video')

Page({
  data: {
    statusBarHeight: 0,
    // 创建表单
    showCreate: false,
    prompt: '',
    sourceImageUrl: '',
    duration: 5,
    resolution: '720p',
    durationOptions: [{ id: 5, label: '5秒' }, { id: 10, label: '10秒' }],
    resolutionOptions: [{ id: '720p', label: '720p' }, { id: '1080p', label: '1080p' }],
    // 视频列表
    videos: [],
    isLoading: false,
    isCreating: false,
    page: 0,
    hasMore: true,
    // 轮询定时器
    _pollTimer: null
  },
  onLoad() {
    this.setData({ statusBarHeight: wx.getSystemInfoSync().statusBarHeight || 20 })
    this.loadVideos(0)
  },
  onUnload() { this.stopPolling() },
  onBack() { wx.navigateBack() },

  loadVideos(page) {
    this.setData({ isLoading: true })
    videoApi.getVideoList(page, 20).then(data => {
      const videos = (data.videos || []).map(v => ({
        videoCreationId: v.videoCreationId,
        prompt: v.prompt,
        sourceImageUrl: v.sourceImageUrl,
        videoUrl: v.videoUrl,
        status: v.status,
        duration: v.duration,
        resolution: v.resolution,
        errorMessage: v.errorMessage,
        createTime: v.createTime,
        isCompleted: v.status === 'completed',
        isFailed: v.status === 'failed',
        isProcessing: v.status === 'pending' || v.status === 'processing'
      }))
      const hasMore = videos.length >= 20
      if (page === 0) this.setData({ videos, page: 0, hasMore, isLoading: false })
      else this.setData({ videos: this.data.videos.concat(videos), page, hasMore, isLoading: false })
      // 有处理中的视频则启动轮询
      if (videos.some(v => v.isProcessing)) this.startPolling()
    }).catch(() => this.setData({ isLoading: false }))
  },

  onShowCreate() { this.setData({ showCreate: true }) },
  onCloseCreate() { this.setData({ showCreate: false, prompt: '', sourceImageUrl: '' }) },
  onPromptInput(e) { this.setData({ prompt: e.detail.value }) },
  onDurationSelect(e) { this.setData({ duration: e.currentTarget.dataset.id }) },
  onResolutionSelect(e) { this.setData({ resolution: e.currentTarget.dataset.id }) },

  onChooseSourceImage() {
    wx.chooseMedia({ count: 1, mediaType: ['image'], success: (res) => {
      this.setData({ sourceImageUrl: res.tempFiles[0].tempFilePath })
    }})
  },

  onCreateVideo() {
    const { prompt, sourceImageUrl, duration, resolution, isCreating } = this.data
    if (!prompt.trim()) { wx.showToast({ title: '请输入提示词', icon: 'none' }); return }
    if (isCreating) return
    this.setData({ isCreating: true })

    videoApi.createVideo({ prompt: prompt.trim(), sourceImageUrl, duration, resolution })
      .then(() => {
        this.setData({ isCreating: false, showCreate: false, prompt: '', sourceImageUrl: '' })
        wx.showToast({ title: '已提交，正在生成', icon: 'success' })
        this.loadVideos(0)
        this.startPolling()
      })
      .catch(err => {
        this.setData({ isCreating: false })
        wx.showToast({ title: err.message || '创建失败', icon: 'none' })
      })
  },

  startPolling() {
    this.stopPolling()
    this._pollTimer = setInterval(() => {
      const processing = this.data.videos.filter(v => v.isProcessing)
      if (processing.length === 0) { this.stopPolling(); return }
      processing.forEach(v => {
        videoApi.getVideoStatus(v.videoCreationId).then(data => {
          const videos = this.data.videos.map(item => {
            if (item.videoCreationId === v.videoCreationId) {
              return Object.assign({}, item, {
                status: data.status, videoUrl: data.videoUrl,
                isCompleted: data.status === 'completed', isFailed: data.status === 'failed',
                isProcessing: data.status === 'pending' || data.status === 'processing'
              })
            }
            return item
          })
          this.setData({ videos })
        }).catch(() => {})
      })
    }, 5000)
  },

  stopPolling() { if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null } },

  onPlayVideo(e) {
    const url = e.currentTarget.dataset.url
    if (url) wx.openEmbeddedVideoPlayer && wx.openEmbeddedVideoPlayer({ url })
  },

  onRetryVideo(e) {
    const id = e.currentTarget.dataset.id
    const video = this.data.videos.find(v => v.videoCreationId === id)
    if (video) {
      videoApi.createVideo({ prompt: video.prompt, sourceImageUrl: video.sourceImageUrl, duration: video.duration, resolution: video.resolution })
        .then(() => { wx.showToast({ title: '已重新提交', icon: 'success' }); this.loadVideos(0) })
    }
  },

  onDeleteVideo(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({ title: '删除视频', content: '确定要删除这个视频吗？', success: (res) => {
      if (res.confirm) {
        videoApi.deleteVideo(id).then(() => {
          this.setData({ videos: this.data.videos.filter(v => v.videoCreationId !== id) })
          wx.showToast({ title: '已删除', icon: 'success' })
        })
      }
    }})
  },

  onLoadMore() {
    if (!this.data.isLoading && this.data.hasMore) this.loadVideos(this.data.page + 1)
  }
})
