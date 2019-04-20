<template>
  <div class="home">
    <div class="node-badge" v-if="connected">{{ connected }}</div>
    <top-bar></top-bar>
    <b-modal v-model="passwordShow" hide-footer title="Unlock your wallet first">
      <b-form-input v-model="unlockPwd" type="password" placeholder="Enter wallet password"></b-form-input><br>
      <div @click.prevent="unlockWallet" class="btn btn-primary">UNLOCK WALLET</div>
    </b-modal>
    <div class="container main-container">
      <div class="row">
        <div class="col-sm-12">
            <div v-if="!isLoading">
              <div v-if="contract" style="position:relative">
                <div v-if="showdetails">
                  <b-button variant="primary" v-on:click="showsendmask()" style="position:absolute; top:0; right:0; font-size:11px">Send data</b-button>
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
                    <div v-for="data in history" v-bind:key="data.txid">
                      <div v-if="data.txid" class="data-card">
                        {{ data.data }}<br><span style="font-size:12px"><strong><i>sent by</i></strong> {{ data.sender }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="showsend" style="position:relative">
                  <h4>Send data to contract</h4>
                  <div style="position:absolute; cursor:pointer; font-size:33px; top:0; right:0" v-on:click="showdetailsmask">X</div>
                  <p>This MVP is currenty locked to 80 characters length, so use it well.</p>
                  <br>
                  <b-form-group id="message" label="Message" label-for="messageTextarea">
                    <b-form-textarea
                      id="messageTextarea"
                      v-model="messageToSend"
                      @keyup.native="checkMessage"
                      placeholder="Write a message (Max 80 characters)"
                      rows="3"
                      max-rows="6"
                    />
                  </b-form-group>
                  <small v-bind:style="{ color: smallColor }">Message is {{ messageToSend.length }} characters long.</small><br><br>
                  <b-button variant="success" v-on:click="openUnlockWallet()">Send data</b-button>
                </div>
              </div>
              <div v-if="!contract">
                Contract not found
              </div>
            </div>
            <div v-if="isLoading">
              Loading contract from blockchain.<br>If nothing happens please refresh the page or wait a minute...
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
      checkUser(){
        const app = this
        if(app.scrypta.keyExsist()){
          app.public_address = this.scrypta.PubAddress;
          app.encrypted_wallet = this.scrypta.RAWsAPIKey;
        }else{
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
            if(inarray === true){
              app.axios.post('https://' + app.connected + '/received', {address: app.contract.address})
                .then(function (response) {
                  console.log(response)
                  app.history = response.data.data
                });
            }
            app.isLoading = false
          });
      },
      showsendmask(){
        const app = this
        app.showsend = true
        app.showdetails = false
      },
      showdetailsmask(){
        const app = this
        app.showsend = false
        app.showdetails = true
      },
      checkMessage(){
        const app = this
        if(app.messageToSend.length > 80){
          app.smallColor = '#f00'
        }else{
          app.smallColor = '#000'
        }
      },
      openUnlockWallet(){
        const app = this
        if (app.messageToSend) {
          if(app.messageToSend.length <= 80){
            app.passwordShow = true
          }else{
            alert('Message too long!')
          }
        }else{
          alert('Write the form first!')
        }
      },
      unlockWallet(){
        if(this.unlockPwd !== ''){
          var app = this
          app.decrypted_wallet = 'WALLET LOCKED'
          app.scrypta.readKey(this.unlockPwd).then(function (response) {
            if(response !== false){
              app.private_key = response.prv
              app.passwordShow = false
              app.sendTX()
            }else{
              alert('Wrong password!')
            }
          })
        }else{
          alert('Write your password first')
        }
      },
      sendTX(){
        const app = this
        if(app.isSending === false){
          if(app.messageToSend.length <= 80){
            app.isSending = true;
            app.axios
              .post('https://' + app.connected + '/send', {
                from: app.contract.data.created_by,
                to: app.contract.address,
                amount: 0.001,
                private_key: app.private_key,
                message: app.messageToSend
              })
              .then(function (response) {
                if(response.data.data.success === true){
                  alert('Data sent correctly, here the txid: ' + response.data.data.txid);
                  app.addressToSend = '';
                  app.amountToSend = '';
                  app.messageToSend = '';
                  app.private_key = '';
                  app.unlockPwd = '';
                  app.isSending = false;
                }else{
                  alert('Something goes wrong: ' + response.data.data.walletresponse.error);
                }
              })
          }else{
            alert('Message is too long!')
          }
        }
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
      history: '',
      showsend: false,
      showdetails: true,
      encrypted_wallet: 'NO WALLET',
      decrypted_wallet: 'WALLET LOCKED',
      unlockPwd: '',
      public_address: '',
      private_key: '',
      fileToUpload: '',
      fileName: '',
      isSending: false,
      messageToSend: '',
      smallColor: '000',
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
  .data-card{
    border:1px solid #ccc; 
    border-radius:5px; 
    padding:20px;
    text-align:left; 
    margin:10px 0
  }
</style>