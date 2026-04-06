<script setup>
import { ref } from 'vue'
import { getStateLabel } from '../utils/processState'

const props = defineProps({
    process: { type: Object, default: null },
    history: { type: Array, default: () => [] },
})

const showPcb = ref(false)
const showHistory = ref(true)

function progress(process) {
    if (!process?.burst_time) {
        return 0
    }
    const used = process.used_cpu_time ?? 0
    return Math.min(100, Math.max(0, (used / process.burst_time) * 100))
}
</script>

<template>
    <div class="detail-content">
        <template v-if="process">
            <!-- Compact info: two columns side by side -->
            <div class="detail-compact">
                <div class="info-col">
                    <h4>基本信息</h4>
                    <div class="info-rows">
                        <span>PID: <strong>{{ process.id }}</strong></span>
                        <span>名称: <strong>{{ process.name }}</strong></span>
                        <span>优先级: <strong>{{ process.priority }}</strong></span>
                        <span>状态: {{ getStateLabel(process.status) }}</span>
                    </div>
                </div>
                <div class="info-col">
                    <h4>时间信息</h4>
                    <div class="info-rows">
                        <span>到达: <strong>{{ process.arrival_time }}</strong></span>
                        <span>开始: <strong>{{ process.start_time ?? '-' }}</strong></span>
                        <span>结束: <strong>{{ process.finish_time ?? '-' }}</strong></span>
                        <span>已用/总: <strong>{{ process.used_cpu_time ?? 0 }}/{{ process.burst_time }}</strong></span>
                    </div>
                    <div class="progress-line">
                        <div class="progress-fill" :style="{ width: `${progress(process)}%` }" />
                    </div>
                </div>
            </div>

            <!-- Collapsible: PCB details -->
            <button class="collapse-toggle" @click="showPcb = !showPcb">
                <span class="collapse-icon">{{ showPcb ? '▾' : '▸' }}</span>
                PCB 详情 (JSON)
            </button>
            <pre v-if="showPcb" class="pcb-pre">{{ JSON.stringify(process, null, 2) }}</pre>

            <!-- Collapsible: Status history -->
            <button class="collapse-toggle" @click="showHistory = !showHistory">
                <span class="collapse-icon">{{ showHistory ? '▾' : '▸' }}</span>
                状态历史 ({{ history.length }})
            </button>
            <div class="collapse-section" :class="{ open: showHistory }">
                <ul v-if="history.length" class="history-list compact-history">
                    <li v-for="(item, index) in history" :key="`${item.time}-${index}`">
                        <span class="history-time">t={{ item.time }}</span>
                        → {{ getStateLabel(item.state) }} · 剩余 {{ item.remaining_time }} · Q{{ (item.queue_level ?? 0) + 1
                        }}
                    </li>
                </ul>
                <p v-else class="placeholder">暂无状态流转记录</p>
            </div>
        </template>
        <p v-else class="placeholder">从进程列表或甘特图选择一个进程查看详情</p>
    </div>
</template>

<style scoped>
.detail-content {
    display: grid;
    gap: 6px;
}

.detail-compact {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
}

.info-col {
    padding: 8px;
    background: color-mix(in srgb, var(--bg-soft), transparent 12%);
    border: 1px solid var(--border-soft);
    border-radius: 8px;

    h4 {
        margin: 0 0 4px;
        font-size: 11px;
        color: var(--text-muted);
        font-weight: 600;
    }
}

.info-rows {
    display: grid;
    gap: 2px;
    font-size: 12px;

    strong {
        font-weight: 600;
    }
}

.collapse-toggle {
    display: flex;
    align-items: center;
    gap: 4px;
    background: none;
    border: none;
    border-bottom: 1px solid var(--border-soft);
    padding: 6px 4px;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    cursor: pointer;
    width: 100%;
    text-align: left;
    border-radius: 0;

    &:hover {
        color: var(--text-main);
        background: color-mix(in srgb, var(--bg-soft), transparent 40%);
    }
}

.collapse-icon {
    font-size: 10px;
    width: 12px;
    text-align: center;
}

.collapse-section {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.25s ease;
    overflow: hidden;
}

.collapse-section>* {
    overflow: hidden;
    min-height: 0;
}

.collapse-section.open {
    grid-template-rows: 1fr;
}

.pcb-pre {
    margin: 0;
    padding: 8px;
    font-size: 11px;
    font-family: monospace;
    max-height: 180px;
    overflow: auto;
    background: color-mix(in srgb, var(--bg-soft), transparent 12%);
    border: 1px solid var(--border-soft);
    border-radius: 6px;
}

.compact-history {
    margin: 0;
    padding-left: 14px;
    display: grid;
    gap: 2px;
    font-size: 12px;
    max-height: 180px;
    overflow-y: auto;
}

.history-time {
    font-weight: 600;
    color: var(--accent);
}
</style>
