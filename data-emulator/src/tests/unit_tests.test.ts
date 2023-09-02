import { assert } from 'console';
import net from 'net';

jest.mock('net');
jest.mock('process', () => ({
  exit: jest.fn(),
}));

const { exit } = require('process');
const { generate_and_send_battery_data } = require('../battery_emulator'); // Replace with the actual path to your module

describe('generate_and_send_battery_data', () => {
  it('should add 1 + 1 and expect it to be 2', () => {
    expect(1 + 1).toBe(2);
  });
});