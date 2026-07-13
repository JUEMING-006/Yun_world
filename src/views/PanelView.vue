<script setup lang="ts">
/**
 * PanelView —— 展开态主面板
 *
 * 三段式布局：
 *  - 顶部：标题栏（最小化按钮 + 设置齿轮）
 *  - 中部：TabBar（待办/存档/闪念） + 对应列表
 *  - 底部：操作栏（麦克风 + 加号）
 *
 * 由 App.vue 通过 windowStore.mode 控制显隐。
 * 切换 tab 时按需懒加载列表数据。
 */
import { ref, onMounted, watch } from 'vue'
import { useWindowStore } from '@/stores/windowStore'
import { useTaskStore } from '@/stores/taskStore'
import { useFlashStore } from '@/stores/flashStore'
import { useTimer } from '@/composables/useTimer'
import TabBar from '@/components/task/TabBar.vue'
import TaskList from '@/components/task/TaskList.vue'
import TaskInput from '@/components/task/TaskInput.vue'
import FlashList from '@/components/flash/FlashList.vue'
import SettingsView from '@/views/SettingsView.vue'
import type { PanelTab } from '@/types'

const windowStore = useWindowStore()
const taskStore = useTaskStore()
const flashStore = useFlashStore()

const activeTab = ref<PanelTab>('todo')
const showSettings = ref(false)

// 注册 Rust 定时器事件监听
useTimer()

onMounted(async () => {
  await Promise.all([taskStore.loadTodo(), taskStore.loadArchive(), flashStore.load()])
})

// 切到闪念 tab 时确保加载
watch(activeTab, (tab) => {
  if (tab === 'flash' && flashStore.list.length === 0) void flashStore.load()
})

function onMinimize() {
  void windowStore.collapse()
}
</script>

<template>
  <div class="panel glass-panel glass-glare animate-expand">
    <!-- 标题栏 -->
    <header class="panel-header">
      <span class="panel-title">FloatTask</span>
      <div class="header-actions">
        <button class="icon-btn" title="设置" @click="showSettings = true">⚙️</button>
        <button class="icon-btn" title="收起" @click="onMinimize">—</button>
      </div>
    </header>

    <!-- 标签栏 -->
    <TabBar v-model="activeTab" />

    <!-- 列表主区域 -->
    <main class="panel-body">
      <TaskList
        v-show="activeTab === 'todo'"
        list-key="todo"
        :tasks="taskStore.todoList"
        @toggle="(id) => taskStore.toggle(id, 'todo')"
        @delete="(id) => taskStore.remove(id, 'todo')"
      />
      <TaskList
        v-show="activeTab === 'archive'"
        list-key="archive"
        :tasks="taskStore.archiveList"
        @toggle="(id) => taskStore.toggle(id, 'archive')"
        @delete="(id) => taskStore.remove(id, 'archive')"
      />
      <FlashList v-show="activeTab === 'flash'" />
    </main>

    <!-- 底部操作栏（仅在待办/闪念显示） -->
    <footer v-if="activeTab !== 'archive'" class="panel-footer">
      <TaskInput :tab="activeTab" />
    </footer>

    <!-- 设置浮层 -->
    <SettingsView v-if="showSettings" @close="showSettings = false" />
  </div>
</template>

<style scoped>
.panel {
  width: var(--panel-width);
  height: var(--panel-height);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  flex: 0 0 auto;
  height: 44px;
  padding: 0 var(--space-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--glass-border);
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
}

.header-actions {
  display: flex;
  gap: var(--space-xs);
}

.icon-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--duration-fast);
}
.icon-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: var(--text-primary);
}

.panel-body {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: var(--space-md) var(--space-lg);
}

.panel-footer {
  flex: 0 0 auto;
  padding: var(--space-md) var(--space-lg);
  border-top: 1px solid var(--glass-border);
}
</style>
