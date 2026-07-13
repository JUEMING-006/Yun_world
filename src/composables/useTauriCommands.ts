/**
 * useTauriCommands —— 统一封装所有对 Rust 后端的 invoke 调用
 *
 * 所有命令名与 src-tauri/src/commands/*.rs 中的 #[tauri::command] 函数名一一对应。
 * 前端各 store / composable 均通过此处与后端通信，便于集中维护与类型约束。
 */
import { invoke } from '@tauri-apps/api/core'
import type {
  Task,
  NewTask,
  FlashNote,
  OrganizedTask,
  Settings,
} from '@/types'

// ===================== 任务 =====================

export function getTasks(status: string): Promise<Task[]> {
  return invoke<Task[]>('get_tasks', { status })
}

export function createTask(task: NewTask): Promise<Task> {
  return invoke<Task>('create_task', { task })
}

export function toggleTaskStatus(id: number): Promise<Task> {
  return invoke<Task>('toggle_task_status', { id })
}

export function deleteTask(id: number): Promise<void> {
  return invoke<void>('delete_task', { id })
}

// ===================== 闪念 =====================

export function getFlashNotes(): Promise<FlashNote[]> {
  return invoke<FlashNote[]>('get_flash_notes')
}

export function createFlashNote(content: string, source: string): Promise<FlashNote> {
  return invoke<FlashNote>('create_flash_note', { content, source })
}

export function transferFlashToTask(
  flashId: number,
  task: NewTask,
): Promise<Task> {
  return invoke<Task>('transfer_flash_to_task', { flashId, task })
}

export function deleteFlashNote(id: number): Promise<void> {
  return invoke<void>('delete_flash_note', { id })
}

// ===================== 设置 =====================

export function getAllSettings(): Promise<Settings> {
  return invoke<Settings>('get_all_settings')
}

export function setSetting(key: string, value: string): Promise<void> {
  return invoke<void>('set_setting', { key, value })
}

// ===================== AI =====================

export function aiPolishText(text: string): Promise<string> {
  return invoke<string>('ai_polish_text', { text })
}

export function aiOrganizeFlash(content: string): Promise<OrganizedTask> {
  return invoke<OrganizedTask>('ai_organize_flash', { content })
}

export function aiTestConnection(
  apiUrl: string,
  apiKey: string,
  model: string,
): Promise<boolean> {
  return invoke<boolean>('ai_test_connection', { apiUrl, apiKey, model })
}

// ===================== 窗口 =====================

export function togglePanel(expand: boolean): Promise<void> {
  return invoke<void>('toggle_panel', { expand })
}

export function savePosition(x: number, y: number): Promise<void> {
  return invoke<void>('save_position', { x, y })
}

// ===================== 便捷聚合 =====================

export function useTauriCommands() {
  return {
    // tasks
    getTasks,
    createTask,
    toggleTaskStatus,
    deleteTask,
    // flash
    getFlashNotes,
    createFlashNote,
    transferFlashToTask,
    deleteFlashNote,
    // settings
    getAllSettings,
    setSetting,
    // ai
    aiPolishText,
    aiOrganizeFlash,
    aiTestConnection,
    // window
    togglePanel,
    savePosition,
  }
}
