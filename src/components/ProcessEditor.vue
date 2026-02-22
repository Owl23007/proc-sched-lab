<script setup>
import { computed, reactive, ref } from 'vue'
import { createProcess } from '../utils/pcb'
import ModalDialog from './ModalDialog.vue'

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
const showFilters = ref(false)
const showAddForm = ref(false)
const showImportModal = ref(false)

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

    return props.processes
        .map((process, sourceIndex) => ({ process, sourceIndex }))
        .filter(({ process }) => {
            const state = props.stateMap.get(process.id) ?? 'W'
            const matchesKeyword =
                !keyword || String(process.id).toLowerCase().includes(keyword) || String(process.name).toLowerCase().includes(keyword)
            const matchesState = stateFilter.value === 'all' || state === stateFilter.value
            const matchesPriority = process.priority >= min && process.priority <= max
            return matchesKeyword && matchesState && matchesPriority
        })
})

function update(index, key, value) {
    if (index < 0 || index >= props.processes.length) {
        return
    }

    const isTextField = key === 'name' || key === 'id'
    const normalizedValue = isTextField ? String(value) : Number(value)
    const safeValue = Number.isNaN(normalizedValue) ? props.processes[index][key] : normalizedValue

    const next = props.processes.map((item, itemIndex) =>
        itemIndex === index
            ? {
                ...item,
                [key]: safeValue,
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
        showImportModal.value = false
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

        <!-- Compact toolbar: search + action buttons -->
        <div class="editor-toolbar">
            <input v-model="search" placeholder="🔍 搜索 PID / 名称" class="search-input" />
            <button class="btn ghost btn-sm" :class="{ active: showFilters }" @click="showFilters = !showFilters"
                title="筛选">⚙ 筛选</button>
            <button class="btn ghost btn-sm" :class="{ active: showAddForm }" @click="showAddForm = !showAddForm"
                title="添加进程">＋ 添加</button>
            <button class="btn ghost btn-sm" @click="showImportModal = true" title="批量导入">📄 导入</button>
        </div>

        <!-- Collapsible filters -->
        <div class="collapse-section" :class="{ open: showFilters }">
            <div class="filter-row">
                <label>
                    状态
                    <select v-model="stateFilter">
                        <option v-for="item in stateOptions" :key="item.value" :value="item.value">{{ item.label }}
                        </option>
                    </select>
                </label>
                <label>
                    优先级 ≥
                    <input v-model.number="minPriority" type="number" min="1" class="input-short" />
                </label>
                <label>
                    优先级 ≤
                    <input v-model.number="maxPriority" type="number" min="1" class="input-short" />
                </label>
            </div>
        </div>

        <!-- Collapsible add form -->
        <div class="collapse-section" :class="{ open: showAddForm }">
            <div class="add-form-row">
                <input v-model="form.id" placeholder="PID" class="input-short" />
                <input v-model="form.name" placeholder="名称" class="input-short" />
                <input v-model.number="form.priority" type="number" min="1" placeholder="优先级" class="input-tiny" />
                <input v-model.number="form.arrival_time" type="number" min="0" placeholder="到达" class="input-tiny" />
                <input v-model.number="form.burst_time" type="number" min="1" placeholder="服务" class="input-tiny" />
                <button class="btn btn-sm" @click="addProcess">添加</button>
            </div>
        </div>

        <!-- Process table -->
        <div class="table-wrap">
            <table class="table process-table">
                <thead>
                    <tr>
                        <th>PID</th>
                        <th>名称</th>
                        <th>优先级</th>
                        <th>到达</th>
                        <th>服务</th>
                        <th>状态</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="row in filteredProcesses" :key="`${row.process.id}-${row.sourceIndex}`"
                        :class="{ selected: row.process.id === selectedProcessId }"
                        @click="emit('select', row.process.id)">
                        <td><input :value="row.process.id" @input="update(row.sourceIndex, 'id', $event.target.value)"
                                @click.stop /></td>
                        <td><input :value="row.process.name"
                                @input="update(row.sourceIndex, 'name', $event.target.value)" @click.stop /></td>
                        <td><input type="number" min="1" max="100" :value="row.process.priority"
                                @input="update(row.sourceIndex, 'priority', $event.target.value)" @click.stop /></td>
                        <td><input type="number" min="0" :value="row.process.arrival_time"
                                @input="update(row.sourceIndex, 'arrival_time', $event.target.value)" @click.stop />
                        </td>
                        <td><input type="number" min="1" :value="row.process.burst_time"
                                @input="update(row.sourceIndex, 'burst_time', $event.target.value)" @click.stop /></td>
                        <td><span class="status-chip">{{ statusLabel(row.process.id) }}</span></td>
                        <td><button class="btn ghost btn-sm" @click.stop="removeProcess(row.sourceIndex)">✕</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- JSON Import Modal -->
        <ModalDialog :open="showImportModal" title="批量导入 JSON" @close="showImportModal = false">
            <textarea v-model="bulkJson" rows="8" class="import-textarea"
                placeholder='[{"id":"P1","name":"P1","arrival_time":0,"burst_time":5,"priority":2}]' />
            <span v-if="importError" class="error-inline">{{ importError }}</span>
            <template #footer>
                <button class="btn ghost" @click="showImportModal = false">取消</button>
                <button class="btn" @click="importJson">导入覆盖</button>
            </template>
        </ModalDialog>
    </section>
</template>

<style scoped>
.editor-toolbar {
    display: flex;
    gap: 6px;
    align-items: center;
}

.search-input {
    flex: 1;
    min-width: 0;
}

.filter-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: flex-end;
    padding: 8px;
    background: color-mix(in srgb, var(--bg-soft), transparent 12%);
    border: 1px solid var(--border-soft);
    border-radius: 8px;
}

.add-form-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    padding: 8px;
    background: color-mix(in srgb, var(--bg-soft), transparent 12%);
    border: 1px solid var(--border-soft);
    border-radius: 8px;
}

.add-form-row input {
    flex: 1;
    min-width: 50px;
}

.input-tiny {
    width: 48px;
    flex: 0 0 48px !important;
}

.import-textarea {
    width: 100%;
    font-family: monospace;
    font-size: 12px;
    resize: vertical;
    border: 1px solid var(--border-main);
    border-radius: 8px;
    padding: 8px;
    background: var(--bg-input);
    color: var(--text-main);
}

.btn-sm.active {
    background: var(--accent-soft);
    border-color: var(--accent);
    color: var(--accent);
}

.collapse-section {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.25s ease;
    overflow: hidden;
}

.collapse-section>* {
    overflow: hidden;
    min-height: 0;
}

.collapse-section.open {
    grid-template-rows: 1fr;
}
</style>
