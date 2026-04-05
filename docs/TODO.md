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

## v0.2 — 智能分析与增强 (Intelligent Analysis & Enhancement)

- [ ] **Rust 核心层**
  - [ ] 负载特征分析器 (`analyzer.rs`)
  - [ ] 性能指标统计引擎
- [ ] **Vue 前端层**
  - [ ] 基于规则的算法推荐引擎面板 (`AdvisorPanel.vue`)
  - [ ] 内置多种典型预设场景 (`presets.js`)
  - [ ] 参数敏感性实验模式（时间片扫描与图表展示）

## v0.3 — 扩展架构与生态 (Extensible Architecture & Ecosystem)

- [ ] **Rust 核心层**
  - [ ] SJF (短作业优先) 算法插件实现
  - [ ] CFS (完全公平调度) 算法插件实现
  - [ ] 随机负载生成器
- [ ] **Vue 前端层**
  - [ ] 导出功能（截图 / JSON 数据 / 实验报告）
  - [ ] 国际化 (i18n) 支持

## v0.3.1 — 界面美化专项 (UI Redesign Sprint)

- [ ] **设计文档与规范**
  - [x] 界面美化设计文档（`docs/ui-redesign-plan.md`）
  - [x] 设计令牌映射与主题规范落地
- [ ] **核心区域改造**
  - [x] Header 信息层级与参数分组
  - [x] 播放控制主操作链重构
  - [ ] 甘特图与队列区可读性优化
- [ ] **细节与验收**
  - [ ] 右侧详情与统计面板信息卡片化
  - [ ] 响应式断点与移动端体验优化
  - [ ] 可访问性与视觉一致性回归
