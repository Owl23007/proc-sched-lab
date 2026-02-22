# ⚙️ SchedLab — Intelligent Process Scheduling Simulation & Optimization Platform

**English** | [中文](./README.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Vue](https://img.shields.io/badge/Vue-3.x-42b883?logo=vuedotjs)](https://vuejs.org/)
[![Rust](https://img.shields.io/badge/Rust-1.70+-orange.svg?logo=rust)](https://www.rust-lang.org/)
[![WebAssembly](https://img.shields.io/badge/WASM-Ready-654FF0?logo=webassembly)](https://webassembly.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646cff?logo=vite)](https://vitejs.dev/)

---

## Introduction

**SchedLab** is a high-performance **process scheduling visualization and experimentation platform**. This project aims to solve the limitations of traditional scheduling demonstration tools, which often suffer from performance bottlenecks, lack of depth, and limited analytical capabilities.

By adopting **Rust + WebAssembly (WASM)** as a high-performance scheduling core and combining it with a modern **Vue 3** visual interface, SchedLab not only smoothly simulates concurrent scheduling of massive process sets but also introduces **intelligent workload analysis**, an **algorithm recommendation engine**, and a **pluggable scheduler architecture**. It provides an intuitive and powerful environment for researching, comparing, and optimizing OS scheduling strategies.

---

## Features

### 📋 Core Scheduling Simulation

- **Process Control Simulation**: Full PCB (Process Control Block) implementation with process name, priority, arrival time, required CPU time, used CPU time, and current state
- **Four-State Transition**: Visual state machine for Execute `E` / Ready `R` / Wait `W` / Finish `F`
- **Priority-based Round Robin (Priority RR)**:
  - Configurable process count, arrival time, burst time, and initial priority (1–100, lower = higher priority)
  - Configurable time quantum; priority degrades dynamically after each quantum (+2 / +3, configurable)
  - Preemption: a woken process with higher priority immediately preempts the running process
- **Multi-Level Feedback Queue (MLFQ)**:
  - 3 queues; time quantum doubles at each level
  - Demotion: a process exhausting its quantum is moved to the next lower queue
- **Dynamic Visualization**: At each scheduling event, shows Gantt chart, per-queue status, remaining time, and state of every process
- **Performance Statistics**: Start time, finish time, turnaround time per process; average turnaround time
- **Side-by-side Comparison**: Switch between algorithms for the same process set and compare metrics

### 🚀 Enhanced Analysis Features

- **High-Performance WASM Engine**: Rust-written scheduling core supporting ultra-fast simulation and parameter sweeps for large-scale process sets
- **Workload Fingerprinting**: Auto-classify the process set as CPU-bound, I/O-bound, or mixed
- **Rule-based Recommendation Engine**: Suggests the optimal algorithm with quantified estimates
  > *Example: "78% short jobs detected — Priority RR (small quantum) recommended; est. 20% lower avg. turnaround vs MLFQ"*
- **Pluggable Scheduler Interface**: Standard interface reserved for extending with SJF, CFS, or custom algorithms
- **Parameter Sweep Mode**: Fix the process set, batch-test different quantum sizes, and visualize results

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Vue 3 + Vite  UI Layer                  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ProcessEditor │  │  GanttChart  │  │  StatsPanel   │  │
│  └──────────────┘  └──────────────┘  └───────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  QueueView   │  │PCBStateMachine│  │ AdvisorPanel  │  │
│  └──────────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────┘
                     ↓  WASM Bindings (wasm-bindgen)
┌─────────────────────────────────────────────────────────┐
│            Scheduling Core Layer (Rust + WASM)           │
│  ┌─────────────────────────────────────────────────┐    │
│  │            Unified Scheduler Trait               │    │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │    │
│  │  │Priority  │  │  MLFQ   │  │  Plugin Slots  │  │    │
│  │  │   RR     │  │(3 queues)│  │ (SJF/CFS/...) │  │    │
│  │  └──────────┘  └──────────┘  └───────────────┘  │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ PCB Manager │  │  Workload   │  │  Stats Engine   │  │
│  │             │  │  Analyzer   │  │                 │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   Workload Layer                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   Built-in  │  │   Custom    │  │  Random Workload │  │
│  │   Presets   │  │   Input     │  │    Generator     │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Vue 3 + `<script setup>` | Composition API; reactive scheduling animation |
| Build | Vite 8 + wasm-pack | Fast HMR, auto-compiles Rust to WASM |
| State management | Pinia | Shared simulation state across components |
| Visualization | Canvas / SVG | Gantt chart, queue animations |
| Scheduling core | Rust + WebAssembly | Memory-safe, ultra-fast simulation, no backend |

---

## Algorithms

| Algorithm | Abbr. | Queues | Quantum Strategy | Preemption | Status |
|-----------|-------|--------|-----------------|------------|--------|
| Priority-based Round Robin | Priority RR | 1 | Fixed, configurable; priority degrades after each quantum | ✅ Priority preemption | ✅ Built-in |
| Multi-Level Feedback Queue | MLFQ | 3 | Q1:q, Q2:2q, Q3:4q (q configurable) | ✅ Inter-queue preemption | ✅ Built-in |
| Shortest Job First (ext.) | SJF | 1 | N/A | ❌ Non-preemptive | 🔌 Plugin slot |
| Completely Fair Scheduler (ext.) | CFS | 1 | Dynamic (virtual runtime) | ✅ | 🔌 Plugin slot |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- pnpm ≥ 9 (`npm install -g pnpm`)
- Rust Toolchain (`rustup`, `cargo`)
- wasm-pack (`cargo install wasm-pack`)

### Install & Run

```bash
# Clone the repo
git clone https://github.com/Owl23007/proc-sched-lab.git
cd proc-sched-lab

# Compile Rust core to WASM
cd core
wasm-pack build --target web

# Return to frontend dir and install dependencies
cd ../
pnpm install

# Start the dev server
pnpm dev
```

Open `http://localhost:5173` in your browser.

---

## Planned Directory Structure

```
proc-sched-lab/
├── core/                     # Rust WASM Core
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs            # WASM export interface
│       ├── pcb.rs            # PCB data structure
│       ├── schedulers/       # Algorithm implementations (Priority RR, MLFQ)
│       └── analyzer.rs       # Workload analysis & stats
│
├── src/                      # Vue Frontend
│   ├── main.js               # App entry point
│   ├── App.vue               # Root component
│   ├── wasm/                 # WASM binding wrappers
│   ├── stores/               # Pinia stores
│   ├── components/           # UI components (GanttChart, QueueView, etc.)
│   └── utils/                # Helpers
│
├── package.json
└── vite.config.js
```

---

## Roadmap

Please refer to [todo.md](./todo.md) for detailed development plans and progress.

---

## Contributing

Issues and Pull Requests are welcome. This project is MIT licensed — you are free to use, modify, and distribute it commercially, as long as the original copyright notice is retained in any derivative work.

---

## License

Copyright © 2026 [Owl23007](https://github.com/Owl23007)

Released under the [MIT License](./LICENSE).
