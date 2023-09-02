import fs from 'fs';
import {
  handleLogging,
  updateIncidents,
  isTempSafe,
  JSON_ERR_FILE,
  INCIDENTS_FILE,
  MAX_TEMP_INCIDENTS,
  SAFE_TEMPERATURE_MAX,
  SAFE_TEMPERATURE_MIN,
} from '../backend';

async function deleteLogFiles() {
  if (fs.existsSync(JSON_ERR_FILE))
    await fs.unlinkSync(JSON_ERR_FILE);
  if (fs.existsSync(INCIDENTS_FILE))
    await fs.unlinkSync(INCIDENTS_FILE);
}

beforeEach(() => {
    deleteLogFiles();
});

afterEach(() => {
    deleteLogFiles();
});


function printFilesInDirectory() {
    const filesInDirectory = fs.readdirSync('./');
    console.log('Files in directory:', filesInDirectory);
}

describe('isTempSafe function', () => {
  test('should return true for temperatures within the safe range', () => {
    expect(isTempSafe(25)).toBe(true);
  });

  test('should return false for temperatures below the safe range', () => {
    expect(isTempSafe(15)).toBe(false);
  });

  test('should return false for temperatures above the safe range', () => {
    expect(isTempSafe(85)).toBe(false);
  });
});

describe('handleLogging function', () => {
    test('should write the error message to the log file', async () => {
        const error = new Error('Test Error');
        const messageString = 'Test Message';
    
        await handleLogging(error, messageString, JSON_ERR_FILE);
        const logFileContents: string = await fs.promises.readFile(JSON_ERR_FILE, 'utf-8');
        expect(logFileContents).toContain('Test Message');
    });
});
  
describe('updateIncidents function', () => {

    test('should write an error message to the incidents log file when the threshold is exceeded', async () => {
        for (let i = 0; i < MAX_TEMP_INCIDENTS + 3; i++)
            updateIncidents(SAFE_TEMPERATURE_MAX + 20, new Date());

        const incidentsLogFileContents: string = await fs.promises.readFile(INCIDENTS_FILE, 'utf-8');
        expect(incidentsLogFileContents).toContain('Temperature Threshold Exceeded');
    });
});