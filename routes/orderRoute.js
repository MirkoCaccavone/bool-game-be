import express from 'express';
import { createOrder, getOrders, getOrderDetails } from '../controllers/orderController.js';

const router = express.Router();

// Rotta per creare un nuovo ordine quando il carrello viene confermato
router.post('/create', createOrder);

// Rotta per ottenere tutti gli ordini
router.get('/', getOrders);

// Rotta per ottenere i dettagli di un ordine specifico
router.get('/:orderId', getOrderDetails);

export default router;