<script setup>
defineProps({
    open: { type: Boolean, default: false },
    title: { type: String, default: '' },
    width: { type: String, default: '480px' },
})

const emit = defineEmits(['close'])

function onOverlay(e) {
    if (e.target === e.currentTarget) {
        emit('close')
    }
}
</script>

<template>
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="open" class="modal-overlay" @mousedown="onOverlay">
                <div class="modal-dialog" :style="{ maxWidth: width }">
                    <div class="modal-header">
                        <h3>{{ title }}</h3>
                        <button class="modal-close" @click="emit('close')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <slot />
                    </div>
                    <div v-if="$slots.footer" class="modal-footer">
                        <slot name="footer" />
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(4px);
}

.modal-dialog {
    width: 90vw;
    background: var(--bg-panel);
    border: 1px solid var(--border-soft);
    border-radius: 14px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
    max-height: 80vh;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px 10px;
    border-bottom: 1px solid var(--border-soft);

    h3 {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
    }
}

.modal-close {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: var(--text-muted);
    padding: 2px 6px;
    border-radius: 6px;
    line-height: 1;

    &:hover {
        background: var(--bg-ghost-hover);
        color: var(--text-main);
    }
}

.modal-body {
    padding: 16px;
    overflow-y: auto;
    flex: 1;
}

.modal-footer {
    padding: 10px 16px 14px;
    border-top: 1px solid var(--border-soft);
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}

/* Transition */
.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.2s ease;
}

.modal-enter-active .modal-dialog,
.modal-leave-active .modal-dialog {
    transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

.modal-enter-from .modal-dialog {
    transform: scale(0.95) translateY(10px);
}

.modal-leave-to .modal-dialog {
    transform: scale(0.95) translateY(10px);
}
</style>
