<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';

  export let data;
  export let height = 200;
  
  let svg;
  let width;
  
  $: if (svg && width && data) {
    drawChart();
  }

  function drawChart() {
    const margin = { top: 10, right: 15, bottom: 30, left: 30 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Clear previous chart
    d3.select(svg).selectAll('*').remove();

    const x = d3.scaleLinear()
      .domain(d3.extent(data, d => d.key))
      .range([0, chartWidth]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count)])
      .range([chartHeight, 0]);

    const line = d3.line()
      .x(d => x(d.key))
      .y(d => y(d.count));

    const g = d3.select(svg)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add line
    g.append('path')
      .datum(data)
      .attr('class', 'line')
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', 'var(--accent)')
      .attr('stroke-width', 2);

    // Add dots
    g.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(d.key))
      .attr('cy', d => y(d.count))
      .attr('r', 4)
      .attr('fill', 'var(--accent)');

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x).ticks(width > 500 ? 10 : 5).tickFormat(d3.format('d')));

    g.append('g')
      .call(d3.axisLeft(y).ticks(5));
  }
</script>

<div class="chart-container" bind:clientWidth={width} style="height: {height}px">
  <svg bind:this={svg} {height}></svg>
</div>

<style>
  .chart-container {
    width: 100%;
    height: 100%;
    padding-bottom: 4px;
  }

  svg {
    width: 100%;
  }

  :global(.dot:hover) {
    r: 6;
  }

  :global(.tick text) {
    fill: var(--primary);
    font-size: 14px;
  }

  :global(.tick line) {
    stroke: var(--primary);
    opacity: 0.1;
  }

  :global(.domain) {
    stroke: var(--primary);
    opacity: 0.1;
  }
</style> 