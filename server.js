require('dotenv').config();
const { sequelize } = require('./src/database/mysql.database');
const app = require('./src/app');
const PORT = process.env.PORT || 3000;

try {
    sequelize.authenticate();
    console.log("Connection to the database established succesfully");

} catch(error){
    console.error('Error starting the server: ', error);
    process.exit(1);
}

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})