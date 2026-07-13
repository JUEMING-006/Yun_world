<script setup lang="ts">
/**
 * TaskList —— 任务列表容器
 *
 * 空状态：显示「还没有任务，点击 '+' 添加」提示。
 * 列表项为 TaskCard，由 TaskCard 处理打钩 / 删除交互。
 */
import type { Task } from '@/types'

const props = defineProps<{
  listKey: string
  tasks: Task[]
}>()

const emit = defineEmits<{
  (e: 'toggle', id: number): void
  (e: 'delete', id: number): void
}>()

function hasUrgent(tasks: Task[]): boolean {
  return tasks.some((t) => t.color_level >= 3)
}
</script>

<template>
  <div class="task-list">
    <p v-if="!tasks.length" class="empty-hint">
      {{
        listKey === 'todo'
          ? '还没有待办，点击 ＋ 添加'
          : '还没有已完成的记录'
      }}
    </p>
    <template v-else>
      <TaskCard
        v-for="task in tasks"
        :key="task.id"
        :task="task"
        :checked="listKey === 'archive'"
        @toggle="emit('toggle', $event)"
        @delete="emit('delete', $event)"
      />
    </template>
  </div>
</template>

<style scoped>
.task-list {
  display: flex;
  flex-direction: column;
}
.empty-hint {
  text-align: center;
  color: var(--text-tertiary);
  font-size: 13px;
  padding: var(--space-xl) 0;
}
</style>
