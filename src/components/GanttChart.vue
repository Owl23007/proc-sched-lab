<script setup>
const props = defineProps({
  timeline: { type: Array, default: () => [] },
  currentTime: { type: Number, default: 0 },
})

function blockStyle(item) {
  const width = Math.max(42, (item.end - item.start) * 30)
  return {
    width: `${width}px`,
  }
}

function isActive(item) {
  return props.currentTime >= item.start && props.currentTime <= item.end
}
</script>

<template>
  <section class="panel">
    <div class="panel-header">
      <h3>甘特图</h3>
      <p class="step-hint">当前时刻：t={{ currentTime }}</p>
    </div>
    <div v-if="timeline.length" class="gantt">
      <div v-for="(item, index) in timeline" :key="`${item.process_id}-${index}`" class="block"
        :class="{ active: isActive(item) }" :style="blockStyle(item)">
        <strong>{{ item.process_name }}</strong>
        <span>{{ item.start }} → {{ item.end }}</span>
        <small>Q{{ item.queue_level + 1 }}</small>
      </div>
    </div>
    <p v-else class="placeholder">运行一次调度后显示执行时间线</p>
  </section>
</template>
