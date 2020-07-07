<template>
  <div id="app">
    <div v-if="!isLogging && wallet && backup">
      <b-navbar class="hide-print">
        <template slot="brand">
          <b-navbar-item tag="router-link" :to="{ path: '/' }">
            <img src="/logo.png" />
          </b-navbar-item>
        </template>
        <template slot="start">
          <b-navbar-item href="/#/">Dashboard</b-navbar-item>
          <b-navbar-item href="/#/create">Nuovo</b-navbar-item>
          <b-navbar-item href="/#/archive">Archivio</b-navbar-item>
          <b-navbar-item href="/#/search">Ricerca</b-navbar-item>
        </template>

        <template slot="end">
          <b-navbar-item tag="div">
            <div class="buttons">
              <v-gravatar class="gravatar" :email="address" style="margin-right: 10px; height: 80px;max-height: 37px;float: right;margin-top: -8px;border-radius: 4px;"/>
              <a v-on:click="logout" class="button login-btn is-primary">
                <strong>Logout</strong>
              </a>
            </div>
          </b-navbar-item>
        </template>
      </b-navbar>
      <router-view />
      <div class="hide-print">
        <hr />Scrypta Digital Contracts is
        <a
          href="https://github.com/scryptachain/scrypta-digital-contracts"
          target="_blank"
        >open-source</a> project by
        <a href="https://scrypta.foundation" target="_blank">Scrypta Foundation</a>.
        <br />
        <br />
      </div>
    </div>

    <div v-if="!isLogging && wallet && !backup">
      <section class="hero">
        <div class="hero-body" style="padding: 0;">
          <div class="container" id="backup" style="margin-top:50px;">
            <div class="card">
              <div style="padding: 50px 20px;">
                <h1 class="title is-1">Fai un backup della tua identità</h1>
                <p>Per prevenire la perdità di dati è fondamentale fare un backup sicuro di questo file.</p><br>
                <b-button v-on:click="downloadBackup" type="is-primary" size="is-large">ESEGUI BACKUP</b-button>
                <a id="downloadid" style="display:none"></a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div v-if="!wallet">
      <section class="hero">
        <div class="hero-body" style="padding: 0;">
          <div class="container" id="create" style="margin-top:50px;">
            <div class="card">
              <div style="padding: 50px 20px;">
                <img src="/logo.png"><br>
                <h1 class="title is-1">Scrypta Digital Contracts</h1>
                <h2 class="subtitle">
                  <br />Hai bisogno un'identità Scrypta per entrare in piattaforma.
                  <br />
                  <br />Usa <a href="https://id.scryptachain.org/" target="_blank">Scrypta ID Extension</a>, <a v-on:click="showCreate">crea un nuovo wallet</a> <br><br><b>oppure</b><br><br>accedi con il pulsante sottostante.
                  <br />
                  <br />
                  <div id="scrypta-login" dapp="Digital Contracts"></div>
                </h2>
              </div>
            </div>
            <br />Scrypta Digital Contracts
            <a
              href="https://github.com/scryptachain/scrypta-digital-contracts"
              target="_blank"
            >open-source</a> project by
            <a href="https://scrypta.foundation" target="_blank">Scrypta Foundation</a>.
            <br />
            <br />
          </div>
        </div>
      </section>
    </div>

    <b-loading :is-full-page="true" :active.sync="isLogging" :can-cancel="false"></b-loading>
    <b-modal :active.sync="showCreateModal" has-modal-card trap-focus aria-role="dialog" aria-modal>
      <form action>
        <div class="modal-card" style="width: auto">
          <header class="modal-card-head">
            <p class="modal-card-title">Crea identità</p>
          </header>
          <section class="modal-card-body">
            <b-field label="Inserisci una nuova password">
              <b-input
                type="password"
                v-model="password"
                password-reveal
                placeholder="Inserisci la password"
                required
              ></b-input>
            </b-field>

            <b-field v-if="!wallet" label="Ripeti la password">
              <b-input
                type="password"
                v-model="passwordrepeat"
                password-reveal
                placeholder="Ripeti la password"
                required
              ></b-input>
            </b-field>
          </section>
          <footer v-if="!isCreating && !isUpdating" class="modal-card-foot">
            <button
              v-if="!wallet"
              class="button is-primary"
              style="width:100%"
              v-on:click="createUser"
            >CREA</button>
          </footer>
          <footer v-if="isCreating" class="modal-card-foot">
            <div style="text-align:center">Creo l'identità, si prega di attendere...</div>
          </footer>
        </div>
      </form>
    </b-modal>
  </div>
</template>

<script>
let ScryptaCore = require("@scrypta/core");

