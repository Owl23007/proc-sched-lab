<script setup>
/**
 * PlaybackBar — 播放控制面板
 * 包含：▶ 开始 / ⏸ 暂停 / ↺ 重置 / ⏭ 单步 / 算法对比 / 导出 / 速度 + 进度条
 * 直接操作 simulation store，无需 App.vue 代理
 */
import { computed } from 'vue'
import { useSimulationStore } from '../stores/simulation'

const simulation = useSimulationStore()

const canPlay = computed(() => (simulation.result?.snapshots?.length ?? 0) > 0)

const progress = computed(() => {
    if (!canPlay.value || simulation.maxStep <= 0) return 0
    return Math.round((simulation.currentStep / simulation.maxStep) * 100)
})

const startButtonText = computed(() => {
    if (canPlay.value && simulation.currentStep > 0 && simulation.currentStep < simulation.maxStep) {
        return '▶ 继续'
    }
    return '▶ 开始'
})

const startButtonTitle = computed(() => (startButtonText.value === '▶ 继续' ? '继续播放' : '开始播放'))

async function startPlayback() {
    if (!canPlay.value) {
        await simulation.runOnce()
    }
    if (simulation.result?.snapshots?.length) {
        simulation.play()
    }
}
</script>

<template>
    <div class="playback-bar">
        <div class="playback-main-row">
            <div class="btn-group playback-main-actions">
                <button class="btn btn-primary-action" :disabled="simulation.isRunning" :title="startButtonTitle"
                    @click="startPlayback">
                    {{ startButtonText }}
                </button>
                <button class="btn ghost" :disabled="!canPlay" title="暂停" @click="simulation.pausePlayback">
                    ⏸ 暂停
                </button>
                <button class="btn ghost" :disabled="!canPlay" title="重置到起点" @click="simulation.resetPlayback">
                    ↺ 重置
                </button>
                <button class="btn ghost" :disabled="!canPlay" title="前进一步" @click="simulation.stepNext">
                    ⏭ 单步
                </button>
            </div>

            <div class="playback-secondary-actions">
                <button class="btn ghost" :disabled="simulation.isRunning" title="运行全部算法并比较指标"
                    @click="simulation.runComparison">
                    算法对比
                </button>
                <button class="btn ghost" :disabled="!simulation.result" title="导出 Markdown 报告"
                    @click="simulation.exportMarkdownReport">
                    导出 MD
                </button>
                <button class="btn ghost" :disabled="!simulation.result" title="导出 PDF 报告"
                    @click="simulation.exportPdfReport">
                    导出 PDF
                </button>
            </div>

            <label class="playback-speed">
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

        <div class="progress-wrap playback-progress">
            <input type="range" min="0" :max="simulation.maxStep" :value="simulation.currentStep" :disabled="!canPlay"
                :style="{ '--pct': progress + '%' }" @input="simulation.seek($event.target.value)" />
            <span class="progress-pct">{{ progress }}%</span>
        </div>
    </div>
</template>
