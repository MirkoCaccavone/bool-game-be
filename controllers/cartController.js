import db from '../config/db.js';

export function addToCart(req, res) {
    const { product_id, quantity } = req.body;

    // Controllo che tutti i dati siano stati forniti
    if (!product_id || !quantity) {
        return res.status(400).json({ message: "Tutti i campi devono essere forniti." });
    }

    // Recupero il prodotto dal database per verificare che esista e se ha abbastanza stock
    const sqlProduct = 'SELECT * FROM products WHERE id = ?';

    db.query(sqlProduct, [product_id], (err, result) => {
        if (err) return res.status(500).json({ message: "Errore nel recupero del prodotto." });
        if (result.length === 0) return res.status(404).json({ message: "Prodotto non trovato." });

        const product = result[0];

        // Verifico se lo stock è sufficiente
        if (product.stock < quantity) {
            return res.status(400).json({ message: "Stock insufficiente." });
        }

        // Verifico se esiste un ordine "In elaborazione"
        const sqlOrder = 'SELECT * FROM orders WHERE status = "In elaborazione"';

        db.query(sqlOrder, (err, orderResult) => {
            if (err) return res.status(500).json({ message: "Errore nel recupero dell'ordine." });

            let orderId;

            if (orderResult.length > 0) {
                // Se esiste un ordine, utilizziamo il suo ID
                orderId = orderResult[0].id;
                insertOrderItem(orderId, product, quantity, res);
            } else {
                // Se non esiste, creiamo un nuovo ordine
                const sqlNewOrder = 'INSERT INTO orders (total, shipping_cost, status) VALUES (?, ?, "In elaborazione")';

                db.query(sqlNewOrder, [0, 5.00], (err, newOrder) => {
                    if (err) return res.status(500).json({ message: "Errore nella creazione dell'ordine." });

                    // Prendo l'ID del nuovo ordine
                    orderId = newOrder.insertId;
                    // Aggiungo il prodotto al nuovo ordine
                    insertOrderItem(orderId, product, quantity, res);
                });
            }
        });
    });
}

// Funzione per inserire un prodotto in un ordine e aggiornare lo stock
function insertOrderItem(orderId, product, quantity, res) {
    // Calcolo il totale per questo prodotto (prezzo * quantità)
    const total = product.price * quantity;

    // Inserisco il prodotto nella tabella order_items
    const sqlInsert = 'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)';

    db.query(sqlInsert, [orderId, product.id, quantity, product.price], (err) => {
        if (err) return res.status(500).json({ message: "Errore nell'aggiunta del prodotto al carrello." });

        // Aggiorno lo stock del prodotto
        const newStock = product.stock - quantity;
        const sqlUpdateStock = 'UPDATE products SET stock = ? WHERE id = ?';

        db.query(sqlUpdateStock, [newStock, product.id], (err) => {
            if (err) return res.status(500).json({ message: "Errore nell'aggiornamento dello stock." });

            // Aggiorno il totale dell'ordine
            const sqlUpdateOrder = 'UPDATE orders SET total = total + ? WHERE id = ?';

            db.query(sqlUpdateOrder, [total, orderId], (err) => {
                if (err) return res.status(500).json({ message: "Errore nell'aggiornamento del totale dell'ordine." });

                // Rispondo con un messaggio di successo
                res.json({ message: "Prodotto aggiunto al carrello con successo." });
            });
        });
    });
}


