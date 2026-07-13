# Lumina 微信小程序

Lumina 是一款 AI 陪伴类微信小程序，提供智能对话、AI 智能体创建、心理评估、社交圈子等功能。

## 功能模块

### 核心功能
- **AI 对话** — 与 AI 进行自然语言对话
- **智能体创建** — 自定义 AI 智能体，配置记忆与人设
- **AI 视频** — AI 生成视频内容
- **知识库** — 浏览和管理知识内容

### 社交功能
- **圈子** — 发布动态、浏览社区内容
- **个人主页** — 查看用户资料与动态

### 心理健康
- **心理评估** — 在线心理测评
- **评估对话** — 基于评估结果的 AI 对话
- **评估报告** — 查看测评报告与分析

### 账号与设置
- **登录注册** — 手机号 + 验证码登录，支持飞书登录
- **个性化设置** — 主题外观、语言、个性化偏好
- **隐私与安全** — 隐私设置、实名认证、监护人模式
- **设备管理** — 多设备管理
- **数据管理** — 用户数据查看与管理

## 技术栈

- **框架**：微信小程序原生开发
- **UI 组件库**：[TDesign for 小程序](https://github.com/Tencent/tdesign-miniprogram)
- **基础库版本**：3.16.2

## 项目结构

```
├── apis/                  # API 接口封装
│   ├── agent.js           # 智能体相关接口
│   ├── assessment.js      # 心理评估接口
│   ├── auth.js            # 登录认证接口
│   ├── chat.js            # 对话接口
│   ├── system.js          # 系统接口
│   ├── user.js            # 用户信息接口
│   └── video.js           # AI 视频接口
├── components/            # 自定义组件
├── images/                # 静态图片资源
├── pages/                 # 页面
│   ├── index/             # 启动页
│   ├── login/             # 登录页
│   ├── chat/              # AI 对话页
│   ├── agent-create/      # 创建智能体
│   ├── agent-memory/      # 智能体记忆
│   ├── ai-video/          # AI 视频
│   ├── knowledge/         # 知识库
│   ├── circle/            # 社交圈子
│   ├── assessment/        # 心理评估
│   └── setting*/          # 各类设置页面
├── utils/                 # 工具函数
│   ├── config.js          # 环境配置
│   ├── secrets.js         # 敏感配置（不提交）
│   └── auth.js            # 登录态管理
├── app.js                 # 小程序入口
├── app.json               # 全局配置
└── app.wxss               # 全局样式
```

## 本地运行

1. 克隆项目
   ```bash
   git clone https://github.com/JUEMING-006/Lumini_miniApp.git
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 在 `utils/` 目录下创建 `secrets.js`，填入你的服务端配置：
   ```js
   module.exports = {
     BASE_URL: '你的业务接口地址',
     AGENT_BASE_URL: '你的 Agent 接口地址',
     LARK_APP_ID: '你的飞书应用 ID',
   }
   ```

4. 使用 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) 导入项目目录

5. 在开发者工具中点击「工具 → 构建 npm」构建依赖

## 许可证

ISC
