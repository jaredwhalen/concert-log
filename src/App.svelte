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

  function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }

  var unique = concerts.map(d => d.band).filter((value, index, self) => self.indexOf(value) === index);

  let groupedConcerts = Object.entries(groupBy(concerts, 'date'))

  let searchTerm = "";

  $: filteredGroupedConcerts = groupedConcerts.filter(x => x[1].some(item => item.band.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1));
</script>

<header>
  <h1>@jared_whalen's concert<span>.log</span></h1>





  <div class="g-share">
    <a target="_blank" href="https://twitter.com/jared_whalen">
      <svg id="twitter" data-name="twitter" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 509.42 416">
        <g id="tfnVb0.tif">
          <path
            d="M-3.11,410.8c56,5,106.56-8.77,152.36-43.23-47.89-4.13-79.86-28.14-97.63-73.21,16,2.44,30.77,2.3,46.51-1.91-24.84-6.09-44.73-18.21-60-37.41S15.32,213.9,15.38,188.45c14.65,7.48,29.37,12.07,46.68,12.78-22.82-16.77-37.49-37.61-43.29-64.17C13,110.68,17,85.73,30.31,61.75q85.13,100,214.85,109.34c-.33-11.08-1.75-21.73-.76-32.15,4-42.5,26-73.13,65.46-88.78,41.28-16.37,79.22-8,112,22.16,2.48,2.28,4.55,2.9,7.83,2.12,19.82-4.68,38.77-11.52,56.54-21.53,1.43-.8,2.92-1.5,5.38-2.76-8.05,24.47-22.71,42.58-42.92,57.38,6.13-1.11,12.31-2,18.36-3.37,6.46-1.5,12.85-3.33,19.16-5.34,6.1-1.95,12.07-4.32,19.55-7-4.48,6-7.57,11.41-11.78,15.66-11.9,12-24.14,23.72-36.54,35.23-2.56,2.38-3.77,4.42-3.69,7.93,1.32,62.37-15.12,119.9-48.67,172.3C361.52,391,300.21,434.46,220.88,451,155.93,464.6,92.65,458.29,32,430.75c-12.17-5.52-23.75-12.33-35.6-18.55Z"
            transform="translate(3.64 -41.93)"></path>
        </g>
      </svg>
    </a>
    <a target="_blank" href="https://github.com/jaredwhalen">
      <svg id="github" data-name="github" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32.58 31.77">
        <path
          d="M249.88,233.65a16.29,16.29,0,0,0-5.15,31.75c.81.15,1.11-.35,1.11-.78s0-1.41,0-2.77c-4.53,1-5.49-2.19-5.49-2.19a4.3,4.3,0,0,0-1.81-2.38c-1.48-1,.11-1,.11-1a3.41,3.41,0,0,1,2.5,1.68,3.46,3.46,0,0,0,4.74,1.35,3.54,3.54,0,0,1,1-2.18c-3.61-.41-7.42-1.8-7.42-8a6.3,6.3,0,0,1,1.68-4.37,5.82,5.82,0,0,1,.16-4.31s1.37-.44,4.48,1.67a15.41,15.41,0,0,1,8.16,0c3.11-2.11,4.47-1.67,4.47-1.67a5.82,5.82,0,0,1,.16,4.31,6.26,6.26,0,0,1,1.68,4.37c0,6.26-3.81,7.64-7.44,8a3.91,3.91,0,0,1,1.11,3c0,2.18,0,3.93,0,4.47s.29.94,1.12.78a16.3,16.3,0,0,0-5.16-31.75Z"
          transform="translate(-233.59 -233.65)" style="fill:#dddddd;fill-rule:evenodd"></path>
      </svg>
    </a>
  </div>
</header>
<div class="intro">

  <div class="instructions">
    <p><span><em>{unique.length} different bands</em> @ <span><em>{groupedConcerts.length} shows</em></span></span></p>
    <p>An incomplete list of shows I've been to. Omissions by error or embarrassment.</p>
    <p>Local/DIY shows currently not included for sanity reasons.</p>

    <p><span>&nbsp;📄<em> Setlist</em>&nbsp;</span> <span>&nbsp;📷<em> Photos/video</em>&nbsp;</span></p>

    <!-- <p>To add a concert run <span> ./add.sh <em>YYYY-MM-DD</em> <em>BAND</em> <em>VENUE</em>  [ <em>MEDIA (true/false)</em> ] [ <em>SETLIST.FM_LINK</em> ] [ <em>NOTES</em> ]</span></p>
    <p>To process the images in a directory and its subfolders, run <span>./process.sh <em>PATH_TO_FOLDER</em></span></p>
    <p>To push updates to Github Pages, run <span>./update.sh</span></p> -->
  </div>
</div>
<main>
  <div class="input-wrapper">
    <input bind:value={searchTerm} placeholder="Search a band name..." />
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


header {
  text-align: center;
}

 header .g-share {
   display: flex;
   justify-content: center;
   align-items: center;
   padding: 15px 0px;
}

header .g-share svg {
  width: 20px;
  margin-left: 20px;
  opacity: 1;
  fill: #dddddd;
}

header h1 span {
  /* text-transform: uppercase; */
  color: var(--accent)
}

header p {
  font-family: var(--font2);
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
  padding: 20px 0px 10px;
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

footer {
  max-width: 800px;
  font-family: var(--font2);
  text-align: center;
  font-size: 12px;
  color: #ccc;
  font-weight: 400;
  opacity: .25;
}

</style>
