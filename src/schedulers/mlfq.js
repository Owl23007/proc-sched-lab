import { buildSnapshot, finalize, enqueueArrivals, enqueueArrivalsBetween } from './utils.js'

const MLFQ_LEVELS = 3

export function runMLFQ(processes, baseQuantum) {
  const normalizedBaseQuantum = Math.max(1, Number(baseQuantum) || 1)
  const quantums = Array.from({ length: MLFQ_LEVELS }, (_, index) => normalizedBaseQuantum * 2 ** index)
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
  const queues = Array.from({ length: MLFQ_LEVELS }, () => [])
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
      const nextLevel = Math.min(MLFQ_LEVELS - 1, level + 1)
      cloned[index].queue_level = nextLevel
      queues[nextLevel].push(index)
    }

    const idQueues = queues.map((q) => q.map((i) => cloned[i].id))
    snapshots.push(buildSnapshot(cloned, time, cloned[index].id, idQueues))
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
