<script>

  import Table from "./Table.svelte"
  import groupBy from "../js/groupBy";

  export let concerts
  export let groupedConcerts

  function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }

  var unique = concerts.map(d => d.band).filter((value, index, self) => self.indexOf(value) === index);


  const getCountBy = (data, key, nested) => {

    let x
    if (nested) {
      x = data.map(d => d[1][0][key])
    } else {
      x = data.map(d => d[key])
    }
    var occurrences = x.reduce(function(obj, item) {
      obj[item] = (obj[item] || 0) + 1;
      return obj;
    }, {})

    let r = Object.keys(occurrences).map(d => {
      return({key: d, count: occurrences[d]})
    }).sort((a,b) => b.count - a.count)

    return(r)
  }

  let bands = getCountBy(concerts, "band", false)
  let venues = getCountBy(groupedConcerts, "venue", true)

  concerts.forEach(d => d.year = new Date(d.date).getFullYear())

  let years = getCountBy(groupedConcerts, "year", true).sort(((a, b) => b.key - a.key))
  console.log(years)


</script>

<div class="intro">

  <div>
    <p><span><em>{unique.length} different bands</em> @ <span><em>{groupedConcerts.length} shows</em></span></span></p>
    <br/>
    <p>An incomplete list of shows I've been to. Omissions by error or embarrassment.</p>
    <p>Local/DIY shows (mostly) not included for sanity reasons.</p>

    <br/>
    <p>A data visualization by <a href="https://jaredwhalen.com" target="_blank">Jared Whalen</a></p>
    <br/>

    <p><span>&nbsp;📄<em> Setlist</em>&nbsp;</span> <span>&nbsp;📷<em> Photos/video</em>&nbsp;</span></p>
  </div>

  <div class="flex">
    <Table name="Bands, by frequency" data={bands}/>
    <Table name="Venues, by frequency" data={venues}/>
    <Table name="Year" data={years}/>
  </div>
</div>

<style>

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

  .flex {
    display: flex;
    gap: 25px;
    margin: 25px 0;
    justify-content: center;
    width: 100%;
    overflow-x: scroll;
  }


a {
  color: var(--accent);
}

</style>
