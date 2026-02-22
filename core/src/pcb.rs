use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessInput {
    pub id: String,
    pub name: String,
    pub arrival_time: u32,
    pub burst_time: u32,
    pub priority: u32,
}

#[derive(Debug, Clone)]
pub struct ProcessRuntime {
    pub input: ProcessInput,
    pub remaining_time: u32,
    pub used_cpu_time: u32,
    pub start_time: Option<u32>,
    pub finish_time: Option<u32>,
    pub queue_level: usize,
}

#[derive(Debug, Clone, Serialize)]
pub struct ProcessSnapshot {
    pub id: String,
    pub name: String,
    pub state: String,
    pub remaining_time: u32,
    pub used_cpu_time: u32,
    pub priority: u32,
    pub queue_level: usize,
}

#[derive(Debug, Clone, Serialize)]
pub struct TickEvent {
    pub start: u32,
    pub end: u32,
    pub process_id: String,
    pub process_name: String,
    pub queue_level: usize,
}

#[derive(Debug, Clone, Serialize)]
pub struct QueueSnapshot {
    pub time: u32,
    pub running: Option<String>,
    pub ready_queues: Vec<Vec<String>>,
    pub processes: Vec<ProcessSnapshot>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ProcessMetric {
    pub id: String,
    pub name: String,
    pub start_time: u32,
    pub finish_time: u32,
    pub turnaround_time: u32,
}

#[derive(Debug, Clone, Serialize)]
pub struct SimulationResult {
    pub timeline: Vec<TickEvent>,
    pub snapshots: Vec<QueueSnapshot>,
    pub metrics: Vec<ProcessMetric>,
    pub average_turnaround_time: f64,
    pub total_time: u32,
}

#[derive(Debug, Clone, Deserialize)]
pub struct PriorityPayload {
    pub processes: Vec<ProcessInput>,
    pub quantum: u32,
    pub priority_step: u32,
}

#[derive(Debug, Clone, Deserialize)]
pub struct MlfqPayload {
    pub processes: Vec<ProcessInput>,
    pub base_quantum: u32,
}
