// importiamo il file di connessione al database
import db from '../config/db.js';


// funzione INDEX per ottenere tutti i prodotti
export function index(req, res) {
    // Query per ottenere tutti i prodotti con la categoria associata
    const sql = `
        SELECT products.*, categories.category_name
        FROM products
        LEFT JOIN categories ON products.id = categories.product_id
    `;

    db.query(sql, (err, results) => {
        if (err)
            return res.status(500).json({ error: 'Database query failed' });

        const productPromises = results.map(product => {
            return new Promise((resolve, reject) => {
                // Se la categoria è 'Console' o 'Accessorio', recuperiamo le immagini
                if (product.category_name === 'Console' || product.category_name === 'Accessorio') {
                    const imageSql = 'SELECT * FROM product_image WHERE product_id = ?';
                    db.query(imageSql, [product.id], (err, imageResults) => {
                        if (err) {
                            reject(err);
                        }
                        // Se ci sono immagini, le aggiungiamo al prodotto
                        const images = imageResults.map(image => req.imagePath ? req.imagePath + image.image_url : image.image_url);
                        product.images = images;
                        resolve(product);
                    });
                } else {
                    // Altrimenti, aggiungiamo solo l'immagine principale
                    product.image_url = req.imagePath ? req.imagePath + product.image_url : product.image_url;
                    resolve(product);
                }
            });
        });

        // Aspettiamo che tutte le promesse siano risolte
        Promise.all(productPromises)
            .then(products => res.json(products))
            .catch(err => res.status(500).json({ error: 'Database query failed' }));
    });
}


// funzione SHOW per ottenere un singolo prodotto
export function show(req, res) {
    const sql = `
        SELECT products.*, categories.category_name
        FROM products
        LEFT JOIN categories ON products.id = categories.product_id
        WHERE products.id = ?
    `;

    db.query(sql, [req.params.id], (err, results) => {
        if (err)
            return res.status(500).json({ error: 'Database query failed' });

        if (results.length === 0)
            return res.status(404).json({ error: 'Product not found' });

        const product = results[0];

        // Se la categoria è 'Console' o 'Accessori', recuperiamo le immagini
        if (product.category_name === 'Console' || product.category_name === 'Accessori') {
            const imageSql = 'SELECT * FROM product_image WHERE product_id = ?';
            db.query(imageSql, [product.id], (err, imageResults) => {
                if (err) {
                    return res.status(500).json({ error: 'Database query failed' });
                }
                // Aggiungiamo le immagini multiple
                const images = imageResults.map(image => req.imagePath ? req.imagePath + image.image_url : image.image_url);
                product.images = images;
                res.json(product);
            });
        } else {
            // Altrimenti, aggiungiamo solo l'immagine principale
            product.image_url = req.imagePath ? req.imagePath + product.image_url : product.image_url;
            res.json(product);
        }
    });
}


// funzione SEARCH per cercare un prodotto
export function search(req, res) {
    const { name, category } = req.query;

    if (!name && !category) {
        return res.status(400).json({ error: 'Nome del prodotto o categoria non fornito' });
    }

    let sql = `
        SELECT products.*, categories.category_name
        FROM products
        LEFT JOIN categories ON products.id = categories.product_id
        WHERE 1=1
    `;
    const queryParams = [];

    if (name) {
        sql += ' AND products.name LIKE ?';
        queryParams.push(`%${name}%`);
    }

    if (category) {
        sql += ' AND categories.category_name = ?';
        queryParams.push(category);
    }

    db.query(sql, queryParams, (err, results) => {
        if (err)
            return res.status(500).json({ error: 'Database query failed' });

        const productPromises = results.map(product => {
            return new Promise((resolve, reject) => {
                if (product.category_name === 'Console' || product.category_name === 'Accessori') {
                    const imageSql = 'SELECT * FROM product_image WHERE product_id = ?';
                    db.query(imageSql, [product.id], (err, imageResults) => {
                        if (err) {
                            reject(err);
                        }
                        const images = imageResults.map(image => req.imagePath ? req.imagePath + image.image_url : image.image_url);
                        product.images = images;
                        resolve(product);
                    });
                } else {
                    product.image_url = req.imagePath ? req.imagePath + product.image_url : product.image_url;
                    resolve(product);
                }
            });
        });

        Promise.all(productPromises)
            .then(products => res.json(products))
            .catch(err => res.status(500).json({ error: 'Database query failed' }));
    });
}




