<script>
  import Meta from "./Meta.svelte";
  import concerts from "./data/concerts.json";

  // Handle responsive iframes for Eden embeds
  import pym from "pym.js";
  import groupBy from "./js/groupBy";
  // components

  new pym.Child({
    polling: 500,
  });

  let groupedConcerts = Object.entries(groupBy(concerts, 'date'))

	let searchTerm = "";

  $: filteredGroupedConcerts = groupedConcerts.filter(x => x[1].some(item => item.band.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1));

</script>

<header>
  <h1>concert<span>.log</span></h1>
</header>
<div class="intro">
  <div class="instructions">
    <p><span>&nbsp;📄<em> Setlist</em>&nbsp;</span> <span>&nbsp;📷<em> Photos/video</em>&nbsp;</span></p>

    <!-- <p>To add a concert run <span> ./add.sh <em>YYYY-MM-DD</em> <em>BAND</em> <em>VENUE</em>  [ <em>MEDIA (true/false)</em> ] [ <em>SETLIST.FM_LINK</em> ] [ <em>NOTES</em> ]</span></p>
    <p>To process the images in a directory and its subfolders, run <span>./process.sh <em>PATH_TO_FOLDER</em></span></p>
    <p>To push updates to Github Pages, run <span>./update.sh</span></p> -->
  </div>
</div>
<main>
  <div class="input-wrapper">
    <input bind:value={searchTerm} placeholder="Search a band name..."/>
  </div>
  <div id="concerts">
    {#each filteredGroupedConcerts as concert, i}
      <div class="concert-cell">
        {#each concert[1] as row, i}
          <div class="band-content">
            <h3>
            <!-- {#if i}&nbsp;•&nbsp;{/if} -->
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
</main>


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


header {
  text-align: center;
}

header h1 span {
  /* text-transform: uppercase; */
  color: var(--accent)
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

h1 {
  font-family: var(--font2);
  text-align: center;
  padding: 50px;
}


#concerts {

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
  width: calc(100% - 30px);
  max-width: 800px;
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

</style>
