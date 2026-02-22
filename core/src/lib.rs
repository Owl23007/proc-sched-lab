mod pcb;
mod schedulers;

use wasm_bindgen::prelude::*;

use pcb::{MlfqPayload, PriorityPayload, ProcessRuntime, SimulationResult};
use schedulers::{mlfq::run_mlfq, priority_rr::run_priority_rr};

#[wasm_bindgen]
pub fn simulate_priority_rr(payload: &str) -> String {
    let parsed = serde_json::from_str::<PriorityPayload>(payload);
    match parsed {
        Ok(input) => {
            let runtime = input
                .processes
                .into_iter()
                .map(|process| ProcessRuntime {
                    remaining_time: process.burst_time,
                    used_cpu_time: 0,
                    start_time: None,
                    finish_time: None,
                    queue_level: 0,
                    input: process,
                })
                .collect();

            to_json(run_priority_rr(runtime, input.quantum.max(1), input.priority_step.max(1)))
        }
        Err(error) => error_json(error.to_string()),
    }
}

#[wasm_bindgen]
pub fn simulate_mlfq(payload: &str) -> String {
    let parsed = serde_json::from_str::<MlfqPayload>(payload);
    match parsed {
        Ok(input) => {
            let runtime = input
                .processes
                .into_iter()
                .map(|process| ProcessRuntime {
                    remaining_time: process.burst_time,
                    used_cpu_time: 0,
                    start_time: None,
                    finish_time: None,
                    queue_level: 0,
                    input: process,
                })
                .collect();

            to_json(run_mlfq(runtime, input.base_quantum.max(1)))
        }
        Err(error) => error_json(error.to_string()),
    }
}

fn to_json(result: SimulationResult) -> String {
    serde_json::to_string(&result).unwrap_or_else(|error| error_json(error.to_string()))
}

fn error_json(message: String) -> String {
    format!("{{\"error\":\"{}\"}}", message.replace('"', "'"))
}
