<script>
  export let data;
  export let height = 200;

  $: maxCount = Math.max(...data.map((d) => d.count));
</script>

<div class="chart-container">
  <div class="chart-scroll" style="height: {height}px">
    {#each data as item}
      <div class="bar-row">
        <div class="label">{item.key}</div>
        <div class="bar-container">
          <div class="bar" style="width: {(item.count / maxCount) * 100}%">
            <span class="value">{item.count}</span>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .chart-container {
    width: 100%;
    /* padding-bottom: 4px; */
    padding: 2px
  }

  .chart-scroll {
    width: 100%;
    overflow-y: auto;
  }

  .bar-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 2px 0;
  }

  .label {
    width: 110px;
    flex-shrink: 0;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 5px;
    text-align: left;
  }

  .bar-container {
    flex-grow: 1;
    padding-right: 30px;
  }

  .bar {
    height: 20px;
    background: var(--accent);
    opacity: 0.8;
    position: relative;
    transition: opacity 0.2s;
  }

  .bar:hover {
    opacity: 1;
  }

  .value {
    position: absolute;
    right: -5px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 14px;
    opacity: 0.7;
    width: 0px;
  }

  .bar:hover .value {
    opacity: 1;
  }
</style>
