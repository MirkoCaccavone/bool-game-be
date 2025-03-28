// Creo un'istanza del router di Express
import express from 'express';
// Creo un'istanza del router di Express
import { processPayment, verifyPayment } from '../controllers/paymentController.js'

// Creo un'istanza del router di Express
const router = express.Router();

/**
 * Rotta per iniziare il processo di pagamento.
 * Il client invia l'ID dell'ordine e il customer_id,
 * e il server risponde con un clientSecret di Stripe per completare il pagamento.
 */
router.post('/process', processPayment);

/**
 * Rotta per iniziare il processo di pagamento.
 * Il client invia l'ID dell'ordine e il customer_id,
 * e il server risponde con un clientSecret di Stripe per completare il pagamento.
 */
router.post('/verify', verifyPayment);

export default router;