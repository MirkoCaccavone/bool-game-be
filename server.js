// Importo dotenv per caricare le variabili d'ambiente dal file .env
import dotenv from 'dotenv';

// Carico le variabili d'ambiente (configuro la chiave segreta di Stripe e altre impostazioni)
dotenv.config();

// Importo Express per gestire il server
import express from 'express';

// Importo cors per abilitare le richieste cross-origin
import cors from 'cors';

// Inizializzo l'app Express
const app = express();

// Configuro la porta
const port = process.env.PORT;

// Middleware per il parsing del corpo della richiesta
app.use(express.json());

// Abilito il CORS per il frontend
app.use(cors({ origin: process.env.FE_APP }));

// Log delle richieste
app.use((req, res, next) => {
    console.log('Request body:', req.body);
    next();
});

// Importo le rotte
import productRoutes from './routes/productRoutes.js';
import stockRoutes from './routes/stockRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

// importo i middleware
import imagePathMiddleware from './middleware/imagePath.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

// Serve i file statici dalla cartella 'public'
app.use(express.static('public'));

// Rotte per lo stock
app.use('/api', stockRoutes);

// registro  il middleware del path delle img
app.use(imagePathMiddleware);

// Rotte per gli ordini
app.use('/api/orders', orderRoutes);

// Rotte per i prodotti
app.use('/api/products', productRoutes);

// Imposto il percorso per le API di pagamento
app.use('/api/payment', paymentRoutes);

// Gestisce la route principale ('/')
app.get('/api', (req, res) => {
    res.send("Server di boolGame");
});

// utilizzo middleware di gestione not found 404
app.use(notFound);

// Utilizzo middleware di gestione errore server
app.use(errorHandler);

// Avvio del server sulla porta specificata
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
