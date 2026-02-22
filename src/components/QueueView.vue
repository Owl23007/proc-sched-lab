<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
    snapshot: { type: Object, default: null },
    waitingQueue: { type: Array, default: () => [] },
    completedQueue: { type: Array, default: () => [] },
    debugMode: { type: Boolean, default: false },
})

const localReadyQueues = ref([])
const dragState = ref({ fromQueue: -1, fromIndex: -1 })

watch(
    () => props.snapshot,
    (value) => {
        localReadyQueues.value = (value?.ready_queues ?? []).map((queue) => [...queue])
    },
    { immediate: true },
)

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
        return
    }
    target.splice(itemIndex, 0, moved)
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

            <div class="queues">
                <div v-for="(queue, queueIndex) in localReadyQueues" :key="queueIndex" class="queue-item">
                    <h4>就绪队列 Q{{ queueIndex + 1 }}</h4>
                    <div class="queue-list">
                        <span v-for="(pid, itemIndex) in queue" :key="`${pid}-${itemIndex}`" class="queue-token"
                            draggable="true" @dragstart="onDragStart(queueIndex, itemIndex)" @dragover.prevent
                            @drop="onDrop(queueIndex, itemIndex)">
                            {{ pid }}
                        </span>
                        <span v-if="!queue.length" class="placeholder">空</span>
                    </div>
                </div>
            </div>

            <div class="queue-aux-grid">
                <div class="queue-item">
                    <h4>等待队列</h4>
                    <p v-if="waitingQueue.length">{{waitingQueue.map((item) => `${item.id}(未到达/等待)`).join(' · ')}}
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
