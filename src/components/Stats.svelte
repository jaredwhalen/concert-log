<script>
  import Table from "./Table.svelte";
  import groupBy from "../js/groupBy";
  import ToggleableView from "./ToggleableView.svelte";

  export let concerts;
  export let groupedConcerts;

  concerts.forEach((d) => (d.year = new Date(d.date).getFullYear()));

  // Function to get counts by a specified key
  const getCountBy = (data, key, nested = false) => {
    const counts = data.reduce((acc, d) => {
      const value = nested ? d[1][0][key] : d[key];
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([key, count]) => ({ key: Number(key) || key, count }))
      .sort((a, b) => b.count - a.count);
  };

  // Get counts for bands and venues
  let bands = getCountBy(concerts, "band");
  let venues = getCountBy(groupedConcerts, "venue", true);

  // Extract years and fill missing years
  const years = concerts.map((d) => new Date(d.date).getFullYear());
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  // Compute shows per year
  let showsByYear = getCountBy(groupedConcerts, "year", true);

  // Compute unique bands per year
  let bandsByYear = concerts.reduce((acc, { date, band }) => {
    const year = new Date(date).getFullYear();
    if (!acc[year]) acc[year] = new Set();
    acc[year].add(band);
    return acc;
  }, {});

  // Fill in missing years for both datasets
  let bandCountsByYear = [];
  let showsByYearComplete = [];

  for (let year = maxYear; year >= minYear; year--) {
    bandCountsByYear.push({
      key: year,
      count: bandsByYear[year] ? bandsByYear[year].size : 0,
    });

    const existingShowEntry = showsByYear.find((d) => d.key === year);
    showsByYearComplete.push({
      key: year,
      count: existingShowEntry ? existingShowEntry.count : 0,
    });
  }

  showsByYear = showsByYearComplete;
</script>

<div class="grid">
  <ToggleableView name="Bands, by frequency" data={bands} chartType="bar" />
  <ToggleableView name="Venues, by frequency" data={venues} chartType="bar" />
  <ToggleableView name="Shows, by year" data={showsByYear} chartType="line" />
  <ToggleableView
    name="Bands, by year"
    data={bandCountsByYear}
    chartType="line"
  />
</div>

<div class="charts-options"></div>
<div class="chart"></div>

<style>
  .grid {
    display: grid;
    gap: 10px;
    margin: 25px 0;
    justify-content: center;
    width: 100%;
    overflow-x: scroll;
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }


</style>
