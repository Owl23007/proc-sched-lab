import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
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
  const isPlaying = ref(false)
  const currentStep = ref(0)
  const playbackSpeed = ref(1)
  let playTimer = null

  const maxStep = computed(() => {
    const snapshots = result.value?.snapshots ?? []
    return snapshots.length ? snapshots.length - 1 : 0
  })

  const currentSnapshot = computed(() => {
    const snapshots = result.value?.snapshots ?? []

    if (!snapshots.length) {
      return null
    }

    return snapshots[Math.min(currentStep.value, snapshots.length - 1)]
  })

  const currentTime = computed(() => currentSnapshot.value?.time ?? 0)

  const visibleTimeline = computed(() => {
    const timeline = result.value?.timeline ?? []
    const time = currentTime.value

    if (!timeline.length) {
      return []
    }

    return timeline
      .filter((item) => item.start < time)
      .map((item) => ({
        ...item,
        end: Math.min(item.end, time),
      }))
      .filter((item) => item.end > item.start)
  })

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
    pausePlayback()
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
        currentStep.value = 0
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
    pausePlayback()
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

  function clearPlayTimer() {
    if (playTimer) {
      clearInterval(playTimer)
      playTimer = null
    }
  }

  function stepNext() {
    if (!result.value?.snapshots?.length) {
      return
    }

    if (currentStep.value >= maxStep.value) {
      pausePlayback()
      return
    }

    currentStep.value += 1
  }

  function stepPrev() {
    if (!result.value?.snapshots?.length) {
      return
    }

    currentStep.value = Math.max(0, currentStep.value - 1)
  }

  function seek(step) {
    if (!result.value?.snapshots?.length) {
      return
    }

    const nextStep = Number(step)
    currentStep.value = Math.min(maxStep.value, Math.max(0, Number.isNaN(nextStep) ? 0 : nextStep))
  }

  function startPlayTimer() {
    clearPlayTimer()
    const interval = Math.max(60, Math.floor(1000 / playbackSpeed.value))
    playTimer = setInterval(() => {
      stepNext()
    }, interval)
  }

  function play() {
    if (!result.value?.snapshots?.length) {
      return
    }

    if (currentStep.value >= maxStep.value) {
      currentStep.value = 0
    }

    isPlaying.value = true
    startPlayTimer()
  }

  function pausePlayback() {
    isPlaying.value = false
    clearPlayTimer()
  }

  function togglePlay() {
    if (isPlaying.value) {
      pausePlayback()
      return
    }

    play()
  }

  function setPlaybackSpeed(speed) {
    const parsed = Number(speed)
    playbackSpeed.value = Number.isNaN(parsed) ? 1 : Math.min(8, Math.max(0.25, parsed))

    if (isPlaying.value) {
      startPlayTimer()
    }
  }

  function resetPlayback() {
    pausePlayback()
    currentStep.value = 0
  }

  watch(result, () => {
    resetPlayback()
  })

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
    isPlaying,
    currentStep,
    maxStep,
    playbackSpeed,
    currentSnapshot,
    currentTime,
    visibleTimeline,
    averageTurnaround,
    runOnce,
    runComparison,
    play,
    pausePlayback,
    togglePlay,
    stepNext,
    stepPrev,
    seek,
    setPlaybackSpeed,
    resetPlayback,
  }
})
