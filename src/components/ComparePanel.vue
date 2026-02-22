<script setup>
const props = defineProps({
  compare: { type: Object, default: null },
})
</script>

<template>
  <section class="panel">
    <h3>算法对比</h3>
    <div v-if="compare" class="compare-grid">
      <article>
        <h4>Priority RR</h4>
        <p>平均周转时间：{{ compare.priority?.average_turnaround_time?.toFixed(2) ?? '-' }}</p>
        <p>总耗时：{{ compare.priority?.total_time ?? '-' }}</p>
      </article>
      <article>
        <h4>MLFQ</h4>
        <p>平均周转时间：{{ compare.mlfq?.average_turnaround_time?.toFixed(2) ?? '-' }}</p>
        <p>总耗时：{{ compare.mlfq?.total_time ?? '-' }}</p>
      </article>
    </div>
    <p v-else class="placeholder">点击“对比两种算法”后显示</p>
  </section>
</template>
