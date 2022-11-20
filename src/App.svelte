<script>
  import Meta from "./Meta.svelte";
  import Header from "./components/Header.svelte"
  import Intro from "./components/Intro.svelte"
  // import concerts from "./data/concerts.json";
  import { csv } from "d3";
  import { onMount } from "svelte";

  import groupBy from "./js/groupBy";

  let concerts
  let groupedConcerts
  let filteredGroupedConcerts

  onMount(async () => {
    concerts = await csv('https://docs.google.com/spreadsheets/d/e/2PACX-1vSZVieEKDaJKxzwtgfq73-M7yv2JYwadtfsn7DXXHMRbeXCCK0Y-YVdikT6LaY1RAz88jj1hvDgQpFn/pub?gid=1440750830&single=true&output=csv').then((data) => data)
    concerts.sort((a, b) => new Date(b.date) - new Date(a.date))
    groupedConcerts = Object.entries(groupBy(concerts, 'date'))
  });


  let searchTerm = "";

  $: if (!!concerts) {
    filteredGroupedConcerts = groupedConcerts.filter(x => x[1].some(item => item.band.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1));
  }

</script>

<main id="App">
  <Header/>
  {#if !!concerts}
  <Intro {concerts} {groupedConcerts}/>

    <div class="input-wrapper">
      <input bind:value={searchTerm} placeholder="Search a band name..." />
    </div>

    <div id="concerts">
      {#each filteredGroupedConcerts as concert, i}
        <div class="concert-cell">
          {#each concert[1] as row, i}
            <div class="band-content">
              <h3>
              {row.band}
              {#if row.setlist} <a target="_blank" href={row.setlist}>📄</a>{/if}
              {#if row.public_url} <a target="_blank" href="{row.public_url}"> 📷</a> {/if}
              </h3>
            </div>
          {/each}
          <div class="show-content">@ {concert[1][0].venue} on {concert[0]}</div>
        </div>
      {/each}
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
  --font1: 'Raleway', Sans-Serif;
  --font2: 'Open Sans', Sans-Serif;
}

:global(body) {
  background: var(--light);
  color: var(--primary);
}

#App {
  width: calc(100% - 30px);
  max-width: 800px;
  margin: 0 auto;
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
  font-size: 14px;
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
  opacity: .25;
}

</style>
