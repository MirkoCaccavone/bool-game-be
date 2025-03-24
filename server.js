
// Importo dotenv per caricare le variabili d'ambiente dal file .env
import dotenv from 'dotenv';

// Carico le variabili d'ambiente (configuro la chiave segreta di Stripe e altre impostazioni)
dotenv.config();

// Importo Express per gestire il server
import express from 'express';

// Importo le rotte per i pagamenti
// import paymentRoutes from './routes/payments.js';

// Importo cors per abilitare le richieste cross-origin
import cors from 'cors';

// Inizializzo l'app Express
const app = express();

// // importiamo il modulo express
// const express = require('express')
// const app = express();
// const port = process.env.PORT;
// const cors = require('cors')
// import dotenv from 'dotenv';
// dotenv.config();

// importo i middleware
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');


// registro il body-parser per "application/json"
// interpreta quello che sarà passato come file JSON
app.use(express.json());

app.use(cors({ origin: process.env.FE_APP }))

// Serve i file statici dalla cartella 'public'
app.use(express.static('public'));

// Gestisce la route principale ('/')
app.get('/api', (req, res) => {
    res.send("Server di boolGame")
});

// Imposto il percorso per le API di pagamento
// app.use('/api/payments', paymentRoutes);

// utilizzo middleware di gestione not found 404
app.use(notFound);

// utilizzo middleware di gestione errore server
app.use(errorHandler);

// avviamo il router sulla porta specificata
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
})