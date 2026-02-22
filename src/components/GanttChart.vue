<script setup>
import { computed } from 'vue'

const props = defineProps({
    timeline: { type: Array, default: () => [] },
    currentTime: { type: Number, default: 0 },
    events: { type: Array, default: () => [] },
    zoom: { type: Number, default: 10 },
    selectedProcessId: { type: String, default: '' },
})

const emit = defineEmits(['select'])

const pxPerUnit = computed(() => {
    if (props.zoom === 50) {
        return 8
    }
    if (props.zoom === 100) {
        return 5
    }
    return 14
})

const totalTime = computed(() => {
    if (!props.timeline.length) {
        return 0
    }
    return Math.max(...props.timeline.map((item) => item.end))
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
    const width = Math.max(44, (item.end - item.start) * pxPerUnit.value)
    return {
        width: `${width}px`,
        borderStyle: isPreempted(item.process_id) ? 'dashed' : 'solid',
        '--proc-color': processColor(item.process_id),
    }
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
            <h3>可视化核心区 · Gantt Chart</h3>
            <p class="step-hint">当前时刻：t={{ currentTime }}</p>
        </div>

        <div v-if="timeline.length" class="timeline-ruler">
            <span v-for="tick in ticks" :key="tick">{{ tick }}</span>
        </div>

        <div v-if="timeline.length" class="gantt">
            <button v-for="(item, index) in timeline" :key="`${item.process_id}-${index}`" class="block"
                :class="{ active: isActive(item), selected: selectedProcessId === item.process_id }"
                :style="blockStyle(item)" @click="emit('select', item.process_id)">
                <strong>{{ item.process_name }}</strong>
                <span>{{ item.start }} → {{ item.end }}</span>
                <small>Q{{ item.queue_level + 1 }}</small>
            </button>
        </div>

        <div v-if="events.length" class="event-row">
            <strong>事件:</strong>
            <span v-for="(event, index) in events" :key="`${event.process_id}-${event.time}-${index}`"
                class="event-chip">
                {{ eventEmoji(event.type) }} t={{ event.time }} {{ event.process_id }}
            </span>
        </div>

        <p v-else class="placeholder">运行一次调度后显示执行时间线</p>
    </section>
</template>

<style scoped>
.gantt {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
}

.timeline-ruler {
    display: flex;
    justify-content: space-between;
    color: var(--text-muted);
    font-size: 11px;
    border: 1px dashed var(--border-main);
    border-radius: 8px;
    padding: 5px 10px;
    margin-top: 6px;
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
