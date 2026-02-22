<script setup>
const props = defineProps({
  timeline: { type: Array, default: () => [] },
})

function blockStyle(item) {
  const width = Math.max(40, (item.end - item.start) * 28)
  return {
    width: `${width}px`,
  }
}
</script>

<template>
  <section class="panel">
    <h3>甘特图</h3>
    <div v-if="timeline.length" class="gantt">
      <div v-for="(item, index) in timeline" :key="`${item.process_id}-${index}`" class="block" :style="blockStyle(item)">
        <strong>{{ item.process_name }}</strong>
        <span>{{ item.start }} → {{ item.end }}</span>
        <small>Q{{ item.queue_level + 1 }}</small>
      </div>
    </div>
    <p v-else class="placeholder">运行一次调度后显示执行时间线</p>
  </section>
</template>
