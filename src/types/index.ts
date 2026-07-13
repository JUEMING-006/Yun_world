// ====================================================================
// FloatTask 全局类型定义
// 与 Rust 端 src-tauri/src/db/models.rs 的结构体保持一致
// ====================================================================

/** 任务优先级 */
export type Priority = 'low' | 'medium' | 'high'

/** 任务状态：todo 待办 / archived 已归档（存档） */
export type TaskStatus = 'todo' | 'archived'

/** 任务来源 */
export type TaskSource = 'manual' | 'voice' | 'flash_ai'

/** 闪念来源 */
export type FlashSource = 'text' | 'voice'

/** 颜色预警等级 0-4，与 Rust 端 color_level 对应 */
export type ColorLevel = 0 | 1 | 2 | 3 | 4

/** 完整任务对象（对应 Rust Task 结构体） */
export interface Task {
  id: number
  title: string
  description: string
  priority: Priority
  status: TaskStatus
  /** ISO 8601 格式截止时间，可为空（无截止） */
  deadline: string | null
  created_at: string
  updated_at: string
  archived_at: string | null
  source: TaskSource
  /** 颜色预警等级缓存 (0-4) */
  color_level: ColorLevel
}

/** 新建任务的入参（对应 Rust NewTask） */
export interface NewTask {
  title: string
  description?: string
  priority?: Priority
  deadline?: string | null
  source?: TaskSource
}

/** 闪念笔记（对应 Rust FlashNote 结构体） */
export interface FlashNote {
  id: number
  content: string
  source: FlashSource
  /** 是否已被 AI 整理过 (0/1) */
  is_processed: boolean
  /** 转移到的任务 ID */
  transferred_to: number | null
  created_at: string
}

/** AI 从闪念中整理出的任务三要素（对应 Rust OrganizedTask） */
export interface OrganizedTask {
  task: string
  deadline: string | null
  priority: Priority
}

/** Rust 定时器推送的预警事件 payload */
export interface DeadlineAlert {
  /** 当前最紧急等级 (0-4) */
  max_level: ColorLevel
  /** 达到橙色(3)及以上的紧急任务列表 */
  urgent_tasks: Task[]
}

/** 用户设置（KV 存储，前端聚合视图） */
export interface Settings {
  ai_api_url: string
  ai_api_key: string
  ai_model_name: string
  ai_voice_polish_enabled: boolean
  ai_flash_organize_enabled: boolean
  window_position_x: number
  window_position_y: number
  timer_interval_seconds: number
}

/** 窗口形态：水滴态 / 展开态 */
export type WindowMode = 'droplet' | 'panel'

/** 面板内三个标签页 */
export type PanelTab = 'todo' | 'archive' | 'flash'
