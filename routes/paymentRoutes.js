import express from 'express';
import { createCheckoutSession, confirmPaymentAndSendEmails } from '../controllers/paymentController.js';

const router = express.Router();

// Rotta per creare la sessione di pagamento con Stripe
router.post('/create-checkout-session', createCheckoutSession);

// Rotta per confermare il pagamento e inviare le email
router.post('/send-order-emails', confirmPaymentAndSendEmails);


export default router;