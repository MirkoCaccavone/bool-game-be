import express from 'express';
import db from '../config/db.js'; // Connessione al database

const router = express.Router();

// Aggiorna lo stock quando un prodotto viene aggiunto/rimosso al carrello
router.post('/update-stock', (req, res) => {
    const { productId, newQuantity, currentQuantity } = req.body;

    console.log(`🟢 Ricevuto: productId=${productId}, newQuantity=${newQuantity}, currentQuantity=${currentQuantity}`);

    // Recupera lo stock attuale del prodotto
    db.query('SELECT stock FROM products WHERE id = ?', [productId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Errore durante il recupero del prodotto' });
        }

        // Se il prodotto non esiste
        if (results.length === 0) {
            return res.status(404).json({ message: 'Prodotto non trovato' });
        }

        const stockDisponibile = results[0].stock;
        const differenza = newQuantity - currentQuantity;

        console.log(`🟡 Stock attuale: ${stockDisponibile}, differenza calcolata: ${differenza}`);

        // 🟢 Se l'utente aggiunge il prodotto per la prima volta al carrello (newQuantity == 1 e currentQuantity == 0)
        if (currentQuantity === 0 && newQuantity === 1) {
            if (stockDisponibile <= 0) {
                console.log('🔴 Stock insufficiente!');
                return res.status(400).json({ message: 'Stock insufficiente' });
            }

            db.query('UPDATE products SET stock = stock - 1 WHERE id = ?', [productId], (updateErr) => {
                if (updateErr) {
                    console.error(updateErr);
                    return res.status(500).json({ message: 'Errore nell\'aggiornamento dello stock' });
                }
                console.log(`✅ Stock ridotto di 1 (aggiunto al carrello)`);
                return res.status(200).json({ message: 'Prodotto aggiunto al carrello, stock aggiornato' });
            });

        }
        // 🟡 Se l'utente aumenta la quantità nel carrello
        else if (differenza > 0) {
            if (stockDisponibile < differenza) {
                console.log('🔴 Stock insufficiente!');
                return res.status(400).json({ message: 'Stock insufficiente' });
            }

            db.query('UPDATE products SET stock = stock - ? WHERE id = ?', [differenza, productId], (updateErr) => {
                if (updateErr) {
                    console.error(updateErr);
                    return res.status(500).json({ message: 'Errore nell\'aggiornamento dello stock' });
                }
                console.log(`✅ Stock ridotto di ${differenza}`);
                return res.status(200).json({ message: 'Stock aggiornato con successo' });
            });

        }
        // 🔵 Se l'utente diminuisce la quantità nel carrello
        else if (differenza < 0) {
            db.query('UPDATE products SET stock = stock + ? WHERE id = ?', [-differenza, productId], (updateErr) => {
                if (updateErr) {
                    console.error(updateErr);
                    return res.status(500).json({ message: 'Errore nell\'aggiornamento dello stock' });
                }
                console.log(`✅ Stock aumentato di ${-differenza}`);
                return res.status(200).json({ message: 'Stock aggiornato con successo' });
            });
        }
        // ℹ️ Se non ci sono modifiche nella quantità
        else {
            console.log('ℹ️ Nessuna modifica necessaria');
            return res.status(200).json({ message: 'Nessuna modifica necessaria' });
        }
    });
});

export default router;
