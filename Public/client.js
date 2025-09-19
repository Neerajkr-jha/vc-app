window.addEventListener('load', bindEvents);
function bindEvents(){
    document.querySelector('#join').addEventListener('click',joinMeeting);
}

let localStream;
let socket;
let peers={};
async function joinMeeting() {
    // for camera
    localStream = await navigator.mediaDevices
        .getUserMedia({ audio: true, video: { facingMode: 'user' } })
    const video = document.querySelector('#video');
    video.srcObject = localStream;
    video.muted = true;
    video.playsInline = true;

    //for socket + webRtc
    socket = io();
    registerSocketEvents();
    socket.emit('join-Meeting') //fire event
}

function registerSocketEvents() {
    // connects to multiple users(peers)
    socket.on('peers', async (peers) => {
        for (let id of peers) {
            const peerConnection = makePeerConnection(id);
            await peerConnection.setLocalDescription(await peerConnection.createOffer());
            socket.emit('signal', { to: id, description: peerConnection.localDescription });
        }
    });
    socket.on('signal', async ({ from, description, candidate }) => {
        const peerConnection = makePeerConnection(from);
        if (description) {
            if (description.type == 'offer') {
                await peerConnection.setRemoteDescription(await peerConnection(description));
                socket.emit('signal', { to: from, description: peerConnection.localDescription });
            } else {
                await peerConnection.setRemoteDescription(description);
            }
        }
        if(candidate){
            await peerConnection.addIceConnection(candidate);
        }
    });
}

function makePeerConnection(id){
    if(peers[id]){
        return peers[id];
    }
    const peerConnection=new RTCPeerConnection({
        iceServers:[{urls:"stun:stun.1.google.com:19302"}]
    })
    localStream.getTracks().forEach(track=>peerConnection.addTrack(track,localStream));
    peerConnection.ontrack=e=>{
        let v=document.getElementById('v-'+id);
        if(!v){
            v=document.createElement("video");
            v.id="v-"+id;
            v.autoplay=true;
            v.playsInline=true;
            v.className="tile";
            document.getElementById("grid").appendChild(v);
        }
        v.srcObject=e.streams[0];
    };
    peers[id]=peerConnection;
    return peerConnection;
}
