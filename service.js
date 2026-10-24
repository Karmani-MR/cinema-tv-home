/* TizenBrew companion. ES5 for the TV's Node runtime; no external dependencies. */
var http = require("http");
var crypto = require("crypto");
var PORT = 8097;
var sessionToken = crypto.randomBytes(24).toString("hex");
var origins = ["http://127.0.0.1:8081", "http://localhost:8081"];
var allowed = {
  netflix: ["org.tizen.netflix-app"],
  hbo: ["5b8c3eb16b.BeamCTVDev", "cj37Ni3qXM.HBONow"],
  prime: ["org.tizen.primevideo"],
  apple: ["com.samsung.tv.aria-video"],
  youtubetv: ["PvWgqxV3Xa.YouTubeTV"],
  inputs: ["org.tizen.SMSourceAPP"],
  settings: ["com.samsung.tv.coba.setting"]
};
function reply(req, res, code, data) {
  var headers = {"Content-Type":"application/json","Cache-Control":"no-store"};
  if(origins.indexOf(req.headers.origin)!==-1) {
    headers["Access-Control-Allow-Origin"] = req.headers.origin;
    headers["Vary"] = "Origin";
  }
  res.writeHead(code,headers);
  res.end(JSON.stringify(data));
}
function apps(done, fail) {
  try {
    tizen.application.getAppsInfo(function(list){
      var installed = {};
      list.forEach(function(app){installed[app.id]=true;});
      var result = {};
      Object.keys(allowed).forEach(function(key){
        result[key]=allowed[key].filter(function(id){return installed[id];})[0]||false;
      });
      done(result);
    },fail);
  }catch(e){fail(e);}
}
var server = http.createServer(function(req,res){
  var origin=req.headers.origin;
  if(origin && origins.indexOf(origin)===-1){reply(req,res,403,{error:"Origin not permitted"});return;}
  if(req.method==="OPTIONS"){
    res.writeHead(204,{
      "Access-Control-Allow-Origin":origin||origins[0],
      "Access-Control-Allow-Methods":"GET, POST, OPTIONS",
      "Access-Control-Allow-Headers":"Content-Type, X-Cinema-Token",
      "Vary":"Origin"
    });res.end();return;
  }
  if(req.method==="GET" && req.url==="/state"){
    apps(function(found){
      var available={};
      Object.keys(found).forEach(function(key){available[key]=!!found[key];});
      reply(req,res,200,{version:"1.0.0",token:sessionToken,apps:available});
    },function(){reply(req,res,503,{error:"TV application API unavailable"});});
    return;
  }
  if(req.method==="POST" && req.url==="/launch"){
    if(req.headers["x-cinema-token"]!==sessionToken){reply(req,res,403,{error:"Session not authorized"});return;}
    var body="";var tooLarge=false;
    req.on("data",function(chunk){body+=chunk;if(body.length>2048){tooLarge=true;req.destroy();}});
    req.on("end",function(){
      if(tooLarge)return;
      var input;
      try{input=JSON.parse(body);}catch(e){reply(req,res,400,{error:"Invalid request"});return;}
      if(!input || !Object.prototype.hasOwnProperty.call(allowed,input.app)){reply(req,res,400,{error:"App not permitted"});return;}
      apps(function(found){
        var id=found[input.app];
        if(!id){reply(req,res,404,{error:"App not installed"});return;}
        try {
          tizen.application.launch(id,function(){reply(req,res,200,{ok:true});},
            function(){reply(req,res,503,{error:"TV could not launch app"});});
        } catch(e){reply(req,res,503,{error:"TV could not launch app"});}
      },function(){reply(req,res,503,{error:"TV application API unavailable"});});
    });
    return;
  }
  reply(req,res,404,{error:"Not found"});
});
server.on("error",function(error){
  /* Keep any existing companion intact rather than stopping or replacing it. */
  if(error.code!=="EADDRINUSE")console.log("Cinema Home companion could not start.");
});
server.listen(PORT,"127.0.0.1");
