<template>
  <div class="home">
    <div class="main text-left">
      <div class="container">
        <h1>Crea un nuovo contratto</h1>
        <hr>
        <b-tabs v-model="activeTab" :animated="false">
            <b-tab-item label="Soggetti">
              <h1>
                Soggetti
                <b-button type="is-primary" style="float:right" v-on:click="addSubject"><b-icon icon="plus"></b-icon></b-button>
              </h1>
              <br>
              <div v-for="(key, index) in subjects" v-bind:key="index">
                <div class="columns" style="position:relative">
                  <div class="column">
                    <b-field :label="'Nome #' + index">
                      <b-input v-model="subjects[index].nome"></b-input>
                    </b-field>
                  </div>
                  <div class="column">
                    <b-field :label="'Cognome #' + index">
                      <b-input v-model="subjects[index].cognome"></b-input>
                    </b-field>
                  </div>
                  <div class="column">
                    <b-field :label="'Indirizzo Lyra #' + index">
                      <b-input v-model="subjects[index].address"></b-input>
                    </b-field>
                  </div>
                  <b-button type="is-primary" style="position:absolute; top: 44px; right:0" v-on:click="deleteSubject(index)"><b-icon icon="backspace"></b-icon></b-button>
                </div>
              </div>
              <div v-if="subjects.length === 0">
                <h2>In questa sezione dovrai inserire tutte le identità dei soggetti e le loro relative chiavi pubbliche. Se non sai come reperire le chiavi pubbliche chiedi ai soggetti di andare all'indirizzo di partecipazione del contratto e aggiungere le proprie identità.<br><br>
                L'indirizzo di partecipazione è <a target="_blank" :href="url + '/#/join/' + contract_address">{{url}}/#/join/{{ contract_address }}</a>
                <br><br>
                <span style="color:#f00">
                  Importante: non aggiornare o uscire dalla pagina mentre aspetti che i soggetti inseriscano le loro identità.
                </span>
                </h2>
              </div>
              <hr>
              <b-button type="is-primary" style="float:right" v-on:click="showObject()">AVANTI</b-button>
            </b-tab-item>

            <b-tab-item label="Oggetto">
              <b-field label="Tipologia di contratto">
                  <b-select v-model="type" placeholder="Seleziona una tipologia">
                      <option
                          v-for="option in types"
                          :value="option.id"
                          :key="option.id">
                          {{ option.label }}
                      </option>
                  </b-select>
              </b-field>
              
              <vue-editor v-if="type === 'plaintext'" v-model="plaintext" />
              <hr>
              <b-button type="is-primary" style="float:left" v-on:click="showSubjects()">INDIETRO</b-button>
              <b-button type="is-primary" style="float:right" v-on:click="showConfirm()">AVANTI</b-button>
            </b-tab-item>
            <b-tab-item label="Conferma">
              <h1>Conferma tutti i dati e crea il contratto</h1>
              <hr>
              <b-button type="is-primary" style="float:left" v-on:click="showObject()">INDIETRO</b-button>
              <b-button type="is-primary" style="float:right" v-on:click="createDraft()">CREA CONTRATTO</b-button>
            </b-tab-item>
        </b-tabs>
      </div>
    </div>
  </div>
</template>

<script>
  const ScryptaCore = require('@scrypta/core')

  export default {
    name: 'Home',
    data(){ 
      return {
        scrypta: new ScryptaCore(true),
        address: '',
        wallet: '',
        isLoading: true,
        url: '',
        activeTab: 0,
        contract_address: '',
        object: [],
        subjects: [],
        types: [
          {label: "TESTO LIBERO (PUBBLICO)", id: "plaintext"},
          {label: "SOLO CALCOLO HASH DI FILE (PRIVATO)", id: "hash"}
        ],
        type: 'plaintext',
        plaintext: ''
      }
    },
    async mounted() {
      const app = this
      app.wallet = await app.scrypta.returnDefaultIdentity()
      let SIDS = app.wallet.split(':')
      app.address = SIDS[0]
      let identity = await app.scrypta.returnIdentity(app.address)
      app.wallet = identity
      app.isLogging = false
      app.isLoading = false
      let currentURL = location.protocol+'//'+location.hostname
      if(location.port !== undefined){
        currentURL+=':'+location.port
      }
      app.url = currentURL
      let newaddress = await app.scrypta.createAddress('new', false)
      app.contract_address = newaddress.pub
      app.scrypta.connectP2P(function(data){
        console.log(data)
      })
    },
    methods: {
      async createDraft(){
        const app = this
        let be = await app.axios.get(app.backendURL)
        console.log(be.data)
      },
      showSubjects(){
        const app = this
        app.activeTab = 0
      },
      showObject(){
        const app = this
        app.activeTab = 1
      },
      showConfirm(){
        const app = this
        app.activeTab = 2
      },
      addSubject(){
        const app = this
        app.subjects.push({
          nome: "",
          cognome: "",
          address: ""
        })
      },
      deleteSubject(index){
        const app = this
        let temp = app.subjects
        app.subjects = []
        for(let k in temp){
          if(parseFloat(k) !== parseFloat(index)){
            app.subjects.push(temp[k])
          }
        }
      }
    },
  }
</script>