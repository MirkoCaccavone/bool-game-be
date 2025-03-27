import db from '../config/db.js';

// Funzione per creare un nuovo ordine
export function createOrder(req, res) {
    const { total, shipping_cost, status, products } = req.body; // Aggiungi `products` per gli articoli dell'ordine

    // Verifica se tutti i campi obbligatori sono presenti e validi
    if (total === undefined || shipping_cost === undefined || !['In Attesa', 'Confermato', 'Annullato'].includes(status) || !products || products.length === 0) {
        return res.status(400).json({ message: "Tutti i campi devono essere forniti e lo stato deve essere valido." });
    }

    // Verifica che i prodotti esistano nel database
    const productIds = products.map(product => product.product_id); // Estrai gli ID dei prodotti dall'array dei prodotti
    const sqlCheckProducts = 'SELECT id FROM products WHERE id IN (?)';

    db.query(sqlCheckProducts, [productIds], (err, results) => {
        if (err) {
            console.error('Errore nel controllo dei prodotti:', err);
            return res.status(500).json({ message: 'Errore nel controllo dei prodotti.', error: err.message });
        }

        // Se non tutti i prodotti sono trovati nel database, restituisci un errore
        if (results.length !== products.length) {
            return res.status(404).json({ message: 'Alcuni prodotti non esistono nel nostro database.' });
        }

        // Query SQL per inserire un nuovo ordine nella tabella "orders"
        const sql = 'INSERT INTO orders (total, shipping_cost, status, created_at) VALUES (?, ?, ?, NOW())';

        db.query(sql, [total, shipping_cost, status], (err, result) => {
            if (err) {
                console.error("Errore nella creazione dell'ordine:", err);
                return res.status(500).json({ message: "Errore nella creazione dell'ordine", error: err.message });
            }

            // Aggiungi gli articoli dell'ordine nella tabella "order_items"
            const orderId = result.insertId; // Ottieni l'ID dell'ordine appena creato
            const orderItems = products.map(product => [
                orderId,
                product.product_id,
                product.quantity,
                product.price
            ]);

            // Inserisce tutti gli articoli nell'ordine
            const sqlInsertOrderItems = 'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?';
            db.query(sqlInsertOrderItems, [orderItems], (err) => {
                if (err) {
                    console.error("Errore nell'aggiunta degli articoli all'ordine:", err);
                    return res.status(500).json({ message: "Errore nell'aggiunta degli articoli all'ordine.", error: err.message });
                }

                // Rispondi con un messaggio di successo e l'ID dell'ordine
                res.json({ message: "Ordine creato con successo", orderId: orderId });
            });
        });
    });
}

// Funzione per annullare un ordine e ripristinare lo stock
export function cancelOrder(req, res) {
    const { order_id } = req.body; // Prendi l'ID dell'ordine dalla richiesta

    // Verifica che l'ID dell'ordine sia fornito
    if (!order_id) {
        return res.status(400).json({ message: 'L\'ID dell\'ordine è necessario.' });
    }

    // Recupera i dettagli degli articoli dell'ordine
    const sqlGetOrderItems = 'SELECT product_id, quantity FROM order_items WHERE order_id = ?';

    db.query(sqlGetOrderItems, [order_id], (err, items) => {
        if (err) {
            console.error('Errore nel recupero degli articoli dell\'ordine:', err);
            return res.status(500).json({ message: 'Errore nel recupero degli articoli dell\'ordine.', error: err.message });
        }

        // Per ogni articolo, aggiorna lo stock nel database
        const updateStockPromises = items.map(item => {
            return new Promise((resolve, reject) => {
                const sqlUpdateStock = 'UPDATE products SET stock = stock + ? WHERE id = ?';
                db.query(sqlUpdateStock, [item.quantity, item.product_id], (err) => {
                    if (err) reject(err); // Se errore, rifiuta la promessa
                    else resolve(); // Se successo, risolvi la promessa
                });
            });
        });

        // Esegui tutte le promesse per aggiornare lo stock
        Promise.all(updateStockPromises)
            .then(() => {
                // Dopo aver aggiornato lo stock, aggiorna lo stato dell'ordine a "Annullato"
                const sqlCancelOrder = 'UPDATE orders SET status = "Annullato" WHERE id = ?';
                db.query(sqlCancelOrder, [order_id], (err) => {
                    if (err) {
                        console.error('Errore nell\'annullare l\'ordine:', err);
                        return res.status(500).json({ message: 'Errore nell\'annullare l\'ordine.', error: err.message });
                    }
                    // Rispondi con un messaggio di successo
                    res.json({ message: 'Ordine annullato e stock aggiornato.' });
                });
            })
            .catch(err => {
                console.error('Errore nell\'aggiornamento dello stock:', err);
                res.status(500).json({ message: 'Errore nell\'aggiornamento dello stock.', error: err.message });
            });
    });
}

// Funzione per confermare un ordine
export function confirmOrder(req, res) {
    const { order_id } = req.body; // Prendi l'ID dell'ordine dalla richiesta

    // Verifica che l'ID dell'ordine sia fornito
    if (!order_id) {
        return res.status(400).json({ message: 'L\'ID dell\'ordine è necessario.' });
    }

    // Controlla se l'ordine esiste nel database
    const sqlCheckOrder = 'SELECT id, status FROM orders WHERE id = ?';
    db.query(sqlCheckOrder, [order_id], (err, results) => {
        if (err) {
            console.error('Errore nel controllo dell\'ordine:', err);
            return res.status(500).json({ message: 'Errore nel controllo dell\'ordine.', error: err.message });
        }
        // Se l'ordine non esiste, restituisci un errore
        if (results.length === 0) {
            return res.status(404).json({ message: 'Ordine non trovato.' });
        }

        // Se lo stato dell'ordine non è "In Attesa", non può essere confermato
        if (results[0].status !== 'In Attesa') {
            return res.status(400).json({ message: 'L\'ordine non può essere confermato perché non è in stato "In Attesa".' });
        }

        // Conferma l'ordine aggiornando lo stato a "Confermato"
        const sqlConfirmOrder = 'UPDATE orders SET status = "Confermato" WHERE id = ?';
        db.query(sqlConfirmOrder, [order_id], (err) => {
            if (err) {
                console.error('Errore nella conferma dell\'ordine:', err);
                return res.status(500).json({ message: 'Errore nella conferma dell\'ordine.', error: err.message });
            }
            // Rispondi con un messaggio di successo
            res.json({ message: 'Ordine confermato con successo.' });
        });
    });
}
