import express from 'express';
import { adjustStock, updateStockAfterPurchase } from '../controllers/stockController.js';

const router = express.Router();

// Endpoint per aggiornare lo stock di un prodotto
router.post('/adjust', adjustStock);

// Endpoint per aggiornare lo stock dopo un acquisto
router.post('/purchase-update', updateStockAfterPurchase);

export default router;

