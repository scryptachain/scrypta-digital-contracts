<template>
  <div class="home">
    <div class="main text-left">
      <div class="container">
        <h1>Crea un nuovo contratto</h1>
        <hr>
        <b-tabs v-model="activeTab" v-if="!isCreating" :animated="false">
            <b-tab-item label="Soggetti">
              <h1>
                Soggetti
                <b-button type="is-primary" style="float:right" v-on:click="addSubject"><b-icon icon="plus"></b-icon></b-button>
              </h1>
              <br>
              <div v-for="(key, index) in subjects" v-bind:key="index">
                <div class="columns" style="position:relative">
                  <div class="column">
                    <b-field :label="'Nome'">
                      <b-input v-model="subjects[index].name"></b-input>
                    </b-field>
                  </div>
                  <div class="column">
                    <b-field :label="'Cognome'">
                      <b-input v-model="subjects[index].surname"></b-input>
                    </b-field>
                  </div>
                  <div class="column">
                    <b-field :label="'Indirizzo Lyra'">
                      <b-input v-model="subjects[index].address"></b-input>
                    </b-field>
                  </div>
                  <b-button type="is-primary" style="position:absolute; top: 44px; right:0" v-on:click="deleteSubject(index)"><b-icon icon="backspace"></b-icon></b-button>
                </div>
              </div>
              <div v-if="subjects.length === 0">
                <h2>In questa sezione dovrai inserire tutte le identità dei soggetti e le loro relative chiavi pubbliche. Se non sai come reperire gli indirizzi chiedi ai soggetti di andare all'indirizzo di partecipazione del contratto e aggiungere le proprie identità.<br><br>
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
              <h1>Inserisci informazioni pubbliche</h1>
              <b-field :label="'Titolo'">
                <b-input v-model="title"></b-input>
              </b-field>
              <vue-editor v-model="plaintext" />
              <br><span style="color:#f00">Attenzione: il testo e il titolo saranno pubblici all'interno della blockchain.</span>
              <hr>
              <div>
                <h1>Allega dei file al contratto</h1>
                <section>
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
                                  <p>Allega dei file trascinandoli o cliccando qui.</p>
                              </div>
                          </section>
                      </b-upload>
                  </b-field>

                  <div class="tags">
                      <span v-for="(file, index) in dropFiles"
                          :key="index"
                          class="tag is-primary" >
                          {{file.name}}
                          <button class="delete is-small"
                              type="button"
                              @click="deleteDropFile(index)">
                          </button>
                      </span>
                  </div>
                  
                  <span style="color:#f00">Attenzione: i file <b>non</b> verranno caricati all'interno della blockchain o di altro spazio, si prega di conservare una copia al fine di poter verificare le informazioni scritte in blockchain.</span><br>
              </section>
              </div>
              <hr>
              <b-button type="is-primary" style="float:left" v-on:click="showSubjects()">INDIETRO</b-button>
              <b-button type="is-primary" v-if="subjects.length >= 2 && (plaintext !== '' || files.length > 0)" style="float:right" v-on:click="showConfirm()">AVANTI</b-button>
            </b-tab-item>
            <b-tab-item label="Conferma" v-if="subjects.length >= 2 && (plaintext !== '' || files.length > 0)">
              <h1>Conferma tutti i dati e crea il contratto</h1>
              <h3 style="font-size:20px; font-weight:bold">Soggetti</h3>
              <div v-for="(key, index) in subjects" v-bind:key="index" style="border:1px solid #ccc; text-align:left; color:#000; border-radius:5px; margin-top:20px; font-size:12px; padding:15px">
                <v-gravatar :email="key.address" style="float:left; height:55px; margin-right:10px;" />
                Soggetto #{{index}}<br>
                <span v-if="key.name === '' || key.surname === ''" style="color:#f00">Nome non valido</span>
                <strong>{{ key.name }} {{ key.surname }}</strong><br>
                <span v-if="key.address.length === 34">{{ key.address }}</span>
                <span v-if="key.address.length !== 34" style="color:#f00">Indirizzo non valido</span>
              </div>
              <hr>
              <h3 style="font-size:20px; font-weight:bold">Oggetto</h3><br>
              <div v-if="plaintext !== ''" v-html="plaintext"></div>
              <div v-if="files.length > 0">
                <hr>
                <h3 style="font-size:20px; font-weight:bold">Allegati</h3>
                <div v-for="file in files" v-bind:key="file.hash" style="border:1px solid #ccc; text-align:left; color:#000; border-radius:5px; margin-top:20px; font-size:12px; padding:15px">
                    <v-gravatar :email="file.hash" style="float:left; height:55px; margin-right:10px;" />
                    <strong>{{ file.filename }}</strong><br>
                    <strong v-if="file.type">{{ file.type }} - </strong><strong>{{ file.size }} Byte</strong><br>
                    <strong>Hash file:</strong> {{ file.hash }}
                </div>
              </div>
              <hr>
              <b-button type="is-primary" style="float:left" v-on:click="showObject()">INDIETRO</b-button>
              <b-button type="is-primary" style="float:right" v-on:click="createContract()">CREA CONTRATTO</b-button>
            </b-tab-item>
        </b-tabs>
        <div v-if="isCreating" style="text-align: center; padding: 20vh">
          <h1>Creazione digital contract in corso..</h1>
          <h3>{{ trustlink.address }}</h3>
          <div>{{ workingMessage }}</div>
        </div>
      </div>
    </div>
    <b-loading :is-full-page="true" :active.sync="isLoading" :can-cancel="true"></b-loading>
  </div>
