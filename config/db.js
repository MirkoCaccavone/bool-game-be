import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

// Creo una connessione al database utilizzando i dati contenuti nelle variabili d'ambiente
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Test di connessione
connection.connect((err) => {
    if (err) {
        console.error('Errore di connessione al database:', err);
        return;
    }
    console.log('Connessione al database riuscita!');
});

export default connection;