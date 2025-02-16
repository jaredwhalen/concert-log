<script>
  import Meta from "./Meta.svelte";
  import Header from "./components/Header.svelte";
  import Stats from "./components/Stats.svelte";
  // import concerts from "./data/concerts.json";
  import { csv } from "d3";
  import { onMount } from "svelte";
  import { Stretch } from "svelte-loading-spinners";

  import groupBy from "./js/groupBy";

  let concerts;
  let groupedConcerts;
  let filteredGroupedConcerts;

  onMount(async () => {
    concerts = await csv(
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vSZVieEKDaJKxzwtgfq73-M7yv2JYwadtfsn7DXXHMRbeXCCK0Y-YVdikT6LaY1RAz88jj1hvDgQpFn/pub?gid=1440750830&single=true&output=csv"
    ).then((data) => data);
    concerts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    groupedConcerts = Object.entries(groupBy(concerts, "date"));

    groupedConcerts.forEach((concert) => {
      concert[1].reverse();
    });
  });

  let searchTerm = "";

  $: if (!!concerts) {
    filteredGroupedConcerts = groupedConcerts.filter(
      (x) =>
        x[1].some(
          (item) =>
            item.band.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1
        ) ||
        x[1].some(
          (item) =>
            item.venue.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1
        )
    );
  }

  $: unique = concerts
    ?.map((d) => d.band)
    .filter((value, index, self) => self.indexOf(value) === index);
</script>

<main id="App">
  <Header />

  {#if !!concerts}
    <div class="intro">
      <div>
        <p>
          <span
            ><em>{unique?.length} different bands</em> @
            <span><em>{groupedConcerts?.length} shows</em></span></span
          >
        </p>
        <br />
        <p>
          An incomplete list of shows I've been to. Omissions by error or
          embarrassment.
        </p>
        <p>Local/DIY shows (mostly) not included for sanity reasons.</p>

        <br />
        <p>
          A data visualization by <a
            href="https://jaredwhalen.com"
            target="_blank">Jared Whalen</a
          >
        </p>
        <br />
      </div>

      <Stats {concerts} {groupedConcerts} />

      <div class="input-wrapper">
        <input bind:value={searchTerm} placeholder="Search a band name..." />
      </div>

      <p>
        <span>&nbsp;📄<em>&nbsp;Setlist</em>&nbsp;</span>
        <span>&nbsp;📷<em>&nbsp;Photos/video</em>&nbsp;</span>
      </p>

      <div id="concerts">
        {#each filteredGroupedConcerts as concert, i}
          <div class="concert-cell">
            {#each concert[1] as row, i}
              <div class="band-content">
                <h3>
                  {row.band}
                  {#if row.setlist}
                    <a target="_blank" href={row.setlist}>📄</a>{/if}
                  {#if row.public_url}
                    <a target="_blank" href={row.public_url}> 📷</a>
                  {/if}
                </h3>
              </div>
            {/each}
            <div class="show-content">
              @ {concert[1][0].venue} on {concert[0]}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div style="text-align: center; margin: 50px;">
      <Stretch size="60" color="#dda71d" unit="px" duration="1s" />
    </div>
  {/if}
</main>

<footer>
  <div>Design and code by Jared Whalen | © 2021 Jared Whalen</div>
</footer>

<style>
  :global(:root) {
    /* --light: #F9F6E9;
  --dark: #ebe8db;
  --primary: #15293e;
  --accent: #c86dd0; */
    --light: #333835;
    --dark: #1d201e;
    --primary: #dddddd;
    --accent: #dda71d;
    --font1: "Raleway", Sans-Serif;
    --font2: "Open Sans", Sans-Serif;
  }

  :global(body) {
    background: var(--light);
    color: var(--primary);
  }

  a {
    color: var(--accent);
  }

  #App {
    width: calc(100% - 30px);
    max-width: 800px;
    margin: 0 auto;
  }

  .intro {
    text-align: center;
    font-family: var(--font2);
    line-height: 1.5;
  }

  .intro span {
    background: var(--dark);
    padding: 1px 1px 3px;
    font-family: monospace;
  }

  .intro span em {
    color: var(--accent);
    font-weight: bold;
  }

  .input-wrapper {
    max-width: 800px;
    margin: 25px auto;
    width: calc(100% - 30px);
  }

  .input-wrapper input {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    border: none;
    /* border-color: var(--accent); */
    background: var(--dark);
    padding: 15px;
    max-width: 800px;
    width: 100%;
    outline: none;
    margin-left: -15px;
    color: var(--primary);
  }

  .concert-cell {
    /* border: 1px solid; */
    margin: 25px auto;
    padding: 15px;
    color: var(--primary);
    background: var(--dark);
    text-align: left;
  }

  .band-content h3 {
    /* font-family: 'Nanum Gothic Coding', monospace; */
    font-family: var(--font1);
    font-size: 20px;
    line-height: 1.6;
  }

  .band-content a {
    text-decoration: none;
  }

  .show-content {
    /* display: inline-block; */
    border-top: 1px solid;
    padding-top: 10px;
    margin-top: 10px;
    font-family: var(--font2);
    opacity: 0.5;
    font-size: 12px;
  }

  .band-content img {
    width: 100%;
  }

  footer {
    max-width: 800px;
    font-family: var(--font2);
    text-align: center;
    font-size: 12px;
    color: #ccc;
    font-weight: 400;
    margin: 0 auto;
    opacity: 0.25;
  }
</style>
