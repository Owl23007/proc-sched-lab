# 🗺️ SchedLab 开发路线图 / Roadmap

## v0.1 — 核心调度引擎 (Core Scheduling Engine)

- [x] **Rust 核心层**
  - [x] PCB 数据结构与状态机 (`pcb.rs`)
  - [x] 统一调度器 Trait 接口 (`schedulers/mod.rs`)
  - [x] Priority RR 调度算法核心 (`schedulers/priority_rr.rs`)
  - [x] MLFQ 三级队列调度算法核心 (`schedulers/mlfq.rs`)
  - [x] WASM 绑定与导出 (`lib.rs`)
- [x] **Vue 前端层**
  - [x] WASM 模块加载与封装 (`src/wasm/`)
  - [x] 进程参数输入界面 (`ProcessEditor.vue`)
  - [x] 甘特图动态渲染 (`GanttChart.vue`)
  - [x] 队列状态可视化 (`QueueView.vue`)
  - [x] 统计面板 + 双算法对比 (`StatsPanel.vue` / `ComparePanel.vue`)

## v0.2 — 扩展架构与生态 (Extensible Architecture & Ecosystem)

- [x] **Rust 核心层**
  - [x] SJF (短作业优先) 算法插件实现
  - [x] CFS (完全公平调度) 算法插件实现
- [x] **Vue 前端层**
  - [x] 导出功能

## v0.3 — 界面美化专项 (UI Redesign Sprint)

- [x] **设计文档与规范**
  - [x] 界面美化设计文档（`docs/ui-redesign-plan.md`）
  - [x] 设计令牌映射与主题规范落地
- [x] **核心区域改造**
  - [x] Header 信息层级与参数分组
  - [x] 播放控制主操作链重构
  - [x] 甘特图与队列区可读性优化
- [x] **细节与验收**
  - [x] 右侧详情与统计面板信息卡片化
  - [x] 可访问性与视觉一致性回归
