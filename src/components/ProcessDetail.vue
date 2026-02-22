<script setup>
const props = defineProps({
    process: { type: Object, default: null },
    history: { type: Array, default: () => [] },
})

function stateText(state) {
    if (state === 'E') {
        return '🟢 执行'
    }
    if (state === 'R') {
        return '🟡 就绪'
    }
    if (state === 'F') {
        return '⚪ 完成'
    }
    return '🔵 等待'
}

function progress(process) {
    if (!process?.burst_time) {
        return 0
    }
    const used = process.used_cpu_time ?? 0
    return Math.min(100, Math.max(0, (used / process.burst_time) * 100))
}
</script>

<template>
    <section class="panel">
        <div class="panel-header">
            <h3>进程详情区</h3>
            <p v-if="process" class="step-hint">{{ process.id }} · {{ process.name }}</p>
        </div>

        <template v-if="process">
            <div class="detail-grid">
                <article class="queue-item">
                    <h4>基本信息</h4>
                    <p>PID: {{ process.id }}</p>
                    <p>进程名: {{ process.name }}</p>
                    <p>优先级: {{ process.priority }}</p>
                    <p>状态: {{ stateText(process.status) }}</p>
                </article>

                <article class="queue-item">
                    <h4>时间信息</h4>
                    <p>到达: {{ process.arrival_time }}</p>
                    <p>开始: {{ process.start_time ?? '-' }}</p>
                    <p>结束: {{ process.finish_time ?? '-' }}</p>
                    <p>已用/总时长: {{ process.used_cpu_time ?? 0 }} / {{ process.burst_time }}</p>
                    <div class="progress-line">
                        <div class="progress-fill" :style="{ width: `${progress(process)}%` }" />
                    </div>
                </article>

                <article class="queue-item pcb-block">
                    <h4>PCB 详情</h4>
                    <pre>{{ JSON.stringify(process, null, 2) }}</pre>
                </article>
            </div>

            <div class="panel-inner">
                <h4>状态历史</h4>
                <ul v-if="history.length" class="history-list">
                    <li v-for="(item, index) in history" :key="`${item.time}-${index}`">
                        t={{ item.time }} → {{ stateText(item.state) }} · 剩余 {{ item.remaining_time }} · Q{{
                            (item.queue_level ?? 0) + 1 }}
                    </li>
                </ul>
                <p v-else class="placeholder">暂无状态流转记录</p>
            </div>
        </template>
        <p v-else class="placeholder">从进程列表或甘特图选择一个进程查看详情</p>
    </section>
</template>
