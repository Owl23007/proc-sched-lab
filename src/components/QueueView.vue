<script setup>
const props = defineProps({
  snapshot: { type: Object, default: null },
})
</script>

<template>
  <section class="panel">
    <div class="panel-header">
      <h3>队列状态</h3>
      <p v-if="snapshot" class="step-hint">t={{ snapshot.time }}</p>
    </div>
    <div v-if="snapshot" class="queue-wrap">
      <p>
        当前执行：
        <strong class="tag" :class="snapshot.running ? 'is-running' : 'is-idle'">
          {{ snapshot.running ?? 'Idle' }}
        </strong>
      </p>
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
