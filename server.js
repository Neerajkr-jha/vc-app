// all the backend 
import express from 'express';
import https from 'https';
import { Server } from 'socket.io';
import fs from 'fs';
const app = express();
// openssl req -new -x509 -key key.pem -out cert.pem -days 365
// app.use(middleware)
const httpsServer = https.createServer({
    cert : fs.readFileSync('./cert/server.crt'),
    key: fs.readFileSync('./cert/server.key')
},app);
app.use(express.static('public'));
const io=new Server(httpsServer,{cors:{origin:"*"}});
// if any new user arrive connection buit
io.on('connection',socket=>{
    // after arrive -> connection
    // ie join meeting
    socket.on('join-meeting',()=>{
        const peers=[...io.sockets.sockets.keys().filter(id=>socket.id!==socket.id)]
        socket.emit('peers',peers);
    });
    //  socket.on('leave-meeting',()=>{

    // })
    socket.on('signal',({to,desciption,candidate})=>{
        if(to){
            io.to(to).emit('signal',{from:socket.id,desciption,candidate});
        }
    })
})

httpsServer.listen(1234, err=>{
    if(err){
        console.log('Server Crash ', err);
    }
    else{
        console.log('Server Up and Running ', 'https://localhost:1234');
    }
})