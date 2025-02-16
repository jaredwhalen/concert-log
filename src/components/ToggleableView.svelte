<script>
  import Table from "./Table.svelte";
  import BarChart from "./charts/BarChart.svelte";
  import LineChart from "./charts/LineChart.svelte";

  export let name;
  export let data;
  export let chartType = "bar"; // 'bar' or 'line'

  let height = 200;
  let showTable = true;
</script>

<div class="toggleable-view">
  <div class="header">
    <h4>{name}</h4>
    <div class="toggle-switch">
      <button class:active={showTable} on:click={() => (showTable = true)}>
        📋
      </button>
      <button class:active={!showTable} on:click={() => (showTable = false)}>
        {chartType == "bar" ? "📊" : "📈"}
      </button>
    </div>
  </div>

  {#if showTable}
    <Table {name} {data} {height} />
  {:else if chartType === "bar"}
    <BarChart {data} {height} />
  {:else}
    <LineChart {data} {height} />
  {/if}
</div>

<style>
  .toggleable-view {
    width: calc(100% - 10px);
    background: var(--dark);
    padding: 5px 5px 0px;
    border-radius: 4px;
    font-size: 14px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
  }

  .toggle-switch {
    display: flex;
    gap: 1px;
    background: var(--light);
    padding: 2px;
    border-radius: 4px;
  }

  .toggle-switch button {
    background: none;
    border: none;
    color: var(--primary);
    cursor: pointer;
    padding: 2px 8px;
    font-size: 12px;
    opacity: 0.7;
    border-radius: 2px;
    transition: all 0.2s;
  }

  .toggle-switch button.active {
    background: var(--dark);
    opacity: 1;
  }

  .toggle-switch button:hover {
    opacity: 1;
  }

  h4 {
    margin: 0;
  }
</style>
