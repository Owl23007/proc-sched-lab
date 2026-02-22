export function runPriorityRR(processes, quantum, priorityStep) {
    const cloned = processes.map((process) => ({
        ...process,
        remaining_time: process.burst_time,
        used_cpu_time: 0,
        start_time: null,
        finish_time: null,
    }))

    let time = 0
    let completed = 0
    const arrived = new Array(cloned.length).fill(false)
    const ready = []
    const timeline = []
    const snapshots = []

    while (completed < cloned.length) {
        enqueueArrivals(cloned, arrived, ready, time)

        if (!ready.length) {
            time += 1
            continue
        }

        ready.sort((a, b) => {
            if (cloned[a].priority !== cloned[b].priority) {
                return cloned[a].priority - cloned[b].priority
            }
            return cloned[a].arrival_time - cloned[b].arrival_time
        })

        const index = ready.shift()
        const start = time

        if (cloned[index].start_time == null) {
            cloned[index].start_time = start
        }

        const runFor = Math.min(Math.max(1, quantum), cloned[index].remaining_time)
        cloned[index].remaining_time -= runFor
        cloned[index].used_cpu_time += runFor
        time += runFor

        enqueueArrivalsBetween(cloned, arrived, ready, start, time)

        timeline.push({
            start,
            end: time,
            process_id: cloned[index].id,
            process_name: cloned[index].name,
            queue_level: 0,
        })

        if (cloned[index].remaining_time === 0) {
            cloned[index].finish_time = time
            completed += 1
        } else {
            cloned[index].priority += Math.max(1, priorityStep)
            ready.push(index)
        }

        snapshots.push(buildSnapshot(cloned, time, cloned[index].id, [ready]))
    }

    return finalize(cloned, timeline, snapshots, time)
}

function enqueueArrivals(processes, arrived, ready, time) {
    for (let i = 0; i < processes.length; i += 1) {
        if (!arrived[i] && processes[i].arrival_time <= time) {
            arrived[i] = true
            ready.push(i)
        }
    }
}

function enqueueArrivalsBetween(processes, arrived, ready, start, end) {
    for (let i = 0; i < processes.length; i += 1) {
        if (!arrived[i] && processes[i].arrival_time > start && processes[i].arrival_time <= end) {
            arrived[i] = true
            ready.push(i)
        }
    }
}

function buildSnapshot(processes, time, runningId, queues) {
    return {
        time,
        running: runningId,
        ready_queues: queues.map((queue) => queue.map((i) => processes[i].id)),
        processes: processes.map((p) => ({
            id: p.id,
            name: p.name,
            state: p.remaining_time === 0 ? 'F' : p.id === runningId ? 'E' : p.arrival_time <= time ? 'R' : 'W',
            remaining_time: p.remaining_time,
            used_cpu_time: p.used_cpu_time,
            priority: p.priority,
            queue_level: 0,
        })),
    }
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

    const average_turnaround_time =
        metrics.reduce((sum, metric) => sum + metric.turnaround_time, 0) / Math.max(1, metrics.length)
    const average_weighted_turnaround_time =
        metrics.reduce((sum, metric) => sum + metric.weighted_turnaround_time, 0) / Math.max(1, metrics.length)
    const average_response_time =
        metrics.reduce((sum, metric) => sum + metric.response_time, 0) / Math.max(1, metrics.length)
    const cpuBusyTime = timeline.reduce((sum, item) => sum + Math.max(0, item.end - item.start), 0)

    const events = timeline.map((item, index) => {
        const sameProcessBefore = timeline.slice(0, index).some((prev) => prev.process_id === item.process_id)
        return {
            time: item.end,
            type: sameProcessBefore ? 'preempt' : 'complete',
            process_id: item.process_id,
        }
    })

    const snapshotsWithEvents = snapshots.map((snapshot) => ({ ...snapshot, events }))

    return {
        timeline,
        snapshots: snapshotsWithEvents,
        metrics,
        average_turnaround_time,
        average_weighted_turnaround_time,
        average_response_time,
        throughput: totalTime > 0 ? metrics.length / totalTime : 0,
        cpu_utilization: totalTime > 0 ? cpuBusyTime / totalTime : 0,
        total_time: totalTime,
    }
}
