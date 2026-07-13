/**
 * flashStore —— 闪念笔记状态
 *
 * 闪念特性：无复选框、无时间、无优先级，纯文本备忘。
 * 来源：text / voice（语音录入时追加时间戳）。
 * AI 整理后可「转移」为待办任务，原闪念标记 is_processed。
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { FlashNote, NewTask } from '@/types'
import {
  getFlashNotes,
  createFlashNote,
  transferFlashToTask,
  deleteFlashNote,
} from '@/composables/useTauriCommands'
import { useTaskStore } from './taskStore'

export const useFlashStore = defineStore('flash', () => {
  const list = ref<FlashNote[]>([])

  async function load() {
    try {
      list.value = await getFlashNotes()
    } catch (e) {
      console.error('加载闪念失败:', e)
    }
  }

  /** 新建闪念（语音录入时 source='voice'） */
  async function add(content: string, source: 'text' | 'voice' = 'text') {
    const text = source === 'voice' ? `[${timestamp()}] ${content}` : content
    try {
      const created = await createFlashNote(text, source)
      list.value.unshift(created)
    } catch (e) {
      console.error('新建闪念失败:', e)
      throw e
    }
  }

  /**
   * AI 整理后将闪念转为待办任务
   * @param flashId  闪念 ID
   * @param task     AI 提取出的任务三要素
   */
  async function transferToTask(flashId: number, task: NewTask) {
    try {
      const taskStore = useTaskStore()
      const created = await transferFlashToTask(flashId, {
        ...task,
        source: 'flash_ai',
      })
      // 待办列表顶部插入
      taskStore.todoList.unshift(created)
      // 本地标记该闪念为已转移
      list.value = list.value.map((f) =>
        f.id === flashId
          ? { ...f, is_processed: true, transferred_to: created.id }
          : f,
      )
    } catch (e) {
      console.error('转移闪念失败:', e)
      throw e
    }
  }

  async function remove(id: number) {
    try {
      await deleteFlashNote(id)
      list.value = list.value.filter((f) => f.id !== id)
    } catch (e) {
      console.error('删除闪念失败:', e)
      throw e
    }
  }

  return { list, load, add, transferToTask, remove }
})

/** 生成本地时间戳字符串 HH:mm */
function timestamp(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
