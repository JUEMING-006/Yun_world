use crate::error::Result;

/// 所有建表 SQL（在应用启动时执行）
pub const CREATE_TABLES: &[&str] = &[
    // tasks
    r#"
    CREATE TABLE IF NOT EXISTS tasks (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        title       TEXT NOT NULL,
        description TEXT DEFAULT '',
        priority    TEXT CHECK(priority IN ('low','medium','high')) DEFAULT 'medium',
        status      TEXT CHECK(status IN ('todo','archived')) DEFAULT 'todo',
        deadline    TEXT,
        created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime')),
        updated_at  TEXT NOT NULL DEFAULT (datetime('now','localtime')),
        archived_at TEXT,
        source      TEXT CHECK(source IN ('manual','voice','flash_ai')) DEFAULT 'manual',
        color_level INTEGER DEFAULT 0
    );
    "#,
    // flash_notes
    r#"
    CREATE TABLE IF NOT EXISTS flash_notes (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        content         TEXT NOT NULL,
        source          TEXT CHECK(source IN ('text','voice')) DEFAULT 'text',
        is_processed    INTEGER DEFAULT 0,
        transferred_to  INTEGER,
        created_at      TEXT NOT NULL DEFAULT (datetime('now','localtime')),
        FOREIGN KEY (transferred_to) REFERENCES tasks(id) ON DELETE SET NULL
    );
    "#,
    // settings（KV 存储）
    r#"
    CREATE TABLE IF NOT EXISTS settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL DEFAULT ''
    );
    "#,
    // 索引
    "CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);",
    "CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);",
    "CREATE INDEX IF NOT EXISTS idx_tasks_status_deadline ON tasks(status, deadline);",
    "CREATE INDEX IF NOT EXISTS idx_flash_processed ON flash_notes(is_processed);",
];

/// 在 setup 阶段执行建表 + 插入默认设置
pub fn migrate(conn: &rusqlite::Connection) -> Result<()> {
    let tx = conn.transaction()?;
    for sql in CREATE_TABLES {
        tx.execute_batch(sql)?;
    }
    // 插入默认设置（若不存在）
    let defaults: &[(&str, &str)] = &[
        ("ai_api_url", ""),
        ("ai_api_key", ""),
        ("ai_model_name", ""),
        ("ai_voice_polish_enabled", "false"),
        ("ai_flash_organize_enabled", "false"),
        ("window_position_x", "50"),
        ("window_position_y", "50"),
        ("timer_interval_seconds", "60"),
    ];
    for (k, v) in defaults {
        tx.execute(
            "INSERT OR IGNORE INTO settings (key, value) VALUES (?1, ?2)",
            &[k, v],
        )?;
    }
    tx.commit()?;
    Ok(())
}
