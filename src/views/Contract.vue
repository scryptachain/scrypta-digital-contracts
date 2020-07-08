<template>
  <div class="home">
    <div class="main text-left">
      <div class="container">
        <v-gravatar :email="$route.params.contract" style="float:left; height:70px; margin-right:20px;" />
        <h1 v-if="!contract.data.title">Dettagli Digital Contract</h1>
        <h1 v-if="contract.data.title">{{ contract.data.title }}</h1>
        {{ $route.params.contract }}
        <a :href="'https://proof.scryptachain.org/#/uuid/' + contract.uuid" target="_blank" style="float:right"><b-icon icon="export" ></b-icon></a>
        <a :href="'/#/print/' + $route.params.contract" style="float:right; margin-right:10px;"><b-icon icon="printer" ></b-icon></a>
        <hr>
        <div v-if="isLoading === false">
          <b-tabs :animated="false" v-model="activeTab">
            <b-tab-item label="Contratto">
              <h1>
                Soggetti
                <a href="#" v-on:click="decryptData">
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
                    <div v-for="file in contract.data.attachments" v-bind:key="file.hash" style="border:1px solid #ccc; position:relative; text-align:left; color:#000; border-radius:5px; margin-top:20px; font-size:12px; padding:15px">
                        <v-gravatar :email="file.hash" style="float:left; height:55px; margin-right:10px;" />
                        <strong>{{ file.filename }}</strong><br>
                        <strong v-if="file.type">{{ file.type }} - </strong><strong>{{ file.size }} Byte</strong><br>
                        <strong>Hash file:</strong> {{ file.hash }}
                        <b-icon
                            v-if="verified.indexOf(file.hash) !== -1"
                            style="position:absolute; top:30px; right:30px; color: green"
                            icon="checkbox-marked-circle">
                        </b-icon>
                    </div><hr>
                    <h3 style="font-size:20px; font-weight:bold">Verifica allegati</h3><br>
                    <b-field>
                        <b-upload v-on:input="calculateHashes" v-model="dropFiles" multiple drag-drop>
                            <section class="section">
                                <div class="content has-text-centered" style="width:100%">
                                    <p>
                                        <b-icon
                                            icon="upload"
                                            size="is-large">
                                        </b-icon>
                                    </p>
                                    <p>Verifica i file trascinandoli o cliccando qui.</p>
                                </div>
                            </section>
                        </b-upload>
                    </b-field>
                    <div v-if="verified.length === contract.data.attachments.length">
                      <h1 style="width:100%; text-align:center">Tutti i file sono stati verificati!</h1>
                    </div>
                  </div>
                </div>
              </div>
            </b-tab-item>

            <b-tab-item label="Firme">
              <h1>Firme</h1>
              <div v-for="(key, index) in contract.data.subjects" v-bind:key="index" style="border:1px solid #ccc; text-align:left; color:#000; border-radius:5px; margin-top:20px; font-size:12px; padding:15px; position:relative">
                <v-gravatar :email="key.address" style="float:left; height:55px; margin-right:10px;" />
                <span v-if="!isDecrypted">Soggetto #{{index}}</span>
                <span v-if="key.identity.name !== undefined && key.identity.surname !== undefined"><strong>{{ key.identity.name }} {{ key.identity.surname }}</strong></span>
                <span v-if="isDecrypted"></span><br>
                N. Firme in clausole obbligatorie: {{ Object.keys(signs[key.address]['required']).length }} / {{ signsdetails['required'].length }}<br>
                N. Firme in clausole opzionali: {{ Object.keys(signs[key.address]['optional']).length }} / {{ signsdetails['optional'].length }}<br>
                <div v-if="Object.keys(signs[key.address]['required']).length === signsdetails['required'].length" style="color:green">Il soggetto ha firmato il contratto.</div>
                <div v-if="Object.keys(signs[key.address]['required']).length > 0 || Object.keys(signs[key.address]['optional']).length > 0 || Object.keys(signs[key.address]['general']).length > 0">
                  <hr>
                  <div v-if="contract.data.signs.length > 0">
                    <div v-for="sign in contract.data.signs" v-bind:key="sign.number"  class="small-icons">
                      <strong>Clausola {{ sign.number }}</strong>
                      <span v-if="sign.required">
                        (obbligatoria)<br>
                        <span v-if="signs[address]['required'][sign.number] !== undefined" style="color:green"> <span v-if="signs[key.address]['required'][sign.number].block > 0">firma inserita al blocco {{ signs[key.address]['required'][sign.number].block }}</span><span v-if="!signs[key.address]['required'][sign.number].block">firma inserita ma in attesa di conferma</span><span v-if="signs[key.address]['required'][sign.number].uuid"> | {{ signs[key.address]['required'][sign.number].date }} | <a :href="'https://proof.scryptachain.org/#/uuid/' + signs[key.address]['required'][sign.number].uuid" target="_blank"><b-icon icon="export" ></b-icon></a></span></span>
                      </span>
                      <span v-if="!sign.required">
                        (opzionale)<br>
                        <span v-if="signs[address]['optional'][sign.number] !== undefined" style="color:green"> <span v-if="signs[key.address]['optional'][sign.number].block > 0">firma inserita al blocco {{ signs[key.address]['optional'][sign.number].block }}</span><span v-if="!signs[key.address]['optional'][sign.number].block">firma inserita ma in attesa di conferma</span> <span v-if="signs[key.address]['optional'][sign.number].uuid">| {{ signs[key.address]['optional'][sign.number].date }} | <a :href="'https://proof.scryptachain.org/#/uuid/' + signs[key.address]['optional'][sign.number].uuid" target="_blank"><b-icon icon="export" ></b-icon></a></span></span>
                      </span>
                    </div>
                  </div>
                  <div v-if="Object.keys(signs[key.address]['general']).length > 0" class="small-icons">
                    <strong>Firma generale contratto</strong><br><span v-if="signs[key.address]['general'].block > 0">firma inserita al blocco {{ signs[key.address]['general'].block }}</span><span v-if="!signs[key.address]['general'].block">firma inserita ma in attesa di conferma</span> <span v-if="signs[key.address]['general'].uuid">| {{ signs[key.address]['general'].date }} | <a :href="'https://proof.scryptachain.org/#/uuid/' + signs[key.address]['general'].uuid" target="_blank"><b-icon icon="export" ></b-icon></a></span>
                  </div>
                </div>
              </div>
            </b-tab-item>

            <b-tab-item label="Notifiche">
              <h1>Notifiche</h1>
              <div v-if="notifications.length > 0">
                <br>
                <b-tabs v-model="activeNotification" :position="'is-left'" :animated="false" :type="'is-boxed'" vertical>
                  <b-tab-item v-for="(notification, index) in notifications" :label="'#' + (index + 1)" v-bind:key="notification.uuid">
                    <h3 style="font-size:25px; padding:0 0 10px 0; margin-top:-20px; font-weight:bold">Notifica #{{activeNotification + 1}} | <a :href="'https://proof.scryptachain.org/#/uuid/' + notification.uuid" target="_blank"><b-icon icon="export" ></b-icon></a></h3>
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
                          <b-icon
                              v-if="verified_attachments.indexOf(file.hash) !== -1"
                              style="position:absolute; top:30px; right:30px; color: green"
                              icon="checkbox-marked-circle">
                          </b-icon>
                      </div><hr>
                      <h3 style="font-size:20px; font-weight:bold">Verifica allegati</h3><br>
                      <b-field>
                          <b-upload v-on:input="verifyAttachments(notification)" v-model="dropFiles_verify" multiple drag-drop>
                              <section class="section">
                                  <div class="content has-text-centered" style="width:100%">
                                      <p>
                                          <b-icon
                                              icon="upload"
                                              size="is-large">
                                          </b-icon>
                                      </p>
                                      <p>Verifica i file trascinandoli o cliccando qui.</p>
                                  </div>
                              </section>
                          </b-upload>
                      </b-field>
                    </div>
                  </b-tab-item>
                </b-tabs>
              </div>
              <div v-if="notifications.length === 0">
                <br>Nessuno ha ancora notificato informazioni.
              </div>
            </b-tab-item>

            <b-tab-item label="Azioni" v-if="(subjects.indexOf(address) !== -1 || contract.data.creator) && !isArchived">
                <div v-if="subjects.indexOf(address) !== -1">
                  <h1>Firma il contratto</h1>
                  <div v-if="contract.data.signs.length > 0">
                    <div v-for="sign in contract.data.signs" v-bind:key="sign.number" style="border:1px solid #ccc; text-align:left; position:relative; color:#000; border-radius:5px; margin-top:20px; font-size:12px; padding:15px">
                        <strong>Clausola #{{ sign.number }}</strong><br>
                        <strong>Obbligatoria:</strong> <span v-if="sign.required === true">SI</span><span v-if="sign.required === 'false'">NO</span>
                        <div v-if="sign.required">
                          <b-button v-if="signs[address]['required'][sign.number] === undefined && !isSigning" v-on:click="signContract(sign.number, 'required')" type="is-primary" size="is-small" style="position:absolute; top:20px; right:20px;">FIRMA</b-button>
                          <div v-if="signs[address]['required'][sign.number] !== undefined" style="color:green">Hai già firmato la clausola</div>
                        </div>
                        <div v-if="!sign.required">
                          <b-button v-if="signs[address]['optional'][sign.number] === undefined && !isSigning" v-on:click="signContract(sign.number, 'optional')" type="is-primary" size="is-small" style="position:absolute; top:20px; right:20px;">FIRMA</b-button>
                          <div v-if="signs[address]['optional'][sign.number] !== undefined" style="color:green">Hai già firmato la clausola</div>
                        </div>
                    </div>
                  </div>
                  <div style="border:1px solid #ccc; text-align:left; position:relative; color:#000; border-radius:5px; margin-top:20px; font-size:12px; padding:15px">
                        <strong>Firma generale contratto</strong><br>
                        <strong>Obbligatoria:</strong> SI
                        <b-button v-if="Object.keys(signs[address]['required']).length === signsdetails['required'].length && Object.keys(signs[address]['general']).length === 0 && !isSigning" v-on:click="signContract('general')" type="is-primary" size="is-small" style="position:absolute; top:20px; right:20px;">FIRMA</b-button>
                        <div v-if="Object.keys(signs[address]['required']).length < signsdetails['required'].length">Firma tutte le clausole obbligatorie prima</div>
                        <div v-if="Object.keys(signs[address]['general']).length > 0" style="color:green">Hai già firmato il contratto</div>
                    </div>
                  <hr>
                </div>
                <h1>Notifica informazioni alle parti</h1>
                <span>
                  Notificando le informazioni alle parti scriverai indelebilmente delle informazioni sul contratto. Questa operazione può essere utile nel caso vogliate comunicare alle parti qualcosa riguardante il contratto o notificare la risoluzione del contratto stesso. Puoi allegare testo, che rimarrà pubblico, oppure caricare uno o più file.
                </span>
                <hr>
                <vue-editor v-model="plaintext_notify" />
                <hr>
                <b-field>
                    <b-upload v-on:input="calculateHashesNotify" v-model="dropFiles_notify" multiple drag-drop>
                        <section class="section">
                            <div class="content has-text-centered" style="width:100%">
                                <p>
                                    <b-icon
                                        icon="upload"
                                        size="is-large">
                                    </b-icon>
                                </p>
                                <p>Allega dei file trascinandoli o cliccando qui.</p>
                            </div>
                        </section>
                    </b-upload>
                </b-field>

                <div v-if="attachments_notify.length > 0 || app.plaintext_notify.length > 0">
                  <div v-if="attachments_notify.length > 0">
                    <div v-for="(file, index) in attachments_notify" v-bind:key="file.hash" style="border:1px solid #ccc; position:relative; text-align:left; color:#000; border-radius:5px; margin-top:20px; font-size:12px; padding:15px">
                        <v-gravatar :email="file.hash" style="float:left; height:55px; margin-right:10px;" />
                        <strong>{{ file.filename }}</strong><br>
                        <strong v-if="file.type">{{ file.type }} - </strong><strong>{{ file.size }} Byte</strong><br>
                        <strong>Hash file:</strong> {{ file.hash }}
                        <a v-on:click="deleteDropFile(index)">
                          <b-icon
                              style="position:absolute; top:30px; right:20px; cursor:pointer"
                              icon="backspace">
                          </b-icon>
                        </a>
                    </div>
                    <br><br>
                  </div>
                  <b-button v-if="!isNotifying" type="is-primary" v-on:click="notifyToContract" size="is-large" style="width:100%!important">NOTIFICA</b-button>
                  <div v-if="isNotifying" style="text-align:center; padding: 20px;">Notifica in corso, si prega di attendere...</div>
                </div>
                <div v-if="address === contract.data.creator">
                  <hr>
                  <h1>Archivia contratto</h1>
                  <span style="color:#f00"><b>Attenzione</b>, archiviando il contratto non lo vedrete tra quelli attivi, ma non potrete cancellare lo storico dalla blockchain in quanto il registro è immutabile. Le firme dei soggetti non vengono eliminate, quindi si prega di stare ben attenti se il contratto ha valenza legale.</span><br><br>
                  <b-button v-if="!isInvalidating" type="is-primary" v-on:click="invalidateContract" size="is-large" style="width:100%!important">ARCHIVIA ORA</b-button>
                  <div v-if="isInvalidating === true">
                    Archivio il contratto si prega di attendere...
                  </div>
                </div>
            </b-tab-item>
          </b-tabs>

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
  const crypto = require('crypto')

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
          required: [],
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
          let signs = {}
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
            if(signs[contract.data.subjects[j].address] === undefined){
              signs[contract.data.subjects[j].address] = {}
              signs[contract.data.subjects[j].address]['required'] = []
              signs[contract.data.subjects[j].address]['optional'] = []
              signs[contract.data.subjects[j].address]['general'] = {}
            }
            app.identities[contract.data.subjects[j].address] = contract.data.subjects[j].address
            let checkinteractions = await app.scrypta.post('/read', { protocol: 'DC://', address: contract.data.subjects[j].address, history: true})
            for(let jjj in checkinteractions.data){
              let interaction = checkinteractions.data[jjj]
              if(interaction.refID.indexOf('SIGN:') !== -1){
                let expsign = interaction.refID.split(':')
                let data = JSON.parse(interaction.data.message)
                interaction.date = new Date(data.timestamp)
                if(expsign.length === 3 && expsign[1] === 'general' && expsign[2] === contract.address){
                  signs[interaction.data.address]['general'] = interaction
                }else if(expsign.length === 4 && expsign[3] === contract.address){
                  if(signs[interaction.data.address][expsign[1]][expsign[2]] === undefined){
                    signs[interaction.data.address][expsign[1]][expsign[2]] = interaction
                  }
                }
              }
              app.signs = signs
              app.$forceUpdate();
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
      async signContract(number, type = 'general'){
        const app = this
        if(app.subjects.indexOf(app.address) !== -1){
          let canSign = false
          if(app.signs[app.address][type][number] === undefined){
            canSign = true
          }
          if(type === 'general' && Object.keys(app.signs[app.address]['general']) === 0){
            canSign = true
          }
          if(canSign){
            let balance = await app.scrypta.get('/balance/' + app.address)
            if(balance.balance > 0.0011){
              app.$buefy.dialog.prompt({
                message: `Inserisci la password del wallet`,
                inputAttrs: {
                  type: "password"
                },
                trapFocus: true,
                onConfirm: async password => {
                  let key = await app.scrypta.readKey(password, app.wallet.wallet);
                  if (key !== false) {
                    app.isSigning = true
                    let sign = await app.writeSign(key, password, type, number)
                    app.isSigning = false
                    if(sign !== false){
                      app.signs[app.address][type][number] = 'PENDING'
                      if(number === 'general'){
                        app.$buefy.toast.open({
                          message: "Hai firmato correttamente il contratto!",
                          type: "is-success"
                        })
                      }else{
                        app.$buefy.toast.open({
                          message: "Hai firmato correttamente la clausola!",
                          type: "is-success"
                        })
                      }
                      app.isSigning = false
                    }else{
                      app.$buefy.toast.open({
                        message: "Qualcosa non va, si prega di riprovare.",
                        type: "is-danger"
                      })
                      app.isSigning = false
                    }
                  }else{
                    app.$buefy.toast.open({
                      message: "La password del wallet è errata!",
                      type: "is-danger"
                    })
                    app.isSigning = false
                  }
                }
              })
            }else{
              app.$buefy.toast.open({
                message: "Non hai abbastanza fondi per firmare!",
                type: "is-danger"
              })
              app.isSigning = false
            }
          }else{
            app.$buefy.toast.open({
              message: "Hai già firmato il contratto!",
              type: "is-danger"
            })
            app.isSigning = false
          }
        }else{
          app.$buefy.toast.open({
            message: "Non puoi firmare questo contratto in quanto non sei tra i partecipanti!",
            type: "is-danger"
          })
          app.isSigning = false
        }
      },
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
      readFile(file){
        const app = this
        return new Promise(response => {
          var reader = new FileReader();
          reader.onload = function(event) {
            var readed = event.target.result;
            let hash = crypto.createHash("sha256").update(new Uint8Array(readed)).digest("hex")
            for(let k in app.contract.data.attachments){
              let attachment = app.contract.data.attachments[k]
              if(attachment.hash.toString() === hash.toString()){
                app.files.push({
                  hash: hash,
                  filename: file.name,
                  size: file.size,
                  lastModified: file.lastModified,
                  type: file.type
                })
                app.verified.push(hash)
              }
            }
            response(true)
          };

          reader.readAsArrayBuffer(file);
        })
      },
      async calculateHashes(){
        const app = this
        
        app.files = []
        app.verified = []

        for(let j in app.dropFiles){
          var file = app.dropFiles[j];
          await app.readFile(file)
        }
      },
      writeSign(key, password, type, number){
        const app = this
        return new Promise(async response => {
          let balance = await app.scrypta.get('/balance/' + app.wallet.address)
          if(balance.balance >= 0.0011){
            let signed = 'SIGN:general:' + app.$route.params.contract
            if(number !== undefined && type !== 'general'){
              signed = 'SIGN:' + type + ':' + number + ':' + app.$route.params.contract
            }
            
            let sign = await app.scrypta.signMessage(key.prv, JSON.stringify({
              timestamp: new Date().getTime(),
              contract: app.$route.params.contract,
              signed: signed
            }))

            let written = await app.scrypta.write(app.wallet.wallet, password, JSON.stringify(sign), '', signed, 'DC://')
            if (written.txs.length >= 1 && written.txs[0] !== null) {
              response(true)
            }else{
              app.$buefy.toast.open({
                message: "Qualcosa non va con l'invio dei fondi, si prega di riprovare.",
                type: "is-danger"
              })
              response(false)
            }
          }else{
            app.$buefy.toast.open({
              message: "Non hai abbastanza fondi da inviare al contratto",
              type: "is-danger"
            })
            response(false)
          }
        })
      },
      fundContract(fees, key){
        const app = this
        return new Promise(async response => {
          let balance = await app.scrypta.get('/balance/' + app.wallet.address)
          if(balance.balance >= fees){
            app.workingMessage = 'Invio ' + fees + ' LYRA al contratto...'
            let send = await app.scrypta.post('/trustlink/fund',{
              amount: fees,
              from: app.wallet.address,
              trustlink: app.contract.address,
              private_key: key.prv
            })
            if(send.success === true && send.txid !== undefined && send.txid.length === 64){
              let trustlinkbalance = 0
              let sendretries = 0
              let sendError = false
              app.workingMessage = 'Verifico che il balance sia quello richiesto...'
              while(trustlinkbalance < fees){
                let checkbalance = await app.scrypta.get('/balance/' + app.contract.address)
                sendretries++
                trustlinkbalance = checkbalance.balance
                if(sendretries > 500){
                  sendError = true
                  trustlinkbalance = 999
                }
              }
              if(sendError === true){
                app.$buefy.toast.open({
                  message: "Qualcosa non va con l'invio dei fondi, si prega di riprovare.",
                  type: "is-danger"
                })
                response(false)
              }else{
                response(true)
              }
            }else{
              app.$buefy.toast.open({
                message: "Qualcosa non va con l'invio dei fondi, si prega di riprovare.",
                type: "is-danger"
              })
              response(false)
            }
          }else{
            app.$buefy.toast.open({
              message: "Non hai abbastanza fondi da inviare al contratto",
              type: "is-danger"
            })
            response(false)
          }
        })
      },
      invalidateContract(){
        const app = this
        if(app.contract.data.creator === app.address){
          app.$buefy.dialog.prompt({
            message: `Inserisci la password del wallet`,
            inputAttrs: {
              type: "password"
            },
            trapFocus: true,
            onConfirm: async password => {
              let key = await app.scrypta.readKey(password, app.wallet.wallet)
              if (key !== false) {
                let balance = await app.scrypta.get('/balance/' + app.wallet.address)
                if(balance.balance >= 0.002){
                  app.isInvalidating = true
                  let contract = await app.scrypta.decryptData(app.contract.data.contract, key.prv)
                  contract = JSON.parse(contract)
                  let fundresponse
                  let checkbalance = await app.scrypta.get('/balance/' + app.contract.address)
                  if(checkbalance.balance < 0.002){
                    fundresponse = await app.fundContract(0.001, key)
                  }else{
                    fundresponse = true
                  }

                  if(fundresponse === true){
                    let invalidate = await app.scrypta.post('/trustlink/invalidate',{
                      trustlink: app.contract.address,
                      private_keys: contract.prv + ',' + key.prv,
                      redeemScript: contract.redeemScript,
                      uuid: app.contract.uuid
                    })
                    if(invalidate.success === true && invalidate.txid !== null && invalidate.txid.length === 64){
                      app.$buefy.toast.open({
                        message: "Contratto invalidato, potrebbero volerci più di 2 minuti per la conferma.",
                        type: "is-success"
                      })
                      setTimeout(function(){
                        window.location = '/#/'
                      })
                    }else{
                      app.$buefy.toast.open({
                        message: "Errore nell'invalidazione, si prega di riprovare.",
                        type: "is-danger"
                      })
                      app.isInvalidating = false
                    }
                  }else{
                    app.$buefy.toast.open({
                      message: "Errore nell'invio dei fondi al contratto, si prega di riprovare.",
                      type: "is-danger"
                    })
                  }
                }else{
                  app.$buefy.toast.open({
                    message: "Non puoi invalidare il contratto.",
                    type: "is-danger"
                  })
                  app.isInvalidating = false
                }
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
            message: "Non puoi annullare il contratto in quanto non proprietario!",
            type: "is-danger"
          })
        }
      },
      async calculateHashesNotify(){
        const app = this
        app.$buefy.toast.open({
            message: `Inizio a calcolare gli hash dei file`,
            type: 'is-info'
        })
        app.attachments_notify = []
        for(let j in app.dropFiles_notify){
          var file = app.dropFiles_notify[j];
          await app.readAttachment(file)
        }
        app.$buefy.toast.open({
            message: `Calcolo hash completato`,
            type: 'is-success'
        })
      },
      readAttachment(file){
        const app = this
        return new Promise(response => {
          var reader = new FileReader();
          reader.onload = function(event) {
            var readed = event.target.result;
            let hash = crypto.createHash("sha256").update(new Uint8Array(readed)).digest("hex");
            app.attachments_notify.push({
              hash: hash,
              filename: file.name,
              size: file.size,
              lastModified: file.lastModified,
              type: file.type
            })
            response(true)
          };

          reader.readAsArrayBuffer(file);
        })
      },
      deleteDropFile(index) {
        const app = this
        app.dropFiles_notify.splice(index, 1)
        app.calculateHashesNotify()
      },
      async notifyToContract(){
        const app = this
        // VERIFICO OGNI INDIRIZZO
        app.isNotifying = true
        if(app.plaintext_notify !== '' || app.attachments_notify.length > 0){
          app.$buefy.dialog.prompt({
            message: `Inserisci la password del wallet`,
            inputAttrs: {
              type: "password"
            },
            trapFocus: true,
            onConfirm: async password => {
              let key = await app.scrypta.readKey(password, app.wallet.wallet);
              if (key !== false) {
                let sign = await app.writeNotification(key, password)
                if(sign !== false){
                  app.plaintext_notify = ''
                  app.attachments_notify = []
                  app.dropFiles_notify = []
                  app.$buefy.toast.open({
                    message: "Hai notificato correttamente al contratto!",
                    type: "is-success"
                  })
                  app.isNotifying = false
                }else{
                  app.$buefy.toast.open({
                    message: "Qualcosa non va, si prega di riprovare.",
                    type: "is-danger"
                  })
                  app.isNotifying = false
                }
              } else {
                app.$buefy.toast.open({
                  message: "Password errata!",
                  type: "is-danger"
                })
                app.isCreating = false
              }
            }
          })
        }else{
          app.$buefy.toast.open({
            message: `Inserire almeno un testo o dei file`,
            type: 'is-danger'
          })
          app.isNotifying = false
        }
      },
      writeNotification(key, password){
        const app = this
        return new Promise(async response => {
          let balance = await app.scrypta.get('/balance/' + app.wallet.address)
          let plaintext = ''
          if(app.plaintext_notify !== ''){
            plaintext = LZUTF8.compress(app.plaintext_notify, {outputEncoding: 'Base64'})
          }
          if(balance.balance >= 0.0011){
            let sign = await app.scrypta.signMessage(key.prv, JSON.stringify({
              timestamp: new Date().getTime(),
              contract: app.$route.params.contract,
              plaintext: plaintext,
              attachments: app.attachments_notify
            }))
            let written = await app.scrypta.write(app.wallet.wallet, password, JSON.stringify(sign), '', 'NOTIFY:' + app.$route.params.contract, 'DC://')
            if (written.txs.length >= 1 && written.txs[0] !== null) {
              response(true)
            }else{
              app.$buefy.toast.open({
                message: "Qualcosa non va con l'invio dei fondi, si prega di riprovare.",
                type: "is-danger"
              })
              response(false)
            }
          }else{
            app.$buefy.toast.open({
              message: "Non hai abbastanza fondi da inviare al contratto",
              type: "is-danger"
            })
            response(false)
          }
        })
      },
      verifyFile(file, notification){
        const app = this
        return new Promise(response => {
          var reader = new FileReader();
          reader.onload = function(event) {
            var readed = event.target.result;
            let hash = crypto.createHash("sha256").update(new Uint8Array(readed)).digest("hex")
            for(let k in notification.data.message.attachments){
              let attachment = notification.data.message.attachments[k]
              if(attachment.hash.toString() === hash.toString()){
                app.verified_attachments.push(hash)
              }
            }
            response(true)
          };

          reader.readAsArrayBuffer(file);
        })
      },
      async verifyAttachments(notification){
        const app = this
        
        app.verified_attachments = []

        for(let j in app.dropFiles_verify){
          var file = app.dropFiles_verify[j];
          await app.verifyFile(file, notification)
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