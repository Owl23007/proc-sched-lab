use crate::pcb::{ProcessMetric, ProcessRuntime, ProcessSnapshot, QueueSnapshot, SimulationResult, TickEvent};

pub fn run_priority_rr(mut processes: Vec<ProcessRuntime>, quantum: u32, priority_step: u32) -> SimulationResult {
    let mut time: u32 = 0;
    let mut ready: Vec<usize> = Vec::new();
    let mut arrived = vec![false; processes.len()];
    let mut completed = 0usize;
    let mut timeline = Vec::new();
    let mut snapshots = Vec::new();

    while completed < processes.len() {
        enqueue_new_arrivals(&processes, &mut arrived, &mut ready, time);

        if ready.is_empty() {
            time += 1;
            continue;
        }

        ready.sort_by(|a, b| {
            processes[*a]
                .input
                .priority
                .cmp(&processes[*b].input.priority)
                .then(processes[*a].input.arrival_time.cmp(&processes[*b].input.arrival_time))
                .then(processes[*a].input.id.cmp(&processes[*b].input.id))
        });

        let current = ready.remove(0);
        let start = time;

        if processes[current].start_time.is_none() {
            processes[current].start_time = Some(start);
        }

        let run_for = quantum.min(processes[current].remaining_time.max(1));
        processes[current].remaining_time -= run_for;
        processes[current].used_cpu_time += run_for;
        time += run_for;

        enqueue_arrivals_between(&processes, &mut arrived, &mut ready, start + 1, time);

        timeline.push(TickEvent {
            start,
            end: time,
            process_id: processes[current].input.id.clone(),
            process_name: processes[current].input.name.clone(),
            queue_level: 0,
        });

        if processes[current].remaining_time == 0 {
            processes[current].finish_time = Some(time);
            completed += 1;
        } else {
            processes[current].input.priority += priority_step;
            ready.push(current);
        }

        snapshots.push(build_snapshot(time, Some(&processes[current].input.id), &ready, &processes));
    }

    build_result(processes, timeline, snapshots, time)
}

fn enqueue_new_arrivals(processes: &[ProcessRuntime], arrived: &mut [bool], ready: &mut Vec<usize>, time: u32) {
    for (idx, process) in processes.iter().enumerate() {
        if !arrived[idx] && process.input.arrival_time <= time {
            arrived[idx] = true;
            ready.push(idx);
        }
    }
}

fn enqueue_arrivals_between(
    processes: &[ProcessRuntime],
    arrived: &mut [bool],
    ready: &mut Vec<usize>,
    start_exclusive: u32,
    end_inclusive: u32,
) {
    for (idx, process) in processes.iter().enumerate() {
        if !arrived[idx]
            && process.input.arrival_time > start_exclusive - 1
            && process.input.arrival_time <= end_inclusive
        {
            arrived[idx] = true;
            ready.push(idx);
        }
    }
}

fn build_snapshot(
    time: u32,
    running: Option<&str>,
    ready: &[usize],
    processes: &[ProcessRuntime],
) -> QueueSnapshot {
    let ready_queue = ready
        .iter()
        .map(|index| processes[*index].input.id.clone())
        .collect::<Vec<_>>();

    let process_states = processes
        .iter()
        .map(|process| {
            let state = if process.remaining_time == 0 {
                "F"
            } else if running == Some(process.input.id.as_str()) {
                "E"
            } else if process.input.arrival_time <= time {
                "R"
            } else {
                "W"
            };

            ProcessSnapshot {
                id: process.input.id.clone(),
                name: process.input.name.clone(),
                state: state.to_string(),
                remaining_time: process.remaining_time,
                used_cpu_time: process.used_cpu_time,
                priority: process.input.priority,
                queue_level: 0,
            }
        })
        .collect();

    QueueSnapshot {
        time,
        running: running.map(|s| s.to_string()),
        ready_queues: vec![ready_queue],
        processes: process_states,
    }
}

fn build_result(
    processes: Vec<ProcessRuntime>,
    timeline: Vec<TickEvent>,
    snapshots: Vec<QueueSnapshot>,
    total_time: u32,
) -> SimulationResult {
    let metrics = processes
        .iter()
        .filter_map(|p| match (p.start_time, p.finish_time) {
            (Some(start), Some(finish)) => Some(ProcessMetric {
                id: p.input.id.clone(),
                name: p.input.name.clone(),
                start_time: start,
                finish_time: finish,
                turnaround_time: finish - p.input.arrival_time,
            }),
            _ => None,
        })
        .collect::<Vec<_>>();

    let average_turnaround_time = if metrics.is_empty() {
        0.0
    } else {
        metrics.iter().map(|m| m.turnaround_time as f64).sum::<f64>() / metrics.len() as f64
    };

    SimulationResult {
        timeline,
        snapshots,
        metrics,
        average_turnaround_time,
        total_time,
    }
}
