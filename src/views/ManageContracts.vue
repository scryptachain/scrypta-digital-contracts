<template>
  <div class="home">
    <div class="node-badge" v-if="connected">{{ connected }}</div>
    <top-bar></top-bar>
    <div class="container main-container">
      <div class="row">
        <div class="col-sm-12">
            <h3>Your active contracts</h3>
            <div v-if="!isLoading">
              <div v-if="contracts.length > 0">
                <div v-for="contract in contracts" v-bind:key="contract.uuid">
                  <div v-if="contract.uuid" class="contract-card">
                    {{ contract.data.subject }}
                    <b-button variant="primary" style="float:right; margin-top:-7px" v-on:click="managecontract(contract.uuid)">MANAGE</b-button>
                  </div>
                </div>
              </div>
              <div v-if="contracts.length === 0">
                No contracts...
              </div>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'search-contracts',
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
        var checknodes = this.scrypta.returnNodes()
        const app = this
        for(var i = 0; i < checknodes.length; i++){
          this.axios.get('https://' + checknodes[i] + '/check')
          .then(function (response) {
             app.nodes.push(response.data.name)
             if(i == checknodes.length){
               app.connectToNode()
             }
          });
        }
      },
      connectToNode(){
        var app = this
        if(app.connected == ''){
          app.connected = app.nodes[Math.floor(Math.random()*app.nodes.length)];
          app.connected = "idanode01.scryptachain.org" //FIXED NODE FOR BETTER EXPERIENCE
          app.fetchContracts()
        }
      },
      fetchContracts(){
        const app = this
        this.axios.post('https://' + app.connected + '/read', {protocol: 'contract://', history: false, json: true})
          .then(function (response) {
            for (var i = 0; i < response.data.data.length; i++){
              var contract = response.data.data[i]
              var inarray = false
              if(contract.data.created_by && contract.data.created_by == app.scrypta.PubAddress){
                app.contracts.push(contract)
                inarray = true
              }
              if(contract.data.created_by && inarray === false){
                var participants = contract.data.participants.split(',')
                if(participants.indexOf(app.scrypta.PubAddress) !== -1){
                  app.contracts.push(contract)
                  inarray = true
                }
              }
            }
            app.isLoading = false
          });
      },
      managecontract(uuid){
        window.location = '/manage/' + uuid
      }
  },
  data () {
    return {
      scrypta: window.ScryptaCore,
      axios: window.axios,
      nodes: [],
      connected: '',
      contracts: [],
      isLoading: true
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
  .contract-card{
    border:1px solid #ccc; 
    border-radius:5px; 
    padding:20px;
    text-align:left; 
    margin:10px 0
  }
</style>