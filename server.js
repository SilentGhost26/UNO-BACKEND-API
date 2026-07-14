require('dotenv').config();
const { sequelize } = require('./src/database/mysql.database');
const app = require('./src/app');
const PORT = process.env.PORT || 3000;

async function runServer() {
    try {
        await sequelize.authenticate();
        console.log("Connection to the database established succesfully");

        await sequelize.sync({ alter: true});
        console.log('Models syncronized correctly');

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`)
        })
    } catch(error){
        console.error('Error starting the server: ', error);
        process.exit(1);
    }
}

runServer();
