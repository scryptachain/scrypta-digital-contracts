<template>
    <div>
        <b-navbar style="background:#0000F0!important" toggleable="lg" type="dark" variant="primary">
            <b-navbar-brand href="#"><router-link to="/dashboard"><img src="./assets/logo.png" height="25" style="float:left; margin-right:15px">Contracts</router-link></b-navbar-brand>

            <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

            <b-collapse id="nav-collapse" is-nav>
            <b-navbar-nav>
                <b-nav-item href="#"><router-link to="/new-contract">New contract</router-link></b-nav-item>
                <b-nav-item href="#"><router-link to="/identity">Manage Identity</router-link></b-nav-item>
                <b-nav-item href="#"><router-link to="/search-contracts">Search contract</router-link></b-nav-item>
            </b-navbar-nav>

            <!-- Right aligned nav items -->
            <b-navbar-nav class="ml-auto">
                <b-nav-item href="#" v-on:click="logout">Sign out</b-nav-item>
            </b-navbar-nav>
            </b-collapse>
        </b-navbar>
    </div>
</template>

<script>
   export default {
        name: 'top-bar',
        mounted (){
        },
        data: function () {
            return {
                
            }
        },
        methods: {
            logout (){
                window.ScryptaCore.forgetKey()
                this.$router.push('/')
            }
        }
    }
</script>
<style>
    a{color:#fff!important; text-decoration: none!important;}
</style>