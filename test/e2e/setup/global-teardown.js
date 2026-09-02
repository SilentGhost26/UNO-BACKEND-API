const { stopTestServer } = require('./test.server');

module.exports = async () => {
    await stopTestServer();
}