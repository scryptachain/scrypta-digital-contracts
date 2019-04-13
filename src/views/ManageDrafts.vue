<template>
  <div class="home">
    <div class="node-badge" v-if="connected">{{ connected }}</div>
    <top-bar></top-bar>
    <div class="container main-container">
      <div class="row">
        <div class="col-sm-12">
            <h3>Manage your drafts</h3>
            <div v-if="!isLoading">
              {{ drafts }}
            </div>
            <div v-if="isLoading">
              Fetching your drafts..
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { setTimeout } from 'timers';
export default {
  name: 'manage-draft',
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
          app.getDrafts()
        }
      },
      getDrafts(){
          const app = this
          app.isLoading = true
          app.axios.post('https://' + app.connected + '/storage/read',
              {
                  dapp: app.scrypta.PubAddress,
                  collection: 'CONTRACT'
              })
              .then(function (response) {
                app.isLoading = false
                app.drafts = response.data.data
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
      login: false,
      unlockPwd: "",
      public_address: '',
      encrypted_wallet: '',
      drafts: '',
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
</style>