const createLoggerServiceMock = () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
});

module.exports = {
    createLoggerServiceMock,
};
