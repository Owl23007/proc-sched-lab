<script setup>
const props = defineProps({
  metrics: { type: Array, default: () => [] },
  averageTurnaround: { type: Number, default: 0 },
  currentStep: { type: Number, default: 0 },
  maxStep: { type: Number, default: 0 },
  currentTime: { type: Number, default: 0 },
})
</script>

<template>
  <section class="panel">
    <div class="panel-header">
      <h3>统计结果</h3>
      <p class="step-hint">Step {{ currentStep }} / {{ maxStep }} · t={{ currentTime }}</p>
    </div>
    <table v-if="metrics.length" class="table">
      <thead>
        <tr>
          <th>进程</th>
          <th>开始</th>
          <th>结束</th>
          <th>周转时间</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="metric in metrics" :key="metric.id">
          <td>{{ metric.name }}</td>
          <td>{{ metric.start_time }}</td>
          <td>{{ metric.finish_time }}</td>
          <td>{{ metric.turnaround_time }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else class="placeholder">暂无统计数据</p>
    <p class="summary">平均周转时间：{{ averageTurnaround.toFixed(2) }}</p>
  </section>
</template>
