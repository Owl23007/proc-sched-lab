use std::collections::VecDeque;

use crate::pcb::{ProcessMetric, ProcessRuntime, ProcessSnapshot, QueueSnapshot, SimulationResult, TickEvent};

pub fn run_mlfq(mut processes: Vec<ProcessRuntime>, base_quantum: u32) -> SimulationResult {
    let quantums = [base_quantum.max(1), (base_quantum.max(1)) * 2, (base_quantum.max(1)) * 4];
    let mut queues: [VecDeque<usize>; 3] = [VecDeque::new(), VecDeque::new(), VecDeque::new()];
    let mut arrived = vec![false; processes.len()];
    let mut timeline = Vec::new();
    let mut snapshots = Vec::new();
    let mut completed = 0usize;
    let mut time = 0u32;

    while completed < processes.len() {
        enqueue_new_arrivals(&processes, &mut arrived, &mut queues[0], time);

        let Some((level, current)) = pop_next(&mut queues) else {
            time += 1;
            continue;
        };

        let start = time;
        processes[current].queue_level = level;

        if processes[current].start_time.is_none() {
            processes[current].start_time = Some(start);
        }

        let run_for = quantums[level].min(processes[current].remaining_time.max(1));
        processes[current].remaining_time -= run_for;
        processes[current].used_cpu_time += run_for;
        time += run_for;

        enqueue_arrivals_between(&processes, &mut arrived, &mut queues[0], start + 1, time);

        timeline.push(TickEvent {
            start,
            end: time,
            process_id: processes[current].input.id.clone(),
            process_name: processes[current].input.name.clone(),
            queue_level: level,
        });

        if processes[current].remaining_time == 0 {
            processes[current].finish_time = Some(time);
            completed += 1;
        } else {
            let next_level = (level + 1).min(2);
            processes[current].queue_level = next_level;
            queues[next_level].push_back(current);
        }

        snapshots.push(build_snapshot(time, Some(&processes[current].input.id), &queues, &processes));
    }

    build_result(processes, timeline, snapshots, time)
}

fn pop_next(queues: &mut [VecDeque<usize>; 3]) -> Option<(usize, usize)> {
    for (level, queue) in queues.iter_mut().enumerate() {
        if let Some(idx) = queue.pop_front() {
            return Some((level, idx));
        }
    }
    None
}

fn enqueue_new_arrivals(
    processes: &[ProcessRuntime],
    arrived: &mut [bool],
    queue0: &mut VecDeque<usize>,
    time: u32,
) {
    for (idx, process) in processes.iter().enumerate() {
        if !arrived[idx] && process.input.arrival_time <= time {
            arrived[idx] = true;
            queue0.push_back(idx);
        }
    }
}

fn enqueue_arrivals_between(
    processes: &[ProcessRuntime],
    arrived: &mut [bool],
    queue0: &mut VecDeque<usize>,
    start_exclusive: u32,
    end_inclusive: u32,
) {
    for (idx, process) in processes.iter().enumerate() {
        if !arrived[idx]
            && process.input.arrival_time > start_exclusive - 1
            && process.input.arrival_time <= end_inclusive
        {
            arrived[idx] = true;
            queue0.push_back(idx);
        }
    }
}

fn build_snapshot(
    time: u32,
    running: Option<&str>,
    queues: &[VecDeque<usize>; 3],
    processes: &[ProcessRuntime],
) -> QueueSnapshot {
    let ready_queues = queues
        .iter()
        .map(|queue| {
            queue
                .iter()
                .map(|index| processes[*index].input.id.clone())
                .collect::<Vec<_>>()
        })
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
                queue_level: process.queue_level,
            }
        })
        .collect();

    QueueSnapshot {
        time,
        running: running.map(|s| s.to_string()),
        ready_queues,
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