export default {
  data() {
    return {
      scrypta: new ScryptaCore(true),
      address: "",
      wallet: "",
      isLogging: true,
      file: [],
      isCreating: false,
      backup: false,
      isUpdating: false,
      showCreateModal: false,
      password: "",
      passwordrepeat: ""
    };
  },
  async mounted() {
    const app = this;
    app.wallet = await app.scrypta.importBrowserSID();
    app.wallet = await app.scrypta.returnDefaultIdentity();
    if (app.wallet.length > 0) {
      let SIDS = app.wallet.split(":");
      app.address = SIDS[0];
      let identity = await app.scrypta.returnIdentity(app.address);
      app.wallet = identity;
      let check_backup = localStorage.getItem('sid_backup')
      if(check_backup !== null && check_backup !== undefined && check_backup === app.address){
        app.backup = true
      }
      app.isLogging = false;
    } else {
      app.isLogging = false;
    }
  },
  methods: {
    loadWalletFromFile() {
      const app = this;
      const file = app.file;
      const reader = new FileReader();
      reader.onload = function() {
        var dataKey = reader.result;

        app.$buefy.dialog.prompt({
          message: `Enter wallet password`,
          inputAttrs: {
            type: "password"
          },
          trapFocus: true,
          onConfirm: async password => {
            let key = await app.scrypta.readKey(password, dataKey);
            if (key !== false) {
              app.scrypta.importPrivateKey(key.prv, password);
              localStorage.setItem("SID", dataKey)
              let exp = dataKey.split(':')
              localStorage.setItem("sid_backup", exp[0])
              location.reload();
            } else {
              app.$buefy.toast.open({
                message: "Wrong password!",
                type: "is-danger"
              });
            }
          }
        });
      };
      reader.readAsText(file);
    },
    showCreate() {
      const app = this;
      app.showCreateModal = true;
    },
    logout() {
      localStorage.setItem("SID", "");
      location.reload();
    },
    async createUser() {
      const app = this;
      if (app.password !== "") {
        if (app.passwordrepeat === app.password) {
          app.isCreating = true;
          setTimeout(async function() {
            let id = await app.scrypta.createAddress(app.password, true);
            let identity = await app.scrypta.returnIdentity(id.pub);
            app.address = id.pub;
            app.wallet = identity;
            localStorage.setItem("SID", id.walletstore);
            app.showCreateModal = false;
            app.password = "";
            app.passwordrepeat = "";
            let tx = await app.scrypta.post("/init", {
              address: id.pub,
              airdrop: true
            });
            if (tx.airdrop_tx === false) {
              app.$buefy.toast.open({
                message: "Sorry, airdrop was not successful!",
                type: "is-danger"
              });
            }
            app.isCreating = false;
          }, 500);
        } else {
          app.$buefy.toast.open({
            message: "Passwords doesn't matches.",
            type: "is-danger"
          });
        }
      } else {
        app.$buefy.toast.open({
          message: "Write a password first!",
          type: "is-danger"
        });
      }
    },
    downloadBackup(){
      const app = this
      app.$buefy.dialog.prompt({
        message: `Enter wallet password`,
        inputAttrs: {
          type: "password"
        },
        trapFocus: true,
        onConfirm: async password => {
          let SID = localStorage.getItem('SID')
          let key = await app.scrypta.readKey(password, SID);
          if (key !== false) {
            var a = document.getElementById("downloadid");
            app.backup = true
            localStorage.setItem('sid_backup', app.address)
            var file = new Blob(
              [SID],
              { type: "sid" }
            );
            a.href = URL.createObjectURL(file);
            a.download = app.address + ".sid";
            var clickEvent = new MouseEvent("click", {
              view: window,
              bubbles: true,
              cancelable: false
            });
            a.dispatchEvent(clickEvent);
          }else{
            app.$buefy.toast.open({
              message: "Wrong password!",
              type: "is-danger"
            });
          }
        }
      })
    }
  }
};
</script>

<style>
  .show-print{
    display: none;
  }
  @media print {
    .hide-print{
      display:none!important;
    }
    .show-print{
      display:block!important;
    }
    .no-cut{
        page-break-inside: avoid;
    }
  }
  #app {
    font-family: "Sen";
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
  }
  #nav {
    padding: 30px;
  }

  #nav a {
    font-weight: bold;
    color: #2c3e50;
  }

  #nav a.router-link-exact-active {
    color: #42b983;
  }
  .container{
    padding:0 15px
  }
  @media screen and (max-width: 1024px){
    .login-btn{
      width: 100%!important;
    }
    .gravatar{
      display:none;
    }
    .card-footer-item{
      font-size:12px!important;
    }
  }
</style>