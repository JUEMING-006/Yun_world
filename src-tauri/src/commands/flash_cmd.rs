use super::*;
use crate::db::queries::*;
use crate::state::AppState;
use tauri::State;

// ====================================================================
// 闪念 CRUD 命令
// ====================================================================

#[tauri::command]
pub async fn get_flash_notes(state: State<'_, AppState>) -> Result<Vec<FlashNote>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    get_flash_notes(&db).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_flash_note(
    content: String,
    source: String,
    state: State<'_, AppState>,
) -> Result<FlashNote, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let note = NewFlashNote { content, source };
    create_flash_note(&db, &note).map_err(|e| e.to_string())
}

/// 将闪念标记为已转移（is_processed=1, transferred_to=task_id）
#[tauri::command]
pub async fn mark_flash_transferred(
    flash_id: i64,
    task_id: i64,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    mark_flash_transferred(&db, flash_id, task_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_flash_note(id: i64, state: State<'_, AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    delete_flash_note(&db, id).map_err(|e| e.to_string())
}
