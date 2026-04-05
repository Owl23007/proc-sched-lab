import { buildSnapshot, finalize } from './utils.js'

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
        snapshots.push(buildSnapshot(cloned, time, process.id, [queueIds]))
    }

    return finalize(cloned, timeline, snapshots, time)
}
