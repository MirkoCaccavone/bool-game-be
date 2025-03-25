import express from 'express';
import { createOrder } from '../controllers/orderController.js';

const router = express.Router();

// Confermare e creare l'ordine
router.post('/create', createOrder);

export default router;