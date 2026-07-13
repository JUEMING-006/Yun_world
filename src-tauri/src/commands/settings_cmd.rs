use super::*;
use crate::db::queries::*;
use crate::state::AppState;
use tauri::State;

// ====================================================================
// 设置 KV 命令
// 前端通过通用 get/set/get_all 读写，不暴露具体 SQL
// ====================================================================

#[tauri::command]
pub async fn get_all_settings(state: State<'_, AppState>) -> Result<std::collections::HashMap<String, String>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let map = get_all_settings(&db).map_err(|e| e.to_string())?;
    Ok(map)
}

#[tauri::command]
pub async fn get_setting(key: String, state: State<'_, AppState>) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    get_setting(&db, &key).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_setting(key: String, value: String, state: State<'_, AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    set_setting(&db, &key, &value).map_err(|e| e.to_string())
}
