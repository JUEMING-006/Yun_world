use super::*;
use crate::state::AppState;
use tauri::State;
use tauri::{WebviewWindow, Size, LogicalSize};

// ====================================================================
// 窗口控制命令
// ====================================================================

/// 展开/收起面板
#[tauri::command]
pub async fn toggle_panel(expand: bool, window: WebviewWindow) -> Result<(), String> {
    let size = if expand {
        LogicalSize::new(380.0, 580.0)
    } else {
        LogicalSize::new(60.0, 60.0)
    };
    window.set_size(size).map_err(|e| e.to_string())?;
    if expand {
        window.center().map_err(|e| e.to_string())?;
        window.show().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// 保存水滴位置（x, y）
#[tauri::command]
pub async fn save_position(x: f64, y: f64, state: State<'_, AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::db::queries::set_setting(&db, "window_position_x", &x.to_string())
        .map_err(|e| e.to_string())?;
    crate::db::queries::set_setting(&db, "window_position_y", &y.to_string())
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// 获取保存的水滴位置
#[tauri::command]
pub async fn get_saved_position(state: State<'_, AppState>) -> Result<(f64, f64), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let x_str = crate::db::queries::get_setting(&db, "window_position_x")
        .map_err(|e| e.to_string())?;
    let y_str = crate::db::queries::get_setting(&db, "window_position_y")
        .map_err(|e| e.to_string())?;
    let x = x_str.parse().unwrap_or(50.0);
    let y = y_str.parse().unwrap_or(50.0);
    Ok((x, y))
}
