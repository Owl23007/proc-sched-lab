<script setup>
import { computed, ref, watchEffect } from 'vue'
import { usePreferredDark, useStorage } from '@vueuse/core'
import GanttChart from './components/GanttChart.vue'
import ProcessDetail from './components/ProcessDetail.vue'
import ProcessEditor from './components/ProcessEditor.vue'
import QueueView from './components/QueueView.vue'
import StatsPanel from './components/StatsPanel.vue'
import KanbanLayout from './layouts/KanbanLayout.vue'
import { useSimulationStore } from './stores/simulation'

const simulation = useSimulationStore()
const preferredDark = usePreferredDark()
const theme = useStorage('schedlab-theme', preferredDark.value ? 'dark' : 'light')
const zoom = ref(10)
const debugMode = ref(false)
const headerCollapsed = ref(false)
const rightTab = ref('detail')

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

async function startPlayback() {
    if (!canPlay.value) {
        await runCurrent()
    }

    if (simulation.result?.snapshots?.length) {
        simulation.play()
    }
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
    <KanbanLayout>
        <template #header>
            <div class="header panel">
                <div class="header-top">
                    <div class="brand">
                        <h1>SchedLab<span class="version-tag">v0.3</span></h1>
                        <p>进程调度可视化实验平台</p>
                    </div>
                    <div class="header-actions">
                        <span class="backend-indicator">后端：{{ simulation.backendDisplay }}</span>
                        <button class="btn ghost btn-sm" @click="headerCollapsed = !headerCollapsed">
                            {{ headerCollapsed ? '▼ 展开' : '▲ 收起' }}
                        </button>
                        <button class="btn ghost" @click="toggleTheme">
                            {{ isDark ? '☀ 亮色' : '🌙 暗色' }}
                        </button>
                    </div>
                </div>

                <div class="header-collapse" :class="{ collapsed: headerCollapsed }">
                    <div class="ctrl-row">
                        <label>
                            算法
                            <select v-model="simulation.algorithm">
                                <option v-for="item in simulation.algorithms" :key="item.key" :value="item.key">{{
                                    item.label }}</option>
                            </select>
                        </label>
                        <label>
                            时间片
                            <input v-model.number="simulation.quantum" type="number" min="1" class="input-short" />
                        </label>
                        <label>
                            队列数
                            <input v-model.number="simulation.queueCount" type="number" min="1" max="6"
                                class="input-short" />
                        </label>
                        <label>
                            优先级衰减
                            <input v-model.number="simulation.priorityDecay" type="number" min="1"
                                class="input-short" />
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
                            调试
                            <select v-model="debugMode">
                                <option :value="false">关闭</option>
                                <option :value="true">开启</option>
                            </select>
                        </label>
                    </div>

                    <div class="ctrl-row">
                        <div class="btn-group">
                            <button class="btn" :disabled="simulation.isRunning" @click="startPlayback">▶ 开始</button>
                            <button class="btn ghost" :disabled="!canPlay" @click="simulation.pausePlayback">⏸
                                暂停</button>
                            <button class="btn ghost" :disabled="!canPlay" @click="simulation.resetPlayback">↺
                                重置</button>
                            <button class="btn ghost" :disabled="!canPlay" @click="simulation.stepNext">⏭ 单步</button>
                        </div>
                        <div class="ctrl-sep"></div>
                        <button class="btn ghost" :disabled="simulation.isRunning" @click="runCompare">算法对比</button>
                        <button class="btn ghost" :disabled="!simulation.result"
                            @click="simulation.exportMarkdownReport">导出
                            MD</button>
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
                </div>

                <div class="progress-wrap">
                    <input type="range" min="0" :max="simulation.maxStep" :value="simulation.currentStep"
                        :disabled="!canPlay" :style="{ '--pct': progress + '%' }"
                        @input="simulation.seek($event.target.value)" />
                    <span class="progress-pct">{{ progress }}%</span>
                </div>
            </div>
        </template>

        <template #left>
            <ProcessEditor :processes="simulation.processes" :state-map="simulation.processStateMap"
                :selected-process-id="simulation.selectedProcessId" @update:processes="simulation.processes = $event"
                @select="simulation.setSelectedProcess" />
        </template>

        <template #center>
            <GanttChart :timeline="simulation.visibleTimeline" :current-time="simulation.currentTime"
                :events="simulation.events" :zoom="zoom" :selected-process-id="simulation.selectedProcessId"
                @select="simulation.setSelectedProcess" />
            <QueueView :snapshot="simulation.currentSnapshot" :waiting-queue="simulation.waitingQueue"
                :completed-queue="simulation.completedQueue" :debug-mode="debugMode" />
        </template>

        <template #right>
            <div class="panel right-tabbed-panel">
                <div class="tab-bar">
                    <button class="tab-btn" :class="{ active: rightTab === 'detail' }" @click="rightTab = 'detail'">
                        📋 进程详情
                    </button>
                    <button class="tab-btn" :class="{ active: rightTab === 'stats' }" @click="rightTab = 'stats'">
                        📊 性能指标
                    </button>
                </div>

                <div class="tab-body">
                    <ProcessDetail v-show="rightTab === 'detail'" :process="simulation.selectedProcess"
                        :history="simulation.selectedProcessHistory" />
                    <StatsPanel v-show="rightTab === 'stats'" :metrics="simulation.result?.metrics ?? []"
                        :average-turnaround="simulation.averageTurnaround"
                        :average-weighted-turnaround="simulation.averageWeightedTurnaround"
                        :average-response-time="simulation.averageResponseTime" :throughput="simulation.throughput"
                        :cpu-utilization="simulation.cpuUtilization" :current-step="simulation.currentStep"
                        :max-step="simulation.maxStep" :current-time="simulation.currentTime"
                        :compare="simulation.compareResult" :turnaround-trend="simulation.turnaroundTrend" />
                </div>
            </div>
        </template>
    </KanbanLayout>

    <p v-if="simulation.error" class="error">{{ simulation.error }}</p>
</template>
