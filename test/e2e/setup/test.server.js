require('dotenv').config({ path: '.env.test'});
require('../../../src/models/associations');

const app = require('../../../src/app');
const { sequelize } = require('../../../src/database/mysql.database');
const { saveUrl, getUrl } = require('./config');

let server;

const startTestServer = async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    const port = process.env.PORT || 4001;
    server = app.listen(port);
    saveUrl(`http://localhost:${port}`);
}

const stopTestServer = async () => {
    await new Promise((resolve) => server.close(resolve));
    await sequelize.close();
}

module.exports = { startTestServer, stopTestServer };