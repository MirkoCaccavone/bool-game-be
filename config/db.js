import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

// Creo una connessione al database utilizzando i dati contenuti nelle variabili d'ambiente
const connection = mysql.createConnection({
    host: process.env.DB_HOST,  // Host del database
    user: process.env.DB_USER,  // Nome utente per accedere al database
    password: process.env.DB_PASSWORD,  // Password dell'utente del database
    database: process.env.DB_NAME  // Nome del database a cui connettersi
});

// Test di connessione
connection.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL!');

});

export default connection;