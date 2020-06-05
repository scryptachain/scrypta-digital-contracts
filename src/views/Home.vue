<template>
  <div class="home">
    <div class="main text-left">
      <div class="container">
        <v-gravatar :email="address" style="float:left; margin-right:20px; width:75px; height:75px;"/>
        <h1>Welcome back</h1>
        <h3>{{ address }}</h3>
        <hr>
      </div>
    </div>
  </div>
</template>

<script>
  const ScryptaCore = require('@scrypta/core')

  export default {
    name: 'Home',
    data(){ 
      return {
        scrypta: new ScryptaCore(true),
        address: '',
        wallet: '',
        isLoading: true,
        activePolls: [],
        nextPolls: [],
        prevPolls: [],
        secretPolls: []
      }
    },
    async mounted() {
      const app = this
      app.wallet = await app.scrypta.returnDefaultIdentity()
      let SIDS = app.wallet.split(':')
      app.address = SIDS[0]
      let identity = await app.scrypta.returnIdentity(app.address)
      app.wallet = identity
      app.isLogging = false
      app.isLoading = false
    }
  }
</script>