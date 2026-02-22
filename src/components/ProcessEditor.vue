<script setup>
import { createProcess } from '../utils/pcb'

const props = defineProps({
  processes: { type: Array, required: true },
})

const emit = defineEmits(['update:processes'])

function update(index, key, value) {
  const next = props.processes.map((item, itemIndex) =>
    itemIndex === index
      ? {
          ...item,
          [key]: key === 'name' ? value : Number(value),
        }
      : item,
  )
  emit('update:processes', next)
}

function addProcess() {
  emit('update:processes', [...props.processes, createProcess()])
}

function removeProcess(index) {
  const next = props.processes.filter((_, itemIndex) => itemIndex !== index)
  emit('update:processes', next.length ? next : [createProcess({ id: 'P1', name: 'P1' })])
}
</script>

<template>
  <section class="panel">
    <div class="panel-header">
      <h3>进程配置</h3>
      <button class="btn" @click="addProcess">新增进程</button>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>名称</th>
          <th>到达时间</th>
          <th>运行时间</th>
          <th>优先级</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(process, index) in processes" :key="process.id">
          <td><input :value="process.name" @input="update(index, 'name', $event.target.value)" /></td>
          <td><input type="number" min="0" :value="process.arrival_time" @input="update(index, 'arrival_time', $event.target.value)" /></td>
          <td><input type="number" min="1" :value="process.burst_time" @input="update(index, 'burst_time', $event.target.value)" /></td>
          <td><input type="number" min="1" max="100" :value="process.priority" @input="update(index, 'priority', $event.target.value)" /></td>
          <td>
            <button class="btn ghost" @click="removeProcess(index)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
