export function runSJF(processes) {
    const cloned = processes.map((process) => ({
        ...process,
        remaining_time: process.burst_time,
        used_cpu_time: 0,
        start_time: null,
        finish_time: null,
        queue_level: 0,
    }))

    let time = 0
    let completed = 0
    const visited = new Array(cloned.length).fill(false)
    const timeline = []
    const snapshots = []

    while (completed < cloned.length) {
        const readyIndexes = []
        for (let index = 0; index < cloned.length; index += 1) {
            if (!visited[index] && cloned[index].arrival_time <= time) {
                readyIndexes.push(index)
            }
        }

        if (!readyIndexes.length) {
            time += 1
            continue
        }

        readyIndexes.sort((a, b) => {
            if (cloned[a].burst_time !== cloned[b].burst_time) {
                return cloned[a].burst_time - cloned[b].burst_time
            }
            if (cloned[a].arrival_time !== cloned[b].arrival_time) {
                return cloned[a].arrival_time - cloned[b].arrival_time
            }
            return String(cloned[a].id).localeCompare(String(cloned[b].id))
        })

        const selectedIndex = readyIndexes[0]
        const process = cloned[selectedIndex]
        visited[selectedIndex] = true
        process.start_time = time
        const start = time
        time += process.burst_time
        process.used_cpu_time = process.burst_time
        process.remaining_time = 0
        process.finish_time = time
        completed += 1

        timeline.push({
            start,
            end: time,
            process_id: process.id,
            process_name: process.name,
            queue_level: 0,
        })

        const queueIds = readyIndexes.slice(1).map((index) => cloned[index].id)
        snapshots.push(buildSnapshot(cloned, time, process.id, [queueIds], timeline))
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