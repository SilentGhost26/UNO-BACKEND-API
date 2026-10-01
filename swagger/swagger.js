const swaggerAutogen = require('swagger-autogen');
require('dotenv').config();

const doc = {

    info: {
        title: 'API for UNO game',
        description: 'API to handle the backend system of UNO game'
    },
    host: `localhost:${process.env.PORT || 3000}`,
    schemes: ['http'],
    securityDefinitions: {
        apiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'Authorization',
        },
    },
}

const outputFile = './swagger-output.json';
const endpointsFiles = ['../src/app.js'];

swaggerAutogen(outputFile, endpointsFiles, doc);
