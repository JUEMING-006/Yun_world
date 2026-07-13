/**
 * 测评报告页
 * 对应 Kuikly: AssessmentReportScreen.kt
 */
const assessApi = require('../../apis/assessment')

Page({
  data: { statusBarHeight: 0, report: null, isLoading: true },
  onLoad(options) {
    this.setData({ statusBarHeight: wx.getSystemInfoSync().statusBarHeight || 20 })
    if (options.reportId) this.loadReport(options.reportId)
    else this.setData({ isLoading: false })
  },
  onBack() { wx.navigateBack() },

  loadReport(reportId) {
    assessApi.getReport(reportId).then(data => {
      this.setData({ report: {
        title: data.title || data.testName || '测评报告',
        overallScore: data.overallScore || 0,
        overallLevel: data.overallLevel || '',
        aiSummary: data.aiSummary || data.interpretation || '',
        dimensions: data.dimensions || [],
        suggestions: data.suggestions || [],
        createdAt: data.createdAt || ''
      }, isLoading: false })
    }).catch(() => {
      this.setData({ report: { title: '测评报告', overallScore: 0, overallLevel: '暂无数据', aiSummary: '报告生成中，请稍后查看', dimensions: [], suggestions: [] }, isLoading: false })
    })
  },

  getLevelText(level) {
    const map = { normal: '正常', mild: '轻度', moderate: '中度', severe: '重度' }
    return map[level] || level || '—'
  },

  getLevelColor(level) {
    const map = { normal: '#0cd053', mild: '#FF9800', moderate: '#FF5722', severe: '#F44336' }
    return map[level] || '#999'
  }
})
