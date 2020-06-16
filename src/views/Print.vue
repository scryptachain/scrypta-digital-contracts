<template>
  <div class="home">
    <div class="main text-left">
      <div class="container">
        <div class="show-print" style="text-align:center">
          <img src="/logo.png" width="60"/><br>
          <h3 style="font-size:20px">Scrypta Digital Contract</h3>
          <hr>
        </div>
        <h1 v-if="!contract.data.title">Dettagli Digital Contract</h1>
        <h1 v-if="contract.data.title">{{ contract.data.title }}</h1>
        <a href="#" class="hide-print" onclick="window.print()" style="float:right"><b-icon icon="printer"></b-icon></a>
        <div style="font-size:14px">
          Timestamp contratto: {{ contract.date }}<br>
          Identificativo contratto: {{ $route.params.contract }}<br>
          Creato dall'indirizzo: {{ contract.data.creator }}<br>
          Notarizzato al blocco: {{ contract.block }}
        </div>
        <hr>
        <div v-if="isLoading === false">
          <div :animated="false">
            <div label="Contratto">
              <h1 style="position:relative">
                Soggetti
                <a href="#" class="hide-print" v-on:click="decryptData">
                  <b-icon
                      v-if="address === contract.data.creator && !isDecrypted"
                      style="position:absolute; top:25px; right:20px; cursor:pointer"
                      icon="lock-open">
                  </b-icon>
                </a>
              </h1>
              <div v-for="(key, index) in contract.data.subjects" v-bind:key="index" style="border:1px solid #ccc; text-align:left; color:#000; border-radius:5px; margin-top:20px; font-size:12px; padding:15px; position:relative">
                <v-gravatar :email="key.address" style="float:left; height:55px; margin-right:10px;" />
                Soggetto #{{index}}<br>
                <div v-if="key.identity.name === undefined || key.identity.surname === undefined" style="color:#f00">Nome da decriptare</div>
                <div v-if="key.identity.name !== undefined && key.identity.surname !== undefined"><strong>{{ key.identity.name }} {{ key.identity.surname }}</strong></div>
                <span v-if="key.address.length === 34">{{ key.address }}</span>
                <br>
                <a :href="'https://me.scrypta.id/#/search/' + key.address" target="_blank">
                  <b-icon
                      style="position:absolute; top:25px; right:30px"
                      icon="account-box"
                      size="is-medium">
                  </b-icon>
                </a>
              </div>
              <div v-if="contract.data.object !== ''">
                <hr>
                <h1>Oggetto</h1><br>
                <div v-html="contract.data.object"></div>
              </div>
              <div v-if="contract.data.attachments.length > 0">
                <hr>
                <div class="columns">
                  <div class="column">
                    <h1>Allegati del contratto</h1>
                    <div v-for="file in contract.data.attachments" class="no-cut" v-bind:key="file.hash" style="border:1px solid #ccc; position:relative; text-align:left; color:#000; border-radius:5px; margin-top:20px; font-size:12px; padding:15px">
                        <v-gravatar :email="file.hash" style="float:left; height:55px; margin-right:10px;" />
                        <strong>{{ file.filename }}</strong><br>
                        <strong v-if="file.type">{{ file.type }} - </strong><strong>{{ file.size }} Byte</strong><br>
                        <strong>Hash file:</strong> {{ file.hash }}
                        <b-icon
                            v-if="verified.indexOf(file.hash) !== -1"
                            style="position:absolute; top:30px; right:30px; color: green"
                            icon="checkbox-marked-circle">
                        </b-icon>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div label="Firme">
              <hr>
              <h1>Firme</h1>
              <div v-for="(key, index) in contract.data.subjects" v-bind:key="index" style="border:1px solid #ccc; text-align:left; color:#000; border-radius:5px; margin-top:20px; font-size:12px; padding:15px; position:relative">
                <v-gravatar :email="key.address" style="float:left; height:55px; margin-right:10px;" />
                <span v-if="!isDecrypted">Soggetto #{{index}}</span>
                <span v-if="key.identity.name !== undefined && key.identity.surname !== undefined"><strong>{{ key.identity.name }} {{ key.identity.surname }}</strong></span>
                <span v-if="isDecrypted"></span><br>
                N. Firme obbligatorie: {{ Object.keys(signs[key.address]['required']).length }} / {{ signsdetails['required'].length }}<br>
                N. Firme opzionali: {{ Object.keys(signs[key.address]['optional']).length }} / {{ signsdetails['optional'].length }}<br>
                <div v-if="Object.keys(signs[key.address]['required']).length === signsdetails['required'].length" style="color:green">Il soggetto ha firmato il contratto.</div>
                <div v-if="Object.keys(signs[key.address]['required']).length > 0 || Object.keys(signs[key.address]['optional']).length > 0">
                  <hr>
                  <strong>Dettaglio firme</strong>
                  <div v-for="(sign, index) in signs[key.address]" v-bind:key="sign._id" class="small-icons">
                    <div v-if="index !== 'optional' && index !== 'required'">
                      <div v-if="index !== 'general'">Clausola #{{index}} <span v-if="sign.block > 0">firmata al blocco {{ sign.block }}</span><span v-if="!sign.block">in attesa di conferma</span> | {{ sign.date }} | <a :href="'https://proof.scryptachain.org/#/uuid/' + sign.uuid" target="_blank"><b-icon icon="export" ></b-icon></a></div>
                      <div v-if="index === 'general'">Contratto <span v-if="sign.block > 0">firmato al blocco {{ sign.block }}</span><span v-if="!sign.block">in attesa di conferma</span> | {{ sign.date }} | <a :href="'https://proof.scryptachain.org/#/uuid/' + sign.uuid" target="_blank"><b-icon icon="export" ></b-icon></a></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div label="Notifiche">
              <hr>
              <div v-if="notifications.length > 0">
                <br>
                <div>
                  <div v-for="(notification, index) in notifications" :label="'#' + (index + 1)" v-bind:key="notification.uuid">
                    <h3 style="font-size:25px; padding:0 0 10px 0; margin-top:5px; font-weight:bold">Notifica #{{index + 1}}</h3>
                    Scritta in blockchain da <strong>{{ identities[notification.address] }}</strong> e notarizzata al blocco <strong>{{ notification.block }}</strong><br>
                    Timestamp notifica: {{ notification.data.message.timestamp }}
                    <hr>
                    <div v-if="notification.data.message.plaintext !== ''" v-html="notification.data.message.plaintext"></div>
                    <div v-if="notification.data.message.attachments.length > 0">
                      <hr>
                      <h1>Allegati</h1>
                      <div v-for="file in notification.data.message.attachments" v-bind:key="file.hash" style="border:1px solid #ccc; position:relative; text-align:left; color:#000; border-radius:5px; margin-top:20px; font-size:12px; padding:15px">
                          <v-gravatar :email="file.hash" style="float:left; height:55px; margin-right:10px;" />
                          <strong>{{ file.filename }}</strong><br>
                          <strong v-if="file.type">{{ file.type }} - </strong><strong>{{ file.size }} Byte</strong><br>
                          <strong>Hash file:</strong> {{ file.hash }}
                      </div>
                    </div>
                    <hr>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
        <div v-if="isLoading === true">
          Carico contratto dalla blockchain...
        </div>
      </div>
    </div>
    <b-loading :is-full-page="true" :active.sync="isLoading" :can-cancel="true"></b-loading>
  </div>
