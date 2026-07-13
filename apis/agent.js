/**
 * 智能体相关 API
 * 对应 Kuikly: ChatViewModel.kt
 *
 * 接口清单：
 * - POST /agent/list           获取智能体列表
 * - POST /agent/:agentId       获取智能体详情
 * - POST /agent/delete         删除智能体
 * - POST /agent/memories       获取智能体记忆
 */

const { post } = require('../utils/request')
const { AGENT_BASE_URL, BASE_URL } = require('../utils/config')

/**
 * 获取智能体列表
 * 对应 Kuikly: ChatViewModel.loadAgentList()
 * @param {number} page 页码
 * @param {number} pageSize 每页数量
 * @returns {Promise<Object>} { total, agents: [{ agentId, name, description, avatarUrl, ... }] }
 */
function getAgentList(page = 0, pageSize = 10) {
  return post(`${AGENT_BASE_URL}/agent/list`, { page, pageSize })
}

/**
 * 获取智能体详情
 * 对应 Kuikly: ChatViewModel.fetchAgentInfo()
 * @param {string} agentId
 * @returns {Promise<Object>} { agentId, name, description, avatarUrl, systemPrompt, model, ... }
 */
function getAgentInfo(agentId) {
  return post(`${AGENT_BASE_URL}/agent/${agentId}`, {})
}

/**
 * 删除智能体
 * 对应 Kuikly: ChatViewModel.deleteAgent()
 * @param {string} agentId
 * @returns {Promise<Object>}
 */
function deleteAgent(agentId) {
  return post(`${AGENT_BASE_URL}/agent/delete`, { agentId })
}

/**
 * 获取智能体记忆列表
 * 对应 Kuikly: ChatViewModel.fetchMemories()
 * @param {string} agentId 智能体ID（可选）
 * @param {number} page 页码
 * @param {number} pageSize 每页数量
 * @returns {Promise<Object>} { total, page, pageSize, memories: [{ memoryId, memory, ... }] }
 */
function getAgentMemories(agentId, page = 0, pageSize = 20) {
  const body = { page, pageSize }
  if (agentId) body.agentId = agentId
  return post(`${BASE_URL}/agent/memories`, body)
}

/**
 * 创建智能体
 * 对应 Kuikly: AgentCreateViewModel.createAgent() + POST /agent/create
 * @param {Object} data
 * @param {string} data.name 智能体名称
 * @param {string} data.description 描述
 * @param {string} data.systemPrompt 系统提示词/性格
 * @param {string} data.gender 性别 male/female/neutral
 * @returns {Promise<Object>} { agentId, name, ... }
 */
function createAgent(data) {
  return post(`${AGENT_BASE_URL}/agent/create`, {
    name: data.name || '',
    description: data.description || '',
    systemPrompt: data.systemPrompt || '',
    gender: data.gender || 'neutral'
  })
}

module.exports = {
  getAgentList,
  getAgentInfo,
  deleteAgent,
  getAgentMemories
}
