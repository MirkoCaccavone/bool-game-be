import express from 'express';
import { createOrder } from '../controllers/orderController.js';

const router = express.Router();

// Middleware di validazione per la creazione dell'ordine
const validateOrderData = (req, res, next) => {
    const { total, shipping_cost, status, products } = req.body;

    if (total === undefined || shipping_cost === undefined || !['In Attesa', 'Confermato', 'Annullato'].includes(status) || !products || products.length === 0) {
        return res.status(400).json({ message: "Tutti i campi devono essere forniti e lo stato deve essere valido." });
    }
    next();
};

// Conferma e creazione dell'ordine
router.post('/create', validateOrderData, createOrder);

export default router;