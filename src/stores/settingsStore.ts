/**
 * settingsStore —— 用户设置（含 AI 配置）
 *
 * 设置项以 KV 形式存储于 Rust 端 SQLite settings 表。
 * 前端聚合为单一 Settings 对象，并提供 aiConfigured 便捷判断。
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Settings } from '@/types'
import { getAllSettings, setSetting } from '@/composables/useTauriCommands'

/** 默认设置（与 Rust 端默认值一致） */
export const DEFAULT_SETTINGS: Settings = {
  ai_api_url: '',
  ai_api_key: '',
  ai_model_name: '',
  ai_voice_polish_enabled: false,
  ai_flash_organize_enabled: false,
  window_position_x: 50,
  window_position_y: 50,
  timer_interval_seconds: 60,
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>({ ...DEFAULT_SETTINGS })
  const loaded = ref(false)

  /** AI 是否已配置（url + key + model 均非空） */
  const aiConfigured = computed(
    () =>
      settings.value.ai_api_url.trim() !== '' &&
      settings.value.ai_api_key.trim() !== '' &&
      settings.value.ai_model_name.trim() !== '',
  )

  /** 从 Rust 加载全部设置 */
  async function load() {
    try {
      settings.value = await getAllSettings()
      loaded.value = true
    } catch (e) {
      console.error('加载设置失败，使用默认值:', e)
      settings.value = { ...DEFAULT_SETTINGS }
      loaded.value = true
    }
  }

  /**
   * 写入单项设置
   * @param key   Settings 字段名
   * @param value 字符串值（布尔/数字在调用方转换）
   */
  async function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    const strVal = String(value)
    // 乐观更新
    settings.value[key] = value
    try {
      await setSetting(key, strVal)
    } catch (e) {
      console.error(`保存设置 ${key} 失败:`, e)
      throw e
    }
  }

  return { settings, loaded, aiConfigured, load, update }
})
