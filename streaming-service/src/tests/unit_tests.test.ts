import fs from 'fs';
import {
	logError,
	updateIncidents,
	isTempSafe,
	ERRORS_FILE,
	INCIDENTS_FILE,
	MAX_TEMP_INCIDENTS,
	SAFE_TEMPERATURE_MAX,
	SAFE_TEMPERATURE_MIN,
	parseBatteryJSON,
} from '../backend';
import { TemperatureError } from '../TemperatureError';

async function deleteLogFiles() {
	if (fs.existsSync(ERRORS_FILE))
		await fs.unlinkSync(ERRORS_FILE);
	if (fs.existsSync(INCIDENTS_FILE))
		await fs.unlinkSync(INCIDENTS_FILE);
}

beforeEach(() => {
    deleteLogFiles();
});

afterEach(() => {
    deleteLogFiles();
});

describe('isTempSafe function', () => {
	test('Success - Should return true for temperatures within the safe range', () => {
		expect(isTempSafe(SAFE_TEMPERATURE_MIN + 5)).toBe(true);
	});

	test('Fail - Should return false for temperatures below the safe range', () => {
		expect(isTempSafe(SAFE_TEMPERATURE_MIN - 5)).toBe(false);
	});

	test('Fail - Should return false for temperatures above the safe range', () => {
		expect(isTempSafe(SAFE_TEMPERATURE_MAX + 5)).toBe(false);
	});
});

describe('handleLogging function', () => {
    test('Success - Write the error message to the errors file', async () => {
        const error = new Error('Test Error');
    
        await logError(error);
        const logFileContents: string = await fs.promises.readFile(ERRORS_FILE, 'utf-8');
        expect(logFileContents).toContain('Test Error');
    });

    test('Success - Write the error message to the incidents file', async () => {
        const error = new TemperatureError('Test Error');
    
        await logError(error);
        const logFileContents: string = await fs.promises.readFile(INCIDENTS_FILE, 'utf-8');
        expect(logFileContents).toContain('Test Error');
    });
});
  
describe('updateIncidents function', () => {
    test('Success - Write error message to the incidents log file when the threshold is exceeded', async () => {
        for (let i = 0; i < MAX_TEMP_INCIDENTS + 3; i++)
            await updateIncidents({ timestamp: Date.now(), temperature: SAFE_TEMPERATURE_MAX + 20, isSafe: false });

        const incidentsLogFileContents: string = await fs.promises.readFile(INCIDENTS_FILE, 'utf-8');
        expect(incidentsLogFileContents).toContain('Temperature Threshold Exceeded');
    });

    test('Fail - Write error message to the incidents log file when the threshold is exceeded', async () => {
        for (let i = 0; i < MAX_TEMP_INCIDENTS - 1; i++)
            await updateIncidents({ timestamp: Date.now(), temperature: SAFE_TEMPERATURE_MAX + 20, isSafe: false });

        const incidentsLogFileContents: string = await fs.promises.readFile(INCIDENTS_FILE, 'utf-8');
        expect(incidentsLogFileContents).toContain('Temperature Threshold Exceeded');
    });
});

describe('parseBatteryJSON function', () => {
	test('Success - Expect to convert string to frontend format', async () => {
		const inputJSON = '{"battery_temperature":40.74831959389153,"timestamp":1693741005254}';
		const expectedOutput = '{"signatures":[{"timestamp":1693741005254,"temperature":40.74831959389153,"isSafe":true}],"medianSignature":{"timestamp":1693741005254,"temperature":40.74831959389153,"isSafe":true}}';
		
		const result = parseBatteryJSON(inputJSON);
	  
		expect(result).toEqual(expectedOutput);
	  });

    test('Fail - Expect to throw error with invalid string', async () => {
        expect (() => parseBatteryJSON('{"battery_temperature":53.713094001803235,"timestamp":1693740870134}}')).toThrow();
    });
});