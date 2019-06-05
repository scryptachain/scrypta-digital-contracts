<template>
  <div class="home">
    <div class="node-badge" v-if="connected">{{ connected }}</div>
    <top-bar></top-bar>
    <div class="container main-container">
      <div class="row">
        <div class="col-sm-12">
            <h3>Manage draft<br><small>{{ $route.params.id }}</small></h3>
            <div v-if="!isLoading">
              <div class="row" style="border-top:1px solid #ccc; padding-top:15px; margin-left:-15px; margin-right:-15px">
                <div class="col-8 text-left">
                  <b-form-input
                    id="input-subject"
                    v-model="subject"
                    type="text"
                    required
                    placeholder="Enter contract's subject"
                  ></b-form-input>
                  <b-form-textarea
                    id="text"
                    v-model="body"
                    placeholder="Enter contract's body"
                    rows="14"
                  ></b-form-textarea>
                  <div class="text-center">
                      <b-button variant="success" v-if="!isUpdating" style="margin-top:15px; float:left" v-on:click="updateDraft()">UPDATE DETAILS</b-button>
                      <div v-if="isUpdating" style="margin-top:15px; float:left">
                        Updating draft...
                      </div>
                      <b-button style="float:right; margin-top:15px" v-on:click="deleteDraft()" variant="danger">DELETE DRAFT</b-button>
                  </div>
                </div>
                <div class="col-4 text-center">
                  <h5 class="text-left">
                    Participants
                    <a :href="joinUrl" target="_blank" style="float:right; color:#666!important">SHARE</a>
                  </h5>
                  <div v-for="participant in draft.data.join" v-bind:key="participant.address">
                      <div class="col-12" v-if="participant.address">
                        <div class="participant-card">
                          {{ participant.address }}
                        </div>
                      </div>
                  </div>
                  <div v-if="draft.data.join.length > 1">
                    <b-button style="width:100%; margin-top:15px" v-if="!isStoring" v-on:click="storeContract()" variant="success">STORE CONTRACT</b-button>
                    <div class="text-center" v-if="isStoring">Storing, please wait. You will be redirected to management page.</div>
                  </div>
                  <div v-if="draft.data.join.length <= 1">
                    You need at least 2 participants to create a contract on the blockchain
                  </div>
                </div>
              </div>
            </div>
            <div v-if="isLoading">
              Fetching your draft..
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
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
                app.joinUrl = window.location.protocol + '//' + window.location.host + '/join/' + app.$route.params.id
                if(app.draft.data.owner === app.scrypta.PubAddress){
                  app.body = app.draft.data.body
                  app.subject = app.draft.data.subject
                }else{
                  window.location = app.joinUrl
                }
                for(var i=0; i< app.draft.data.join.length; i++){
                  app.pubkeys.push(app.draft.data.join[i].pubkey)
                  app.participants.push(app.draft.data.join[i].address)
                  app.privkeys.push(app.draft.data.join[i].prv) //NOT 100% SECURE BUT REALLY USEFUL FOR EXPLAIN THE IDEA
                }
              })
      },
      updateDraft(){
        const app = this
        app.isUpdating = true
        app.axios.post('https://' + app.connected + '/storage/update',
            {
                data: {
                      "owner": app.scrypta.PubAddress,
                      "join": app.draft.data.join,
                      "subject": app.subject,
                      "body": app.body
                },
                uuid: app.$route.params.id
            })
            .then(function () {
              app.isUpdating = false
            })
            .catch(function () {
              app.isUpdating = false
              alert("Seems there's a problem, please retry or change node!")
            })
      },
      deleteDraft(redirect = true){
        const app = this
        app.isRemoving = true
        app.axios.post('https://' + app.connected + '/storage/remove',
            {
                uuid: app.$route.params.id
            })
            .then(function () {
              app.isRemoving = false
              if(redirect === true){
                window.location = '/drafts'
              }
            })
            .catch(function () {
              app.isRemoving = false
              alert("Seems there's a problem, please retry or change node!")
            })
      },
      storeContract(){
        const app = this
        if(app.isStoring === false){
          app.isStoring = true
          app.deleteDraft(false)
          app.axios.post('https://' + app.connected + '/trustlink/init',
            {
                addresses: app.pubkeys.join(',')
            })
            .then(function (response) {
              var trustlink = response.data.data.address
              var redeemScript = response.data.data.redeemScript

              var contractdata = {
                created_by: app.draft.data.owner,
                subject: app.subject,
                body: app.body,
                participants: app.participants.join(',')
              }
              
              contractdata = JSON.stringify(contractdata)
              app.axios.post('https://' + app.connected + '/trustlink/write',
                {
                    trustlink: trustlink,
                    private_keys: app.privkeys.join(','),
                    redeemScript: redeemScript,
                    protocol: 'contract://',
                    data: contractdata
                })
                .then(function (response) {
                  window.location = '/manage/' + response.data.data.uuid
                })
                .catch(function () {
                  app.isStoring = false
                  alert("Seems there's a problem, please retry or change node!")
                })
            })
            .catch(function () {
              app.isStoring = false
              alert("Seems there's a problem, please retry or change node!")
            })
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
      encrypted_wallet: '',
      draft: '',
      isLoading: true,
      isUpdating: false,
      subject: '',
      body: '',
      joinUrl: '',
      isStoring: false,
      pubkeys: [],
      privkeys: [],
      participants: []
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