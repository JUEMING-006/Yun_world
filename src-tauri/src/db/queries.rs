use crate::db::models::*;
use crate::error::Result;
use chrono::NaiveDateTime;
use rusqlite::{params, Connection};

// ====================================================================
// queries.rs —— SQL 封装层
// 所有数据库操作集中在这里，命令层 (task_cmd.rs 等) 只调用这些函数
// ====================================================================

// ---------- 通用辅助 ----------

fn row_to_task(row: &rusqlite::Row) -> Result<Task> {
    Ok(Task {
        id: row.get(0)?,
        title: row.get(1)?,
        description: row.get(2)?,
        priority: row.get(3)?,
        status: row.get(4)?,
        deadline: row.get(5)?,
        created_at: row.get(6)?,
        updated_at: row.get(7)?,
        archived_at: row.get(8)?,
        source: row.get(9)?,
        color_level: row.get(10)?,
    })
}

fn row_to_flash(row: &rusqlite::Row) -> Result<FlashNote> {
    Ok(FlashNote {
        id: row.get(0)?,
        content: row.get(1)?,
        source: row.get(2)?,
        is_processed: row.get::<_, i32>(3)? != 0,
        transferred_to: row.get(4)?,
        created_at: row.get(5)?,
    })
}

// ---------- Tasks ----------

pub fn get_tasks(conn: &Connection, status: &str) -> Result<Vec<Task>> {
    let mut stmt = conn.prepare_cached(
        "SELECT id, title, description, priority, status, deadline,
                created_at, updated_at, archived_at, source, color_level
         FROM tasks WHERE status = ?1 ORDER BY created_at DESC",
    )?;
    let iter = stmt.query_map([status], row_to_task)?;
    iter.collect()
}

pub fn create_task(conn: &Connection, task: &NewTask) -> Result<Task> {
    let priority = task.priority.as_deref().unwrap_or("medium");
    let source = task.source.as_deref().unwrap_or("manual");
    conn.execute(
        "INSERT INTO tasks (title, description, priority, status, deadline, source)
         VALUES (?1, ?2, ?3, 'todo', ?4, ?5)",
        params![
            task.title,
            task.description.as_deref().unwrap_or(""),
            priority,
            task.deadline,
            source
        ],
    )?;
    let id = conn.last_insert_rowid();
    get_task_by_id(conn, id)
}

pub fn get_task_by_id(conn: &Connection, id: i64) -> Result<Task> {
    let mut stmt = conn.prepare_cached(
        "SELECT id, title, description, priority, status, deadline,
                created_at, updated_at, archived_at, source, color_level
         FROM tasks WHERE id = ?1",
    )?;
    let task = stmt.query_row([id], row_to_task)?;
    Ok(task)
}

pub fn toggle_task_status(conn: &Connection, id: i64) -> Result<Task> {
    // 读取当前状态并翻转
    let current: String = conn.query_row(
        "SELECT status FROM tasks WHERE id = ?1",
        [id],
        |r| r.get(0),
    )?;
    let new_status = if current == "todo" { "archived" } else { "todo" };
    let now = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    conn.execute(
        "UPDATE tasks SET status = ?1, updated_at = ?2, archived_at = ?3 WHERE id = ?4",
        params![
            new_status,
            &now,
            if new_status == "archived" { Some(&now) } else { None },
            id
        ],
    )?;
    get_task_by_id(conn, id)
}

pub fn update_task(conn: &Connection, id: i64, updates: &TaskUpdate) -> Result<Task> {
    let now = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    if let Some(_) = updates.title {
        conn.execute("UPDATE tasks SET title = ?1, updated_at = ?2 WHERE id = ?3", params![updates.title, &now, id])?;
    }
    if let Some(_) = &updates.description {
        conn.execute("UPDATE tasks SET description = ?1, updated_at = ?2 WHERE id = ?3", params![updates.description, &now, id])?;
    }
    if let Some(_) = &updates.priority {
        conn.execute("UPDATE tasks SET priority = ?1, updated_at = ?2 WHERE id = ?3", params![updates.priority, &now, id])?;
    }
    if let Some(_) = &updates.deadline {
        conn.execute("UPDATE tasks SET deadline = ?1, updated_at = ?2 WHERE id = ?3", params![updates.deadline, &now, id])?;
    }
    if let Some(_) = &updates.status {
        conn.execute("UPDATE tasks SET status = ?1, updated_at = ?2 WHERE id = ?3", params![updates.status, &now, id])?;
    }
    if let Some(lv) = updates.color_level {
        conn.execute("UPDATE tasks SET color_level = ?1 WHERE id = ?2", params![lv, id])?;
    }
    get_task_by_id(conn, id)
}

