use std::time::Duration;
use chrono::{Local, NaiveDateTime};
use tauri::{AppHandle, Emitter};
use crate::db::queries::*;
use crate::error::Result;
use crate::state::AppState;

// ====================================================================
// 定时器调度器 —— Tokio 轻量轮询
//
// 每 60s 唤醒一次，扫描所有有截止时间的 todo 任务，
// 计算 color_level 并更新数据库，向 UI 推送预警事件。
//
// 静默期逻辑（TODO）：用户手动收起面板后 5 分钟内不自动展开。
// 静默期时间戳暂未持久化，Phase 3 补充。
// ====================================================================

pub async fn start_deadline_scanner(app: AppHandle, state: tauri::State<'_, AppState>) {
    let mut ticker = tokio::time::interval(Duration::from_secs(60));

    // 首次启动不立即扫描，等待第一个 tick
    ticker.tick().await;

    loop {
        ticker.tick().await;

        if let Err(e) = scan_and_alert(&app, &state).await {
            eprintln!("[FloatTask] deadline scan error: {}", e);
        }
    }
}

/// 单次扫描：计算 color_level → 写 DB → emit 事件
async fn scan_and_alert(app: &AppHandle, state: &tauri::State<'_, AppState>) -> Result<()> {
    let db = state.db.lock().map_err(|e| AppError::Custom(e.to_string()))?;
    let tasks = get_todo_tasks_with_deadline(&db)?;

    let now = Local::now().naive_local();
    let mut max_urgency: i32 = 0;

    for task in &tasks {
        let Some(deadline_str) = &task.deadline else { continue };

        // 兼容 "YYYY-MM-DD HH:mm" 和 "YYYY-MM-DDTHH:mm:ss"
        let deadline = NaiveDateTime::parse_from_str(
            deadline_str,
            "%Y-%m-%d %H:%M:%S",
        )
        .or_else(|_| NaiveDateTime::parse_from_str(deadline_str, "%Y-%m-%dT%H:%M:%S"))
        .unwrap_or(now);

        let hours_remaining = (deadline - now).num_hours();

        let level = match hours_remaining {
            h if h < 0 => 4,   // 已过期
            h if h < 12 => 4,  // <12h
            h if h < 24 => 3,  // 12-24h
            h if h < 72 => 2,  // 1-3天
            h if h < 168 => 1, // 3-7天
            _ => 0,            // >7天
        };

        // 写 DB（只有等级变化时才更新，减少写放大；这里简化直接写）
        update_color_level(&db, task.id, level)?;
        max_urgency = max_urgency.max(level);
    }

    // 构建紧急任务列表（level >= 3）
    let urgent_tasks: Vec<_> = tasks
        .into_iter()
        .filter(|t| t.color_level >= 3)
        .collect();

    // 向前端推送事件
    let _ = app.emit(
        "deadline-alert",
        serde_json::json!({
            "max_level": max_urgency,
            "urgent_tasks": urgent_tasks,
        }),
    );

    Ok(())
}

// TODO(Phase 3): 静默期持久化
//   将 silence_until 时间戳写入 settings，每次扫描时读取，
//   若当前时间 < silence_until，则 max_level>=4 时不自动展开。

// TODO(Phase 5): 系统休眠唤醒后，第一次 tick 可能会有大量任务重新计算，
//   可以考虑分批或限流（当前数据量预期不大，直接全量计算可接受）。
