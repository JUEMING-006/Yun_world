/**
 * useAI —— 前端 AI 调用封装
 *
 * 调用 Rust 后端的 AI 代理命令（ai_polish_text / ai_organize_flash / ai_test_connection）。
 * API Key 永远不出 Rust 进程，前端只传文本与配置项。
 * 依赖 settingsStore.aiConfigured 判断是否已配置可用 API。
 */
import { ref } from 'vue'
import { aiPolishText, aiOrganizeFlash, aiTestConnection } from './useTauriCommands'
import { useSettingsStore } from '@/stores/settingsStore'
import type { OrganizedTask } from '@/types'

export function useAI() {
  const settings = useSettingsStore()

  const loading = ref(false)
  const error = ref<string | null>(null)

  /** 是否已配置可用的 AI API（前端快速判断，真正校验由后端负责） */
  const aiAvailable = () => settings.aiConfigured

  /** 语音转写润色 */
  const polish = async (text: string): Promise<string> => {
    if (!text.trim()) return text
    loading.value = true
    error.value = null
    try {
      return await aiPolishText(text)
    } catch (e) {
      error.value = (e as Error).message || '润色失败'
      return text // 失败时回退原文
    } finally {
      loading.value = false
    }
  }

  /** 闪念整理为任务三要素 */
  const organizeFlash = async (content: string): Promise<OrganizedTask | null> => {
    if (!content.trim()) return null
    loading.value = true
    error.value = null
    try {
      return await aiOrganizeFlash(content)
    } catch (e) {
      error.value = (e as Error).message || '整理失败'
      return null
    } finally {
      loading.value = false
    }
  }

  /** 测试 API 连接 */
  const testConnection = async (
    apiUrl: string,
    apiKey: string,
    model: string,
  ): Promise<{ ok: boolean; message: string }> => {
    loading.value = true
    error.value = null
    try {
      await aiTestConnection(apiUrl, apiKey, model)
      return { ok: true, message: '已连接' }
    } catch (e) {
      const msg = (e as Error).message || '连接失败'
      error.value = msg
      return { ok: false, message: msg }
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    aiAvailable,
    polish,
    organizeFlash,
    testConnection,
  }
}
