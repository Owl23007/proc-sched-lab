import { buildSnapshot, finalize, enqueueArrivals, enqueueArrivalsBetween } from './utils.js'

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

        const readyIds = ready.map((i) => cloned[i].id)
        snapshots.push(buildSnapshot(cloned, time, cloned[index].id, [readyIds]))
    }

    return finalize(cloned, timeline, snapshots, time)
}

