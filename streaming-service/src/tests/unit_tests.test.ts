import fs from 'fs';
import { TemperatureError } from '../TemperatureError';
import { closeServers } from '../server';
import {
	parseBatteryJSON,
	incidentUpdate,
	isTempSafe,
	logError,
    clearData,

	ERRORS_FILE,
	INCIDENTS_FILE,
    SAFE_TEMPERATURE_MAX,
	SAFE_TEMPERATURE_MIN,
	MAX_UNSAFE_TEMPERATURES,
    getIncidentDetails,
} from '../backend';

async function deleteLogFiles() {
	if (fs.existsSync(ERRORS_FILE))
		await fs.promises.unlink(ERRORS_FILE);
	if (fs.existsSync(INCIDENTS_FILE))
		await fs.promises.unlink(INCIDENTS_FILE);
}

beforeEach(async () => {
    await deleteLogFiles();
    clearData();
});

afterEach(async() => {
    await deleteLogFiles();
    clearData();
});

afterAll(() => {
    closeServers();
});

describe('isTempSafe function', () => {
	test('Success - Should return true for temperatures within the safe range', () => {
		expect(isTempSafe(SAFE_TEMPERATURE_MIN + 5)).toBe(true);
	});

	test('Success - Should return false for temperatures below the safe range', () => {
		expect(isTempSafe(SAFE_TEMPERATURE_MIN - 5)).toBe(false);
	});

	test('Success - Should return false for temperatures above the safe range', () => {
		expect(isTempSafe(SAFE_TEMPERATURE_MAX + 5)).toBe(false);
	});
});

describe('logError function', () => {
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

describe('parseBatteryJSON function', () => {
	test('Success - Expect to convert string to frontend format', async () => {
		const inputJSON = '{"battery_temperature":40.74831959389153,"timestamp":1693741005254}';
		const expectedOutput = '{"signatures":[{"timestamp":1693741005254,"temperature":40.74831959389153,"isSafe":true}],"medianSignature":{"timestamp":1693741005254,"temperature":40.74831959389153,"isSafe":true}}';
		
		const result = parseBatteryJSON(inputJSON);
	  
		expect(result).toEqual(expectedOutput);
	  });

    test('Fail - Expect to convert string to frontend format', async () => {
        expect (() => parseBatteryJSON('{"battery_temperature":53.713094001803235,"timestamp":1693740870134}}')).toThrow();
    });
});

describe('incidents update test', () => {
    test('Success - Update the last incident array when temps exceed allowable threshold', async () => {
        for (let i = 0; i < MAX_UNSAFE_TEMPERATURES + 1; i++)
            parseBatteryJSON(JSON.stringify({
                "battery_temperature": SAFE_TEMPERATURE_MIN - 1,
                "timestamp": Date.now()
            }));
        
        expect(incidentUpdate()).toStrictEqual(true);
        const incidentDetails: string = getIncidentDetails();;
        expect(incidentDetails).toEqual(expect.any(String));
    });

    test('Fail - Update the last incident array when temps exceed allowable threshold', async () => {
        for (let i = 0; i < MAX_UNSAFE_TEMPERATURES - 1; i++)
            parseBatteryJSON(JSON.stringify({
                "battery_temperature": SAFE_TEMPERATURE_MIN - 1,
                "timestamp": Date.now()
            }));
        
        expect(incidentUpdate()).toStrictEqual(false);
    });
});