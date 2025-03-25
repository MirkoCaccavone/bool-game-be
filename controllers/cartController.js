import db from '../config/db.js';

// Aggiungo una quantità al prodotto nel carrello
export const increaseQuantity = async (req, res) => {

    // Estraggo l'ID dell'ordine dal corpo della richiesta
    const { orderId } = req.body;

    try {
        // Incremento la quantità del prodotto nel carrello di 1
        const query = `UPDATE orderitem SET quantity = quantity + 1 WHERE id = ?`;
        await db.execute(query, [orderId]);

        res.json({ message: "Quantità aumentata con successo" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Errore nell'aumentare la quantità" });
    }

};

// Diminuisco la quantità di un prodotto nel carrello (minimo 1)
export const decreaseQuantity = async (req, res) => {

    // Estraggo l'ID dell'ordine dal corpo della richiesta
    const { orderId } = req.body;

    try {
        // Decremento la quantità del prodotto nel carrello di 1, ma solo se è maggiore di 1
        const query = `UPDATE orderitem SET quantity = quantity - 1 WHERE id = ? AND quantity > 1`;
        await db.execute(query, [orderId]);

        res.json({ message: "Quantità diminuita con successo" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Errore nel diminuire la quantità" });
    }
};

// Rimuove un prodotto dal carrello
export const removeFromCart = async (req, res) => {

    // Estraggo l'ID dell'ordine dal corpo della richiesta
    const { orderId } = req.body;

    try {
        // Elimino il prodotto dal carrello basandosi sul suo ID
        const query = `DELETE FROM orderitem WHERE id = ?`;
        await db.execute(query, [orderId]);

        res.json({ message: "Prodotto rimosso dal carrello" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Errore nella rimozione del prodotto" });
    }
};