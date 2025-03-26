import db from '../config/db.js';

// Funzione per creare un ordine
export function createOrder(req, res) {
    const { total, shipping_cost, status } = req.body;

    // Verifico se tutti i parametri sono presenti e definiti
    if (total === undefined || shipping_cost === undefined || status === undefined) {
        return res.status(400).json({ message: "Tutti i campi devono essere forniti." });
    }

    // Query SQL per inserire un nuovo ordine nella tabella "orders"
    const sql = 'INSERT INTO orders (total, shipping_cost, status) VALUES (?, ?, ?)';

    // Eseguo la query passando i valori ricevuti dalla richiesta
    db.query(sql, [total, shipping_cost, status], (err, result) => {
        if (err) {
            console.error("Errore nella creazione dell'ordine:", err);
            return res.status(500).json({ message: "Errore nella creazione dell'ordine" });
        }

        // Se l'ordine è stato creato con successo, restituisce una risposta con il nuovo orderId
        res.json({ message: "Ordine creato con successo", orderId: result.insertId });
    });
}

// Funzione per annullare un ordine
export function cancelOrder(req, res) {
    const { order_id } = req.body;

    if (!order_id) {
        return res.status(400).json({ message: 'L\'ID dell\'ordine è necessario.' });
    }

    // Recupera i dettagli degli articoli dell'ordine
    const sqlGetOrderItems = 'SELECT product_id, quantity FROM order_items WHERE order_id = ?';

    db.query(sqlGetOrderItems, [order_id], (err, items) => {
        if (err) {
            console.error('Errore nel recupero degli articoli dell\'ordine:', err);
            return res.status(500).json({ message: 'Errore nel recupero degli articoli dell\'ordine.' });
        }

        // Restituisce lo stock per ogni prodotto
        const sqlUpdateStock = 'UPDATE products SET stock = stock + ? WHERE id = ?';

        items.forEach(item => {
            db.query(sqlUpdateStock, [item.quantity, item.product_id], (err) => {
                if (err) {
                    console.error('Errore nell\'aggiornamento dello stock:', err);
                    return res.status(500).json({ message: 'Errore nell\'aggiornamento dello stock.' });
                }
            });
        });

        // Annulla l'ordine nel database
        const sqlCancelOrder = 'UPDATE orders SET status = "Annullato" WHERE id = ?';
        db.query(sqlCancelOrder, [order_id], (err) => {
            if (err) {
                console.error('Errore nell\'annullare l\'ordine:', err);
                return res.status(500).json({ message: 'Errore nell\'annullare l\'ordine.' });
            }
            res.json({ message: 'Ordine annullato e stock aggiornato.' });
        });
    });
}