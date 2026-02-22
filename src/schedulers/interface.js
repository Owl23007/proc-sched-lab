import { runMLFQ } from './mlfq'
import { runPriorityRR } from './priorityRR'

export const ALGORITHMS = {
    priority_rr: {
        key: 'priority_rr',
        label: 'Priority RR',
        run: ({ processes, quantum, priorityStep }) => runPriorityRR(processes, quantum, priorityStep),
    },
    mlfq: {
        key: 'mlfq',
        label: 'MLFQ',
        run: ({ processes, baseQuantum }) => runMLFQ(processes, baseQuantum),
    },
}
