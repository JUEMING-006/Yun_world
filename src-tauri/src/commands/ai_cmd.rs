use super::*;
use crate::ai::{self, client::AiClient};
use crate::db::queries::*;
use crate::state::AppState;
use tauri::State;

// ====================================================================
// AI 代理命令
// 所有 API 请求走 Rust 后端，Key 永远不经过前端网络层
// ====================================================================

fn load_ai_settings(state: &AppState) -> Result<ai::AiClient, AppError> {
    let db = state.db.lock().map_err(|e| AppError::Custom(e.to_string()))?;
    let map = get_all_settings(&db)?;
    let url = map.get("ai_api_url").cloned().unwrap_or_default();
    let key = map.get("ai_api_key").cloned().unwrap_or_default();
    let model = map.get("ai_model_name").cloned().unwrap_or_default();
    if url.is_empty() || key.is_empty() || model.is_empty() {
        return Err(AppError::AiNotConfigured);
    }
    Ok(AiClient::new(&url, &key, &model))
}

/// 语音转写润色
#[tauri::command]
pub async fn ai_polish_text(text: String, state: State<'_, AppState>) -> Result<String, String> {
    let client = load_ai_settings(&state).map_err(|e| e.to_string())?;
    client
        .chat(ai::prompts::VOICE_POLISH_PROMPT, &text)
        .await
        .map_err(|e| e.to_string())
}

/// 闪念 AI 整理
#[tauri::command]
pub async fn ai_organize_flash(
    content: String,
    state: State<'_, AppState>,
) -> Result<OrganizedTask, String> {
    let client = load_ai_settings(&state).map_err(|e| e.to_string())?;
    let raw = client
        .chat(ai::prompts::FLASH_ORGANIZE_PROMPT, &content)
        .await
        .map_err(|e| e.to_string())?;

    // 预处理：去除 markdown 包裹 ```json ... ```
    let cleaned = raw
        .trim()
        .trim_start_matches("```json")
        .trim_start_matches("```")
        .trim_end_matches("```")
        .trim()
        .to_string();

    serde_json::from_str::<OrganizedTask>(&cleaned)
        .map_err(|e| format!("AI返回格式异常，请重试 ({}): {}", e, cleaned))
}

/// 测试 API 连接
#[tauri::command]
pub async fn ai_test_connection(
    api_url: String,
    api_key: String,
    model: String,
) -> Result<bool, String> {
    let client = AiClient::new(&api_url, &api_key, &model);
    match client.chat(ai::prompts::PING_PROMPT, "ping").await {
        Ok(resp) if resp.contains("pong") => Ok(true),
        Ok(_) => Ok(true), // 能返回就算连通
        Err(e) => Err(e.to_string()),
    }
}
