import express from 'express';
import connection from '../config/db'

const router = express.Router();

// Aggiungi prodotto al carrello
router.post('/add-to-cart', (req, res) => {
    const { productId, quantity } = req.body;

    connection.query(
        'SELECT * FROM products WHERE id = ?',
        [productId],
        (err, results) => {
            if (err) {
                return res.status(500).send('Errore nel database');
            }

            const product = results[0];
            if (!product) {
                return res.status(404).send('Prodotto non trovato');
            }

            if (quantity > product.stock) {
                return res.status(400).send('Quantità maggiore rispetto allo stock disponibile');
            }

            // Aggiungi prodotto al carrello
            connection.query(
                'INSERT INTO cart (product_id, quantity) VALUES (?, ?)',
                [productId, quantity],
                (err, results) => {
                    if (err) {
                        return res.status(500).send('Errore nell\'aggiunta al carrello');
                    }
                    res.status(200).send('Prodotto aggiunto al carrello');
                }
            );
        }
    );
});

// Modifica quantità prodotto nel carrello
router.put('/update-cart', (req, res) => {
    const { cartItemId, quantity } = req.body;

    connection.query(
        'SELECT * FROM cart WHERE id = ?',
        [cartItemId],
        (err, results) => {
            if (err) {
                return res.status(500).send('Errore nel database');
            }

            const cartItem = results[0];
            if (!cartItem) {
                return res.status(404).send('Prodotto nel carrello non trovato');
            }

            connection.query(
                'SELECT * FROM products WHERE id = ?',
                [cartItem.product_id],
                (err, results) => {
                    if (err) {
                        return res.status(500).send('Errore nel database');
                    }

                    const product = results[0];
                    if (quantity > product.stock) {
                        return res.status(400).send('Quantità maggiore rispetto allo stock disponibile');
                    }

                    connection.query(
                        'UPDATE cart SET quantity = ? WHERE id = ?',
                        [quantity, cartItemId],
                        (err, results) => {
                            if (err) {
                                return res.status(500).send('Errore nell\'aggiornamento del carrello');
                            }
                            res.status(200).send('Quantità aggiornata nel carrello');
                        }
                    );
                }
            );
        }
    );
});

// Rimuovi prodotto dal carrello
router.delete('/remove-from-cart', (req, res) => {
    const { cartItemId } = req.body;

    connection.query(
        'DELETE FROM cart WHERE id = ?',
        [cartItemId],
        (err, results) => {
            if (err) {
                return res.status(500).send('Errore nel database');
            }
            res.status(200).send('Prodotto rimosso dal carrello');
        }
    );
});

export default router;
