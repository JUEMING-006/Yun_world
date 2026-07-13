/**
 * AI 视频创作 API
 * 对应 Kuikly: VideoCreationViewModel.kt + VideoModels.kt
 */
const { post } = require('../utils/request')
const { AGENT_BASE_URL } = require('../utils/config')

function createVideo(data) {
  return post(`${AGENT_BASE_URL}/video/create`, {
    prompt: data.prompt,
    duration: data.duration || 5,
    resolution: data.resolution || '720p',
    sourceImageUrl: data.sourceImageUrl || '',
    agentId: data.agentId || ''
  })
}

function getVideoList(page = 0, pageSize = 20) {
  return post(`${AGENT_BASE_URL}/video/list`, { page, pageSize })
}

function getVideoStatus(videoId) {
  return post(`${AGENT_BASE_URL}/video/${videoId}/status`, {})
}

function deleteVideo(videoId) {
  return post(`${AGENT_BASE_URL}/video/${videoId}/delete`, {})
}

module.exports = { createVideo, getVideoList, getVideoStatus, deleteVideo }
