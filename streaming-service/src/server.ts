import net from 'net';
import { WebSocket, WebSocketServer } from 'ws';
import { ERRORS_FILE, INCIDENTS_FILE, getFileJSONString, logError, parseBatteryJSON } from './backend';

const TCP_PORT = parseInt(process.env.TCP_PORT || '12000', 10);

const tcpServer = net.createServer();
const websocketServer = new WebSocketServer({ port: 8080 });

tcpServer.on('connection', (socket) => {
    console.log('TCP client connected');
    
    socket.on('data', (msg) => {
        try {
            sendToFrontend(parseBatteryJSON(msg.toString()));
        } catch (e: any) {
            logError(e);
        }
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
    sendToFrontend(getFileJSONString(ERRORS_FILE));
    sendToFrontend(getFileJSONString(INCIDENTS_FILE));
    ws.on('error', console.error);  
});

tcpServer.listen(TCP_PORT, () => {
    console.log(`TCP server listening on port ${TCP_PORT}`);
});

/**
 * Sends the given message to all connected frontend clients.
 * @param msg 
 */
function sendToFrontend(msg: string) {
    [...websocketServer.clients]
        .filter(client => client.readyState === WebSocket.OPEN)
        .forEach(client => client.send(msg));
}

export { sendToFrontend };