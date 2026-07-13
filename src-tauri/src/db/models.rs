use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

// ====================================================================
// 数据模型 —— 与前端 src/types/index.ts 的接口一一对应
// ====================================================================

/// 任务优先级
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Priority {
    Low,
    Medium,
    High,
}

impl Priority {
    pub fn as_str(&self) -> &'static str {
        match self {
            Priority::Low => "low",
            Priority::Medium => "medium",
            Priority::High => "high",
        }
    }
}

/// 任务状态
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TaskStatus {
    Todo,
    Archived,
}

impl TaskStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            TaskStatus::Todo => "todo",
            TaskStatus::Archived => "archived",
        }
    }
}

/// 任务来源
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TaskSource {
    Manual,
    Voice,
    FlashAi,
}

impl TaskSource {
    pub fn as_str(&self) -> &'static str {
        match self {
            TaskSource::Manual => "manual",
            TaskSource::Voice => "voice",
            TaskSource::FlashAi => "flash_ai",
        }
    }
}

/// 颜色预警等级 0-4
pub type ColorLevel = i32;

/// 完整任务对象
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: i64,
    pub title: String,
    pub description: String,
    pub priority: String, // "low" | "medium" | "high"
    pub status: String,   // "todo" | "archived"
    pub deadline: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub archived_at: Option<String>,
    pub source: String,
    pub color_level: i32,
}

/// 新建任务入参（前端传参，部分字段可为空）
#[derive(Debug, Deserialize)]
pub struct NewTask {
    pub title: String,
    pub description: Option<String>,
    pub priority: Option<String>,
    pub deadline: Option<String>,
    pub source: Option<String>,
}

/// 任务更新字段（仅传需要修改的字段）
#[derive(Debug, Default, Deserialize)]
pub struct TaskUpdate {
    pub title: Option<String>,
    pub description: Option<String>,
    pub priority: Option<String>,
    pub deadline: Option<String>,
    pub status: Option<String>,
    pub color_level: Option<i32>,
    pub archived_at: Option<String>,
}

/// 闪念来源
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum FlashSource {
    Text,
    Voice,
}

/// 闪念笔记
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlashNote {
    pub id: i64,
    pub content: String,
    pub source: String,
    pub is_processed: bool,
    pub transferred_to: Option<i64>,
    pub created_at: String,
}

/// 闪念入参
#[derive(Debug, Deserialize)]
pub struct NewFlashNote {
    pub content: String,
    pub source: String,
}

/// AI 整理后的任务三要素
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrganizedTask {
    pub task: String,
    pub deadline: Option<String>,
    pub priority: String,
}

/// 定时器推送的预警事件 payload
#[derive(Debug, Clone, Serialize)]
pub struct DeadlineAlert {
    pub max_level: ColorLevel,
    pub urgent_tasks: Vec<Task>,
}

/// 设置项 KV
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Setting {
    pub key: String,
    pub value: String,
}
