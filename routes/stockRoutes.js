import express from 'express';
import { adjustStock } from '../controllers/stockController.js';

const router = express.Router();

// Endpoint per aggiornare lo stock di un prodotto
router.post('/adjust', adjustStock);

export default router;

