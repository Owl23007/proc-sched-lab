<script setup>
import { computed } from 'vue'
import ComparePanel from './components/ComparePanel.vue'
import GanttChart from './components/GanttChart.vue'
import ProcessEditor from './components/ProcessEditor.vue'
import QueueView from './components/QueueView.vue'
import StatsPanel from './components/StatsPanel.vue'
import { useSimulationStore } from './stores/simulation'

const simulation = useSimulationStore()

const latestSnapshot = computed(() => {
  const snapshots = simulation.result?.snapshots ?? []
  return snapshots.length ? snapshots[snapshots.length - 1] : null
})

async function runCurrent() {
  await simulation.runOnce()
}

async function runCompare() {
  await simulation.runComparison()
}
</script>

<template>
  <main class="layout">
    <header class="header panel">
      <div>
        <h1>SchedLab · v0.1</h1>
        <p>Priority RR / MLFQ 调度模拟与可视化</p>
      </div>
      <div class="controls">
        <label>
          算法
          <select v-model="simulation.algorithm">
            <option value="priority_rr">Priority RR</option>
            <option value="mlfq">MLFQ</option>
          </select>
        </label>
        <label>
          时间片
          <input v-model.number="simulation.quantum" type="number" min="1" />
        </label>
        <label>
          优先级步长
          <input v-model.number="simulation.priorityStep" type="number" min="1" />
        </label>
        <button class="btn" :disabled="simulation.isRunning" @click="runCurrent">运行当前算法</button>
        <button class="btn ghost" :disabled="simulation.isRunning" @click="runCompare">对比两种算法</button>
        <span class="backend-indicator">当前运行后端：{{ simulation.backendDisplay }}</span>
      </div>
    </header>

    <ProcessEditor :processes="simulation.processes" @update:processes="simulation.processes = $event" />

    <section class="grid-2">
      <GanttChart :timeline="simulation.result?.timeline ?? []" />
      <QueueView :snapshot="latestSnapshot" />
    </section>

    <section class="grid-2">
      <StatsPanel :metrics="simulation.result?.metrics ?? []" :average-turnaround="simulation.averageTurnaround" />
      <ComparePanel :compare="simulation.compareResult" />
    </section>

    <p v-if="simulation.error" class="error">{{ simulation.error }}</p>
  </main>
</template>
