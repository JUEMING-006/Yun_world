/**
 * 心理测评 API
 * 对应 Kuikly: AssessmentViewModel.kt + AssessmentModels.kt
 */
const { post, get } = require('../utils/request')
const { BASE_URL } = require('../utils/config')

function getScaleList() {
  return get(`${BASE_URL}/evaluation/scales`, {}, { requiresAuth: true })
}

function startAssessment(testId, mode, agentId) {
  return post(`${BASE_URL}/evaluation/start`, { testId, mode: mode || 'ai', agentId: agentId || '' })
}

function submitAnswer(sessionId, questionId, answer) {
  return post(`${BASE_URL}/evaluation/answer`, { sessionId, questionId, answer })
}

function completeAssessment(sessionId) {
  return post(`${BASE_URL}/evaluation/complete`, { sessionId })
}

function getReport(reportId) {
  return get(`${BASE_URL}/evaluation/report/${reportId}`, {}, { requiresAuth: true })
}

function getHistory(page = 0, pageSize = 20) {
  return post(`${BASE_URL}/evaluation/history`, { page, pageSize })
}

module.exports = { getScaleList, startAssessment, submitAnswer, completeAssessment, getReport, getHistory }