pub fn update_color_level(conn: &Connection, id: i64, level: i32) -> Result<()> {
    conn.execute("UPDATE tasks SET color_level = ?1 WHERE id = ?2", params![level, id])?;
    Ok(())
}

pub fn delete_task(conn: &Connection, id: i64) -> Result<()> {
    conn.execute("DELETE FROM tasks WHERE id = ?1", [id])?;
    Ok(())
}

// ---------- Flash Notes ----------

pub fn get_flash_notes(conn: &Connection) -> Result<Vec<FlashNote>> {
    let mut stmt = conn.prepare_cached(
        "SELECT id, content, source, is_processed, transferred_to, created_at
         FROM flash_notes ORDER BY created_at DESC",
    )?;
    let iter = stmt.query_map([], row_to_flash)?;
    iter.collect()
}

pub fn create_flash_note(conn: &Connection, note: &NewFlashNote) -> Result<FlashNote> {
    conn.execute(
        "INSERT INTO flash_notes (content, source) VALUES (?1, ?2)",
        params![note.content, note.source],
    )?;
    let id = conn.last_insert_rowid();
    get_flash_by_id(conn, id)
}

pub fn get_flash_by_id(conn: &Connection, id: i64) -> Result<FlashNote> {
    let mut stmt = conn.prepare_cached(
        "SELECT id, content, source, is_processed, transferred_to, created_at
         FROM flash_notes WHERE id = ?1",
    )?;
    let note = stmt.query_row([id], row_to_flash)?;
    Ok(note)
}

/// 将闪念转移为任务：在 flash_notes 中标记 transferred_to
pub fn mark_flash_transferred(conn: &Connection, flash_id: i64, task_id: i64) -> Result<()> {
    conn.execute(
        "UPDATE flash_notes SET is_processed = 1, transferred_to = ?1 WHERE id = ?2",
        params![task_id, flash_id],
    )?;
    Ok(())
}

pub fn delete_flash_note(conn: &Connection, id: i64) -> Result<()> {
    conn.execute("DELETE FROM flash_notes WHERE id = ?1", [id])?;
    Ok(())
}

// ---------- Settings ----------

pub fn get_all_settings(conn: &Connection) -> Result<std::collections::HashMap<String, String>> {
    let mut stmt = conn.prepare_cached("SELECT key, value FROM settings")?;
    let iter = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
    })?;
    let mut map = std::collections::HashMap::new();
    for item in iter {
        let (k, v) = item?;
        map.insert(k, v);
    }
    Ok(map)
}

pub fn get_setting(conn: &Connection, key: &str) -> Result<String> {
    let val: String = conn.query_row("SELECT value FROM settings WHERE key = ?1", [key], |r| r.get(0))?;
    Ok(val)
}

pub fn set_setting(conn: &Connection, key: &str, value: &str) -> Result<()> {
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        params![key, value],
    )?;
    Ok(())
}

// ---------- 定时器辅助 ----------

/// 查询所有有截止时间的 todo 任务（用于定时器扫描）
pub fn get_todo_tasks_with_deadline(conn: &Connection) -> Result<Vec<Task>> {
    let mut stmt = conn.prepare_cached(
        "SELECT id, title, description, priority, status, deadline,
                created_at, updated_at, archived_at, source, color_level
         FROM tasks WHERE status = 'todo' AND deadline IS NOT NULL AND deadline != ''
         ORDER BY deadline ASC",
    )?;
    let iter = stmt.query_map([], row_to_task)?;
    iter.collect()
}
