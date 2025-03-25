
// Importo dotenv per caricare le variabili d'ambiente dal file .env
import dotenv from 'dotenv';

// Carico le variabili d'ambiente (configuro la chiave segreta di Stripe e altre impostazioni)
dotenv.config();

// Importo Express per gestire il server
import express from 'express';

// Importo cors per abilitare le richieste cross-origin
import cors from 'cors';

// Importo le rotte per i pagamenti
// import paymentRoutes from './routes/payments.js';

// Inizializzo l'app Express
const app = express();

const port = process.env.PORT;


// importo i middleware
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

// importo le routes
import productRoutes from './routes/productRoutes.js';


app.use(cors({ origin: process.env.FE_APP }))



// registro il body-parser per "application/json"
// interpreta quello che sarà passato come file JSON
app.use(express.json());



// Serve i file statici dalla cartella 'public'
app.use(express.static('public/images'));



// Imposto il percorso per le API di pagamento
// app.use('/api/payments', paymentRoutes);

// Gestisce la route principale ('/')
app.get('/api', (req, res) => {
    res.send("Server di boolGame")
});

app.use('/api/products', productRoutes);

// utilizzo middleware di gestione not found 404
app.use(notFound);

// utilizzo middleware di gestione errore server
app.use(errorHandler);

// avviamo il router sulla porta specificata
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
})