<template>
    <div class="kanban-root">
        <header class="kanban-header">
            <slot name="header" />
        </header>

        <main class="kanban-body">
            <section class="kanban-column kanban-left">
                <div class="column-scroll">
                    <slot name="left" />
                </div>
            </section>

            <section class="kanban-column kanban-center">
                <div class="column-scroll">
                    <slot name="center" />
                </div>
            </section>

            <aside class="kanban-column kanban-right">
                <div class="column-scroll">
                    <slot name="right" />
                </div>
            </aside>
        </main>
    </div>
</template>

<script setup>
// layout is presentational only
</script>

<style scoped>
.kanban-root {
    height: 100vh;
    display: grid;
    grid-template-rows: auto 1fr;
    gap: 12px;
}

.kanban-header {
    padding: 0;
}

.kanban-body {
    display: grid;
    grid-template-columns: minmax(280px, 360px) 1fr minmax(320px, 420px);
    gap: 16px;
    align-content: start;
    padding: 0;
}

.kanban-column {
    display: flex;
    flex-direction: column;
}

.column-scroll {
    /* ensure internal scrolling but prevent page scroll */
    max-height: calc(100vh - 120px);
    overflow: auto;
    padding-right: 6px;
}

/* small screen fallback */
@media (max-width: 1200px) {
    .kanban-body {
        grid-template-columns: 1fr;
        grid-auto-rows: auto;
    }
}
</style>
