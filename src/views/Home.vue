<template>
  <div class="home">
    <div class="node-badge" v-if="connected">{{ connected }}</div>
    <div v-if="!login">
      <img style="margin: 30px 0 20px 0" width="100" src="../assets/logo.png">
      <h2>Scrypta Contracts</h2>
      <p>
        This is a simple example of how we're planning to implement contracts on Scrypta Blockchain.<br><br>
        Our approach is simple: we don't need to create a smart contract for every real contract.<br>
        Sometimes we need to write our existing (yet valid) contract over the blockchain<br>
        and start a secure communication channel between two -or more- entities.<br><br>
        This is a simple use case will use our core technologies like ScryptaID, Trustlink and IdaNodes.<br>
        The code is auditable here <a href="https://github.com/scryptachain/scrypta-contracts">https://github.com/scryptachain/scrypta-contracts</a><br>
        Please use it for research or development purposes and feel free to contribute on GitHub.
      </p>
      <b-button variant="success" v-on:click="showLogin">Enter with ScryptaID</b-button>
    </div>
    <div v-if="login">
      <img style="margin: 30px 0 20px 0" width="100" src="../assets/logo.png">
      <h2>Scrypta Contracts</h2>
      <b-container>
        <b-row class="mt-3">
          <b-col md="6">
            <b-card bg-variant="light" class="border-0 mb-3">
              <h2>Start creating a new wallet.</h2>
              <b-form-input
                v-model="createPwd"
                type="password"
                placeholder="Enter a strong wallet password and don't forget it!"
                class="mb-3"
              ></b-form-input>
              <b-form-input
                v-model="createPwdRepeat"
                type="password"
                placeholder="Repeat again your password."
                class="mb-3"
              ></b-form-input>
              <b-button @click.prevent="createWallet" variant="primary">CREATE WALLET</b-button>
            </b-card>
          </b-col>
          <b-col md="6">
            <b-card bg-variant="light" class="border-0 mb-3 pb-5">
              <h2>Or import an exsisting one.</h2>
              <p>Please select a valid wallet .sid file</p>
              <b-button @click.prevent="openImportWallet" variant="primary" class="mt-3">IMPORT WALLET</b-button>
            </b-card>
          </b-col>
        </b-row>
      </b-container>
      <b-modal v-model="importShow" hide-footer title="Import a wallet">
        <b-form-file
          v-model="file"
          placeholder="Just drag and drop here or select a .sid file"
          drop-placeholder="Drop file here..."
          @change="loadWalletFromFile"
          class="text-left mb-3 mt-3"
        />
      </b-modal>
    </div>
  </div>
</template>

<style>
  #app{
    text-align: center;
    font-family: 'karmillaregular';
  }
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
        if (this.scrypta.keyExsist()) {
          this.$router.push('/dashboard')
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
        }
      },
      showLogin(){
        this.login = true
      },

    openImportWallet() {
      this.importShow = true;
    },
    loadWalletFromFile(ev) {
      const file = ev.target.files[0];
      const reader = new FileReader();
      var app = this;
      reader.onload = function() {
        var dataKey = reader.result;
        app.scrypta.saveKey(dataKey).then(function() {
          setTimeout(function() {
            location.reload();
          }, 1000);
        });
      };
      reader.readAsText(file);
    },
    createWallet() {
      var app = this;
      if (app.createPwd !== "" && app.createPwd === app.createPwdRepeat) {
        app.scrypta
          .createAddress(this.createPwd, true)
          .then(function(response) {
            app.axios
              .post("https://" + app.connected + "/init", {
                address: response.pub,
                api_secret: response.api_secret
              })
              .then(function() {
                location.reload();
              })
              .catch(function() {
                alert("Seems there's a problem, please retry or change node!");
              });
          });
      } else {
        alert("Password is incorrect!");
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
      file: "",
      createPwd: "",
      createPwdRepeat: "",
      importShow: false,
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
</style>