/**
 * 调度器公共工具函数
 * 四个调度算法共享：buildSnapshot、buildEvents、finalize、enqueueArrivals
 */

/**
 * 构建当前时刻快照（ready_queues 已是 ID 数组）
 * @param {Array} processes  - 克隆后的进程数组
 * @param {number} time      - 当前时刻
 * @param {string} runningId - 正在执行的进程 ID
 * @param {Array[][]} idQueues - 就绪队列（每个队列内是进程 ID）
 */
export function buildSnapshot(processes, time, runningId, idQueues) {
    return {
        time,
        running: runningId,
        ready_queues: idQueues,
        processes: processes.map((p) => ({
            id: p.id,
            name: p.name,
            state: p.remaining_time === 0 ? 'F' : p.id === runningId ? 'E' : p.arrival_time <= time ? 'R' : 'W',
            remaining_time: p.remaining_time,
            used_cpu_time: p.used_cpu_time,
            priority: p.priority,
            queue_level: p.queue_level ?? 0,
        })),
    }
}

/**
 * 从「索引队列」构建快照（会先把索引映射为 ID）
 */
export function buildSnapshotFromIndexQueues(processes, time, runningId, indexQueues) {
    const idQueues = indexQueues.map((queue) => queue.map((i) => processes[i].id))
    return buildSnapshot(processes, time, runningId, idQueues)
}

/**
 * 根据 timeline 生成事件列表
 */
export function buildEvents(timeline) {
    return timeline.map((item, index) => {
        const sameProcessBefore = timeline.slice(0, index).some((prev) => prev.process_id === item.process_id)
        return {
            time: item.end,
            type: sameProcessBefore ? 'preempt' : 'complete',
            process_id: item.process_id,
        }
    })
}

/**
 * 统一收尾：计算指标、注入事件到快照
 */
export function finalize(processes, timeline, snapshots, totalTime) {
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
        metrics.reduce((sum, m) => sum + m.turnaround_time, 0) / Math.max(1, metrics.length)
    const average_weighted_turnaround_time =
        metrics.reduce((sum, m) => sum + m.weighted_turnaround_time, 0) / Math.max(1, metrics.length)
    const average_response_time =
        metrics.reduce((sum, m) => sum + m.response_time, 0) / Math.max(1, metrics.length)
    const cpuBusyTime = timeline.reduce((sum, item) => sum + Math.max(0, item.end - item.start), 0)

    const events = buildEvents(timeline)
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

/**
 * 将新到达的进程加入队列（≤ time）
 */
export function enqueueArrivals(processes, arrived, queue, time) {
    for (let i = 0; i < processes.length; i += 1) {
        if (!arrived[i] && processes[i].arrival_time <= time) {
            arrived[i] = true
            queue.push(i)
        }
    }
}

/**
 * 将在 (start, end] 时间段内到达的进程加入队列
 */
export function enqueueArrivalsBetween(processes, arrived, queue, start, end) {
    for (let i = 0; i < processes.length; i += 1) {
        if (!arrived[i] && processes[i].arrival_time > start && processes[i].arrival_time <= end) {
            arrived[i] = true
            queue.push(i)
        }
    }
}
