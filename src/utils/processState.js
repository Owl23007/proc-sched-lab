/**
 * 进程状态工具函数
 * 供 ProcessEditor、ProcessDetail 等组件统一调用，避免重复的 state → 文字/class 映射
 */

/** 返回状态对应的 emoji + 文字 */
export function getStateLabel(state) {
    if (state === 'E') return '🟢 执行'
    if (state === 'R') return '🟡 就绪'
    if (state === 'F') return '⚪ 完成'
    return '🔵 等待'
}

/** 返回状态对应的 CSS class 名 */
export function getStateClass(state) {
    if (state === 'E') return 'is-running'
    if (state === 'R') return 'is-ready'
    if (state === 'F') return 'is-finished'
    return 'is-waiting'
}
