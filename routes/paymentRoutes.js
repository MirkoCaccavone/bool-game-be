import express from 'express';
import { createCheckoutSession } from '../controllers/paymentController.js';

const router = express.Router();

// Rotta per creare la sessione di pagamento
router.post('/create-checkout-session', createCheckoutSession);

export default router;
