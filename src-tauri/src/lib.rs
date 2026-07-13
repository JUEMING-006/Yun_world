//! ====================================================================
//! FloatTask —— Tauri 2.0 库入口 (lib.rs)
//!
//! 所有模块注册、Tauri Builder 初始化、命令注册、AppState 托管
//! 以及 setup 钩子（DB 初始化 + 定时器启动）都在这里。
//! ====================================================================

mod commands;
mod db;
mod error;
mod state;
mod timer;
mod ai;
mod window;

use std::path::PathBuf;
use std::sync::Mutex;

use commands::{ai_cmd, flash_cmd, settings_cmd, task_cmd, window_cmd};
use db::schema;
use state::AppState;
use tauri::Manager;
use tauri::WebviewWindow;

use crate::db::models::Task;

/// 命令名常量（前端调用时必须匹配）
pub const CMD_GET_TASKS: &str = "get_tasks";
pub const CMD_CREATE_TASK: &str = "create_task";
pub const CMD_TOGGLE_TASK_STATUS: &str = "toggle_task_status";
pub const CMD_DELETE_TASK: &str = "delete_task";
pub const CMD_GET_FLASH_NOTES: &str = "get_flash_notes";
pub const CMD_CREATE_FLASH_NOTE: &str = "create_flash_note";
pub const CMD_MARK_FLASH_TRANSFERRED: &str = "mark_flash_transferred";
pub const CMD_DELETE_FLASH_NOTE: &str = "delete_flash_note";
pub const CMD_GET_ALL_SETTINGS: &str = "get_all_settings";
pub const CMD_SET_SETTING: &str = "set_setting";
pub const CMD_AI_POLISH: &str = "ai_polish_text";
pub const CMD_AI_ORGANIZE: &str = "ai_organize_flash";
pub const CMD_AI_TEST_CONNECTION: &str = "ai_test_connection";
pub const CMD_TOGGLE_PANEL: &str = "toggle_panel";
pub const CMD_SAVE_POSITION: &str = "save_position";
pub const CMD_GET_SAVED_POSITION: &str = "get_saved_position";

/// 库入口函数（main.rs 调用）
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .setup(|app| {
            // ---- 1. 获取应用数据目录，初始化 SQLite ----
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("无法获取应用数据目录")
                .expect("应用数据目录不可用");

            std::fs::create_dir_all(&app_data_dir).expect("创建应用数据目录失败");
            let db_path = app_data_dir.join("floattask.db");

            let conn = rusqlite::Connection::open(&db_path)
                .expect("无法打开或创建数据库");
            conn.execute_batch("PRAGMA journal_mode=WAL;")
                .expect("启用 WAL 模式失败");

            // 建表 + 默认设置
            schema::migrate(&conn).expect("数据库迁移失败");

            let app_state = AppState {
                db: Mutex::new(conn),
            };

            // ---- 2. 托管 AppState ----
            app.manage(app_state);

            // ---- 3. 启动时初始化窗口（毛玻璃效果） ----
            let main_window = app
                .get_webview_window("main")
                .expect("获取主窗口失败");
            window::apply_glass_effect(&main_window);
            main_window.hide().expect("隐藏窗口失败");

            // ---- 4. 启动定时器 ----
            let app_handle = app.handle().clone();
            let timer_state = app.state::<AppState>().clone();
            tauri::async_runtime::spawn(async move {
                timer::start_deadline_scanner(app_handle, timer_state).await;
            });

            // ---- 5. 系统托盘（TODO：需先有图标文件）----
            // tray 实现依赖图标存在，因此暂时注释掉，仅在文档中给出方案
            // TODO(Phase 5): 图标到位后取消下方注释
            //
            // use tauri::{
            //     SystemTray, SystemTrayMenu, SystemTrayMenuItem, CustomMenuItem,
            //     tray::SystemTrayEvent,
            // };
            // let show = CustomMenuItem::new("show", "显示面板");
            // let quit = CustomMenuItem::new("quit", "退出");
            // let tray_menu = SystemTrayMenu::new()
            //     .add_item(show)
            //     .add_native_item(SystemTrayMenuItem::Separator)
            //     .add_item(quit);
            // let system_tray = SystemTray::new().with_menu(tray_menu);
            // app.on_system_tray_event(|app, event| match event {
            //     SystemTrayEvent::LeftClick { .. } => {
            //         let _ = app.get_webview_window("main").map(|w| w.show());
            //     }
            //     SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
            //         "show" => {
            //             let _ = app.get_webview_window("main").map(|w| w.show());
            //         }
            //         "quit" => {
            //             app.exit(0);
            //         }
            //         _ => {}
            //     },
            //     _ => {}
            // });
            // app.run(|_app_handle, _event| {});

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Task commands
            task_cmd::get_tasks,
            task_cmd::create_task,
            task_cmd::toggle_task_status,
            task_cmd::update_task,
            task_cmd::delete_task,
            task_cmd::update_color_level,
            task_cmd::get_todo_with_deadline,
            // Flash commands
            flash_cmd::get_flash_notes,
            flash_cmd::create_flash_note,
            flash_cmd::mark_flash_transferred,
            flash_cmd::delete_flash_note,
            // Settings commands
            settings_cmd::get_all_settings,
            settings_cmd::get_setting,
            settings_cmd::set_setting,
            // AI commands
            ai_cmd::ai_polish_text,
            ai_cmd::ai_organize_flash,
            ai_cmd::ai_test_connection,
            // Window commands
            window_cmd::toggle_panel,
            window_cmd::save_position,
            window_cmd::get_saved_position,
        ])
        .run(tauri::generate_context!())
        .expect("Tauri 启动失败");
}
