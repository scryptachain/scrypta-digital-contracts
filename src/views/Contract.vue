<template>
  <div class="home">
    <div class="main text-left">
      <div class="container">
        <v-gravatar :email="$route.params.contract" style="float:left; height:70px; margin-right:20px;" />
        <h1 v-if="!contract.data.title">Dettagli Digital Contract</h1>
        <h1 v-if="contract.data.title">{{ contract.data.title }}</h1>
        {{ $route.params.contract }}
        <hr>
        <div v-if="isLoading === false">
          <div class="columns">
            <div class="column" v-if="address === contract.data.creator">
              <b-button type="is-primary" v-on:click="decryptData" size="is-large" style="width:100%!important">DECODIFICA INFORMAZIONI</b-button>
            </div>
            <div class="column" v-if="signs.indexOf(address) === -1">
              <b-button type="is-primary" v-if="!isSigning" v-on:click="signContract" size="is-large" style="width:100%!important">FIRMA CONTRATTO</b-button>
              <span v-if="isSigning" style="padding:10px; text-align:center">Firmo il contratto...</span>
            </div>
          </div>
         <h3 style="font-size:20px; font-weight:bold">Soggetti</h3>
          <div v-for="(key, index) in contract.data.subjects" v-bind:key="index" style="border:1px solid #ccc; text-align:left; color:#000; border-radius:5px; margin-top:20px; font-size:12px; padding:15px; position:relative">
            <v-gravatar :email="key.address" style="float:left; height:70px; margin-right:10px;" />
            Soggetto #{{index}}<br>
            <div v-if="key.identity.name === undefined || key.identity.surname === undefined" style="color:#f00">Nome da decriptare</div>
            <div v-if="key.identity.name !== undefined && key.identity.surname !== undefined"><strong>{{ key.identity.name }} {{ key.identity.surname }}</strong></div>
            <span v-if="key.address.length === 34">{{ key.address }}</span>
            <br>
            <span v-if="signs.indexOf(key.address) === -1" style="color:#f00">Firma non apposta</span>
            <span v-if="signs.indexOf(key.address) !== -1" style="color:green">Firmato al blocco {{ signsdetails[key.address].block }}</span>
            <a :href="'https://me.scrypta.id/#/search/' + key.address" target="_blank">
              <b-icon
                  style="position:absolute; top:37px; right:30px"
                  icon="account-box"
                  size="is-medium">
              </b-icon>
            </a>
          </div>
          <hr>
          <h3 style="font-size:20px; font-weight:bold">Oggetto</h3><br>
          <div v-if="contract.data.object !== ''" v-html="contract.data.object"></div>
          <div v-if="contract.data.attachments.length > 0">
            <hr>
            <div class="columns">
              <div class="column">
                <h3 style="font-size:20px; font-weight:bold">Allegati in blockchain</h3>
                <div v-for="file in contract.data.attachments" v-bind:key="file.hash" style="border:1px solid #ccc; position:relative; text-align:left; color:#000; border-radius:5px; margin-top:20px; font-size:12px; padding:15px">
                    <v-gravatar :email="file.hash" style="float:left; height:55px; margin-right:10px;" />
                    <strong>{{ file.filename }}</strong><br>
                    <strong v-if="file.type">{{ file.type }} - </strong><strong>{{ file.size }} Byte</strong><br>
                    <strong>Hash file:</strong> {{ file.hash }}
                    <b-icon
                        v-if="verified.indexOf(file.hash) !== -1"
                        style="position:absolute; top:30px; right:30px; color: green"
                        icon="thumb-up">
                    </b-icon>
                </div>
              </div>
              <div class="column">
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
              </div>
            </div>
          </div>

          <div v-if="address === contract.data.creator">
            <hr>
            <h1>Archivia contratto</h1>
            <span style="color:#f00"><b>Attenzione</b>, archiviando il contratto non lo vedrete, ma non potrete cancellare lo storico dalla blockchain in quanto il registro è immutabile. Le firme dei soggetti non vengono eliminate, quindi si prega di stare ben attenti se il contratto ha valenza legale.</span><br><br>
            <b-button v-if="!isInvalidating" type="is-primary" v-on:click="invalidateContract" size="is-large" style="width:100%!important">ARCHIVIA ORA</b-button>
            <div v-if="isInvalidating === true">
              Archivio il contratto si prega di attendere...
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
  const crypto = require('crypto')

  export default {
    name: 'Home',
    data(){ 
      return {
        scrypta: new ScryptaCore(true),
        address: '',
        wallet: '',
        isLoading: true,
        isSigning: false,
        isInvalidating: false,
        contract: {
          data: {
            title: ""
          }
        },
        subjects: [],
        interactions: [],
        signs: [],
        signsdetails: {},
        dropFiles: [],
        files: [],
        verified: []
      }
    },
    async mounted() {
      const app = this
      app.wallet = await app.scrypta.returnDefaultIdentity()
      let SIDS = app.wallet.split(':')
      app.scrypta.staticnodes = true
      app.scrypta.mainnetIdaNodes = ['https://idanodejs01.scryptachain.org','https://idanodejs02.scryptachain.org','https://idanodejs03.scryptachain.org','https://idanodejs04.scryptachain.org','https://idanodejs05.scryptachain.org','https://idanodejs06.scryptachain.org']
      app.scrypta.mainnetIdaNodes = ['http://localhost:3001']
      app.address = SIDS[0]
      let identity = await app.scrypta.returnIdentity(app.address)
      app.wallet = identity
      let contracts_data = await app.scrypta.post('/read', { protocol: 'DC://', address: app.$route.params.contract })
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
          for(let j in contract.data.subjects){
            app.subjects.push(contract.data.subjects[j].address)
            let checksign = await app.scrypta.post('/read', { protocol: 'DC://', address: app.address})
            for(let jjj in checksign.data){
              let singlesign = checksign.data[jjj]
              if(singlesign.refID === 'SIGN:' + app.$route.params.contract){
                app.signs.push(singlesign.address)
                app.signsdetails[singlesign.address] = singlesign
              }
            }
          }
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
      async signContract(){
        const app = this
        if(app.subjects.indexOf(app.address) !== -1){
          if(app.signs.indexOf(app.address) === -1){
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
                    let sign = await app.writeSign(key, password)
                    if(sign !== false){
                      app.signs.push(app.address)
                    }
                    app.isSigning = false
                    if(sign !== false){
                      app.$buefy.toast.open({
                        message: "Hai firmato correttamente il contratto!",
                        type: "is-success"
                      })
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
                  app.contract.data.subjects[j].identity = JSON.parse(JSON.parse(app.contract.data.subjects[j].identity))
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
        app.$buefy.toast.open({
            duration: 1500,
            message: `Inizio a verificare i file`,
            type: 'is-info'
        })
        
        app.files = []
        app.verified = []

        for(let j in app.dropFiles){
          var file = app.dropFiles[j];
          await app.readFile(file)
        }
      },
      writeSign(key, password){
        const app = this
        return new Promise(async response => {
          let balance = await app.scrypta.get('/balance/' + app.wallet.address)
          if(balance.balance >= 0.0011){
            let sign = await app.scrypta.signMessage(key.prv, JSON.stringify({
              timestamp: new Date().getTime(),
              contract: app.$route.params.contract
            }))
            let written = await app.scrypta.write(app.wallet.wallet, password, JSON.stringify(sign), '', 'SIGN:' + app.$route.params.contract, 'DC://')
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
                  contract = JSON.parse(JSON.parse(contract))
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
      }
    },
  }
</script>