<script setup>
import { computed, watchEffect } from 'vue'
import { usePreferredDark, useStorage } from '@vueuse/core'
import ComparePanel from './components/ComparePanel.vue'
import GanttChart from './components/GanttChart.vue'
import ProcessEditor from './components/ProcessEditor.vue'
import QueueView from './components/QueueView.vue'
import StatsPanel from './components/StatsPanel.vue'
import { useSimulationStore } from './stores/simulation'

const simulation = useSimulationStore()
const preferredDark = usePreferredDark()
const theme = useStorage('schedlab-theme', preferredDark.value ? 'dark' : 'light')

const isDark = computed(() => theme.value === 'dark')

const canPlay = computed(() => (simulation.result?.snapshots?.length ?? 0) > 0)

const progress = computed(() => {
  if (!canPlay.value || simulation.maxStep <= 0) {
    return 0
  }

  return Math.round((simulation.currentStep / simulation.maxStep) * 100)
})

async function runCurrent() {
  await simulation.runOnce()
}

async function runCompare() {
  await simulation.runComparison()
}

function toggleTheme() {
  theme.value = isDark.value ? 'light' : 'dark'
}

watchEffect(() => {
  document.documentElement.dataset.theme = theme.value
})
</script>

<template>
  <main class="layout">
    <header class="header panel">
      <div class="header-top">
        <div>
          <h1>SchedLab · v0.2</h1>
          <p>Priority RR / MLFQ 调度模拟与可视化</p>
        </div>
        <button class="btn ghost" @click="toggleTheme">
          {{ isDark ? '切换亮色主题' : '切换暗色主题' }}
        </button>
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

      <section class="playback panel-inner">
        <div class="panel-header">
          <h3>流程播放</h3>
          <p class="step-hint">Step {{ simulation.currentStep }} / {{ simulation.maxStep }}</p>
        </div>

        <div class="playback-controls">
          <button class="btn ghost" :disabled="!canPlay" @click="simulation.stepPrev">上一步</button>
          <button class="btn" :disabled="!canPlay" @click="simulation.togglePlay">
            {{ simulation.isPlaying ? '暂停' : '播放' }}
          </button>
          <button class="btn ghost" :disabled="!canPlay" @click="simulation.stepNext">下一步</button>
          <button class="btn ghost" :disabled="!canPlay" @click="simulation.resetPlayback">重置</button>

          <label>
            速度
            <select :value="simulation.playbackSpeed" :disabled="!canPlay"
              @change="simulation.setPlaybackSpeed($event.target.value)">
              <option :value="0.5">0.5x</option>
              <option :value="1">1x</option>
              <option :value="2">2x</option>
              <option :value="4">4x</option>
            </select>
          </label>
        </div>

        <div class="progress-wrap">
          <input type="range" min="0" :max="simulation.maxStep" :value="simulation.currentStep" :disabled="!canPlay"
            @input="simulation.seek($event.target.value)" />
          <span>{{ progress }}%</span>
        </div>
      </section>
    </header>

    <ProcessEditor :processes="simulation.processes" @update:processes="simulation.processes = $event" />

    <section class="grid-2">
      <GanttChart :timeline="simulation.visibleTimeline" :current-time="simulation.currentTime" />
      <QueueView :snapshot="simulation.currentSnapshot" />
    </section>

    <section class="grid-2">
      <StatsPanel :metrics="simulation.result?.metrics ?? []" :average-turnaround="simulation.averageTurnaround"
        :current-step="simulation.currentStep" :max-step="simulation.maxStep" :current-time="simulation.currentTime" />
      <ComparePanel :compare="simulation.compareResult" />
    </section>

    <p v-if="simulation.error" class="error">{{ simulation.error }}</p>
  </main>
</template>
