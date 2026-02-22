export function runMLFQ(processes, baseQuantum) {
  const quantums = [Math.max(1, baseQuantum), Math.max(1, baseQuantum) * 2, Math.max(1, baseQuantum) * 4]
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
  const arrived = new Array(cloned.length).fill(false)
  const queues = [[], [], []]
  const timeline = []
  const snapshots = []

  while (completed < cloned.length) {
    enqueueArrivals(cloned, arrived, queues[0], time)

    const selection = popNext(queues)
    if (!selection) {
      time += 1
      continue
    }

    const { level, index } = selection
    const start = time

    if (cloned[index].start_time == null) {
      cloned[index].start_time = start
    }

    const runFor = Math.min(quantums[level], cloned[index].remaining_time)
    cloned[index].remaining_time -= runFor
    cloned[index].used_cpu_time += runFor
    cloned[index].queue_level = level
    time += runFor

    enqueueArrivalsBetween(cloned, arrived, queues[0], start, time)

    timeline.push({
      start,
      end: time,
      process_id: cloned[index].id,
      process_name: cloned[index].name,
      queue_level: level,
    })

    if (cloned[index].remaining_time === 0) {
      cloned[index].finish_time = time
      completed += 1
    } else {
      const nextLevel = Math.min(2, level + 1)
      cloned[index].queue_level = nextLevel
      queues[nextLevel].push(index)
    }

    snapshots.push(buildSnapshot(cloned, time, cloned[index].id, queues))
  }

  return finalize(cloned, timeline, snapshots, time)
}

function popNext(queues) {
  for (let level = 0; level < queues.length; level += 1) {
    if (queues[level].length) {
      return { level, index: queues[level].shift() }
    }
  }
  return null
}

function enqueueArrivals(processes, arrived, queue0, time) {
  for (let i = 0; i < processes.length; i += 1) {
    if (!arrived[i] && processes[i].arrival_time <= time) {
      arrived[i] = true
      queue0.push(i)
    }
  }
}

function enqueueArrivalsBetween(processes, arrived, queue0, start, end) {
  for (let i = 0; i < processes.length; i += 1) {
    if (!arrived[i] && processes[i].arrival_time > start && processes[i].arrival_time <= end) {
      arrived[i] = true
      queue0.push(i)
    }
  }
}

function buildSnapshot(processes, time, runningId, queues) {
  return {
    time,
    running: runningId,
    ready_queues: queues.map((queue) => queue.map((index) => processes[index].id)),
    processes: processes.map((p) => ({
      id: p.id,
      name: p.name,
      state: p.remaining_time === 0 ? 'F' : p.id === runningId ? 'E' : p.arrival_time <= time ? 'R' : 'W',
      remaining_time: p.remaining_time,
      used_cpu_time: p.used_cpu_time,
      priority: p.priority,
      queue_level: p.queue_level,
    })),
  }
}

function finalize(processes, timeline, snapshots, totalTime) {
  const metrics = processes.map((p) => ({
    id: p.id,
    name: p.name,
    start_time: p.start_time ?? 0,
    finish_time: p.finish_time ?? totalTime,
    turnaround_time: (p.finish_time ?? totalTime) - p.arrival_time,
  }))

  const average_turnaround_time =
    metrics.reduce((sum, metric) => sum + metric.turnaround_time, 0) / Math.max(1, metrics.length)

  return {
    timeline,
    snapshots,
    metrics,
    average_turnaround_time,
    total_time: totalTime,
  }
}
