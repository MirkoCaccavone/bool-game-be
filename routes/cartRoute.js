import express from 'express';
import { increaseQuantity, decreaseQuantity, removeFromCart } from '../controllers/cartController.js';

const router = express.Router();

// Rotta per aumentare la quantità di un prodotto nel carrello
router.put('/increase', increaseQuantity);

// Rotta per diminuire la quantità di un prodotto nel carrello
router.put('/decrease', decreaseQuantity);

// Rotta per rimuovere un prodotto dal carrello
router.delete('/remove', removeFromCart);

export default router;