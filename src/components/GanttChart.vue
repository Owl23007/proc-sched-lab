<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
    timeline: { type: Array, default: () => [] },
    currentTime: { type: Number, default: 0 },
    events: { type: Array, default: () => [] },
    zoom: { type: Number, default: 10 },
    selectedProcessId: { type: String, default: '' },
})

const emit = defineEmits(['select'])

const TIMELINE_SIDE_PADDING = 16
const MIN_SCALE = 40
const MAX_SCALE = 260
const DEFAULT_SCALE = 100

const zoomScale = ref(DEFAULT_SCALE)

const zoomLabel = computed(() => `${zoomScale.value}%`)

const basePxPerUnit = computed(() => {
    if (props.zoom === 50) {
        return 8
    }
    if (props.zoom === 100) {
        return 5
    }
    return 14
})

const pxPerUnit = computed(() => (basePxPerUnit.value * zoomScale.value) / 100)

const totalTime = computed(() => {
    if (!props.timeline.length) {
        return 0
    }
    return Math.max(...props.timeline.map((item) => item.end))
})

const canvasStyle = computed(() => {
    const width = totalTime.value * pxPerUnit.value + TIMELINE_SIDE_PADDING * 2
    return {
        width: `${Math.max(0, width)}px`,
        minWidth: '100%',
    }
})

const playheadStyle = computed(() => {
    const clampedTime = Math.min(Math.max(props.currentTime, 0), totalTime.value)
    return {
        left: `${TIMELINE_SIDE_PADDING + clampedTime * pxPerUnit.value}px`,
    }
})

const ticks = computed(() => {
    const step = Number(props.zoom)
    const result = []
    for (let value = 0; value <= totalTime.value; value += step) {
        result.push(value)
    }
    if (result[result.length - 1] !== totalTime.value) {
        result.push(totalTime.value)
    }
    return result
})

const palette = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16',
]

function processColor(pid) {
    let hash = 0
    for (const c of String(pid)) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff
    return palette[hash % palette.length]
}

function blockStyle(item) {
    const width = Math.max(6, (item.end - item.start) * pxPerUnit.value)
    const left = TIMELINE_SIDE_PADDING + item.start * pxPerUnit.value
    return {
        left: `${left}px`,
        width: `${width}px`,
        borderStyle: isPreempted(item.process_id) ? 'dashed' : 'solid',
        '--proc-color': processColor(item.process_id),
    }
}

function tickStyle(tick) {
    return {
        left: `${TIMELINE_SIDE_PADDING + tick * pxPerUnit.value}px`,
    }
}

function tickClass(tick) {
    if (tick === 0) {
        return 'ruler-tick edge-start'
    }
    if (tick === totalTime.value) {
        return 'ruler-tick edge-end'
    }
    return 'ruler-tick'
}

function isActive(item) {
    return props.currentTime >= item.start && props.currentTime <= item.end
}

function isPreempted(processId) {
    return props.events.some((event) => event.process_id === processId && event.type === 'preempt')
}

function eventEmoji(type) {
    if (type === 'preempt') {
        return '⚡'
    }
    if (type === 'block') {
        return '⏸️'
    }
    return '✓'
}
</script>

