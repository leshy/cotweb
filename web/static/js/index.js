var $fMN8b$engineioclient = require("engine.io-client");


var $566e0e2140a4de60$require$Socket = $fMN8b$engineioclient.Socket;
const $566e0e2140a4de60$var$socket = new $566e0e2140a4de60$require$Socket("ws://" + document.location.host);
//@ts-ignore
$566e0e2140a4de60$var$socket.on("open", (err, data)=>{
    console.log("connected", err, data);
    // @ts-ignore
    $566e0e2140a4de60$var$socket.on("message", (data)=>{});
    $566e0e2140a4de60$var$socket.on("close", ()=>{
        console.log("closed");
    });
});


//# sourceMappingURL=index.js.map
