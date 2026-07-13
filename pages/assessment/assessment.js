/**
 * 心理测评主页
 * 对应 Kuikly: AssessmentScreen.kt + AssessmentViewModel.kt
 */
const assessApi = require('../../apis/assessment')
const agentApi = require('../../apis/agent')

Page({
  data: {
    statusBarHeight: 0,
    scales: [],
    history: [],
    agents: [],
    isLoading: false,
    activeTab: 0 // 0=量表列表, 1=历史记录
  },
  onLoad() {
    this.setData({ statusBarHeight: wx.getSystemInfoSync().statusBarHeight || 20 })
    this.loadScales()
    this.loadAgents()
  },
  onBack() { wx.navigateBack() },
  onTabChange(e) { this.setData({ activeTab: e.currentTarget.dataset.tab }) },

  loadScales() {
    this.setData({ isLoading: true })
    assessApi.getScaleList().then(data => {
      this.setData({ scales: data.scales || data || [], isLoading: false })
    }).catch(() => {
      this.setData({ scales: [
        { testId: 'sds', name: '抑郁自评量表(SDS)', description: '评估抑郁症状严重程度', questionCount: 20, estimatedMinutes: 5 },
        { testId: 'sas', name: '焦虑自评量表(SAS)', description: '评估焦虑症状严重程度', questionCount: 20, estimatedMinutes: 5 },
        { testId: 'phq9', name: 'PHQ-9 抑郁筛查', description: '9项患者健康问卷', questionCount: 9, estimatedMinutes: 3 },
        { testId: 'gad7', name: 'GAD-7 焦虑筛查', description: '7项广泛性焦虑障碍量表', questionCount: 7, estimatedMinutes: 3 }
      ], isLoading: false })
    })
  },

  loadAgents() {
    agentApi.getAgentList(0, 10).then(data => {
      this.setData({ agents: data.agents || [] })
    }).catch(() => {})
  },

  loadHistory() {
    assessApi.getHistory(0, 50).then(data => {
      this.setData({ history: data.sessions || [] })
    }).catch(() => {})
  },

  onStartAssessment(e) {
    const testId = e.currentTarget.dataset.id
    const testName = e.currentTarget.dataset.name
    const agentId = this.data.agents.length > 0 ? this.data.agents[0].agentId : ''

    assessApi.startAssessment(testId, 'ai', agentId).then(data => {
      wx.navigateTo({
        url: `/pages/assessment-chat/assessment-chat?sessionId=${data.sessionId}&testName=${encodeURIComponent(testName)}&totalQuestions=${data.totalQuestions || 0}`
      })
    }).catch(err => {
      wx.showToast({ title: err.message || '启动测评失败', icon: 'none' })
    })
  },

  onViewReport(e) {
    const reportId = e.currentTarget.dataset.reportid
    if (reportId) wx.navigateTo({ url: `/pages/assessment-report/assessment-report?reportId=${reportId}` })
  }
})
