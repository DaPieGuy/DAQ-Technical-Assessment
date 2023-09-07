import fs from 'fs';
import net from 'net';
import { WebSocket, WebSocketServer } from 'ws';
import { TemperatureError } from './TemperatureError';
import {
    parseBatteryJSON,
    getFileJSON,
    logError,
    incidentUpdate,
    getIncidentDetails,
    ERRORS_FILE,
    INCIDENTS_FILE
} from './backend';

const TCP_PORT = parseInt(process.env.TCP_PORT || '12000', 10);

const tcpServer = net.createServer();
const websocketServer = new WebSocketServer({ port: 8080 });

tcpServer.on('connection', (socket) => {
    console.log('TCP client connected');
    
    socket.on('data', async (msg) => {
        try {
            sendToFrontend(parseBatteryJSON(msg.toString()));
        } catch (e: any) {
            sendToFrontend(await logError(e));
        }
        if (incidentUpdate())
            sendToFrontend(await logError(new TemperatureError(getIncidentDetails())));
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
    initFrontend();
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

/**
 * Closes the TCP server and websocket servers.
 */
function closeServers() {
    tcpServer.close();
    websocketServer.close();
}

/**
 * Initialises the frontend on websocket connection.
 */
function initFrontend() {
    if (fs.existsSync(ERRORS_FILE))
        sendToFrontend(getFileJSON(ERRORS_FILE));
    if (fs.existsSync(INCIDENTS_FILE))
        sendToFrontend(getFileJSON(INCIDENTS_FILE));
}

export { sendToFrontend, closeServers };