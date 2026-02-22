<script setup>
import { computed, reactive, ref } from 'vue'
import { createProcess } from '../utils/pcb'

const props = defineProps({
    processes: { type: Array, required: true },
    stateMap: { type: Object, default: () => new Map() },
    selectedProcessId: { type: String, default: '' },
})

const emit = defineEmits(['update:processes', 'select'])

const form = reactive({
    id: '',
    name: '',
    arrival_time: 0,
    burst_time: 5,
    priority: 10,
})

const search = ref('')
const stateFilter = ref('all')
const minPriority = ref('')
const maxPriority = ref('')
const bulkJson = ref('')
const importError = ref('')

const stateOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'E', label: '🟢 执行' },
    { value: 'R', label: '🟡 就绪' },
    { value: 'W', label: '🔵 等待' },
    { value: 'F', label: '⚪ 完成' },
]

const filteredProcesses = computed(() => {
    const keyword = search.value.trim().toLowerCase()
    const min = minPriority.value === '' ? Number.NEGATIVE_INFINITY : Number(minPriority.value)
    const max = maxPriority.value === '' ? Number.POSITIVE_INFINITY : Number(maxPriority.value)

    return props.processes.filter((process) => {
        const state = props.stateMap.get(process.id) ?? 'W'
        const matchesKeyword =
            !keyword || String(process.id).toLowerCase().includes(keyword) || String(process.name).toLowerCase().includes(keyword)
        const matchesState = stateFilter.value === 'all' || state === stateFilter.value
        const matchesPriority = process.priority >= min && process.priority <= max
        return matchesKeyword && matchesState && matchesPriority
    })
})

function update(index, key, value) {
    const next = props.processes.map((item, itemIndex) =>
        itemIndex === index
            ? {
                ...item,
                [key]: key === 'name' || key === 'id' ? String(value) : Number(value),
            }
            : item,
    )
    emit('update:processes', next)
}

function addProcess() {
    const process = createProcess({
        id: form.id || undefined,
        name: form.name || undefined,
        arrival_time: Number(form.arrival_time),
        burst_time: Number(form.burst_time),
        priority: Number(form.priority),
    })

    emit('update:processes', [...props.processes, process])
    form.id = ''
    form.name = ''
    form.arrival_time = 0
    form.burst_time = 5
    form.priority = 10
}

function removeProcess(index) {
    const next = props.processes.filter((_, itemIndex) => itemIndex !== index)
    emit('update:processes', next.length ? next : [createProcess({ id: 'P1', name: 'P1' })])
}

function importJson() {
    importError.value = ''
    try {
        const parsed = JSON.parse(bulkJson.value)
        if (!Array.isArray(parsed)) {
            throw new Error('JSON 必须是数组')
        }

        const imported = parsed.map((item) => createProcess(item))
        emit('update:processes', imported)
        bulkJson.value = ''
    } catch (error) {
        importError.value = error.message
    }
}

function statusLabel(processId) {
    const state = props.stateMap.get(processId) ?? 'W'
    if (state === 'E') {
        return '🟢 执行'
    }
    if (state === 'R') {
        return '🟡 就绪'
    }
    if (state === 'F') {
        return '⚪ 完成'
    }
    return '🔵 等待'
}
</script>

<template>
    <section class="panel process-panel">
        <div class="panel-header">
            <h3>进程管理区</h3>
            <span class="step-hint">共 {{ filteredProcesses.length }} / {{ processes.length }} 个进程</span>
        </div>

        <div class="toolbar-wrap">
            <label>
                搜索
                <input v-model="search" placeholder="PID / 名称" />
            </label>
            <label>
                状态
                <select v-model="stateFilter">
                    <option v-for="item in stateOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
                </select>
            </label>
            <label>
                优先级最小
                <input v-model.number="minPriority" type="number" min="1" />
            </label>
            <label>
                优先级最大
                <input v-model.number="maxPriority" type="number" min="1" />
            </label>
        </div>

        <table class="table">
            <thead>
                <tr>
                    <th>PID</th>
                    <th>名称</th>
                    <th>优先级</th>
                    <th>到达时间</th>
                    <th>服务时间</th>
                    <th>状态</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="process in filteredProcesses" :key="process.id"
                    :class="{ selected: process.id === selectedProcessId }" @click="emit('select', process.id)">
                    <td><input :value="process.id"
                            @input="update(processes.findIndex((item) => item.id === process.id), 'id', $event.target.value)" />
                    </td>
                    <td><input :value="process.name"
                            @input="update(processes.findIndex((item) => item.id === process.id), 'name', $event.target.value)" />
                    </td>
                    <td><input type="number" min="1" max="100" :value="process.priority"
                            @input="update(processes.findIndex((item) => item.id === process.id), 'priority', $event.target.value)" />
                    </td>
                    <td><input type="number" min="0" :value="process.arrival_time"
                            @input="update(processes.findIndex((item) => item.id === process.id), 'arrival_time', $event.target.value)" />
                    </td>
                    <td><input type="number" min="1" :value="process.burst_time"
                            @input="update(processes.findIndex((item) => item.id === process.id), 'burst_time', $event.target.value)" />
                    </td>
                    <td><span class="status-chip">{{ statusLabel(process.id) }}</span></td>
                    <td><button class="btn ghost"
                            @click.stop="removeProcess(processes.findIndex((item) => item.id === process.id))">删除</button>
                    </td>
                </tr>
            </tbody>
        </table>

        <div class="panel-inner editor-grid">
            <div>
                <h4>添加进程</h4>
                <div class="toolbar-wrap">
                    <label>PID<input v-model="form.id" placeholder="可选" /></label>
                    <label>名称<input v-model="form.name" placeholder="可选" /></label>
                    <label>优先级<input v-model.number="form.priority" type="number" min="1" /></label>
                    <label>到达<input v-model.number="form.arrival_time" type="number" min="0" /></label>
                    <label>服务<input v-model.number="form.burst_time" type="number" min="1" /></label>
                    <button class="btn" @click="addProcess">添加</button>
                </div>
            </div>

            <div>
                <h4>批量导入 JSON</h4>
                <textarea v-model="bulkJson" rows="5"
                    placeholder='[{"id":"P1","name":"P1","arrival_time":0,"burst_time":5,"priority":2}]' />
                <div class="toolbar-wrap">
                    <button class="btn ghost" @click="importJson">导入覆盖</button>
                    <span v-if="importError" class="error-inline">{{ importError }}</span>
                </div>
            </div>
        </div>
    </section>
</template>
