<script>
  export let name
  export let data
</script>

<div>
<h4>{name}</h4>
<table>
  <tbody>
    {#each data as el}
          <tr>
            <td class="key">{el.key}</td>
            <td class="count">{el.count}</td>
          </tr>
    {/each}
  </tbody>
</table>
</div>


<style>

table {
  height: 300px;
  overflow-y: scroll;
  display: inline-block;
  /* background: var(--dark); */
  padding: 1px 1px 3px;
  text-align: left;

}

 h4 {
   position: sticky;
    top: 1px;
    background: var(--light);
    padding: 2px 0px;
    text-align: left;
 }


  td {

  }

.key {

}

.count {
  text-align: right;
  padding-left: 15px;
      color: var(--accent)
  /* font-family: monospace; */
}

</style>
