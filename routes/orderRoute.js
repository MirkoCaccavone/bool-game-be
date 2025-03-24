import express from 'express';
import { createOrder } from '../controllers/orderController.js';

const router = express.Router();

// Crea un ordine a partire dal carrello
router.post('/create', createOrder);

export default router;