<template>
  <div class="home">
    <div class="node-badge" v-if="connected">{{ connected }}</div>
    <top-bar></top-bar>
    <b-modal v-model="passwordShow" hide-footer title="Unlock your wallet first">
      <b-form-input v-model="unlockPwd" type="password" placeholder="Enter wallet password"></b-form-input>
      <br>
      <div v-on:click="unlockWallet" class="btn btn-primary">UNLOCK WALLET</div>
    </b-modal>
    <div class="container main-container">
      <div class="row">
        <div class="col-sm-12">
            <h3>Join contract<br><small><strong>Num.</strong> {{ $route.params.id }}<br><strong>Created by</strong> {{ owner }}</small></h3>
            <div v-if="!isLoading">
              <div class="row" style="border-top:1px solid #ccc; padding-top:15px; margin-left:-15px; margin-right:-15px">
                <div class="col-12 text-left">
                  <h5>{{ subject }}</h5>
                  <p>{{ body }}</p>
                  <div class="text-center">
                    <div v-if="canJoin">
                      <b-button variant="success" v-if="!isJoining" style="margin-top:15px; float:left" v-on:click="openUnlockWallet()">JOIN CONTRACT</b-button>
                      <div v-if="isJoining" style="margin-top:15px; float:left">
                        Joining contract...
                      </div>
                    </div>
                    <div v-if="!canJoin" style="font-weight:bold; color:#f00">
                      You've joined this contract yet.
                    </div>
                  </div>
                </div>
                <h5 class="text-center" style="margin-top:50px">
                  Participants
                </h5>
                <div class="row text-center" style="width:100%">
                    <div class="col-4" v-for="participant in draft.data.join" v-bind:key="participant.address">
                        <div class="participant-card" style="width:100%">
                          {{ participant.address }}
                        </div>
                    </div>
                </div>
              </div>
            </div>
            <div v-if="isLoading">
              Fetching contract..
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'join-contract',
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
      openUnlockWallet() {
        this.passwordShow = true;
      },
      connectToNode(){
        var app = this
        if(app.connected == ''){
          app.connected = app.nodes[Math.floor(Math.random()*app.nodes.length)];
          app.connected = "idanode01.scryptachain.org" //FIXED NODE FOR BETTER EXPERIENCE
          app.getDraft()
        }
      },
      getDraft(){
          const app = this
          app.isLoading = true
          app.axios.post('https://' + app.connected + '/storage/read',
              {
                  hash: app.$route.params.id
              })
              .then(function (response) {
                app.isLoading = false
                app.draft = response.data.data
                app.body = app.draft.data.body
                app.subject = app.draft.data.subject
                app.owner = app.draft.data.owner
                if(app.draft.data.join.length > 0){
                  for (var i=0; i<= app.draft.data.join.length; i++){
                    if(app.draft.data.join[i].address === app.scrypta.PubAddress){
                      app.canJoin = false
                    }
                  }
                }
              })
      },
      unlockWallet() {
      if (this.unlockPwd !== "") {
        var app = this;
        app.decrypted_wallet = "WALLET LOCKED";
        app.scrypta.readKey(this.unlockPwd).then(function(response) {
          if (response !== false) {
            var pubkey = response.key
            var privkey = response.prv
            app.draft.data.join.push({
              address: app.scrypta.PubAddress,
              pubkey: pubkey,
              prv: privkey //NOT 100% SECURE BUT REALLY USEFUL FOR EXPLAIN THE IDEA
            })
            app.isUpdating = true
            app.axios.post('https://' + app.connected + '/storage/update',
            {
                data: {
                      "owner": app.draft.data.owner,
                      "join": app.draft.data.join,
                      "subject": app.draft.data.subject,
                      "body": app.draft.data.body
                },
                uuid: app.$route.params.id
            })
            .then(function () {
              app.isUpdating = false
              app.canJoin = false
              app.passwordShow = false
            })
            .catch(function () {
              app.isUpdating = false
              alert("Seems there's a problem, please retry or change node!")
            })
          } else {
            alert("Wrong password!");
          }
        });
      } else {
        alert("Write your password first");
      }
    }
  },
  data () {
    return {
      scrypta: window.ScryptaCore,
      axios: window.axios,
      nodes: [],
      connected: '',
      unlockPwd: "",
      draft: '',
      isLoading: true,
      isJoining: false,
      subject: '',
      body: '',
      owner: '',
      canJoin: true,
      passwordShow: false
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
  small{font-size:13px!important}
  .participant-card{
    font-size:13px; 
    border: #ccc solid 1px;
    border-radius: 5px;
    padding:10px;
    text-align:center;
    margin:10px 0;
  }
</style>