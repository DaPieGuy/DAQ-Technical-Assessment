import fs from 'fs';
import { TemperatureError } from './TemperatureError';

const ERRORS_FILE = 'errors.log';
const INCIDENTS_FILE = 'incidents.log';

const SAFE_TEMPERATURE_MIN = 20;
const SAFE_TEMPERATURE_MAX = 80;

const INCIDENT_WINDOW = 5000; //ms
const MAX_UNSAFE_TEMPERATURES = 3;

interface Signature {
    timestamp: number;
    temperature: number;
    isSafe: boolean;
}

const signatures: Signature[] = [];
let lastIncident: Signature[] = [];

/**
 * Parses the given JSON string, returning a new JSON string with all the current
 * signatures and the median signature. Each signature includes the temperature,
 * its' safety status, and timestamp. Temperature incidents are logged and invalid
 * JSON errors are thrown to the caller.
 * @param msg 
 * @returns string
 */
function parseBatteryJSON(msg: string): string {
    const msgJSON = JSON.parse(msg.toString());
    signatures.push({
        timestamp: msgJSON.timestamp,
        temperature: msgJSON.battery_temperature,
        isSafe: isTempSafe(msgJSON.battery_temperature)
    });

    return (JSON.stringify({
        signatures: signatures,
        medianSignature: signatures.slice().sort((a, b) => a.temperature - b.temperature)
		    [Math.floor(signatures.length / 2)] ?? { timestamp: null, temperature: 0, isSafe: false },
    }));
}

/**
 * Returns a stringified JSON object containing the contents of the given
 * file under an appropriate key. The key will be the name of the file it
 * was read from.
 * @param filename 
 * @returns string
 */
function getFileJSON(logFile: string) {
    const data: { [key: string]: string } = {};
    data[logFile] = fs.readFileSync(logFile, 'utf8');
    return JSON.stringify(data);
}

/**
 * If the number of unsafe temperatures in the INCIDENT_WINDOW exceeds the
 * MAX_UNSAFE_TEMPERATURES, the most recent incident will be updated the
 * function will return true.
 * @param signature
 * @returns boolean
 */
function incidentUpdate(): boolean {
    const incident = signatures.filter(entry => Date.now() - entry.timestamp <=
        INCIDENT_WINDOW && !entry.isSafe);
    if (incident.length > MAX_UNSAFE_TEMPERATURES &&
        JSON.stringify(incident) !== JSON.stringify(lastIncident)) {
        lastIncident = incident;
        return true;
    }
    return false;
}

/**
 * Returns a string containing the details of the most recent incident.
 * @returns string
 */
function getIncidentDetails(): string {
    const incidentDetails = lastIncident
        .map(signature => `- ${signature.temperature.toFixed(3)
        .padEnd(8, ' ')}°C at ${new Date(signature.timestamp)
        .toISOString()}`).join('\n');
    return (`Temperatures Exceeded ${lastIncident
        .length} Times in ${INCIDENT_WINDOW}ms:\n${incidentDetails}`);
}

/**
 * Performs a temperature check to ensure the given temperature is within the
 * safe range.
 * @param temperature 
 * @returns boolean
 */
function isTempSafe(temperature: number): boolean {
    return !(temperature < SAFE_TEMPERATURE_MIN || temperature > SAFE_TEMPERATURE_MAX);
}

/**
 * Logs the given error to the appropriate file and creates a timestamp. Will
 * log any TemperatureError to the INCIDENTS_FILE and any other Error to the
 * ERRORS_FILE. Returns the contents of the log file as a stringified JSON object.
 * @param error
 * @returns string
 */
async function logError(error: Error): Promise<string> {
    const logFile: string = error instanceof TemperatureError ? INCIDENTS_FILE : ERRORS_FILE;
    const logData = `${new Date().toISOString()}:\n${error.message}\n\n`;
    await fs.promises.appendFile(logFile, logData);
    return getFileJSON(logFile);
}

/**
 * Clears the signatures and lastIncident arrays for testing purposes.
 */
function clearData() {
    signatures.length = 0;
    lastIncident = [];
}

export {
    parseBatteryJSON,
    getFileJSON,
    incidentUpdate,
    getIncidentDetails,
    isTempSafe,
    logError,
    clearData,
    ERRORS_FILE,
    INCIDENTS_FILE,
    MAX_UNSAFE_TEMPERATURES,
    SAFE_TEMPERATURE_MAX,
    SAFE_TEMPERATURE_MIN
};