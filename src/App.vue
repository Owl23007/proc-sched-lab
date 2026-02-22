<script setup>
import { computed, ref, watchEffect } from 'vue'
import { usePreferredDark, useStorage } from '@vueuse/core'
import GanttChart from './components/GanttChart.vue'
import ProcessDetail from './components/ProcessDetail.vue'
import ProcessEditor from './components/ProcessEditor.vue'
import QueueView from './components/QueueView.vue'
import StatsPanel from './components/StatsPanel.vue'
import { useSimulationStore } from './stores/simulation'

const simulation = useSimulationStore()
const preferredDark = usePreferredDark()
const theme = useStorage('schedlab-theme', preferredDark.value ? 'dark' : 'light')
const zoom = ref(10)
const debugMode = ref(false)

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
                    <h1>SchedLab · v0.3</h1>
                    <p>进程调度可视化实验平台</p>
                </div>
                <button class="btn ghost" @click="toggleTheme">
                    {{ isDark ? '切换亮色主题' : '切换暗色主题' }}
                </button>
            </div>

            <section class="panel-inner">
                <div class="panel-header">
                    <h3>控制栏</h3>
                    <span class="backend-indicator">当前运行后端：{{ simulation.backendDisplay }}</span>
                </div>

                <div class="controls">
                    <label>
                        算法选择
                        <select v-model="simulation.algorithm">
                            <option v-for="item in simulation.algorithms" :key="item.key" :value="item.key">{{
                                item.label }}</option>
                        </select>
                    </label>

                    <label>
                        时间片大小
                        <input v-model.number="simulation.quantum" type="number" min="1" />
                    </label>

                    <label>
                        队列数量
                        <input v-model.number="simulation.queueCount" type="number" min="1" max="6" />
                    </label>

                    <label>
                        优先级衰减值
                        <input v-model.number="simulation.priorityDecay" type="number" min="1" />
                    </label>

                    <label>
                        时间标尺
                        <select v-model.number="zoom">
                            <option :value="10">10ms</option>
                            <option :value="50">50ms</option>
                            <option :value="100">100ms</option>
                        </select>
                    </label>

                    <label>
                        调试模式
                        <select v-model="debugMode">
                            <option :value="false">关闭</option>
                            <option :value="true">开启</option>
                        </select>
                    </label>
                </div>

                <div class="playback-controls top-gap">
                    <button class="btn" :disabled="simulation.isRunning" @click="runCurrent">开始</button>
                    <button class="btn ghost" :disabled="!canPlay" @click="simulation.pausePlayback">暂停</button>
                    <button class="btn ghost" :disabled="!canPlay" @click="simulation.resetPlayback">重置</button>
                    <button class="btn ghost" :disabled="!canPlay" @click="simulation.stepNext">单步执行</button>
                    <button class="btn ghost" :disabled="simulation.isRunning" @click="runCompare">算法对比</button>
                    <button class="btn ghost" :disabled="!simulation.result" @click="simulation.exportMarkdownReport">导出
                        Markdown</button>
                    <button class="btn ghost" :disabled="!simulation.result" @click="simulation.exportPdfReport">导出
                        PDF</button>

                    <label>
                        速度
                        <select :value="simulation.playbackSpeed" :disabled="!canPlay"
                            @change="simulation.setPlaybackSpeed($event.target.value)">
                            <option :value="0.5">0.5x</option>
                            <option :value="1">1x</option>
                            <option :value="2">2x</option>
                            <option :value="5">5x</option>
                            <option :value="10">10x</option>
                        </select>
                    </label>
                </div>

                <div class="progress-wrap top-gap">
                    <input type="range" min="0" :max="simulation.maxStep" :value="simulation.currentStep"
                        :disabled="!canPlay" @input="simulation.seek($event.target.value)" />
                    <span>{{ progress }}%</span>
                </div>
            </section>
        </header>

        <ProcessEditor :processes="simulation.processes" :state-map="simulation.processStateMap"
            :selected-process-id="simulation.selectedProcessId" @update:processes="simulation.processes = $event"
            @select="simulation.setSelectedProcess" />

        <section class="grid-2">
            <GanttChart :timeline="simulation.visibleTimeline" :current-time="simulation.currentTime"
                :events="simulation.events" :zoom="zoom" :selected-process-id="simulation.selectedProcessId"
                @select="simulation.setSelectedProcess" />
            <QueueView :snapshot="simulation.currentSnapshot" :waiting-queue="simulation.waitingQueue"
                :completed-queue="simulation.completedQueue" :debug-mode="debugMode" />
        </section>

        <section class="grid-2">
            <ProcessDetail :process="simulation.selectedProcess" :history="simulation.selectedProcessHistory" />
            <StatsPanel :metrics="simulation.result?.metrics ?? []" :average-turnaround="simulation.averageTurnaround"
                :average-weighted-turnaround="simulation.averageWeightedTurnaround"
                :average-response-time="simulation.averageResponseTime" :throughput="simulation.throughput"
                :cpu-utilization="simulation.cpuUtilization" :current-step="simulation.currentStep"
                :max-step="simulation.maxStep" :current-time="simulation.currentTime"
                :compare="simulation.compareResult" :turnaround-trend="simulation.turnaroundTrend" />
        </section>

        <p v-if="simulation.error" class="error">{{ simulation.error }}</p>
    </main>
</template>
