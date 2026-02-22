import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { defaultProcesses } from '../utils/pcb'
import { runSimulation } from '../wasm/scheduler'

export const useSimulationStore = defineStore('simulation', () => {
  const processes = ref(defaultProcesses())
  const algorithm = ref('priority_rr')
  const quantum = ref(2)
  const priorityStep = ref(2)
  const result = ref(null)
  const compareResult = ref(null)
  const backend = ref('unknown')
  const isRunning = ref(false)
  const error = ref('')

  const averageTurnaround = computed(() => result.value?.average_turnaround_time ?? 0)
  const backendDisplay = computed(() => {
    if (backend.value === 'wasm') {
      return 'WASM'
    }

    if (backend.value === 'js') {
      return 'JS'
    }

    if (backend.value === 'mixed') {
      return 'WASM + JS'
    }

    return '未知'
  })

  async function runOnce(selectedAlgorithm = algorithm.value) {
    isRunning.value = true
    error.value = ''

    try {
      const simulation = await runSimulation({
        algorithm: selectedAlgorithm,
        processes: processes.value,
        quantum: Number(quantum.value),
        priorityStep: Number(priorityStep.value),
      })

      if (simulation.error) {
        throw new Error(simulation.error)
      }

      if (selectedAlgorithm === algorithm.value) {
        result.value = simulation
        backend.value = simulation.__backend ?? 'unknown'
      }

      return simulation
    } catch (e) {
      error.value = e.message
      backend.value = 'unknown'
      return null
    } finally {
      isRunning.value = false
    }
  }

  async function runComparison() {
    const [priority, mlfq] = await Promise.all([
      runSimulation({ algorithm: 'priority_rr', processes: processes.value, quantum: Number(quantum.value), priorityStep: Number(priorityStep.value) }),
      runSimulation({ algorithm: 'mlfq', processes: processes.value, quantum: Number(quantum.value), priorityStep: Number(priorityStep.value) }),
    ])

    compareResult.value = { priority, mlfq }

    if (priority?.__backend && priority.__backend === mlfq?.__backend) {
      backend.value = priority.__backend
    } else {
      backend.value = 'mixed'
    }
  }

  return {
    processes,
    algorithm,
    quantum,
    priorityStep,
    result,
    compareResult,
    backend,
    backendDisplay,
    isRunning,
    error,
    averageTurnaround,
    runOnce,
    runComparison,
  }
})
