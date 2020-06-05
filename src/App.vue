<template>
  <div id="app">
    <div v-if="!isLogging && !needsRSA && wallet">
      <b-navbar>
        <template slot="brand">
          <b-navbar-item tag="router-link" :to="{ path: '/' }">
            <img src="/logo.png" />
          </b-navbar-item>
        </template>
        <template slot="start">
          <b-navbar-item href="/#/">Home</b-navbar-item>
          <b-navbar-item href="/#/create">Crea nuovo</b-navbar-item>
          <b-navbar-item href="/#/contracts">I miei contratti</b-navbar-item>
        </template>

        <template slot="end">
          <b-navbar-item tag="div">
            <div class="buttons">
              <a :href="'/#/address/' + address">
                <v-gravatar :email="address" style="margin-right: 10px; height: 80px;max-height: 37px;float: right;margin-top: -8px;border-radius: 4px;"/>
              </a>
              <a v-on:click="logout" class="button is-primary">
                <strong>Logout</strong>
              </a>
            </div>
          </b-navbar-item>
        </template>
      </b-navbar>
      <router-view />
      <hr />Scrypta Digital Contracts is an
      <a
        href="https://github.com/scryptachain/scrypta-digital-contracts"
        target="_blank"
      >open-source</a> project by
      <a href="https://scrypta.foundation" target="_blank">Scrypta Foundation</a>.
      <br />
      <br />
    </div>
    <div v-if="needsRSA && wallet">
      <section class="hero">
        <div class="hero-body">
          <div class="container">
            <b-button
              size="is-medium"
              style="position: absolute; top: 0; right: 0;"
              type="is-primary"
              v-on:click="logout"
            >Logout</b-button>
            <img src="/logo.png" width="100" />
            <br />
            <br />
            <h1 class="title">Create your RSA keys</h1><br>
            <h2 class="subtitle">
              Scrypta Contracts will allow you to create and store contracts in the blockchain.
              <br><br>
              Your address is {{ address }} but we need an RSA key before start.
              <br />
              <br />
              <b-button size="is-medium" type="is-primary" v-on:click="showCreate">Create RSA Keys</b-button>
            </h2>
            <hr />Scrypta Digital Contracts is an
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
    <div v-if="!wallet">
      <section class="hero">
        <div class="hero-body" style="padding: 0;">
          
          <div class="container" style="margin-top:50px;" id="login">
            <div class="card">
              <div style="padding: 50px 20px;">
                <img src="/logo.png"><br>
                <h1 class="title is-1">Scrypta Digital Contracts</h1><br>
                <h2 class="subtitle">
                  Enter with 
                  <a
                    href="https://id.scryptachain.org"
                  >Scrypta Extension Browser</a> or enter with your existing .sid file.
                  <br />
                  <br />
                  <b-upload v-model="file" v-on:input="loadWalletFromFile" drag-drop>
                    <section class="section">
                      <div class="content has-text-centered text-center" style="text-align:center!important; width:100%">
                        <p class="text-center" style="text-align:center!important;">Drag and drop your .sid here or click to upload.</p>
                      </div>
                    </section>
                  </b-upload>
                </h2>
              </div>
            </div>
            <br />Scrypta Digital Contracts is an
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
            <p v-if="!wallet" class="modal-card-title">Create new Identity</p>
            <p v-if="wallet" class="modal-card-title">Update Identity</p>
          </header>
          <section class="modal-card-body">
            <b-field label="Insert Password">
              <b-input
                type="password"
                v-model="password"
                password-reveal
                placeholder="Your main password"
                required
              ></b-input>
            </b-field>

            <b-field v-if="!wallet" label="Repeat password">
              <b-input
                type="password"
                v-model="passwordrepeat"
                password-reveal
                placeholder="Repeat password"
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
            >CREATE</button>
            <button
              v-if="wallet"
              class="button is-primary"
              style="width:100%"
              v-on:click="updateUser"
            >UPDATE</button>
          </footer>
          <footer v-if="isCreating" class="modal-card-foot">
            <div style="text-align:center">Creating identity, please wait...</div>
          </footer>
          <footer v-if="isUpdating" class="modal-card-foot">
            <div style="text-align:center">Updating identity, please wait...</div>
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
      needsRSA: false,
      isCreating: false,
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
      if (identity.rsa === undefined) {
        app.needsRSA = true;
      }
      app.wallet = identity;
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
              localStorage.setItem("SID", dataKey);
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
            await app.scrypta.createRSAKeys(id.pub, app.password);
            let identity = await app.scrypta.returnIdentity(id.pub);
            app.needsRSA = false;
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
    async updateUser() {
      const app = this;
      if (app.password !== "") {
        let walletstore = app.wallet.wallet;
        let key = await app.scrypta.readKey(app.password, walletstore);
        if (key !== false) {
          app.isUpdating = true;
          setTimeout(async function() {
            let res = await app.scrypta.createRSAKeys(
              app.wallet.wallet,
              app.password
            );
            if (res !== false) {
              let identity = await app.scrypta.returnIdentity(app.address);
              let balance = await app.scrypta.get("/balance/" + app.address);
              if (balance.balance === 0) {
                await app.scrypta.post("/init", {
                  dapp_address: app.address,
                  airdrop: true
                });
              }
              app.needsRSA = false;
              app.wallet = identity;
              app.showCreateModal = false;
              app.password = "";
              app.passwordrepeat = "";
              app.isUpdating = false;
            } else {
              app.isUpdating = false;
              app.$buefy.toast.open({
                message: "Password is wrong!",
                type: "is-danger"
              });
            }
          }, 500);
        } else {
          app.$buefy.toast.open({
            message: "Wrong password!",
            type: "is-danger"
          });
        }
      } else {
        app.$buefy.toast.open({
          message: "Write a password first!",
          type: "is-danger"
        });
      }
    }
  }
};
</script>

<style>
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

.center-home {
  position: absolute;
  top: 45%;
  -moz-transform: translateY(-45%);
  -webkit-transform: translateY(-45%);
  transform: translateY(-45%);
}

.center {
  margin: 0;
  position: absolute;
  top: 36%;
}

.section {
  display: flex;
}

.middle {
  margin: auto;
}

.is-horizontal {
  display: flex;
}
.card-image {
  width: 100%;
  height: 100%;
}
.card-stacked {
  flex-direction: column;
  flex: 1 1 auto;
  display: flex;
  position: relative;
}
.card-content {
  flex-grow: 1;
}
</style>