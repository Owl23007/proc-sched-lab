<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
    snapshot: { type: Object, default: null },
    waitingQueue: { type: Array, default: () => [] },
    completedQueue: { type: Array, default: () => [] },
    debugMode: { type: Boolean, default: false },
})

const localReadyQueues = ref([])
const dragState = ref({ fromQueue: -1, fromIndex: -1 })
const latestTransitions = ref([])
const movedPids = ref([])
const previousSnapshot = ref(null)

const movedPidSet = computed(() => new Set(movedPids.value))
const queueSwitchRuleHint = computed(() => {
    if (localReadyQueues.value.length <= 1) {
        return '就绪队列变化时，会在这里显示迁移轨迹。'
    }
    return '切换逻辑：新到达进入 Q1，时间片耗尽未完成则降级，完成后进入完成队列。'
})

watch(
    () => props.snapshot,
    (value) => {
        localReadyQueues.value = (value?.ready_queues ?? []).map((queue) => [...queue])

        if (value && previousSnapshot.value && value.time > previousSnapshot.value.time) {
            const { transitions, touched } = collectQueueTransitions(previousSnapshot.value, value)
            latestTransitions.value = transitions.slice(0, 8)
            movedPids.value = touched
        } else {
            latestTransitions.value = []
            movedPids.value = []
        }

        previousSnapshot.value = value ?? null
    },
    { immediate: true },
)

function buildQueueMap(readyQueues = []) {
    const map = new Map()
    readyQueues.forEach((queue, queueIndex) => {
        queue.forEach((pid) => {
            map.set(pid, queueIndex)
        })
    })
    return map
}

function buildStateMap(snapshot) {
    const map = new Map()
        ; (snapshot?.processes ?? []).forEach((process) => {
            map.set(process.id, process.state)
        })
    return map
}

function queueLabel(queueIndex) {
    return `Q${queueIndex + 1}`
}

function collectQueueTransitions(prevSnapshot, nextSnapshot) {
    const prevQueueMap = buildQueueMap(prevSnapshot?.ready_queues ?? [])
    const nextQueueMap = buildQueueMap(nextSnapshot?.ready_queues ?? [])
    const prevStateMap = buildStateMap(prevSnapshot)
    const nextStateMap = buildStateMap(nextSnapshot)
    const transitions = []
    const touched = new Set()

    for (const [pid, fromQueue] of prevQueueMap.entries()) {
        const toQueue = nextQueueMap.get(pid)
        if (typeof toQueue === 'number') {
            if (toQueue !== fromQueue) {
                transitions.push(`${pid}: ${queueLabel(fromQueue)} -> ${queueLabel(toQueue)}`)
                touched.add(pid)
            }
            continue
        }

        const nextState = nextStateMap.get(pid)
        if (nextState === 'F') {
            transitions.push(`${pid}: ${queueLabel(fromQueue)} -> 完成队列`)
        } else if (nextState === 'W') {
            transitions.push(`${pid}: ${queueLabel(fromQueue)} -> 等待队列`)
        } else if (nextSnapshot.running === pid) {
            transitions.push(`${pid}: ${queueLabel(fromQueue)} -> CPU`)
        } else {
            transitions.push(`${pid}: ${queueLabel(fromQueue)} -> 离开就绪队列`)
        }
        touched.add(pid)
    }

    for (const [pid, toQueue] of nextQueueMap.entries()) {
        if (prevQueueMap.has(pid)) {
            continue
        }

        const prevState = prevStateMap.get(pid)
        if (prevState === 'W') {
            transitions.push(`${pid}: 等待队列 -> ${queueLabel(toQueue)}`)
        } else if (prevState === 'E' || prevSnapshot.running === pid) {
            transitions.push(`${pid}: CPU -> ${queueLabel(toQueue)}`)
        } else {
            transitions.push(`${pid}: 新到达 -> ${queueLabel(toQueue)}`)
        }
        touched.add(pid)
    }

    return {
        transitions,
        touched: Array.from(touched),
    }
}

function onDragStart(queueIndex, itemIndex) {
    if (!props.debugMode) {
        return
    }
    dragState.value = { fromQueue: queueIndex, fromIndex: itemIndex }
}

function onDrop(queueIndex, itemIndex) {
    if (!props.debugMode) {
        return
    }

    const fromQueue = dragState.value.fromQueue
    const fromIndex = dragState.value.fromIndex
    if (fromQueue < 0 || fromIndex < 0) {
        return
    }

    const source = localReadyQueues.value[fromQueue] ?? []
    const target = localReadyQueues.value[queueIndex] ?? []
    const [moved] = source.splice(fromIndex, 1)
    if (!moved) {
        dragState.value = { fromQueue: -1, fromIndex: -1 }
        return
    }

    let insertAt = Math.max(0, Math.min(itemIndex, target.length))
    if (fromQueue === queueIndex && fromIndex < insertAt) {
        insertAt -= 1
    }

    target.splice(insertAt, 0, moved)
    dragState.value = { fromQueue: -1, fromIndex: -1 }
}
</script>

<template>
    <section class="panel">
        <div class="panel-header">
            <h3>队列展示区</h3>
            <p v-if="snapshot" class="step-hint">t={{ snapshot.time }} · {{ debugMode ? '调试拖拽已开启' : '只读模式' }}</p>
        </div>

        <div v-if="snapshot" class="queue-wrap">
            <p>
                当前执行：
                <strong class="tag" :class="snapshot.running ? 'is-running' : 'is-idle'">
                    {{ snapshot.running ?? 'Idle' }}
                </strong>
            </p>

            <div class="queue-flow">
                <div v-if="latestTransitions.length" class="transition-list">
                    <span v-for="(item, index) in latestTransitions" :key="`${item}-${index}`"
                        class="event-chip transition-chip">
                        {{ item }}
                    </span>
                </div>
            </div>

            <div class="queues">
                <div v-for="(queue, queueIndex) in localReadyQueues" :key="queueIndex" class="queue-item">
                    <h4>就绪队列 Q{{ queueIndex + 1 }}</h4>
                    <TransitionGroup name="queue-token" tag="div" class="queue-list" @dragover.prevent
                        @drop="onDrop(queueIndex, queue.length)">
                        <span v-for="(pid, itemIndex) in queue" :key="pid" class="queue-token"
                            :class="{ 'is-moved': movedPidSet.has(pid), 'is-draggable': debugMode }"
                            :draggable="debugMode" @dragstart="onDragStart(queueIndex, itemIndex)" @dragover.prevent
                            @drop.stop="onDrop(queueIndex, itemIndex)">
                            {{ pid }}
                        </span>
                    </TransitionGroup>
                    <span v-if="!queue.length" class="placeholder">空</span>
                </div>
            </div>

            <div class="queue-aux-grid">
                <div class="queue-item">
                    <h4>等待队列</h4>
                    <p v-if="waitingQueue.length">
                        {{waitingQueue.map((item) => item.id).join(' · ')}}
                    </p>
                    <p v-else class="placeholder">空</p>
                </div>

                <div class="queue-item">
                    <h4>完成队列</h4>
                    <p v-if="completedQueue.length">{{completedQueue.map((item) => item.id).join(' → ')}}</p>
                    <p v-else class="placeholder">空</p>
                </div>
            </div>
        </div>

        <p v-else class="placeholder">暂无队列数据</p>
    </section>
</template>
