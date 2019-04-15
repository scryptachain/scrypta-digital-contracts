<template>
  <div class="home">
    <div class="node-badge" v-if="connected">{{ connected }}</div>
    <top-bar></top-bar>
    <div class="container main-container">
      <div class="row">
        <div class="col-sm-12">
            <div v-if="!joinUrl">
                <h3>Create a new draft</h3>
                <p>
                    In order to create a new contract you need to create a new draft contract.<br>
                    This contract is stored off-chain and other parts have to enter.<br><br>
                    <b-button variant="success" v-if="!isCreating" v-on:click="createDraft">CREATE DRAFT</b-button>
                    <span v-if="isCreating">Creating draft...</span>
                </p>
            </div>
            <div v-if="joinUrl">
                <h3>Create on-chain contract</h3>
                Your shareable link is:<br>
                {{ joinUrl }}
                <br><br>
                Please wait for other parts and then create your onchain contract.
                <br><br>
                <a :href="manageUrl">
                  <b-button variant="success">MANAGE DRAFT</b-button>
                </a>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'contracts-new',
  mounted : function(){
      this.checkIdaNodes()
      this.checkUser()
  },
  methods: {
      checkUser() {
        const app = this
        if (!app.scrypta.keyExsist()) {
          app.$router.push('/')
        }
      },
      checkIdaNodes(){
        const checknodes = this.scrypta.returnNodes()
        const app = this
        for(var i = 0; i < checknodes.length; i++){
          this.axios.get('https://' + checknodes[i] + '/check')
          .then(function (response) {
             app.nodes.push(response.data.name);
             if(i === checknodes.length){
               app.connectToNode()
             }
          });
        }
      },
      connectToNode(){
        const app = this
        if(app.connected === ''){
          app.connected = app.nodes[Math.floor(Math.random()*app.nodes.length)];
          app.connected = "idanode01.scryptachain.org" //FIXED NODE FOR BETTER EXPERIENCE
        }
      },
      createDraft(){
          const app = this
          app.isCreating = true
          app.axios.post('https://' + app.connected + '/storage/write',
              {
                  dapp: app.scrypta.PubAddress,
                  collection: 'SCRYPTACONTRACTS',
                  data: {
                      "owner": app.scrypta.PubAddress,
                      "join": []
                  }
              })
              .then(function (response) {
                  app.isCreating = false
                  app.joinUrl = window.location.protocol + '//' + window.location.host + '/join/' + response.data.data
                  app.manageUrl = window.location.protocol + '//' + window.location.host + '/draft/' + response.data.data
              })
              .catch(function () {
                  alert("Seems there's a problem, please retry or change node!")
              })
      }
  },
  data () {
    return {
      scrypta: window.ScryptaCore,
      axios: window.axios,
      nodes: [],
      connected: '',
      isCreating: false,
      unlockPwd: "",
      public_address: '',
      joinUrl: ''
    }
  }
}
</script>

<style>
  .node-badge{
    position:fixed; bottom:-3px; font-size:10px; padding:8px; right:10px; z-index:9999;
  }
  .main-container{
    margin-top:30px
  }
</style>