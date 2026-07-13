# FloatTask

> 极轻量桌面悬浮任务管理应用  
> 常态为一颗"液态水滴"按钮，点击展开为液态玻璃质感面板。  
> 包含待办 · 存档 · 闪念三个标签页，支持语音输入、AI 智能整理、多级颜色预警。

---

## 架构总览

```
前端 (Vue 3 + Pinia + TypeScript)
  │ invoke ──────────────────────────────┐
  │                                       │
  ▼                                       ▼
Tauri 2.0 命令层                     Rust 后端
(commands/*.rs)                    ├── db/     —— SQLite (rusqlite)
                                   │   ├── models.rs
                                   │   ├── schema.rs  (建表 + 迁移)
                                   │   └── queries.rs (SQL 封装)
                                   ├── timer/  —— Tokio 60s 轮询
                                   ├── ai/     —— reqwest 代理
                                   │   ├── client.rs
                                   │   └── prompts.rs
                                   └── window/  —— 毛玻璃效果
```

### 关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **SQLite 驱动** | Rust `rusqlite`（非 `tauri-plugin-sql`） | 数据引擎全在 Rust，定时器和 AI 共享同一连接，WAL 模式并发安全 |
| **路由** | Pinia `windowStore.mode` + `v-show`（无 vue-router） | 单窗口，避免重建组件丢失状态 |
| **AI 调用** | 全部走 Rust 后端 `reqwest`，Key 不经过前端 | 安全性 |
| **定时器** | Rust Tokio 60s 异步 tick，前端被动接收 `deadline-alert` 事件 | 避免 `setInterval` 节流 |
| **图标** | 需用户自行生成（见下方说明） | Tauri CLI 无法在脚本中自动生成 PNG |

---

## 前置要求

| 工具 | 版本 |
|------|------|
| Node.js | ≥ 18 |
| pnpm | ≥ 8（或 npm/yarn） |
| Rust | ≥ 1.70（含 `cargo`） |

> **Windows 注意**：Tauri 依赖 WebView2。Windows 10/11 通常已内置；若缺失，打包时会自动内嵌 bootstrapper。

---

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 生成应用图标（必须，否则 `tauri build` 会报错）

准备一张 **1024×1024 PNG** 源文件，然后：

```bash
pnpm tauri icon path/to/your-icon-1024.png
```

生成后的图标文件会写入 `src-tauri/icons/`。

> 图标字段已在 `tauri.conf.json` 中配置，首次 `pnpm tauri dev` 在多数配置下可跳过此步，
> 但 `pnpm tauri build` 必须要有图标。

### 3. 启动开发环境

```bash
pnpm tauri dev
```

### 4. 类型检查 / 前端构建

```bash
pnpm type-check    # 仅 TypeScript 类型检查
pnpm build         # 前端构建（用于 Tauri 打包）
```

### 5. 打包

```bash
pnpm tauri build
```

输出：`src-tauri/target/` 下 `.msi` / `.exe` (NSIS)。

---

## 项目结构

```
FloatTask/
├── src/                              # Vue 3 前端
│   ├── types/index.ts                # 全局 TS 类型
│   ├── styles/
│   │   ├── glass.css                 # 液态玻璃 CSS 变量
│   │   ├── colors.css                # 5 级预警颜色映射
│   │   └── animations.css            # 水滴呼吸 / 展开 / 脉冲动画
│   ├── composables/
│   │   ├── useTauriCommands.ts       # Rust 命令 invoke 封装
│   │   ├── useVoice.ts               # Web Speech API 语音识别
│   │   ├── useAI.ts                  # AI 调用封装
│   │   └── useTimer.ts               # deadline-alert 事件监听
│   ├── stores/
│   │   ├── windowStore.ts            # 水滴/展开形态 + 预警等级
│   │   ├── taskStore.ts              # 待办/存档 CRUD
│   │   ├── flashStore.ts             # 闪念 CRUD + AI 转移
│   │   └── settingsStore.ts          # 用户设置（含 AI 配置）
│   ├── views/
│   │   ├── DropletView.vue           # 水滴态视图
│   │   ├── PanelView.vue             # 展开态主面板
│   │   └── SettingsView.vue          # 设置浮层
│   └── components/
│       ├── task/ (TabBar, TaskCard, TaskList, TaskInput)
│       ├── flash/ (FlashCard, AiPreviewCard)
│       └── common/ (GlassButton)
│
├── src-tauri/                        # Rust 后端
│   ├── src/
│   │   ├── lib.rs                    # Tauri Builder + 命令注册 + setup
│   │   ├── main.rs                   # 入口
│   │   ├── error.rs                  # AppError 统一错误类型
│   │   ├── state.rs                  # AppState (Mutex<Connection>)
│   │   ├── commands/                 # Tauri 命令
│   │   │   ├── task_cmd.rs
│   │   │   ├── flash_cmd.rs
│   │   │   ├── settings_cmd.rs
│   │   │   ├── ai_cmd.rs
│   │   │   └── window_cmd.rs
│   │   ├── db/                       # SQLite 数据层
│   │   │   ├── models.rs
│   │   │   ├── schema.rs
│   │   │   └── queries.rs
│   │   ├── timer/scheduler.rs        # Tokio 60s 轮询 + emit 预警
│   │   ├── ai/                       # AI 代理
│   │   │   ├── client.rs
│   │   │   └── prompts.rs
│   │   └── window/effects.rs         # 跨平台毛玻璃
│   └── tauri.conf.json
```

