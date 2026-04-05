<script setup>
import { computed, ref, watchEffect } from 'vue'
import { usePreferredDark, useStorage } from '@vueuse/core'
import GanttChart from './components/GanttChart.vue'
import ProcessDetail from './components/ProcessDetail.vue'
import ProcessEditor from './components/ProcessEditor.vue'
import QueueView from './components/QueueView.vue'
import StatsPanel from './components/StatsPanel.vue'
import KanbanLayout from './layouts/KanbanLayout.vue'
import ControlBar from './components/ControlBar.vue'
import PlaybackBar from './components/PlaybackBar.vue'
import { useSimulationStore } from './stores/simulation'

const simulation = useSimulationStore()
const preferredDark = usePreferredDark()
const theme = useStorage('schedlab-theme', preferredDark.value ? 'dark' : 'light')
const zoom = ref(10)
const debugMode = ref(false)
const headerCollapsed = ref(false)
const rightTab = ref('detail')

const isDark = computed(() => theme.value === 'dark')

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
                    <ControlBar v-model:zoom="zoom" v-model:debug-mode="debugMode" />
                    <PlaybackBar />
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
