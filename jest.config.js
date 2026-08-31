/** @type {import('jest').Config} */
const config = {
    verbose: true,
    collectCoverage: true,
    collectCoverageFrom: [
        'src/services/*.js',
        'src/controllers/*.js',
        'src/middlewares/*.js',
        'src/dto/*.js',
        'src/websocket/middlewares/**.js',
        'src/websocket/callbacks/**.js',
        'src/websocket/handlers/**.js',
        'src/websocket/sockets/**.js'],
    coverageDirectory: 'coverage',
    clearMocks: true,
    resetMocks: true
};
module.exports = config;    