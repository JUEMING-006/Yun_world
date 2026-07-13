/**
 * taskStore —— 待办 / 存档任务状态
 *
 * 职责：
 *  - 维护 todoList 与 archiveList
 *  - 通过 useTauriCommands 调用 Rust CRUD
 *  - 打钩：todo -> archived（toggle_task_status）
 *  - 同步紧急任务高亮（来自 Rust 定时器事件）
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Task, NewTask, ColorLevel } from '@/types'
import {
  getTasks,
  createTask,
  toggleTaskStatus,
  deleteTask,
} from '@/composables/useTauriCommands'

export const useTaskStore = defineStore('task', () => {
  const todoList = ref<Task[]>([])
  const archiveList = ref<Task[]>([])
  /** 当前最紧急等级（用于水滴颜色，由 Rust 事件同步） */
  const urgentIds = ref<Set<number>>(new Set())

  const todoCount = computed(() => todoList.value.length)

  /** 加载待办列表（按创建/截止时间排序） */
  async function loadTodo() {
    try {
      todoList.value = await getTasks('todo')
    } catch (e) {
      console.error('加载待办失败:', e)
    }
  }

  /** 加载存档列表 */
  async function loadArchive() {
    try {
      archiveList.value = await getTasks('archived')
    } catch (e) {
      console.error('加载存档失败:', e)
    }
  }

  /** 新建任务，插入待办列表顶部 */
  async function add(task: NewTask) {
    try {
      const created = await createTask(task)
      todoList.value.unshift(created)
    } catch (e) {
      console.error('新建任务失败:', e)
      throw e
    }
  }

  /**
   * 打钩 / 取消打钩：
   *  - 待办打钩 -> 归档（卡片滑出 -> 存档）
   *  - 存档再次打钩 -> 回到待办顶部
   */
  async function toggle(id: number, fromList: 'todo' | 'archive') {
    try {
      const updated = await toggleTaskStatus(id)
      if (fromList === 'todo') {
        todoList.value = todoList.value.filter((t) => t.id !== id)
        archiveList.value.unshift(updated)
      } else {
        archiveList.value = archiveList.value.filter((t) => t.id !== id)
        todoList.value.unshift(updated)
      }
    } catch (e) {
      console.error('切换任务状态失败:', e)
      throw e
    }
  }

  /** 删除任务 */
  async function remove(id: number, fromList: 'todo' | 'archive') {
    try {
      await deleteTask(id)
      if (fromList === 'todo') {
        todoList.value = todoList.value.filter((t) => t.id !== id)
      } else {
        archiveList.value = archiveList.value.filter((t) => t.id !== id)
      }
    } catch (e) {
      console.error('删除任务失败:', e)
      throw e
    }
  }

  /** 由 Rust 定时器事件同步：更新紧急任务集合与水滴颜色等级 */
  function syncUrgentTasks(urgentTasks: Task[]) {
    urgentIds.value = new Set(urgentTasks.map((t) => t.id))
    // 同步各任务的 color_level
    const levelMap = new Map(urgentTasks.map((t) => [t.id, t.color_level]))
    todoList.value = todoList.value.map((t) =>
      levelMap.has(t.id) ? { ...t, color_level: levelMap.get(t.id) as ColorLevel } : t,
    )
  }

  return {
    todoList,
    archiveList,
    urgentIds,
    todoCount,
    loadTodo,
    loadArchive,
    add,
    toggle,
    remove,
    syncUrgentTasks,
  }
})
