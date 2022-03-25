<script>
  export let name
  export let data
</script>

<table>
  <thead>
    <tr>
      <th colspan=2>{name}</th>
    </tr>
  </thead>
  <tbody>
    {#each data as el}
          <tr>
            <td class="key">{el.key}</td>
            <td class="count">{el.count}</td>
          </tr>
    {/each}
  </tbody>
</table>


<style>

table {

  /* background: var(--dark); */
  padding: 1px 1px 3px;
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
