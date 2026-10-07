require('dotenv').config();
require('./src/models/associations');

const { sequelize } = require('./src/database/mysql.database');
const { dbTransportStream } = require('./src/compositions'); 

const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('./swagger/swagger-output.json');

const app = require('./src/app');
const htpp = require('http');
const server = htpp.createServer(app);
const { Server } = require('socket.io');
const initializeServer = require('./src/websocket/socket.server');
const { cardService } = require('./src/compositions');
const PORT = process.env.PORT || 3000;

const logger = require('./config/winston-logger.config');

async function runServer() {
    try {
        await sequelize.authenticate();
        console.log("Connection to the database established succesfully");

        await sequelize.sync({ alter: false});
        console.log('Models syncronized correctly');

        logger.add(dbTransportStream);

        const cards = await cardService.initializeCards();
        if (!cards.ok && cards.error?.statusCode !== 409) throw cards.error;
    
        app.use(
            '/api-docs',
            swaggerUi.serve,
            swaggerUi.setup(swaggerFile)
        )
        
        initializeServer(server);

        server.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
            console.log(`API documentation: http://localhost:${PORT}/api-docs`);
        })
    } catch(error){
        console.error('Error starting the server: ', error);
        process.exit(1);
    }
}

runServer();
