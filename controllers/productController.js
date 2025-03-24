// importiamo il file di connessione al database
import db from '../config/db';

// funzione INDEX per ottenere tutti i prodotti
export default function index(req, res) {
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



