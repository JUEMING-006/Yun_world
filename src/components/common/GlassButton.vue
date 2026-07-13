<script setup lang="ts">
/**
 * GlassButton —— 通用液态玻璃按钮组件
 * 默认为圆形图标按钮，通过 type='primary' / 'secondary' 区分样式。
 */
defineProps<{
  type?: 'default' | 'primary'
  title?: string
  disabled?: boolean
}>()

defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()
</script>

<template>
  <button
    class="glass-button"
    :class="[`btn-${type}`]"
    :disabled="disabled"
    :title="title"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<style scoped>
.btn-primary {
  background: linear-gradient(135deg, rgba(100, 180, 255, 0.35), rgba(80, 140, 255, 0.2));
  border-color: rgba(120, 180, 255, 0.45);
}
.btn-primary:hover {
  background: linear-gradient(135deg, rgba(100, 180, 255, 0.5), rgba(80, 140, 255, 0.35));
}

.btn-default {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}
</style>
