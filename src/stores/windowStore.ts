/**
 * windowStore —— 窗口形态与预警状态
 *
 * 职责：
 *  - mode: 'droplet' | 'panel'（水滴态 / 展开态）
 *  - urgencyLevel: 0-4 颜色预警等级（驱动水滴颜色）
 *  - 水滴位置记忆
 *  - 静默期控制（用户手动收起后一段时间内不自动展开）
 *  - 与 Rust window_cmd 通信切换窗口尺寸
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ColorLevel, WindowMode } from '@/types'
import { togglePanel } from '@/composables/useTauriCommands'

const SILENCE_PERIOD_MS = 5 * 60 * 1000 // 5 分钟静默期

export const useWindowStore = defineStore('window', () => {
  const mode = ref<WindowMode>('droplet')
  const urgencyLevel = ref<ColorLevel>(0)
  const dropletX = ref(0)
  const dropletY = ref(0)
  /** 是否处于静默期（手动收起后） */
  const silenceUntil = ref<number>(0)

  const isExpanded = computed(() => mode.value === 'panel')
  const inSilencePeriod = computed(() => Date.now() < silenceUntil.value)

  /** 启动初始化（由 App.vue onMounted 调用） */
  async function init() {
    // 默认水滴态；Rust 端在 setup 中已设置窗口为 60x60
    mode.value = 'droplet'
  }

  /** 展开为面板 */
  async function expand() {
    mode.value = 'panel'
    try {
      await togglePanel(true)
    } catch (e) {
      console.error('展开失败:', e)
    }
  }

  /** 收回为水滴（用户主动操作，进入静默期） */
  async function collapse() {
    mode.value = 'droplet'
    silenceUntil.value = Date.now() + SILENCE_PERIOD_MS
    try {
      await togglePanel(false)
    } catch (e) {
      console.error('收起失败:', e)
    }
  }

  /** 紧急自动展开（由定时器触发，不受静默期限制已在外层判断） */
  async function autoExpand() {
    mode.value = 'panel'
    try {
      await togglePanel(true)
    } catch (e) {
      console.error('自动展开失败:', e)
    }
  }

  function setUrgencyLevel(level: ColorLevel) {
    urgencyLevel.value = level
  }

  function setPosition(x: number, y: number) {
    dropletX.value = x
    dropletY.value = y
  }

  return {
    mode,
    urgencyLevel,
    dropletX,
    dropletY,
    silenceUntil,
    isExpanded,
    inSilencePeriod,
    init,
    expand,
    collapse,
    autoExpand,
    setUrgencyLevel,
    setPosition,
  }
})
