use std::sync::Mutex;
use rusqlite::Connection;

/// AppState —— 全局共享状态
///
/// - `db`: SQLite 连接（Mutex 保证线程安全，因为 Tauri 命令与定时器可能并发访问）
///   连接路径在 `setup` 时由 `tauri_plugin_sql::ConnectionExt` 获取
///
/// Tauri 2.0 中 State 要求 Send + Sync，Mutex<Connection> 满足条件。
pub struct AppState {
    pub db: Mutex<Connection>,
}