---

## 数据模型速查

### tasks 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INTEGER PK | 自增 |
| `title` | TEXT | 任务标题 |
| `description` | TEXT | 详细描述（可选） |
| `priority` | TEXT | `low` / `medium` / `high` |
| `status` | TEXT | `todo` / `archived` |
| `deadline` | TEXT | ISO 8601，可为空 |
| `color_level` | INTEGER | 0-4 颜色预警等级（定时器更新） |
| `source` | TEXT | `manual` / `voice` / `flash_ai` |

### flash_notes 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INTEGER PK | 自增 |
| `content` | TEXT | 原始内容 |
| `source` | TEXT | `text` / `voice` |
| `is_processed` | INTEGER | 是否 AI 整理过 |
| `transferred_to` | INTEGER | 转移到的任务 ID |

### settings 表（KV 存储）

| Key | 默认值 | 说明 |
|-----|--------|------|
| `ai_api_url` | `""` | API 地址 |
| `ai_api_key` | `""` | API Key |
| `ai_model_name` | `""` | 模型名称 |
| `ai_voice_polish_enabled` | `false` | 语音润色开关 |
| `ai_flash_organize_enabled` | `false` | 闪念 AI 整理开关 |
| `window_position_x` | `50` | 水滴 X 坐标 |
| `window_position_y` | `50` | 水滴 Y 坐标 |
| `timer_interval_seconds` | `60` | 轮询间隔 |

### 颜色预警等级

| 等级 | 条件 | 颜色 |
|------|------|------|
| 0 | 无截止 或 >7天 | 灰白 |
| 1 | 3-7天 | 绿色 |
| 2 | 1-3天 | 黄色 |
| 3 | 12-24h | 橙色 |
| 4 | <12h / 已过期 | 红色（触发自动展开）|

---

## 命令名速查（前端 invoke 时必须匹配）

```
任务：
  get_tasks          { status: "todo" | "archived" }
  create_task        { task: NewTask }
  toggle_task_status { id: number }
  update_task        { id, updates: TaskUpdate }
  delete_task        { id }

闪念：
  get_flash_notes
  create_flash_note  { content, source }
  mark_flash_transferred { flash_id, task_id }
  delete_flash_note  { id }

设置：
  get_all_settings
  get_setting        { key }
  set_setting        { key, value }

AI：
  ai_polish_text     { text }
  ai_organize_flash  { content }
  ai_test_connection { api_url, api_key, model }

窗口：
  toggle_panel       { expand: boolean }
  save_position      { x, y }
  get_saved_position
```

---

## 已知问题与 TODO

| 模块 | TODO | 优先级 |
|------|------|--------|
| 语音识别 | WebView2 中 Web Speech API 不可用时降级提示 | Phase 3 |
| 系统托盘 | 图标就位后取消 lib.rs 注释 | Phase 5 |
| Win10 兼容 | `window/effects.rs` 检测系统版本降级为 `Effect::Blur` | Phase 5 |
| 静默期持久化 | `scheduler.rs` 静默期时间戳写入 settings 表 | Phase 3 |
| 拖拽移动 | 前端 DropletView 调用 `startDragging` + 释放时 `save_position` | Phase 3 |
| AI 语音润色 | 在 TaskInput 中接入 `useAI.polish()` 完整流程 | Phase 4 |
| AI 闪念整理 | TaskInput / FlashList 完整 UX 动画（Loading → 预览 → 确认）| Phase 4 |
| 开机自启 | `tauri-plugin-autostart` + 设置开关 | Phase 5 |
| 模态添加卡 | TaskInput "+" 点击后弹出含截止时间/优先级选择器的模态 | Phase 4 |

---

## 技术栈

| 层面 | 技术 |
|------|------|
| 桌面框架 | [Tauri 2.0](https://tauri.app/) (Rust + WebView2) |
| 前端 | Vue 3.5 + TypeScript 5.5 + Vite 5 |
| 状态管理 | Pinia 2.2 |
| 数据库 | SQLite (rusqlite 0.31, WAL 模式) |
| 后台定时 | Rust Tokio 1.x 异步任务 |
| AI 代理 | Rust reqwest 0.12 + OpenAI 兼容接口 |
| UI 风格 | CSS `backdrop-filter` + Tauri 原生毛玻璃 |

---

## 开发阶段

- **Phase 1 ✅** 基础骨架（本脚手架）
- **Phase 2 ⬜** 核心数据流（todo/archive 打钩、闪念基础 CRUD）
- **Phase 3 ⬜** 高级交互（语音输入、颜色预警、水滴自动展开、拖拽）
- **Phase 4 ⬜** AI 集成（润色 + 闪念 AI 整理 + 测试连接）
- **Phase 5 ⬜** 打磨体验（系统托盘、Win10 兼容、视觉细化、性能优化）

---

## 贡献

在提交 PR 前请确保 `pnpm type-check` 通过，并与现有代码风格保持一致。

---

## License

MIT
