// importiamo il file di connessione al database
import db from '../config/db.js';

// Funzione per controllare se un URL è assoluto
function isAbsoluteUrl(url) {
    return /^(https?:/ /|//)/.test(url);
}

// Funzione INDEX per ottenere tutti i prodotti
export function index(req, res) {
    const sql = `
        SELECT p.*, c.category_name, 
               COALESCE(pi.image_url, p.image_url) AS final_image
        FROM products p
        JOIN categories c ON p.id = c.product_id
        LEFT JOIN products_image pi ON p.id = pi.product_id AND pi.isCover = TRUE
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database query failed' });

        const products = results.map(product => {
            product.image_url = product.final_image
                ? (isAbsoluteUrl(product.final_image) ? product.final_image : `${req.imagePath}${product.final_image}`)
                : null;
            delete product.final_image;
            return product;
        });

        res.json(products);
    });
}

// Funzione SHOW per ottenere un singolo prodotto
export function show(req, res) {
    const sql = `
        SELECT p.*, c.category_name, 
               COALESCE(pi.image_url, p.image_url) AS final_image
        FROM products p
        JOIN categories c ON p.id = c.product_id
        LEFT JOIN products_image pi ON pi.product_id = p.id AND pi.isCover = TRUE
        WHERE p.id = ?`
        ;

    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database query failed' });
        if (results.length === 0) return res.status(404).json({ error: 'Product not found' });

        const product = results[0];
        product.image_url = product.final_image
            ? (isAbsoluteUrl(product.final_image) ? product.final_image : `${req.imagePath}${product.final_image}`)
            : null;
        delete product.final_image;

        const imageSql = `SELECT image_url FROM products_image WHERE product_id = ?`;
        db.query(imageSql, [product.id], (err, imageResults) => {
            if (err) return res.status(500).json({ error: 'Database query failed' });

            product.images = imageResults.map(image =>
                isAbsoluteUrl(image.image_url) ? image.image_url : `${req.imagePath}${image.image_url}`
            );
            res.json(product);
        });
    });
}

// Funzione SEARCH per cercare un prodotto
export function search(req, res) {
    const { name, category } = req.query;

    if (!name && !category) {
        return res.status(400).json({ error: 'Nome del prodotto o categoria non fornito' });
    }

    let sql = `
        SELECT p.*, c.category_name, 
               COALESCE(pi.image_url, p.image_url) AS final_image
        FROM products p
        LEFT JOIN categories c ON p.id = c.product_id
        LEFT JOIN products_image pi ON pi.product_id = p.id AND pi.isCover = TRUE
        WHERE 1=1`
        ;
    const queryParams = [];

    if (name) {
        sql += ' AND p.name LIKE ?';
        queryParams.push(`%${name}%`);
    }

    if (category) {
        sql += ' AND c.category_name = ?';
        queryParams.push(category);
    }

    db.query(sql, queryParams, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database query failed' });

        const products = results.map(product => {
            product.image_url = product.final_image
                ? (isAbsoluteUrl(product.final_image) ? product.final_image : `${req.imagePath}${product.final_image}`)
                : null;
            delete product.final_image;
            return product;
        });

        res.json(products);
    });
}