// Funzione per modificare la quantità di un prodotto nel carrello
export function updateQuantity(req, res) {
    const { product_id, quantity } = req.body;

    // Controllo che tutti i dati siano stati forniti
    if (!product_id || !quantity) {
        return res.status(400).json({ message: "Tutti i campi devono essere forniti." });
    }

    // Recupero il prodotto dal carrello per verificarne la disponibilità in magazzino
    const sqlCartItem = `
        SELECT oi.order_id, oi.quantity, oi.price, p.stock
        FROM order_items oi
        INNER JOIN orders o ON oi.order_id = o.id
        INNER JOIN products p ON oi.product_id = p.id
        WHERE o.status = "In elaborazione" AND oi.product_id = ?
    `;

    db.query(sqlCartItem, [product_id], (err, result) => {
        if (err) return res.status(500).json({ message: "Errore nel recupero del prodotto nel carrello." });
        if (result.length === 0) return res.status(404).json({ message: "Prodotto non trovato nel carrello." });

        const cartItem = result[0];

        // Se la quantità è zero, rimuovo il prodotto dal carrello
        if (quantity === 0) {

            // Richiamo la funzione per rimuovere il prodotto
            return removeFromCart(req, res);
        }

        // Verifico che la nuova quantità non superi la disponibilità in magazzino
        const stockChange = quantity - cartItem.quantity;
        const newStock = cartItem.stock - stockChange;

        if (newStock < 0) {
            return res.status(400).json({ message: "Stock insufficiente." });
        }

        // Calcolo la differenza di prezzo basata sulla nuova quantità
        const priceDifference = (quantity - cartItem.quantity) * cartItem.price;

        // Aggiorno la quantità nel carrello
        const sqlUpdateItem = 'UPDATE order_items SET quantity = ? WHERE order_id = ? AND product_id = ?';

        db.query(sqlUpdateItem, [quantity, cartItem.order_id, product_id], (err) => {
            if (err) return res.status(500).json({ message: "Errore nell'aggiornamento della quantità." });

            // Aggiorno lo stock del prodotto nel magazzino
            const sqlUpdateStock = 'UPDATE products SET stock = ? WHERE id = ?';

            db.query(sqlUpdateStock, [newStock, product_id], (err) => {
                if (err) return res.status(500).json({ message: "Errore nell'aggiornamento dello stock." });

                // Aggiorno il totale dell'ordine in base alla differenza di prezzo
                const sqlUpdateOrder = 'UPDATE orders SET total = total + ? WHERE id = ?';

                db.query(sqlUpdateOrder, [priceDifference, cartItem.order_id], (err) => {
                    if (err) return res.status(500).json({ message: "Errore nell'aggiornamento del totale dell'ordine." });

                    // Rispondo con un messaggio di successo
                    res.json({ message: "Quantità aggiornata con successo." });
                });
            });
        });
    });
}

// Funzione per rimuovere un prodotto dal carrello
export function removeFromCart(req, res) {
    const { product_id } = req.body;

    // Controllo che il dato sia stato fornito
    if (!product_id) {
        return res.status(400).json({ message: "Il campo 'product_id' deve essere fornito." });
    }

    // Recupero il prodotto dal carrello per verificarne l'esistenza
    const sqlCartItem = `
        SELECT oi.order_id, oi.quantity, oi.price 
        FROM order_items oi 
        INNER JOIN orders o ON oi.order_id = o.id 
        WHERE oi.product_id = ? AND o.status = "In elaborazione"
    `;

    db.query(sqlCartItem, [product_id], (err, result) => {
        if (err) return res.status(500).json({ message: "Errore nel recupero del prodotto nel carrello." });
        if (result.length === 0) return res.status(404).json({ message: "Prodotto non trovato nel carrello." });

        const cartItem = result[0];
        const quantityToRemove = cartItem.quantity;
        const priceToRemove = cartItem.quantity * cartItem.price;

        // Rimuovo il prodotto dalla tabella order_items
        const sqlDelete = 'DELETE FROM order_items WHERE order_id = ? AND product_id = ?';

        db.query(sqlDelete, [cartItem.order_id, product_id], (err) => {
            if (err) return res.status(500).json({ message: "Errore nella rimozione del prodotto dal carrello." });

            // Ripristino lo stock del prodotto
            const sqlProduct = 'SELECT * FROM products WHERE id = ?';
            db.query(sqlProduct, [product_id], (err, productResult) => {
                if (err) return res.status(500).json({ message: "Errore nel recupero del prodotto." });

                const product = productResult[0];
                const newStock = product.stock + quantityToRemove;

                const sqlUpdateStock = 'UPDATE products SET stock = ? WHERE id = ?';

                db.query(sqlUpdateStock, [newStock, product.id], (err) => {
                    if (err) return res.status(500).json({ message: "Errore nell'aggiornamento dello stock." });

                    // Aggiorno il totale dell'ordine
                    const sqlUpdateOrder = 'UPDATE orders SET total = total - ? WHERE id = ?';
                    db.query(sqlUpdateOrder, [priceToRemove, cartItem.order_id], (err) => {
                        if (err) return res.status(500).json({ message: "Errore nell'aggiornamento del totale dell'ordine." });

                        // Rispondo con un messaggio di successo
                        res.json({ message: "Prodotto rimosso dal carrello con successo." });
                    });
                });
            });
        });
    });
}



