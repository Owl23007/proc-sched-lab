import { runMLFQ } from './mlfq'
import { runPriorityRR } from './priorityRR'
import { runFCFS } from './fcfs'
import { runSJF } from './sjf'

export const ALGORITHMS = {
    priority_rr: {
        key: 'priority_rr',
        label: 'Priority RR',
        run: ({ processes, quantum, priorityStep }) => runPriorityRR(processes, quantum, priorityStep),
    },
    mlfq: {
        key: 'mlfq',
        label: 'MLFQ',
        run: ({ processes, baseQuantum, queueCount }) => runMLFQ(processes, baseQuantum, queueCount),
    },
    fcfs: {
        key: 'fcfs',
        label: 'FCFS',
        run: ({ processes }) => runFCFS(processes),
    },
    sjf: {
        key: 'sjf',
        label: 'SJF',
        run: ({ processes }) => runSJF(processes),
    },
}
