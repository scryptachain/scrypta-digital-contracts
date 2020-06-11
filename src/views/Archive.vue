<template>
  <div class="home">
    <div class="main text-left">
      <div class="container">
        <h1>Contratti archiviati</h1>
        <hr>
        <div v-if="contracts.length > 0">
          <div v-for="contract in contracts" v-bind:key="contract.data.hash">
            <div v-if="contract.data.v === 1">
              <a :href="'/#/contract/' + contract.address">
                <div style="border:1px solid #ccc; text-align:left; position:relative; color:#000; border-radius:5px; margin-top:20px; font-size:12px; padding:15px">
                  <v-gravatar :email="contract.address" style="float:left; height:55px; margin-right:10px;" />
                  <strong v-if="contract.data.title">{{ contract.data.title }}</strong>
                  <strong v-if="!contract.data.title">Nessun titolo</strong>
                  <br><strong>Indirizzo:</strong> {{ contract.address }}
                  <br><strong>Partecipanti:</strong> {{ contract.data.subjects.length }}
                  <b-icon
                      style="position:absolute; top:27px; right:30px"
                      icon="arrow-right"
                      size="is-medium">
                  </b-icon>
                </div>
              </a>
            </div>
          </div>
        </div>
        <div v-if="isLoading === true">
          Cerco i tuoi contratti in blockchain...
        </div>
        <div v-if="contracts.length === 0 && isLoading === false">
          Nessun contratto da mostrare...
        </div>
      </div>
    </div>
    <b-loading :is-full-page="true" :active.sync="isLoading" :can-cancel="true"></b-loading>
  </div>
</template>

<script>
  const ScryptaCore = require('@scrypta/core')
  const LZUTF8 = require('lzutf8')

  export default {
    name: 'Home',
    data(){ 
      return {
        scrypta: new ScryptaCore(true),
        address: '',
        wallet: '',
        isLoading: true,
        contracts: []
      }
    },
    async mounted() {
      const app = this
      app.wallet = await app.scrypta.returnDefaultIdentity()
      let SIDS = app.wallet.split(':')
      app.address = SIDS[0]
      let identity = await app.scrypta.returnIdentity(app.address)
      app.wallet = identity
      let active = await app.scrypta.post('/read', { protocol: 'DC://' })
      let active_contracts = []
      for(let k in active.data){
        active_contracts.push(active.data[k].address)
      }
      let contracts = await app.scrypta.post('/read', { protocol: 'DC://', history: true })
      for(let k in contracts.data){
        let contract = contracts.data[k]
        if(active_contracts.indexOf(contract.address) === -1){
          let subjects = []
          for(let j in contract.data.subjects){
            subjects.push(contract.data.subjects[j].address)
          }
          if(contract.data.creator === app.address || subjects.indexOf(app.address) !== -1){
            if(contract.data.title !== undefined && contract.data.title !== ''){
              contract.data.title = LZUTF8.decompress(contract.data.title, { inputEncoding: 'Base64' });
            }
            app.contracts.push(contract)
          }
        }
      }
      app.isLogging = false
      app.isLoading = false
    }
  }
</script>