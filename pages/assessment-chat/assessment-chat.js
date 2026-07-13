/**
 * 测评对话页
 * 对应 Kuikly: AssessmentChatScreen.kt + AssessmentChatViewModel.kt
 */
const assessApi = require('../../apis/assessment')

Page({
  data: {
    statusBarHeight: 0, sessionId: '', testName: '', totalQuestions: 0,
    currentIndex: 0, messages: [], currentQuestion: null, isSubmitting: false, isCompleted: false
  },
  onLoad(options) {
    this.setData({ statusBarHeight: wx.getSystemInfoSync().statusBarHeight || 20,
      sessionId: options.sessionId || '', testName: decodeURIComponent(options.testName || ''),
      totalQuestions: parseInt(options.totalQuestions) || 0 })
    this.loadNextQuestion()
  },
  onBack() { wx.navigateBack() },

  loadNextQuestion() {
    assessApi.submitAnswer(this.data.sessionId, '', '').then(data => {
      if (data.status === 'completed' || !data.question) {
        this.onAssessmentComplete()
        return
      }
      const q = data.question
      this.setData({ currentQuestion: q, currentIndex: data.currentQuestionIndex || 0, totalQuestions: data.totalQuestions || 0 })
    }).catch(() => {
      // 如果没有更多问题，尝试完成
      this.onAssessmentComplete()
    })
  },

  onAnswerSelect(e) {
    const value = e.currentTarget.dataset.value
    const text = e.currentTarget.dataset.text
    if (!this.data.currentQuestion || this.data.isSubmitting) return
    this.setData({ isSubmitting: true })
    const msgs = this.data.messages.concat([{ type: 'user', content: text || value }])
    this.setData({ messages: msgs })

    assessApi.submitAnswer(this.data.sessionId, this.data.currentQuestion.questionId, value)
      .then(data => {
        this.setData({ isSubmitting: false })
        if (data.status === 'completed' || !data.question) {
          this.onAssessmentComplete()
        } else {
          this.setData({ currentQuestion: data.question, currentIndex: data.currentQuestionIndex || this.data.currentIndex + 1 })
        }
      })
      .catch(() => { this.setData({ isSubmitting: false }); wx.showToast({ title: '提交失败', icon: 'none' }) })
  },

  onTextAnswer(e) { this.setData({ textAnswer: e.detail.value }) },
  onSubmitTextAnswer() {
    if (!this.data.textAnswer || !this.data.currentQuestion) return
    const msgs = this.data.messages.concat([{ type: 'user', content: this.data.textAnswer }])
    this.setData({ messages: msgs, isSubmitting: true })
    assessApi.submitAnswer(this.data.sessionId, this.data.currentQuestion.questionId, this.data.textAnswer)
      .then(data => {
        this.setData({ isSubmitting: false, textAnswer: '' })
        if (data.status === 'completed' || !data.question) this.onAssessmentComplete()
        else this.setData({ currentQuestion: data.question, currentIndex: data.currentQuestionIndex })
      }).catch(() => this.setData({ isSubmitting: false }))
  },

  onAssessmentComplete() {
    this.setData({ isCompleted: true, currentQuestion: null })
    assessApi.completeAssessment(this.data.sessionId).then(data => {
      const reportId = data.reportId || ''
      this.setData({ messages: this.data.messages.concat([{ type: 'system', content: '测评完成！正在生成报告...' }]) })
      setTimeout(() => {
        wx.redirectTo({ url: `/pages/assessment-report/assessment-report?reportId=${reportId}&sessionId=${this.data.sessionId}` })
      }, 1500)
    }).catch(() => {
      this.setData({ messages: this.data.messages.concat([{ type: 'system', content: '测评完成' }]) })
    })
  }
})
