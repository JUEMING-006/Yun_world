use super::*;
use crate::db::queries::*;
use crate::state::AppState;
use tauri::State;

// ====================================================================
// 任务 CRUD 命令
// ====================================================================

/// 获取指定状态的任务列表
#[tauri::command]
pub async fn get_tasks(status: String, state: State<'_, AppState>) -> Result<Vec<Task>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    get_tasks(&db, &status).map_err(|e| e.to_string())
}

/// 创建新任务
#[tauri::command]
pub async fn create_task(task: NewTask, state: State<'_, AppState>) -> Result<Task, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    create_task(&db, &task).map_err(|e| e.to_string())
}

/// 切换任务状态（待办 <-> 归档）
#[tauri::command]
pub async fn toggle_task_status(id: i64, state: State<'_, AppState>) -> Result<Task, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    toggle_task_status(&db, id).map_err(|e| e.to_string())
}

/// 更新任务（部分字段）
#[tauri::command]
pub async fn update_task(id: i64, updates: TaskUpdate, state: State<'_, AppState>) -> Result<Task, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    update_task(&db, id, &updates).map_err(|e| e.to_string())
}

/// 删除任务
#[tauri::command]
pub async fn delete_task(id: i64, state: State<'_, AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    delete_task(&db, id).map_err(|e| e.to_string())
}

/// 更新单个任务的 color_level（定时器调用）
#[tauri::command]
pub async fn update_color_level(id: i64, level: i32, state: State<'_, AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    update_color_level(&db, id, level).map_err(|e| e.to_string())
}

/// 查询所有有截止时间的待办任务（供定时器使用）
#[tauri::command]
pub async fn get_todo_with_deadline(state: State<'_, AppState>) -> Result<Vec<Task>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    get_todo_tasks_with_deadline(&db).map_err(|e| e.to_string())
}
