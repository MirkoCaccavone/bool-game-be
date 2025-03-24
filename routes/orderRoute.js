import express from 'express';


// Creiamo il router
const router = express.Router();

// Route per creare un ordine
router.post('/create', async (req, res) => {
    try {
        const { userId } = req.body;  // Otteniamo l'ID dell'utente dalla request (può anche essere preso da un JWT)

        // Otteniamo gli articoli nel carrello
        const cartItems = await getCartItems(userId);

        if (cartItems.length === 0) {
            return res.status(400).json({ message: 'Il carrello è vuoto' });
        }

        // Verifica che ci sia abbastanza stock per ogni prodotto
        const insufficientStockItems = await checkStock(cartItems);
        if (insufficientStockItems.length > 0) {
            return res.status(400).json({ message: 'Non ci sono abbastanza prodotti in stock per alcuni articoli', insufficientStockItems });
        }

        // Crea l'ordine (se lo stock è sufficiente)
        const order = await createOrder(userId, cartItems);

        return res.status(201).json({ message: 'Ordine creato con successo', order });
    } catch (error) {
        console.error('Errore nella creazione dell\'ordine:', error);
        return res.status(500).json({ message: 'Errore nel creare l\'ordine' });
    }
});

export default router;