</template>

<script>
  const ScryptaCore = require('@scrypta/core')
  const LZUTF8 = require('lzutf8')

  export default {
    name: 'Home',
    data(){ 
      return {
        scrypta: new ScryptaCore(true),
        address: '',
        wallet: '',
        activeTab: 0,
        activeNotification: 0,
        isDecrypted: false,
        isLoading: true,
        isSigning: false,
        isNotifying: false,
        isInvalidating: false,
        contract: {
          data: {
            title: ""
          }
        },
        subjects: [],
        identities: {},
        notifications: [],
        signs: {},
        signsdetails: { 
          required: ['GENERAL'],
          optional: []
        },
        dropFiles: [],
        files: [],
        verified: [],
        attachments_notify: [],
        plaintext_notify: '',
        dropFiles_notify: [],
        dropFiles_verify: [],
        verified_attachments: [],
        required_ids: [],
        optional_ids: [],
        isArchived: false
      }
    },
    async mounted() {
      const app = this
      app.wallet = await app.scrypta.returnDefaultIdentity()
      let SIDS = app.wallet.split(':')
      app.scrypta.staticnodes = true
      app.scrypta.mainnetIdaNodes = ['https://idanodejs01.scryptachain.org','https://idanodejs02.scryptachain.org','https://idanodejs03.scryptachain.org','https://idanodejs04.scryptachain.org','https://idanodejs05.scryptachain.org','https://idanodejs06.scryptachain.org']
      app.address = SIDS[0]
      let identity = await app.scrypta.returnIdentity(app.address)
      app.wallet = identity
      let check_archived = await app.scrypta.post('/read', { protocol: 'DC://', address: app.$route.params.contract})
      let isArchived = true
      for(let k in check_archived.data){
        let contract = check_archived.data[k]
        if(contract.data.contract !== undefined){
          isArchived = false
        }
      }
      app.isArchived = isArchived
      let contracts_data = await app.scrypta.post('/read', { protocol: 'DC://', address: app.$route.params.contract, history: true })
      for(let k in contracts_data.data){
        let contract = contracts_data.data[k]
        if(contract.data.title !== undefined && contract.data.title !== ''){
          contract.data.title = LZUTF8.decompress(contract.data.title, { inputEncoding: 'Base64' });
        }
        if(contract.data.object !== undefined && contract.data.object !== ''){
          contract.data.object = LZUTF8.decompress(contract.data.object, { inputEncoding: 'Base64' });
        }
        if(contract.data.contract !== undefined){
          app.contract = contract
          for(let y in contract.data.signs){
            if(contract.data.signs[y].required === true){
              app.signsdetails['required'].push(contract.data.signs[y])
              app.required_ids.push(contract.data.signs[y].number)
            }else{
              app.signsdetails['optional'].push(contract.data.signs[y])
              app.optional_ids.push(contract.data.signs[y].number)
            }
          }
          for(let j in contract.data.subjects){
            app.subjects.push(contract.data.subjects[j].address)
            if(app.signs[contract.data.subjects[j].address] === undefined){
              app.signs[contract.data.subjects[j].address] = {}
              app.signs[contract.data.subjects[j].address]['required'] = []
              app.signs[contract.data.subjects[j].address]['optional'] = []
            }
            app.identities[contract.data.subjects[j].address] = contract.data.subjects[j].address
            let checkinteractions = await app.scrypta.post('/read', { protocol: 'DC://', address: contract.data.subjects[j].address, history: true})
            for(let jjj in checkinteractions.data){
              let interaction = checkinteractions.data[jjj]
              if(interaction.refID.indexOf('SIGN:') !== -1){
                let expsign = interaction.refID.split(':')
                let data = JSON.parse(interaction.data.message)
                interaction.date = new Date(data.timestamp)
                if(expsign.length === 2 && expsign[1] === contract.address){
                  app.signs[interaction.data.address]['general'] = interaction
                  app.signs[interaction.data.address]['required'].push(interaction)
                }else if(expsign.length === 3 && expsign[2] === contract.address){
                  app.signs[interaction.data.address][expsign[1]] = interaction
                  if(app.required_ids.indexOf(expsign[1]) !== -1){
                    app.signs[interaction.data.address]['required'].push(interaction)
                  }else{
                    app.signs[interaction.data.address]['optional'].push(interaction)
                  }
                }
              }
              if(interaction.refID === 'NOTIFY:' + app.$route.params.contract){
                let data = JSON.parse(interaction.data.message)
                interaction.data.message = data
                if(data.attachments > 0 || data.plaintext !== ''){
                  if(data.plaintext !== ''){
                    interaction.data.message.plaintext = LZUTF8.decompress(data.plaintext, { inputEncoding: 'Base64' })
                  }
                  let date = new Date(interaction.data.message.timestamp)
                  interaction.data.message.timestamp = date
                  app.notifications.push(interaction)
                }
              }
            }
          }
          app.notifications.sort(function(a, b){return a.block - b.block});
        }else if(contract.data.sign !== undefined){
          app.signs.push(contract)
        }else{
          app.interactions.push(contract)
        }
      }
      app.isLogging = false
      app.isLoading = false
    },
    methods: {
      async decryptData(){
        const app = this
        if(app.contract.data.creator === app.address){
          app.$buefy.dialog.prompt({
            message: `Inserisci la password del wallet`,
            inputAttrs: {
              type: "password"
            },
            trapFocus: true,
            onConfirm: async password => {
              let key = await app.scrypta.readKey(password, app.wallet.wallet);
              if (key !== false) {
                for(let j in app.contract.data.subjects){
                  app.contract.data.subjects[j].identity = await app.scrypta.decryptData(app.contract.data.subjects[j].identity, key.prv)
                  app.contract.data.subjects[j].identity = JSON.parse(app.contract.data.subjects[j].identity)
                  app.identities[app.contract.data.subjects[j].address] = app.contract.data.subjects[j].identity['name'] + ' ' + app.contract.data.subjects[j].identity['surname']
                }
                app.isDecrypted = true
              }else{
                app.$buefy.toast.open({
                  message: "La password è errata!",
                  type: "is-danger"
                })
              }
            }
          })
        }else{
          app.$buefy.toast.open({
            message: "Non puoi decodificare le informazioni in quanto non proprietario!",
            type: "is-danger"
          })
        }
      },
    },
  }
</script>

<style>
  .small-icons .mdi-24px.mdi-set, .small-icons .mdi-24px.mdi:before{
    font-size:12px
  }
</style>