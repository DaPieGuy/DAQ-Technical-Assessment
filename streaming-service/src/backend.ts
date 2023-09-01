import fs from 'fs';

const JSON_ERR_FILE = 'jsonErrs.log';
const INCIDENTS_FILE = 'incidents.log';

const SAFE_TEMPERATURE_MIN = 20;
const SAFE_TEMPERATURE_MAX = 80;

const TEMP_INCIDENT_WINDOW = 5000; //ms
const MAX_TEMP_INCIDENTS = 3;

interface Incident {
    timestamp: Date;
    temperature: number;
}

let incidents: Incident[] = [];

/**
 * Logs custom error messages to the specified logFile and console. Logged messages
 * are also timestamped with an included messageString.
 * @param error 
 * @param messageString 
 * @param logFile 
 */
function handleLogging(error: any, messageString: string, logFile: string) {
    console.error(error.message);
    fs.appendFile(logFile, `${new Date().toISOString()}: ${messageString}\n`, (err) => {
        if (err) {
            console.error(`Error writing to ${logFile}:`, err);
        }
    });
}

/**
 * Performs a temperature check on the given temperature.
 * @param temperature 
 * @returns boolean indicating whether the given temperature is outside the safe range
 */
function isTempSafe(temperature: number): boolean {
    return !(temperature < SAFE_TEMPERATURE_MIN || temperature > SAFE_TEMPERATURE_MAX);
}

/**
 * For each temperature outside the given range, an incident is created. When the number
 * of MAX_TEMP_INCIDENTS is exceeded in the TEMP_INCIDENT_WINDOW, the result is logged.
 * @param temperature 
 * @param timestamp 
 */
function updateIncidents(temperature: number, timestamp: Date) {
    const incident: Incident = { temperature, timestamp };
    incidents = incidents.filter((entry) => Date.now() - entry.timestamp.getTime() <= TEMP_INCIDENT_WINDOW);

    if (!isTempSafe(temperature)) {
        incidents.push(incident);

        if (incidents.length > MAX_TEMP_INCIDENTS) {
            const incidentDetails: string = incidents
                .map((incident) => `Timestamp: ${incident.timestamp.toISOString()}, Temperature: ${incident.temperature}`)
                .join('\n');
            handleLogging(new Error("Temperature Threshold Exceeded"), `Temperature Threshold Exceeded ${incidents.length} Times in ${TEMP_INCIDENT_WINDOW}ms:\n` + incidentDetails, INCIDENTS_FILE);
        }
    }
}

export { handleLogging, updateIncidents, isTempSafe, JSON_ERR_FILE };