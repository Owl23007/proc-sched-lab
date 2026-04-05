import { buildSnapshot, finalize } from './utils.js'

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

        const readyIds = cloned
            .filter((p) => p.arrival_time <= time && p.remaining_time > 0)
            .map((p) => p.id)
        snapshots.push(buildSnapshot(cloned, time, process.id, [readyIds]))
    }

    return finalize(cloned, timeline, snapshots, time)
}

