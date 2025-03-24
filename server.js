
// importiamo il modulo express
const express = require('express')
const app = express();
const port = process.env.PORT;
const cors = require('cors')
import dotenv from 'dotenv';
dotenv.config();

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

// utilizzo middleware di gestione not found 404
app.use(notFound);

// utilizzo middleware di gestione errore server
app.use(errorHandler);

// avviamo il router sulla porta specificata
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
})