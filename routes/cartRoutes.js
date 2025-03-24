import express from 'express';
import { getCart, addToCart, updateQuantity, removeFromCart } from '../controllers/cartController.js';

const router = express.Router();

// Aggiungi un prodotto al carrello
router.post('/add', addToCart);

// Modifica la quantità di un prodotto nel carrello
router.put('/update', updateQuantity);

// Rimuovi un prodotto dal carrello
router.delete('/remove', removeFromCart);

// Visualizza il carrello
router.get('/', getCart);

export default router;

