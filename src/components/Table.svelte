<script>
  export let name;
  export let data;
  export let height = 200;
</script>

<div class="table-container">
  <div class="table" style="height: {height}px">
    {#each data as el}
      <div class="row">
        <div class="key">{el.key}</div>
        <div class="count">{el.count}</div>
      </div>
    {/each}
  </div>
</div>

<style>
  .table-container {
    width: 100%;
  }

  h4 {
    position: sticky;
    top: 0;
    background: var(--light);
    padding: 2px 0px;
    text-align: left;
  }

  .table {
    overflow-y: auto; /* Scrollable */
    display: flex;
    flex-direction: column;
    padding: 2px;
  }

  .row {
    display: flex;
    justify-content: space-between;
    width: 100%;
    padding: 2px 0;
  }

  .key {
    flex: 1;
    text-align: left;
  }

  .count {
    text-align: right;
    padding-left: 15px;
    color: var(--accent);
  }
</style>