<template>
    <section class="panel">
        <div class="panel-header">
            <h3>时间轴</h3>
            <p class="step-hint">当前时刻：t={{ currentTime }}</p>
        </div>

        <div v-if="timeline.length" class="timeline-scroll">
            <div class="timeline-canvas" :style="canvasStyle">
                <div class="gantt-timeline-ruler">
                    <span v-for="tick in ticks" :key="tick" :class="tickClass(tick)" :style="tickStyle(tick)">{{ tick
                    }}</span>
                </div>

                <div class="gantt-track">
                    <button v-for="(item, index) in timeline" :key="`${item.process_id}-${index}`"
                        class="block timeline-block"
                        :class="{ active: isActive(item), selected: selectedProcessId === item.process_id }"
                        :style="blockStyle(item)" @click="emit('select', item.process_id)">
                        <strong>{{ item.process_name }}</strong>
                        <span>{{ item.start }} → {{ item.end }}</span>
                        <small>Q{{ item.queue_level + 1 }}</small>
                    </button>
                    <div class="timeline-playhead" :style="playheadStyle" />
                </div>
            </div>
        </div>

        <div v-if="timeline.length" class="timeline-zoom-bar">
            <span class="zoom-label">缩放</span>
            <input v-model.number="zoomScale" class="zoom-slider" type="range" :min="MIN_SCALE" :max="MAX_SCALE"
                step="5" title="时间线缩放" />
            <button class="btn ghost btn-sm zoom-reset" :disabled="zoomScale === DEFAULT_SCALE"
                @click="zoomScale = DEFAULT_SCALE">{{ zoomLabel }}</button>
        </div>

        <div v-if="events.length" class="event-row">
            <strong>事件:</strong>
            <span v-for="(event, index) in events" :key="`${event.process_id}-${event.time}-${index}`"
                class="event-chip">
                {{ eventEmoji(event.type) }} t={{ event.time }} {{ event.process_id }}
            </span>
        </div>

        <p v-if="!timeline.length" class="placeholder">运行一次调度后显示执行时间线</p>
    </section>
</template>

<style scoped>
.timeline-scroll {
    margin-top: 8px;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 4px;
}

.timeline-canvas {
    position: relative;
}

.gantt-timeline-ruler {
    position: relative;
    height: 28px;
    border: 1px dashed var(--border-main);
    border-radius: 8px;
    background: color-mix(in srgb, var(--bg-soft), transparent 12%);
}

.ruler-tick {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    color: var(--text-muted);
    font-size: 11px;
    white-space: nowrap;
    pointer-events: none;
}

.ruler-tick.edge-start {
    transform: translate(0, -50%);
}

.ruler-tick.edge-end {
    transform: translate(-100%, -50%);
}

.gantt-track {
    position: relative;
    margin-top: 8px;
    height: 84px;
    border: 1px solid var(--border-soft);
    border-radius: 10px;
    background: color-mix(in srgb, var(--bg-soft), transparent 8%);
    overflow: hidden;
}

.timeline-block {
    position: absolute;
    top: 8px;
    height: 68px;
    margin: 0;
    padding: 8px;
    gap: 2px;
    align-content: center;
}

.timeline-block strong,
.timeline-block span,
.timeline-block small {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.timeline-playhead {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: color-mix(in srgb, var(--accent), #fff 8%);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent), transparent 60%);
    pointer-events: none;
}

.timeline-zoom-bar {
    margin-top: 6px;
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 8px;
}

.zoom-label {
    font-size: 11px;
    color: var(--text-muted);
    white-space: nowrap;
}

.zoom-slider {
    width: 100%;
    min-width: 0;
    padding: 0;
    border: none;
    background: transparent;
    appearance: none;
    -webkit-appearance: none;
    height: 14px;
}

.zoom-slider::-webkit-slider-runnable-track {
    height: 4px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--border-main), transparent 14%);
}

.zoom-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-top: -4px;
    border: 1px solid color-mix(in srgb, var(--accent), transparent 24%);
    background: color-mix(in srgb, var(--accent), #fff 22%);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent), transparent 78%);
}

.zoom-slider::-moz-range-track {
    height: 4px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--border-main), transparent 14%);
}

.zoom-slider::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 1px solid color-mix(in srgb, var(--accent), transparent 24%);
    background: color-mix(in srgb, var(--accent), #fff 22%);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent), transparent 78%);
}

.zoom-reset {
    width: 68px;
    justify-content: center;
}

.event-row {
    margin-top: 8px;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    font-size: 12px;
}

.event-chip {
    border: 1px solid var(--border-main);
    border-radius: 999px;
    padding: 2px 9px;
    font-size: 11px;
    background: color-mix(in srgb, var(--bg-soft), transparent 10%);
}
</style>
