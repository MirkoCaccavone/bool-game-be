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