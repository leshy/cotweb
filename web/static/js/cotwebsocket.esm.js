import {Socket as $7FxxX$Socket} from "engine.io-client";


var $777586aab735b37c$require$Socket = $7FxxX$Socket;
const $777586aab735b37c$var$socket = new $777586aab735b37c$require$Socket("ws://" + document.location.host);
//@ts-ignore
$777586aab735b37c$var$socket.on("open", (err, data)=>{
    console.log("connected", err, data);
    // @ts-ignore
    $777586aab735b37c$var$socket.on("message", (data)=>{});
    $777586aab735b37c$var$socket.on("close", ()=>{
        console.log("closed");
    });
});


//# sourceMappingURL=cotwebsocket.esm.js.map
