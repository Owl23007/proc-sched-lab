import { ALGORITHMS } from '../schedulers/interface'

let wasmApiPromise

async function loadWasmApi() {
  if (!wasmApiPromise) {
    wasmApiPromise = import('../../core/pkg/proc_sched_core.js')
      .then(async (module) => {
        if (typeof module.default === 'function') {
          await module.default()
        }
        return {
          simulatePriorityRR: module.simulate_priority_rr,
          simulateMlfq: module.simulate_mlfq,
        }
      })
      .catch(() => null)
  }
  return wasmApiPromise
}

export async function runSimulation({ algorithm, processes, quantum, priorityStep, queueCount }) {
  const wasm = await loadWasmApi()

  if (wasm) {
    if (algorithm === 'priority_rr' && wasm.simulatePriorityRR) {
      const payload = JSON.stringify({ processes, quantum, priority_step: priorityStep })
      const simulation = JSON.parse(wasm.simulatePriorityRR(payload))
      return { ...simulation, __backend: 'wasm' }
    }

    if (algorithm === 'mlfq' && wasm.simulateMlfq) {
      const payload = JSON.stringify({ processes, base_quantum: quantum })
      const simulation = JSON.parse(wasm.simulateMlfq(payload))
      return { ...simulation, __backend: 'wasm' }
    }
  }

  const runner = ALGORITHMS[algorithm]
  if (!runner) {
    throw new Error(`Unsupported algorithm: ${algorithm}`)
  }

  if (algorithm === 'priority_rr') {
    const simulation = runner.run({ processes, quantum, priorityStep })
    return { ...simulation, __backend: 'js' }
  }

  if (algorithm === 'mlfq') {
    const simulation = runner.run({ processes, baseQuantum: quantum, queueCount })
    return { ...simulation, __backend: 'js' }
  }

  const simulation = runner.run({ processes, quantum, priorityStep, baseQuantum: quantum, queueCount })
  return { ...simulation, __backend: 'js' }
}
