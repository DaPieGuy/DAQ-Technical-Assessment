import net from 'net';
import { WebSocket, WebSocketServer } from 'ws';
import { handleLogging, isTempSafe, updateIncidents, JSON_ERR_FILE } from './backend';

const TCP_PORT = parseInt(process.env.TCP_PORT || '12000', 10);

const tcpServer = net.createServer();
const websocketServer = new WebSocketServer({ port: 8080 });

tcpServer.on('connection', (socket) => {
    console.log('TCP client connected');
    
    socket.on('data', (msg) => {
        let msgJSON: any;
        
        try {
            msgJSON = JSON.parse(msg.toString());
            console.log(msg.toString());
        } catch (e) {
            handleLogging(e, "Invalid JSON String:\n" + msg, JSON_ERR_FILE);
            return;
        }

        updateIncidents(msgJSON.battery_temperature, new Date(msgJSON.timestamp));
        msgJSON.is_temp_safe = isTempSafe(msgJSON.battery_temperature);

        websocketServer.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN)
                client.send(JSON.stringify(msgJSON));
        });
    });

    socket.on('end', () => {
        console.log('Closing connection with the TCP client');
    });
    
    socket.on('error', (err) => {
        console.log('TCP client error: ', err);
    });
});

websocketServer.on('listening', () => console.log('Websocket server started'));

websocketServer.on('connection', async (ws: WebSocket) => {
    console.log('Frontend websocket client connected to websocket server');
    ws.on('error', console.error);  
});

tcpServer.listen(TCP_PORT, () => {
    console.log(`TCP server listening on port ${TCP_PORT}`);
});