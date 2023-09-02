import { tcpClient, generate_and_send_battery_data } from '../battery_emulator'; // Import tcpClient from your module

// Mock the net.Socket module
jest.mock('net');

describe('generate_and_send_battery_data', () => {
	it('should send a non-empty string to the socket', () => {
		const writeMock = jest.spyOn(tcpClient, 'write');
		generate_and_send_battery_data();
		expect(writeMock).toHaveBeenCalledWith(expect.stringMatching(/\S+/));
	});
});