</template>

<script>
  const ScryptaCore = require('@scrypta/core')
  const crypto = require('crypto')
  const LZUTF8 = require('lzutf8')

  export default {
    name: 'Home',
    data(){ 
      return {
        scrypta: new ScryptaCore(true),
        address: '',
        wallet: '',
        isLoading: false,
        url: '',
        isCreating: false,
        activeTab: 0,
        error: '',
        contract_address: '',
        contract_sid: '',
        object: [],
        trustlink: {
          address: "Attendo la creazione dell'indirizzo"
        },
        files: [],
        subjects: [],
        dropFiles: [],
        title: '',
        plaintext: '',
        workingMessage: ''
      }
    },
    async mounted() {
      const app = this
      app.wallet = await app.scrypta.returnDefaultIdentity()
      app.scrypta.staticnodes = true
      app.scrypta.mainnetIdaNodes = ['https://idanodejs01.scryptachain.org','https://idanodejs02.scryptachain.org','https://idanodejs03.scryptachain.org','https://idanodejs04.scryptachain.org','https://idanodejs05.scryptachain.org','https://idanodejs06.scryptachain.org']
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
      app.contract_sid = newaddress
      app.scrypta.connectP2P(function(data){
        try{
          let object = JSON.parse(data.message)
          if(object.contract === app.contract_address && object.action === 'join'){
            let found = false
            for(let x in app.subjects){
              if(app.subjects[x].address === data.address){
                found = true
              }
            }
            if(found === false){
              app.subjects.push({
                name: object.name,
                surname: object.surname,
                address: data.address
              })
            }
          }
        }catch(e){
          app.error = e
        }
      })
    },
    methods: {
      async createContract(){
        const app = this
        // VERIFICO OGNI INDIRIZZO
        app.isCreating = true
        if(app.subjects.length >= 2){
          let validSubjects = true
          let findTwins = false
          app.workingMessage = 'Verifico gli indirizzi Lyra dei soggetti'
          var subjectsToStore = []
          let doublecheck = []
          for(let k in app.subjects){
            let subject = app.subjects[k]
            let validate = await app.scrypta.get('/validate/' + subject.address)
            if(validate.data.isvalid === false){
              validSubjects = false
            }else{
              if(doublecheck.indexOf(subject.address) === -1){
                doublecheck.push(subject.address)
                let hash = crypto.createHash("sha256").update(JSON.stringify(subject)).digest("hex")
                subjectsToStore.push({
                  address: subject.address,
                  identity: {
                    name: subject.name,
                    surname: subject.surname
                  },
                  hash: hash
                })
              }else{
                findTwins = true
                app.$buefy.toast.open({
                  message: "Due soggetti hanno lo stesso indirizzo!",
                  type: "is-danger"
                })
                app.isCreating = false
              }
            }
          }
          if(validSubjects === true && findTwins === false){
            app.$buefy.dialog.prompt({
              message: `Inserisci la password del wallet`,
              inputAttrs: {
                type: "password"
              },
              trapFocus: true,
              onConfirm: async password => {
                let key = await app.scrypta.readKey(password, app.wallet.wallet);
                if (key !== false) {
                  app.workingMessage = 'Creo l\'indirizzo del contratto...'
                  let trustlink = await app.scrypta.post('/trustlink/init', {addresses: app.contract_sid.key + ',' + key.key })
                  if(trustlink.data.address !== undefined && trustlink.data.address.length === 34){
                    app.workingMessage = 'L\'indirizzo del contratto è ' + trustlink.data.address
                    app.trustlink = trustlink.data
                    app.workingMessage = 'Costruisco il contratto...'
                    let objectToStore = ''
                    if(app.plaintext !== ''){
                      objectToStore = LZUTF8.compress(app.plaintext, {outputEncoding: 'Base64'})
                    }

                    let titleToStore = ''
                    if(app.title !== ''){
                      titleToStore = LZUTF8.compress(app.title, {outputEncoding: 'Base64'})
                    }

                    for(let kk in subjectsToStore){
                      subjectsToStore[kk].identity = await app.scrypta.cryptData(JSON.stringify(subjectsToStore[kk].identity), key.prv)
                    }

                    let contractToStore = {
                      prv: app.contract_sid.prv,
                      key: app.contract_sid.key,
                      redeemScript: trustlink.data.redeemScript
                    }

                    contractToStore = await app.scrypta.cryptData(JSON.stringify(contractToStore), key.prv)
                    
                    let digitalcontract = {
                      v: 1,
                      title: titleToStore,
                      contract: contractToStore,
                      creator: app.address,
                      address: trustlink.data.address,
                      subjects: subjectsToStore,
                      object: objectToStore,
                      attachments: app.files
                    }
                    let contracthash = crypto.createHash("sha256").update(JSON.stringify(digitalcontract)).digest("hex")
                    digitalcontract['hash'] = contracthash
                    let length = JSON.stringify(digitalcontract).length
                    let fees = Math.ceil(length / 7500) * 0.003
                    app.workingMessage = 'Il contratto costerà ' + fees + ' LYRA'
                    
                    // CONTROLLO SE IL CONTRATTO HA ABBASTANZA FEE
                    let checkbalance = await app.scrypta.get('/balance/' + trustlink.data.address)
                    let fundresponse
                    if(checkbalance.balance < fees){
                      fundresponse = await app.fundContract(fees, key, trustlink)
                    }else{
                      fundresponse = true
                    }

                    if(fundresponse === true){
                      let written = false
                      let writeretries = 0
                      let writeError = false
                      app.workingMessage = 'Scrivo il contratto in blockchain...'
                      while(written === false){
                        let write = await app.scrypta.post('/trustlink/write', {
                          trustlink: trustlink.data.address,
                          redeemScript: trustlink.data.redeemScript,
                          private_keys: app.contract_sid.prv + ',' + key.prv,
                          data: JSON.stringify(digitalcontract),
                          protocol: 'DC://'
                        })
                        if(write.txs.length > 0 && write.txs !== null && write.txs !== undefined){
                          written = true
                        }
                        writeretries++
                        if(writeretries > 300){
                          writeError = true
                          written = true
                        }
                      }

                      if(written === true && writeError === false){
                        app.workingMessage = 'Contratto scritto correttamente, reindirizzo in 5 secondi!'
                        setTimeout(function(){
                          window.location = '/#/'
                        },5000)
                      }else{
                        app.$buefy.toast.open({
                          message: "Qualcosa non va con la scrittura del contratto, si prega di riprovare.",
                          type: "is-danger"
                        })
                      }
                    }
                  }else{
                    app.$buefy.toast.open({
                      message: "Qualcosa non va con L'IdANode, si prega di riprovare!",
                      type: "is-danger"
                    })
                  }
                } else {
                  app.$buefy.toast.open({
                    message: "Wrong password!",
                    type: "is-danger"
                  })
                  app.isCreating = false
                }
              }
            })
          }else{
            app.$buefy.toast.open({
              duration: 5000,
              message: `Uno o più indirizzi sono invalidi, controllare gli indirizzi Lyra dei soggetti`,
              type: 'is-danger'
            })
            app.isCreating = false
          }
        }else{
          app.$buefy.toast.open({
            duration: 5000,
            message: `Inserire almeno due o più soggetti`,
            type: 'is-danger'
          })
          app.isCreating = false
        }
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
          name: "",
          surname: "",
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
      },
      deleteDropFile(index) {
        const app = this
        app.dropFiles.splice(index, 1)
        app.calculateHashes()
      },
      fundContract(fees, key, trustlink){
        const app = this
        return new Promise(async response => {
          let balance = await app.scrypta.get('/balance/' + app.wallet.address)
          if(balance.balance >= fees){
            app.workingMessage = 'Invio ' + fees + ' LYRA al contratto...'
            let send = await app.scrypta.post('/trustlink/fund',{
              amount: fees,
              from: app.wallet.address,
              trustlink: trustlink.data.address,
              private_key: key.prv
            })
            if(send.success === true && send.txid !== undefined && send.txid.length === 64){
              let trustlinkbalance = 0
              let sendretries = 0
              let sendError = false
              app.workingMessage = 'Verifico che il balance sia quello richiesto...'
              while(trustlinkbalance < fees){
                let checkbalance = await app.scrypta.get('/balance/' + trustlink.data.address)
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
      async calculateHashes(){
        const app = this
        app.isLoading = true
        app.$buefy.toast.open({
            duration: 1500,
            message: `Inizio a calcolare gli hash dei file`,
            type: 'is-info'
        })
        app.files = []
        for(let j in app.dropFiles){
          var file = app.dropFiles[j];
          await app.readFile(file)
        }
        app.isLoading = false
        app.$buefy.toast.open({
            duration: 5000,
            message: `Calcolo hash completato`,
            type: 'is-success'
        })
      },
      readFile(file){
        const app = this
        return new Promise(response => {
          var reader = new FileReader();
          reader.onload = function(event) {
            var readed = event.target.result;
            let hash = crypto.createHash("sha256").update(new Uint8Array(readed)).digest("hex");
            app.files.push({
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
      }
    }
  }
</script>