/**
 * 知识文章页面
 * 严格对照 Kuikly: pages/KnowledgeScreen.kt
 *
 * Kuikly 实现细节：
 * - @Page("Knowledge")
 * - 使用 mock 数据（generateMockData），不从 API 加载
 * - KnowledgeCardData: id, avatar, title, label, author, isFollow
 * - 点击卡片跳转到 "xinLin" 页面（文章详情页），传递 articleId
 * - 使用 KnowledgeCard 组件，支持关注/取消关注
 * - 标题: "心理知识"
 */
Page({
  data: {
    statusBarHeight: 0,
    cardList: []
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20,
      cardList: this.generateMockData()
    })
  },

  onBack() { wx.navigateBack() },

  // ── 生成 Mock 数据 ──
  // 对应 Kuikly: KnowledgeScreen.generateMockData()
  generateMockData() {
    const list = []
    for (let i = 1; i <= 20; i++) {
      list.push({
        id: i.toString(),
        avatar: `https://picsum.photos/400/300?random=${i}`,
        title: 'AI心理咨询成为"电子止痛药"？',
        label: '心理观察',
        author: '心理健康中国',
        isFollow: i % 2 === 0
      })
    }
    return list
  },

  // ── 点击卡片跳转详情 ──
  // 对应 Kuikly: openPage("xinLin", params)
  onCardClick(e) {
    const id = e.currentTarget.dataset.id
    // Kuikly 跳转到 "xinLin" 页面（文章详情页），传递 articleId
    // 小程序中暂用 toast 提示，后续可实现 xinLin 页面
    wx.navigateTo({
      url: `/pages/article-detail/article-detail?articleId=${id}`
    }).catch(() => {
      wx.showToast({ title: '文章详情（开发中）', icon: 'none' })
    })
  },

  // ── 关注/取消关注 ──
  // 对应 Kuikly: KnowledgeScreen.handleFollowClick()
  onFollowClick(e) {
    const id = e.currentTarget.dataset.id
    const cardList = this.data.cardList.map(card => {
      if (card.id === id) {
        return Object.assign({}, card, { isFollow: !card.isFollow })
      }
      return card
    })
    this.setData({ cardList })
  }
})
