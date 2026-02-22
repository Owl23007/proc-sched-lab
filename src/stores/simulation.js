import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { defaultProcesses } from '../utils/pcb'
import { runSimulation } from '../wasm/scheduler'

const ALGORITHMS = [
    { key: 'priority_rr', label: 'Priority RR' },
    { key: 'mlfq', label: 'MLFQ' },
    { key: 'fcfs', label: 'FCFS' },
    { key: 'sjf', label: 'SJF' },
]

export const useSimulationStore = defineStore('simulation', () => {
    const processes = ref(defaultProcesses())
    const algorithm = ref('priority_rr')
    const quantum = ref(2)
    const queueCount = ref(3)
    const priorityDecay = ref(2)
    const result = ref(null)
    const compareResult = ref(null)
    const backend = ref('unknown')
    const isRunning = ref(false)
    const error = ref('')

    const isPlaying = ref(false)
    const currentStep = ref(0)
    const playbackSpeed = ref(1)
    const selectedProcessId = ref('')
    let playTimer = null

    const maxStep = computed(() => {
        const snapshots = result.value?.snapshots ?? []
        return snapshots.length ? snapshots.length - 1 : 0
    })

    const currentSnapshot = computed(() => {
        const snapshots = result.value?.snapshots ?? []
        if (!snapshots.length) {
            return null
        }
        return snapshots[Math.min(currentStep.value, snapshots.length - 1)]
    })

    const currentTime = computed(() => currentSnapshot.value?.time ?? 0)

    const visibleTimeline = computed(() => {
        const timeline = result.value?.timeline ?? []
        const time = currentTime.value

        if (!timeline.length) {
            return []
        }

        return timeline
            .filter((item) => item.start < time)
            .map((item) => ({
                ...item,
                end: Math.min(item.end, time),
            }))
            .filter((item) => item.end > item.start)
    })

    const processStateMap = computed(() => {
        const map = new Map()
        const snapshotProcesses = currentSnapshot.value?.processes ?? []
        snapshotProcesses.forEach((process) => {
            map.set(process.id, process.state)
        })
        return map
    })

    const waitingQueue = computed(() => {
        const snapshotProcesses = currentSnapshot.value?.processes ?? []
        return snapshotProcesses.filter((process) => process.state === 'W')
    })

    const completedQueue = computed(() => {
        const snapshotProcesses = currentSnapshot.value?.processes ?? []
        return snapshotProcesses.filter((process) => process.state === 'F')
    })

    const events = computed(() => {
        const list = currentSnapshot.value?.events ?? []
        return list.filter((event) => event.time <= currentTime.value)
    })

    const averageTurnaround = computed(() => result.value?.average_turnaround_time ?? 0)
    const averageWeightedTurnaround = computed(() => result.value?.average_weighted_turnaround_time ?? 0)
    const averageResponseTime = computed(() => result.value?.average_response_time ?? 0)
    const throughput = computed(() => result.value?.throughput ?? 0)
    const cpuUtilization = computed(() => result.value?.cpu_utilization ?? 0)

    const turnaroundTrend = computed(() => {
        const metrics = result.value?.metrics ?? []
        const sorted = [...metrics].sort((a, b) => a.finish_time - b.finish_time)
        let sum = 0
        return sorted.map((metric, index) => {
            sum += metric.turnaround_time
            return {
                x: index + 1,
                y: sum / (index + 1),
            }
        })
    })

    const selectedProcess = computed(() => {
        if (!selectedProcessId.value) {
            return null
        }

        const base = processes.value.find((process) => process.id === selectedProcessId.value)
        if (!base) {
            return null
        }

        const metric = (result.value?.metrics ?? []).find((item) => item.id === selectedProcessId.value)
        const snapshotProcess = (currentSnapshot.value?.processes ?? []).find((item) => item.id === selectedProcessId.value)

        return {
            ...base,
            ...(snapshotProcess ?? {}),
            ...(metric ?? {}),
            status: snapshotProcess?.state ?? 'W',
        }
    })

    const selectedProcessHistory = computed(() => {
        if (!selectedProcessId.value) {
            return []
        }

        const snapshots = result.value?.snapshots ?? []
        const items = snapshots
            .map((snapshot) => {
                const current = (snapshot.processes ?? []).find((process) => process.id === selectedProcessId.value)
                if (!current) {
                    return null
                }
                return {
                    time: snapshot.time,
                    state: current.state,
                    remaining_time: current.remaining_time,
                    queue_level: current.queue_level,
                }
            })
            .filter(Boolean)

        const merged = []
        for (const item of items) {
            const last = merged[merged.length - 1]
            if (!last || last.state !== item.state) {
                merged.push(item)
            }
        }

        return merged
    })

    const backendDisplay = computed(() => {
        if (backend.value === 'wasm') {
            return 'WASM'
        }

        if (backend.value === 'js') {
            return 'JS'
        }

        if (backend.value === 'mixed') {
            return 'WASM + JS'
        }

        return '未知'
    })

    async function runOnce(selectedAlgorithm = algorithm.value) {
        pausePlayback()
        isRunning.value = true
        error.value = ''

        try {
            const simulation = await runSimulation({
                algorithm: selectedAlgorithm,
                processes: processes.value,
                quantum: Number(quantum.value),
                priorityStep: Number(priorityDecay.value),
                queueCount: Number(queueCount.value),
            })

            if (simulation.error) {
                throw new Error(simulation.error)
            }

            if (selectedAlgorithm === algorithm.value) {
                result.value = simulation
                backend.value = simulation.__backend ?? 'unknown'
                currentStep.value = 0
            }

            return simulation
        } catch (e) {
            error.value = e.message
            backend.value = 'unknown'
            return null
        } finally {
            isRunning.value = false
        }
    }

    async function runComparison() {
        pausePlayback()
        const runs = await Promise.all(ALGORITHMS.map((item) => runOnce(item.key)))
        compareResult.value = ALGORITHMS.reduce((map, item, index) => {
            map[item.key] = runs[index]
            return map
        }, {})

        const backends = runs.map((item) => item?.__backend).filter(Boolean)
        backend.value = backends.length > 0 && backends.every((item) => item === backends[0]) ? backends[0] : 'mixed'
    }

    function clearPlayTimer() {
        if (playTimer) {
            clearInterval(playTimer)
            playTimer = null
        }
    }

    function stepNext() {
        if (!result.value?.snapshots?.length) {
            return
        }

        if (currentStep.value >= maxStep.value) {
            pausePlayback()
            return
        }

        currentStep.value += 1
    }

    function stepPrev() {
        if (!result.value?.snapshots?.length) {
            return
        }

        currentStep.value = Math.max(0, currentStep.value - 1)
    }

    function seek(step) {
        if (!result.value?.snapshots?.length) {
            return
        }

        const nextStep = Number(step)
        currentStep.value = Math.min(maxStep.value, Math.max(0, Number.isNaN(nextStep) ? 0 : nextStep))
    }

    function startPlayTimer() {
        clearPlayTimer()
        const interval = Math.max(30, Math.floor(1000 / playbackSpeed.value))
        playTimer = setInterval(() => {
            stepNext()
        }, interval)
    }

    function play() {
        if (!result.value?.snapshots?.length) {
            return
        }

        if (currentStep.value >= maxStep.value) {
            currentStep.value = 0
        }

        isPlaying.value = true
        startPlayTimer()
    }

    function pausePlayback() {
        isPlaying.value = false
        clearPlayTimer()
    }

    function togglePlay() {
        if (isPlaying.value) {
            pausePlayback()
            return
        }

        play()
    }

    function setPlaybackSpeed(speed) {
        const parsed = Number(speed)
        playbackSpeed.value = Number.isNaN(parsed) ? 1 : Math.min(10, Math.max(0.25, parsed))

        if (isPlaying.value) {
            startPlayTimer()
        }
    }

    function resetPlayback() {
        pausePlayback()
        currentStep.value = 0
    }

    function setSelectedProcess(processId) {
        selectedProcessId.value = processId
    }

    function buildMarkdownReport() {
        const metrics = result.value?.metrics ?? []
        const lines = [
            '# 调度实验报告',
            '',
            `- 算法: ${algorithm.value}`,
            `- 时间片: ${quantum.value}`,
            `- 队列数量: ${queueCount.value}`,
            `- 优先级衰减: ${priorityDecay.value}`,
            `- 进程数量: ${processes.value.length}`,
            '',
            '## 核心指标',
            '',
            `- 平均周转时间: ${averageTurnaround.value.toFixed(2)}`,
            `- 平均带权周转时间: ${averageWeightedTurnaround.value.toFixed(2)}`,
            `- 平均响应时间: ${averageResponseTime.value.toFixed(2)}`,
            `- 吞吐量: ${throughput.value.toFixed(3)}`,
            `- CPU 利用率: ${(cpuUtilization.value * 100).toFixed(2)}%`,
            '',
            '## 进程明细',
            '',
            '| PID | 名称 | 开始 | 结束 | 周转 | 带权周转 | 响应 |',
            '| --- | --- | ---: | ---: | ---: | ---: | ---: |',
            ...metrics.map((item) => `| ${item.id} | ${item.name} | ${item.start_time} | ${item.finish_time} | ${item.turnaround_time.toFixed(2)} | ${(item.weighted_turnaround_time ?? 0).toFixed(2)} | ${(item.response_time ?? 0).toFixed(2)} |`),
        ]

        return lines.join('\n')
    }

    function exportMarkdownReport() {
        const content = buildMarkdownReport()
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = 'schedlab-report.md'
        anchor.click()
        URL.revokeObjectURL(url)
    }

    function exportPdfReport() {
        const content = buildMarkdownReport()
        const escaped = content
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;')
        const popup = window.open('', '_blank')
        if (!popup) {
            return
        }

        popup.document.write(`<!doctype html><html><head><meta charset="utf-8" /><title>SchedLab Report</title><style>body{font-family:Segoe UI,Arial,sans-serif;padding:24px}pre{white-space:pre-wrap;line-height:1.5}</style></head><body><pre>${escaped}</pre></body></html>`)
        popup.document.close()
        popup.focus()
        popup.print()
    }

    watch(result, () => {
        resetPlayback()
        selectedProcessId.value = processes.value[0]?.id ?? ''
    })

    watch(currentSnapshot, () => {
        if (!selectedProcessId.value && processes.value.length) {
            selectedProcessId.value = processes.value[0].id
        }
    })

    return {
        algorithms: ALGORITHMS,
        processes,
        algorithm,
        quantum,
        queueCount,
        priorityDecay,
        result,
        compareResult,
        backend,
        backendDisplay,
        isRunning,
        error,
        isPlaying,
        currentStep,
        maxStep,
        playbackSpeed,
        currentSnapshot,
        currentTime,
        visibleTimeline,
        processStateMap,
        waitingQueue,
        completedQueue,
        events,
        averageTurnaround,
        averageWeightedTurnaround,
        averageResponseTime,
        throughput,
        cpuUtilization,
        turnaroundTrend,
        selectedProcessId,
        selectedProcess,
        selectedProcessHistory,
        runOnce,
        runComparison,
        play,
        pausePlayback,
        togglePlay,
        stepNext,
        stepPrev,
        seek,
        setPlaybackSpeed,
        resetPlayback,
        setSelectedProcess,
        exportMarkdownReport,
        exportPdfReport,
    }
})
