require('dotenv').config();
require('./src/models/associations');

const { sequelize } = require('./src/database/mysql.database');
const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('./swagger/swagger-output.json');
const app = require('./src/app');
const htpp = require('http');
const server = htpp.createServer(app);
const { Server } = require('socket.io');
const initializeServer = require('./src/websocket/socket.server');
const PORT = process.env.PORT || 3000;

async function runServer() {
    try {
        await sequelize.authenticate();
        console.log("Connection to the database established succesfully");

        await sequelize.sync({ alter: false});
        console.log('Models syncronized correctly');
    
        app.use(
            '/api-docs',
            swaggerUi.serve,
            swaggerUi.setup(swaggerFile)
        )
        
        initializeServer(server);

        server.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`)
        })
    } catch(error){
        console.error('Error starting the server: ', error);
        process.exit(1);
    }
}

runServer();
