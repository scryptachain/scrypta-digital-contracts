<template>
  <div id="app">
    <router-view/>
    <div class="text-center footer">
      Open Source Project developed by <a href="https://scryptachain.org" style="color:#000!important">Scrypta Task Force</a>.
    </div>
  </div>
</template>
<style>
  .footer{
    position:fixed;
    bottom:0;
    background:#fff;
    z-index: 99;
    left:0;
    font-size:12px; 
    text-align:center;
    width:100%;
    padding:5px;
    border-top:1px solid #eee
  }
  .main-container{
    padding-bottom:60px;
  }
</style>