<script setup>
/**
 * ControlBar — 算法参数面板
 * 负责算法选择 + 时间片 / 队列数 / 优先级衰减滑块 + 时间标尺 + 调试开关
 * App-local 状态（zoom / debugMode）通过 v-model 传入，其余参数直接读写 simulation store
 */
import { useSimulationStore } from '../stores/simulation'

const props = defineProps({
    zoom: { type: Number, default: 10 },
    debugMode: { type: Boolean, default: false },
})

const emit = defineEmits(['update:zoom', 'update:debugMode'])

const simulation = useSimulationStore()
</script>

<template>
    <div class="ctrl-row">
        <label>
            算法
            <select v-model="simulation.algorithm">
                <option v-for="item in simulation.algorithms" :key="item.key" :value="item.key">
                    {{ item.label }}
                </option>
            </select>
        </label>

        <label>
            时间片
            <input v-model.number="simulation.quantum" type="number" min="1" class="input-short" />
        </label>

        <label>
            队列数
            <input v-model.number="simulation.queueCount" type="number" min="1" max="6" class="input-short" />
        </label>

        <label>
            优先级衰减
            <input v-model.number="simulation.priorityDecay" type="number" min="1" class="input-short" />
        </label>

        <label>
            时间标尺
            <select :value="zoom" @change="emit('update:zoom', Number($event.target.value))">
                <option :value="10">10ms</option>
                <option :value="50">50ms</option>
                <option :value="100">100ms</option>
            </select>
        </label>

        <label>
            调试模式
            <select
                :value="debugMode"
                @change="emit('update:debugMode', $event.target.value === 'true')"
            >
                <option :value="false">关闭</option>
                <option :value="true">开启</option>
            </select>
        </label>
    </div>
</template>
