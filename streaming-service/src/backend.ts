import fs from 'fs';
import { TemperatureError } from './TemperatureError';

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
 * Parses the given JSON string, returning a new JSON string with the 20 most recent temperatures
 * and the median signature. Each signature includes the temperature,their safety status, and
 * timestamp. Temperature incidents are logged and invalid JSON strings are thrown to the caller.
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
		[Math.floor(signatures.length / 2)] ?? { timestamp: null, temperature: 0, isSafe: false }
    }));
}

/**
 * Logs the given error to the appropriate file and creates a timestamp. Will log any
 * TemperatureError to the INCIDENTS_FILE and any other Error to the ERRORS_FILE.
 * @param error
 */
function logError(error: Error) {
    let logFile: string = error instanceof TemperatureError ? INCIDENTS_FILE : ERRORS_FILE;
    fs.appendFile(logFile, `${new Date().toISOString()}:\n${error.message}\n`, (err) => {
        if (err)
            throw err;
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
 */
function updateIncidents(signature: Signature) {
    incidents.push(signature);
    incidents = incidents.filter(entry => Date.now() - entry.timestamp <= TEMP_INCIDENT_WINDOW);
    if (incidents.length > MAX_TEMP_INCIDENTS) {
        const incidentDetails = incidents
            .map(incident => `Timestamp: ${new Date(incident.timestamp).toISOString()}, Temperature: ${incident.temperature}`)
            .join('\n');
        logError(new TemperatureError(`Temperature Threshold Exceeded ${incidents.length} Times in ${TEMP_INCIDENT_WINDOW}ms:\n${incidentDetails}`));
    }
}

export {
    parseBatteryJSON,
    logError,
    isTempSafe,
    updateIncidents,
    ERRORS_FILE,
    INCIDENTS_FILE,
    MAX_TEMP_INCIDENTS,
    SAFE_TEMPERATURE_MAX,
    SAFE_TEMPERATURE_MIN
};