class TemperatureError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TemperatureError';
    }
}

export { TemperatureError };