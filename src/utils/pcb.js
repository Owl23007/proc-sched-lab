export function createProcess(partial = {}) {
  const id = partial.id ?? crypto.randomUUID().slice(0, 8)
  return {
    id,
    name: partial.name ?? `P${id.slice(0, 4)}`,
    arrival_time: Number(partial.arrival_time ?? 0),
    burst_time: Number(partial.burst_time ?? 5),
    priority: Number(partial.priority ?? 10),
  }
}

export function defaultProcesses() {
  return [
    createProcess({ id: 'P1', name: 'P1', arrival_time: 0, burst_time: 7, priority: 8 }),
    createProcess({ id: 'P2', name: 'P2', arrival_time: 1, burst_time: 4, priority: 3 }),
    createProcess({ id: 'P3', name: 'P3', arrival_time: 2, burst_time: 6, priority: 6 }),
  ]
}
