export function runFCFS(processes) {
    const cloned = processes
        .map((process) => ({
            ...process,
            remaining_time: process.burst_time,
            used_cpu_time: 0,
            start_time: null,
            finish_time: null,
            queue_level: 0,
        }))
        .sort((a, b) => {
            if (a.arrival_time !== b.arrival_time) {
                return a.arrival_time - b.arrival_time
            }
            return String(a.id).localeCompare(String(b.id))
        })

    let time = 0
    const timeline = []
    const snapshots = []

    for (const process of cloned) {
        if (time < process.arrival_time) {
            time = process.arrival_time
        }

        const start = time
        process.start_time = start
        process.used_cpu_time = process.burst_time
        process.remaining_time = 0
        time += process.burst_time
        process.finish_time = time

        timeline.push({
            start,
            end: time,
            process_id: process.id,
            process_name: process.name,
            queue_level: 0,
        })

        snapshots.push(buildSnapshot(cloned, time, process.id, [[...cloned.filter((p) => p.arrival_time <= time && p.remaining_time > 0).map((p) => p.id)]], timeline))
    }

    return finalize(cloned, timeline, snapshots, time)
}

function buildSnapshot(processes, time, runningId, readyQueuesById, timeline) {
    return {
        time,
        running: runningId,
        ready_queues: readyQueuesById,
        processes: processes.map((p) => ({
            id: p.id,
            name: p.name,
            state: p.remaining_time === 0 ? 'F' : p.id === runningId ? 'E' : p.arrival_time <= time ? 'R' : 'W',
            remaining_time: p.remaining_time,
            used_cpu_time: p.used_cpu_time,
            priority: p.priority,
            queue_level: p.queue_level ?? 0,
        })),
        events: buildEvents(timeline),
    }
}

function buildEvents(timeline) {
    return timeline.map((item, index) => {
        const sameProcessBefore = timeline.slice(0, index).some((prev) => prev.process_id === item.process_id)
        return {
            time: item.end,
            type: sameProcessBefore ? 'preempt' : 'complete',
            process_id: item.process_id,
        }
    })
}

function finalize(processes, timeline, snapshots, totalTime) {
    const metrics = processes.map((p) => {
        const turnaround = (p.finish_time ?? totalTime) - p.arrival_time
        const response = (p.start_time ?? p.arrival_time) - p.arrival_time
        return {
            id: p.id,
            name: p.name,
            start_time: p.start_time ?? 0,
            finish_time: p.finish_time ?? totalTime,
            turnaround_time: turnaround,
            weighted_turnaround_time: p.burst_time > 0 ? turnaround / p.burst_time : 0,
            response_time: response,
        }
    })

    const average_turnaround_time = metrics.reduce((sum, metric) => sum + metric.turnaround_time, 0) / Math.max(1, metrics.length)
    const average_weighted_turnaround_time =
        metrics.reduce((sum, metric) => sum + metric.weighted_turnaround_time, 0) / Math.max(1, metrics.length)
    const average_response_time = metrics.reduce((sum, metric) => sum + metric.response_time, 0) / Math.max(1, metrics.length)
    const cpuBusyTime = timeline.reduce((sum, item) => sum + Math.max(0, item.end - item.start), 0)

    return {
        timeline,
        snapshots,
        metrics,
        average_turnaround_time,
        average_weighted_turnaround_time,
        average_response_time,
        throughput: totalTime > 0 ? metrics.length / totalTime : 0,
        cpu_utilization: totalTime > 0 ? cpuBusyTime / totalTime : 0,
        total_time: totalTime,
    }
}