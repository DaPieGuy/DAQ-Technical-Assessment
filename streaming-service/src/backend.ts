import fs from 'fs';
import { TemperatureError } from './TemperatureError';
import { sendToFrontend } from './server';

const ERRORS_FILE = 'errors.log';
const INCIDENTS_FILE = 'incidents.log';

const SAFE_TEMPERATURE_MIN = 20;
const SAFE_TEMPERATURE_MAX = 80;

const TEMP_INCIDENT_WINDOW = 5000; //ms
const MAX_TEMP_INCIDENTS = 3;

interface Signature {
    timestamp: number;
    temperature: number;
    isSafe: boolean;
}

const signatures: Signature[] = [];
let incidents: Signature[] = [];

/**
 * Parses the given JSON string, returning a new JSON string with all the current signatures
 * and the median signature. Each signature includes the temperature, its' safety status, and
 * timestamp. Temperature incidents are logged and invalid JSON errors are thrown to the caller.
 * @param msg 
 * @returns string
 */
function parseBatteryJSON(msg: string): string {
    const msgJSON = JSON.parse(msg.toString());
    const signature: Signature = {
        timestamp: msgJSON.timestamp,
        temperature: msgJSON.battery_temperature,
        isSafe: isTempSafe(msgJSON.battery_temperature)
    };

    signatures.push(signature);
    if (signature.isSafe === false)
        updateIncidents(signature);

    return (JSON.stringify({
        signatures: signatures,
        medianSignature: signatures.slice().sort((a, b) => a.temperature - b.temperature)
		    [Math.floor(signatures.length / 2)] ?? { timestamp: null, temperature: 0, isSafe: false },
    }));
}

/**
 * Logs the given error to the appropriate file, creating a timestamp and forwarding to the
 * frontend. Will log any TemperatureError to the INCIDENTS_FILE and any other Error to the
 * ERRORS_FILE.
 * @param error
 */
function logError(error: Error) {
    let logFile: string = error instanceof TemperatureError ? INCIDENTS_FILE : ERRORS_FILE;
    fs.appendFile(logFile, `${new Date().toISOString()}:\n${error.message}\n\n`, (err) => {
        if (err)
            throw err;

        sendToFrontend(getFileJSONString(logFile));
    });
}

/**
 * Performs a temperature check to ensure the given temperature is within the safe range.
 * @param temperature 
 * @returns boolean
 */
function isTempSafe(temperature: number): boolean {
    return !(temperature < SAFE_TEMPERATURE_MIN || temperature > SAFE_TEMPERATURE_MAX);
}

/**
 * For each temperature in the TEMP_INCIDENT_WINDOW and outside of the safe temperature
 * range, an incident is formed. If the number of incidents exceeds MAX_TEMP_INCIDENTS,
 * a TemperatureError is logged to the INCIDENTS_FILE.
 * @param signature
 */
function updateIncidents(signature: Signature) {
    incidents.push(signature);
    incidents = incidents.filter(entry => Date.now() - entry.timestamp <= TEMP_INCIDENT_WINDOW);
    if (incidents.length > MAX_TEMP_INCIDENTS) {
        const incidentDetails = incidents
        .map(incident => `- ${incident.temperature.toFixed(3).padEnd(8, ' ')}°C at ${new Date(incident.timestamp).toISOString()}`)
        .join('\n');
        logError(new TemperatureError(`Temperatures Exceeded ${incidents.length} Times in ${TEMP_INCIDENT_WINDOW}ms:\n${incidentDetails}`));
    }
}

/**
 * Gets the contents of the given file, returning an empty string if the file does not
 * exist and a json string with the file name and contents if it does.
 * @param filename 
 * @returns string
 */
function getFileJSONString(logFile: string) {
    if (fs.existsSync(logFile)) {
        const data: { [key: string]: string } = {};
        data[logFile] = fs.readFileSync(logFile, 'utf8');
        return JSON.stringify(data);
    }
    return '';
}

export {
    parseBatteryJSON,
    logError,
    isTempSafe,
    updateIncidents,
    getFileJSONString,
    ERRORS_FILE,
    INCIDENTS_FILE,
    MAX_TEMP_INCIDENTS,
    SAFE_TEMPERATURE_MAX,
    SAFE_TEMPERATURE_MIN
};