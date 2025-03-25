// importiamo il file di connessione al database
import db from '../config/db.js';

// funzione INDEX per ottenere tutti i prodotti
export function index(req, res) {
    // prepariamo la query
    const sql = 'SELECT * FROM products'

    // eseguiamo la query
    db.query(sql, (err, results) => {
        if (err)
            return res.status(500).json({ error: 'Database query failed' });

        // versione mappata del risultato
        const products = results.map(product => {
            return {
                ...product,
                image: req.imagePath + product.image
            }

        })

        res.json(products);
    });
}

// funzione SHOW per ottenere un singolo prodotto

export function show(req, res) {
    // prepariamo la query
    const sql = 'SELECT * FROM products WHERE id = ?'

    // eseguiamo la query
    db.query(sql, [req.params.id], (err, results) => {
        if (err)
            return res.status(500).json({ error: 'Database query failed' });

        if (results.length === 0)
            return res.status(404).json({ error: 'Product not found' });

        // versione mappata del risultato
        const product = {
            ...results[0],
            image: req.imagePath + results[0].image
        }

        res.json(product);
    });
}

// funzione SEARCH per cercare un prodotto

export function search(req, res) {
    const { name } = req.query;

    if (!name) {
        return res.status(400).json({ error: 'Nome del prodotto non fornito' });
    }
    // prepariamo la query
    const sql = 'SELECT * FROM products WHERE name LIKE ?'

    // eseguiamo la query
    db.query(sql, [`%${name}%`], (err, results) => {
        if (err)
            return res.status(500).json({ error: 'Database query failed' });

        // versione mappata del risultato
        const products = results.map(product => {
            return {
                ...product,
                image: req.imagePath + product.image
            }
        })

        res.json(products);
    });
}


