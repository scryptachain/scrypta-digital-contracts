<template>
  <div class="home">
    <div class="node-badge" v-if="connected">{{ connected }}</div>
    <top-bar></top-bar>
    <div class="container main-container">
      <div class="row">
        <div class="col-sm-12">
          <img src="../assets/file-plus.svg" width="200"><br><br>
          You haven't contracts to see right now.<br>
          Starts by finding another user and create a new contract!<br><br>
          <router-link to="/new-contract"><b-button variant="success">Create new contract</b-button></router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
  #app{
    text-align: center;
    font-family: 'karmillaregular';
  }
  .navbar-dark .navbar-nav .nav-link{opacity:0.9!important; color:#fff!important}
  .navbar-dark .navbar-nav .nav-link:hover{opacity: 0.7!important;}
</style>

<script>
export default {
  name: 'home',
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
        }
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
      encrypted_wallet: ''
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