<template>
  <div class="home">
    <div class="node-badge" v-if="connected">{{ connected }}</div>
    <top-bar></top-bar>
    <div class="container main-container">
      <div class="row">
        <div class="col-sm-12">
            <div v-if="!isLoading">
              <div v-if="contract" style="position:relative">
                <b-button variant="primary" style="position:absolute; top:0; right:0; font-size:11px">Send data</b-button>
                <h3>{{ contract.data.subject }}</h3>
                {{ contract.address }}
                <br><br>
                <p style="text-align:justify">
                  {{ contract.data.body }}
                </p>
                <hr>
                <h4>Contract's history</h4>
                <div v-if="!history">
                  Nothing to show..
                </div>
                <div v-if="history">

                </div>
              </div>
              <div v-if="!contract">
                Contract not found
              </div>
            </div>
            <div v-if="isLoading">
              Loading contract from blockchain...
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
          app.fetchContract()
        }
      },
      fetchContract(){
        const app = this
        this.axios.post('https://' + app.connected + '/read', {uuid: app.$route.params.id, history: false, json: true})
          .then(function (response) {
            var contract = response.data.data
            var inarray = false
            if(contract.data.created_by && contract.data.created_by == app.scrypta.PubAddress){
              app.contract = contract
              inarray = true
            }
            if(contract.data.created_by && inarray === false){
              var participants = contract.data.participants.split(',')
              if(participants.indexOf(app.scrypta.PubAddress) !== -1){
                app.contract = contract
                inarray = true
              }
            }
            app.isLoading = false
          });
      }
  },
  data () {
    return {
      scrypta: window.ScryptaCore,
      axios: window.axios,
      nodes: [],
      connected: '',
      isLoading: true,
      contract: '',
      history: ''
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