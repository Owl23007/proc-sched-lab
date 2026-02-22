<script setup>
const props = defineProps({
  snapshot: { type: Object, default: null },
})
</script>

<template>
  <section class="panel">
    <h3>队列状态</h3>
    <div v-if="snapshot" class="queue-wrap">
      <p>调度时刻：t={{ snapshot.time }} | 运行中：{{ snapshot.running ?? 'Idle' }}</p>
      <div class="queues">
        <div v-for="(queue, index) in snapshot.ready_queues" :key="index" class="queue-item">
          <h4>队列 {{ index + 1 }}</h4>
          <p>{{ queue.length ? queue.join(' → ') : '空' }}</p>
        </div>
      </div>
    </div>
    <p v-else class="placeholder">暂无队列数据</p>
  </section>
</template>
