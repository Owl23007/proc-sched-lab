<template>
    <div class="kanban-root">
        <header class="kanban-header">
            <slot name="header" />
        </header>

        <main class="kanban-body">
            <section class="kanban-column kanban-left">
                <slot name="left" />
            </section>

            <section class="kanban-column kanban-center">
                <slot name="center" />
            </section>

            <aside class="kanban-column kanban-right">
                <slot name="right" />
            </aside>
        </main>
    </div>
</template>

<script setup>
// layout is presentational only
</script>

<style scoped>
.kanban-root {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.kanban-header {
    flex-shrink: 0;
}

.kanban-body {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(300px, 380px) 1fr minmax(300px, 380px);
    gap: 10px;
    align-items: stretch;
}

.kanban-column {
    /* fill available height and scroll internally */
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-right: 4px;
    /* custom scrollbar */
    scrollbar-width: thin;
    scrollbar-color: var(--border-main) transparent;
}

.kanban-column::-webkit-scrollbar {
    width: 5px;
}

.kanban-column::-webkit-scrollbar-track {
    background: transparent;
}

.kanban-column::-webkit-scrollbar-thumb {
    background: var(--border-main);
    border-radius: 999px;
}

/* small screen fallback */
@media (max-width: 1100px) {
    .kanban-body {
        grid-template-columns: 1fr;
        height: auto;
        overflow-y: visible;
    }

    .kanban-column {
        height: auto;
        overflow-y: visible;
    }
}
</style>
