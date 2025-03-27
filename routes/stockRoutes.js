import express from 'express';
import db from '../config/db.js'; // Connessione al database

const router = express.Router();

// Endpoint per aggiornare lo stock di un prodotto
router.post('/update-stock', (req, res) => {
    const { productId, newQuantity, currentQuantity } = req.body;

    console.log(`🟢 Ricevuto: productId=${productId}, newQuantity=${newQuantity}, currentQuantity=${currentQuantity}`);

    // Recupera lo stock attuale del prodotto
    db.query('SELECT stock FROM products WHERE id = ?', [productId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Errore durante il recupero del prodotto' });
        }

        // Se il prodotto non esiste, restituisce un errore
        if (results.length === 0) {
            return res.status(404).json({ message: 'Prodotto non trovato' });
        }

        const stockDisponibile = results[0].stock;
        const differenza = newQuantity - currentQuantity;

        console.log(`🟡 Stock attuale: ${stockDisponibile}, differenza calcolata: ${differenza}`);

        // Se la differenza è positiva, significa che il cliente sta aggiungendo più unità al carrello
        // Quindi lo stock disponibile deve diminuire
        if (differenza > 0) {
            if (stockDisponibile < differenza) {
                console.log('🔴 Stock insufficiente!');
                return res.status(400).json({ message: 'Stock insufficiente' });
            }

            // Aggiorna lo stock riducendo la quantità richiesta
            db.query('UPDATE products SET stock = stock - ? WHERE id = ?', [differenza, productId], (updateErr) => {
                if (updateErr) {
                    console.error(updateErr);
                    return res.status(500).json({ message: 'Errore nell\'aggiornamento dello stock' });
                }
                console.log(`✅ Stock ridotto di ${differenza}`);
                return res.status(200).json({ message: 'Stock aggiornato con successo' });
            });

            // Se la differenza è negativa, il cliente sta rimuovendo unità dal carrello → lo stock deve aumentare
        } else if (differenza < 0) {

            db.query('UPDATE products SET stock = stock + ? WHERE id = ?', [-differenza, productId], (updateErr) => {
                if (updateErr) {
                    console.error(updateErr);
                    return res.status(500).json({ message: 'Errore nell\'aggiornamento dello stock' });
                }
                console.log(`✅ Stock aumentato di ${-differenza}`);
                return res.status(200).json({ message: 'Stock aggiornato con successo' });
            });
            // Se la differenza è zero, la quantità nel carrello non è cambiata, quindi non è necessario aggiornare lo stock
        } else {
            console.log('ℹ️ Nessuna modifica necessaria');
            return res.status(200).json({ message: 'Nessuna modifica necessaria' });
        }
    });
});

export default router;
