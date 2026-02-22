<script setup>
import { computed } from 'vue'

const props = defineProps({
    metrics: { type: Array, default: () => [] },
    averageTurnaround: { type: Number, default: 0 },
    averageWeightedTurnaround: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 },
    throughput: { type: Number, default: 0 },
    cpuUtilization: { type: Number, default: 0 },
    currentStep: { type: Number, default: 0 },
    maxStep: { type: Number, default: 0 },
    currentTime: { type: Number, default: 0 },
    compare: { type: Object, default: null },
    turnaroundTrend: { type: Array, default: () => [] },
})

const compareBars = computed(() => {
    const candidates = [
        { key: 'priority_rr', label: 'Priority RR' },
        { key: 'mlfq', label: 'MLFQ' },
        { key: 'fcfs', label: 'FCFS' },
        { key: 'sjf', label: 'SJF' },
    ]

    const values = candidates
        .map((item) => ({
            label: item.label,
            value: props.compare?.[item.key]?.average_turnaround_time ?? 0,
        }))
        .filter((item) => item.value > 0)

    const max = Math.max(1, ...values.map((item) => item.value))
    return values.map((item) => ({
        ...item,
        width: `${Math.round((item.value / max) * 100)}%`,
    }))
})
</script>

<template>
    <section class="panel">
        <div class="panel-header">
            <h3>性能指标区</h3>
            <p class="step-hint">Step {{ currentStep }} / {{ maxStep }} · t={{ currentTime }}</p>
        </div>

        <div class="metric-grid">
            <article class="metric-item">
                <h4>平均周转时间</h4><strong>{{ averageTurnaround.toFixed(2) }}</strong>
            </article>
            <article class="metric-item">
                <h4>平均带权周转时间</h4><strong>{{ averageWeightedTurnaround.toFixed(2) }}</strong>
            </article>
            <article class="metric-item">
                <h4>平均响应时间</h4><strong>{{ averageResponseTime.toFixed(2) }}</strong>
            </article>
            <article class="metric-item">
                <h4>吞吐量</h4><strong>{{ throughput.toFixed(3) }} /t</strong>
            </article>
            <article class="metric-item">
                <h4>CPU 利用率</h4><strong>{{ (cpuUtilization * 100).toFixed(2) }}%</strong>
            </article>
        </div>

        <table v-if="metrics.length" class="table">
            <thead>
                <tr>
                    <th>进程</th>
                    <th>开始</th>
                    <th>结束</th>
                    <th>周转</th>
                    <th>带权周转</th>
                    <th>响应</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="metric in metrics" :key="metric.id">
                    <td>{{ metric.name }}</td>
                    <td>{{ metric.start_time }}</td>
                    <td>{{ metric.finish_time }}</td>
                    <td>{{ metric.turnaround_time.toFixed(2) }}</td>
                    <td>{{ (metric.weighted_turnaround_time ?? 0).toFixed(2) }}</td>
                    <td>{{ (metric.response_time ?? 0).toFixed(2) }}</td>
                </tr>
            </tbody>
        </table>
        <p v-else class="placeholder">暂无统计数据</p>

        <div class="panel-inner">
            <h4>当前算法 vs 其他算法（平均周转时间）</h4>
            <div v-if="compareBars.length" class="bar-list">
                <div v-for="item in compareBars" :key="item.label" class="bar-row">
                    <span>{{ item.label }}</span>
                    <div class="bar-bg">
                        <div class="bar-fill" :style="{ width: item.width }" />
                    </div>
                    <strong>{{ item.value.toFixed(2) }}</strong>
                </div>
            </div>
            <p v-else class="placeholder">运行“算法对比”后显示</p>
        </div>

        <div class="panel-inner">
            <h4>周转时间趋势（随完成进程数量变化）</h4>
            <div v-if="turnaroundTrend.length" class="trend-row">
                <span v-for="point in turnaroundTrend" :key="point.x" class="trend-point"
                    :style="{ height: `${Math.max(8, point.y * 6)}px` }"
                    :title="`n=${point.x}, avg=${point.y.toFixed(2)}`" />
            </div>
            <p v-else class="placeholder">暂无趋势数据</p>
        </div>
    </section>
</template>
