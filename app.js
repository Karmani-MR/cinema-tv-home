(function () {
  "use strict";
  var tv = /^(127\.0\.0\.1|localhost)$/.test(location.hostname) && location.port === "8081";
  var base = "http://127.0.0.1:8097";
  var token = "";
  var socket = null;
  var tube = null;
  var pendingTube = null;
  var reconnects = 0;
  var launchTimer = null;
  var restoreFocus = null;
  var cards = Array.prototype.slice.call(document.querySelectorAll(".app-card"));
  var names = {youtube:"YouTube",netflix:"Netflix",hbo:"HBO Max",prime:"Prime Video",apple:"Apple TV",youtubetv:"YouTube TV",inputs:"Inputs",settings:"Settings"};
  var details = {youtube:"Watch with TizenTube",netflix:"Films, series, and documentaries",hbo:"HBO originals, films, and series",prime:"Films, series, and live events",apple:"Apple TV and your library",youtubetv:"Your live television"};
  var state = {};
  var $ = function(id){return document.getElementById(id);};

  function status(message) { $("status").textContent = message || ""; }
  function clock() {
    var now = new Date();
    $("clock").textContent = now.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"});
    $("day-label").textContent = now.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"}).toUpperCase();
  }
  function openDialog(title, paragraphs, credits) {
    restoreFocus = document.activeElement;
    $("dialog-title").textContent = title;
    $("dialog-body").textContent = "";
    paragraphs.forEach(function(text){var p=document.createElement("p");p.textContent=text;$("dialog-body").appendChild(p);});
    if (credits) {
      var p = document.createElement("p");
      p.innerHTML = 'Landscape: <a href="https://unsplash.com/photos/mountains-reflect-in-a-dark-wet-landscape-24h4vWNHjJE" target="_blank" rel="noopener noreferrer">Karsten Winegeart / Unsplash</a>. Manrope by the Manrope Project Authors, SIL Open Font License. App names and marks belong to their owners.';
      $("dialog-body").appendChild(p);
    }
    $("dialog-backdrop").hidden = false;
    $("dialog-close").focus();
  }
  function closeDialog() {
    $("dialog-backdrop").hidden = true;
    if (restoreFocus && restoreFocus.focus) restoreFocus.focus();
  }
  function about() {
    openDialog("Your apps. Nothing extra.",[
      "A cinematic home with no promotional feed, tracking, or account sign-in. Your streaming accounts stay in their original apps.",
      "YouTube opens through TizenTube. Ads inside other streaming services still depend on the service and your subscription.",
      "Press the TV remote’s Home button to return to Samsung Home. This launcher does not replace the system Home button. To bypass Cinema Home, hold Up while TizenBrew starts.",
      tv ? "This screen talks only to its companion service on the TV itself." : "Browser preview: app buttons show a preview message and never connect to your TV."
    ],true);
  }
  function select(card) {
    var key=card.getAttribute("data-app");
    $("selected-name").textContent=names[key];
    $("selected-detail").textContent=details[key];
  }
  function send(data) {
    if(socket && socket.readyState===1) socket.send(JSON.stringify(data));
  }
  function connectModules() {
    try {socket=new WebSocket("ws://127.0.0.1:8081");}
    catch(e){status("TizenBrew is not ready yet. Reopen Cinema Home to retry.");return;}
    socket.onopen=function(){reconnects=0;send({type:4});};
    socket.onmessage=function(event){
      var data;
      try {data=JSON.parse(event.data);} catch(e){return;}
      if(data.type===4){
        if(data.payload===null){setTimeout(function(){send({type:4});},700);return;}
        tube=(data.payload||[]).filter(function(m){return m.fullName && m.fullName.indexOf("npm/@foxreis/tizentube")===0;})[0]||null;
        send({type:-1});
      }else if(data.type===5 && pendingTube){
        var path=pendingTube.appPath;pendingTube=null;location.href=path;
      }else if(data.type===8){
        status("TizenBrew: "+String(data.payload));clearTimeout(launchTimer);
      }
    };
    socket.onclose=function(){socket=null;if(++reconnects<4)setTimeout(connectModules,1500);};
  }
  function loadState(attempt) {
    fetch(base+"/state").then(function(r){if(!r.ok)throw new Error("Service unavailable");return r.json();}).then(function(data){
      token=data.token;state=data.apps||{};$("connection").textContent="TV connected";
      status("");
      cards.forEach(function(card){
        var key=card.getAttribute("data-app");
        if(key!=="youtube" && state[key]===false) card.setAttribute("data-unavailable","true");
      });
    }).catch(function(){
      $("connection").textContent="Connecting to TV…";
      if(attempt<15)setTimeout(function(){loadState(attempt+1);},800);
      else{status("The companion service is not ready. Close and reopen Cinema Home, or restart the TV.");$("connection").textContent="TV service unavailable";}
    });
  }
  function activate(key) {
    if(!tv) {
      openDialog(names[key]+" on your TV",[
        "This is a browser preview. On the TV, this shortcut opens "+(key==="youtube"?"YouTube through TizenTube":names[key])+".",
        "No remote-control request has been sent from this preview."
      ],false);
      return;
    }
    if(key==="youtube") {
      if(!tube || !socket || socket.readyState!==1){status("TizenTube is not ready. Wait a moment, then try again.");return;}
      status("Opening YouTube…");
      send({type:5,payload:tube});
      if(tube.evaluateScriptOnDocumentStart)pendingTube=tube;
      else location.href=tube.appPath;
      launchTimer=setTimeout(function(){status("If YouTube did not open, return to TizenBrew and open TizenTube directly.");},12000);
      return;
    }
    if(!token){status("Waiting for the TV service. Try again in a moment.");return;}
    if(state[key]===false){status(names[key]+" was not found. Install it through Samsung Apps, then reopen Cinema Home.");return;}
    status("Opening "+names[key]+"…");
    fetch(base+"/launch",{
      method:"POST",headers:{"Content-Type":"application/json","X-Cinema-Token":token},body:JSON.stringify({app:key})
    }).then(function(r){return r.json().then(function(data){if(!r.ok)throw new Error(data.error||"Launch failed");return data;});}).then(function(){status("");}).catch(function(){
      status("Could not open "+names[key]+". Try the app from Samsung Home, then reopen Cinema Home.");
    });
  }
  cards.forEach(function(card){
    card.addEventListener("focus",function(){select(card);});
    card.addEventListener("mouseenter",function(){select(card);});
    card.addEventListener("click",function(){activate(card.getAttribute("data-app"));});
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-system]"),function(button){
    button.addEventListener("click",function(){activate(button.getAttribute("data-system"));});
  });
  $("about-button").addEventListener("click",about);
  $("clock").addEventListener("click",about);
  $("dialog-close").addEventListener("click",closeDialog);
  $("dialog-backdrop").addEventListener("click",function(e){if(e.target===$("dialog-backdrop"))closeDialog();});
  document.addEventListener("keydown",function(e){
    var key=e.key || e.keyCode;
    if(!$("dialog-backdrop").hidden){
      if(key==="Escape" || key===27 || key===10009){e.preventDefault();closeDialog();}
      if(key==="Tab" || key===9){
        var focusables=Array.prototype.slice.call($("dialog-backdrop").querySelectorAll("a,button"));
        var first=focusables[0],last=focusables[focusables.length-1];
        if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
        else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
      }
      return;
    }
    if(key==="ArrowLeft" || key===37 || key==="ArrowRight" || key===39){
      var index=cards.indexOf(document.activeElement);
      var step=key==="ArrowLeft" || key===37?-1:1;
      if(index>=0){e.preventDefault();cards[(index+step+cards.length)%cards.length].focus();}
      else {
        var utilities=Array.prototype.slice.call(document.querySelectorAll(".utility"));
        var utilityIndex=utilities.indexOf(document.activeElement);
        if(utilityIndex>=0){e.preventDefault();utilities[(utilityIndex+step+utilities.length)%utilities.length].focus();}
      }
    }else if(key==="ArrowUp" || key===38){
      var current=cards.indexOf(document.activeElement);
      if(current>=0){e.preventDefault();document.querySelector("[data-system='settings']").focus();}
      else if(document.activeElement===$("about-button")){e.preventDefault();cards[0].focus();}
    }else if(key==="ArrowDown" || key===40){
      e.preventDefault();
      if(cards.indexOf(document.activeElement)>=0)$("about-button").focus();
      else cards[0].focus();
    }else if(key===10009){
      e.preventDefault();
      openDialog("Return to Samsung Home",["Press the Home button on your TV remote to open Samsung Home. To change or disable Cinema Home, hold Up while TizenBrew starts, then open its Settings."],false);
    }
  });
  document.addEventListener("visibilitychange",function(){if(!document.hidden){status("");clearTimeout(launchTimer);}});
  clock();setInterval(clock,30000);
  if(tv){$("connection").textContent="Connecting to TV…";connectModules();loadState(0);}
  setTimeout(function(){if(document.activeElement===document.body)cards[0].focus();},150);
})();
