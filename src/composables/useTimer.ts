/**
 * useTimer —— 前端定时器与 Rust 事件桥接
 *
 * Rust 端 scheduler 每 60s 轮询一次截止时间，并通过 emit("deadline-alert", ...) 推送：
 *   - max_level: 当前最紧急等级 (0-4)
 *   - urgent_tasks: 橙色及以上的紧急任务
 *
 * 前端在此监听事件，更新水滴颜色、在红色时自动展开面板。
 * 注意：真正的轮询逻辑在 Rust（避免浏览器 setInterval 节流），前端只被动接收。
 */
import { onMounted, onBeforeUnmount } from 'vue'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { useWindowStore } from '@/stores/windowStore'
import { useTaskStore } from '@/stores/taskStore'
import type { DeadlineAlert } from '@/types'

export function useTimer() {
  const windowStore = useWindowStore()
  const taskStore = useTaskStore()

  let unlisten: UnlistenFn | null = null

  onMounted(async () => {
    unlisten = await listen<DeadlineAlert>('deadline-alert', (event) => {
      const { max_level, urgent_tasks } = event.payload

      // 1. 更新水滴颜色预警等级
      windowStore.setUrgencyLevel(max_level)

      // 2. 红色等级 (4) 且当前为水滴态 -> 自动展开并置顶
      //    （静默期：用户手动收起后 5 分钟内不自动展开，由 windowStore 控制）
      if (max_level >= 4 && !windowStore.isExpanded && !windowStore.inSilencePeriod) {
        windowStore.autoExpand()
      }

      // 3. 刷新紧急任务卡片高亮
      taskStore.syncUrgentTasks(urgent_tasks)
    })
  })

  onBeforeUnmount(() => {
    unlisten?.()
  })
}
