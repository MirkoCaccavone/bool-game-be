// importiamo il file di connessione al database
import db from '../config/db.js';

// Funzione per controllare se un URL è assoluto (utile per le immagini)
function isAbsoluteUrl(url) {
    return /^(https?:\/\/|\/\/)/.test(url);
}


// =============================
// Funzione INDEX: Ottiene tutti i prodotti
// =============================
export function index(req, res) {
    // Query SQL per recuperare i prodotti con tutte le loro informazioni, inclusi dettagli delle categorie e immagini
    const sql = `
        SELECT
            p.*,
            c.category_name,
            g.game_genre, g.pegi_rating, g.supported_consoles, g.multiplayer, g.online_mode, g.publisher,
            a.compatibility, a.brand,
            con.color, con.hardware_specs, con.bundle_included, con.brand_console,
            COALESCE(pi.image_url, p.image_url) AS final_image,
            pi.image_url AS pi_image_url -- Campo per distinguere se l'immagine proviene da products_image
        FROM products p
        JOIN categories c ON p.id = c.product_id
        LEFT JOIN games g ON p.id = g.product_id
        LEFT JOIN accessories a ON p.id = a.product_id
        LEFT JOIN consoles con ON p.id = con.product_id
        LEFT JOIN products_image pi ON p.id = pi.product_id AND pi.isCover = TRUE;
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database query failed' });

        // Mappa i risultati per gestire correttamente le immagini
        const products = results.map(product => {
            // Se l'immagine proviene da products_image, aggiungi il path assoluto
            product.image_url = product.pi_image_url
                ? `${req.imagePath}${product.final_image}`  // Se l'immagine proviene da products_image, aggiungi il path assoluto
                : product.final_image; // Altrimenti usa direttamente l'immagine di products

            //  Rimuove i campi di supporto non necessari dalla risposta finale
            delete product.final_image; // Rimuovi il campo di supporto
            delete product.pi_image_url; // Rimuovi il campo di supporto
            return product;
        });

        res.json(products);
    });
}


// =============================
// Funzione SHOW: Ottiene un singolo prodotto per ID
// =============================
export function show(req, res) {
    // Query SQL per ottenere i dettagli del prodotto specifico
    const sql = `
        SELECT
            p.*,
            c.category_name,
            g.game_genre, g.pegi_rating, g.supported_consoles, g.multiplayer, g.online_mode, g.publisher,
            a.compatibility, a.brand,
            con.color, con.hardware_specs, con.bundle_included, con.brand_console,
            COALESCE(pi.image_url, p.image_url) AS final_image,
            pi.image_url AS pi_image_url -- Campo per distinguere se l'immagine proviene da products_image
        FROM products p
        JOIN categories c ON p.id = c.product_id
        LEFT JOIN games g ON p.id = g.product_id
        LEFT JOIN accessories a ON p.id = a.product_id
        LEFT JOIN consoles con ON p.id = con.product_id
        LEFT JOIN products_image pi ON p.id = pi.product_id AND pi.isCover = TRUE
        WHERE p.id = ?
        `
        ;

    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database query failed' });
        if (results.length === 0) return res.status(404).json({ error: 'Product not found' });

        // Estraggo il primo (e unico) risultato
        const product = results[0];

        // Gestione dell'immagine principale
        product.image_url = product.final_image
            ? (product.pi_image_url
                ? `${req.imagePath}${product.final_image}` // Aggiungi il path assoluto se proviene da products_image
                : product.final_image) // Usa direttamente l'immagine di products
            : null;
        // Rimuovi il campo di supporto
        delete product.final_image;
        delete product.pi_image_url;

        // Query per ottenere tutte le immagini aggiuntive del prodotto
        const imageSql = `SELECT image_url FROM products_image WHERE product_id = ?`;
        db.query(imageSql, [product.id], (err, imageResults) => {
            if (err) return res.status(500).json({ error: 'Database query failed' });

            // Mappa gli URL delle immagini, aggiungendo il path assoluto se necessario
            product.images = imageResults.map(image =>
                isAbsoluteUrl(image.image_url) ? image.image_url : `${req.imagePath}${image.image_url}`
            );
            res.json(product);
        });
    });
}


// =============================
// Funzione SEARCH: Cerca un prodotto per nome o categoria
// =============================
export function search(req, res) {

    // Estraggo i parametri di ricerca dalla query
    const { name, category } = req.query;

    // Controllo che almeno uno dei due parametri sia stato fornito
    if (!name && !category) {
        return res.status(400).json({ error: 'Nome del prodotto o categoria non fornito' });
    }

    // Costruzione della query SQL di ricerca
    let sql = `
        SELECT
            p.*,
            c.category_name,
            g.game_genre, g.pegi_rating, g.supported_consoles, g.multiplayer, g.online_mode, g.publisher,
            a.compatibility, a.brand,
            con.color, con.hardware_specs, con.bundle_included, con.brand_console,
            COALESCE(pi.image_url, p.image_url) AS final_image,
            pi.image_url AS pi_image_url -- Campo per distinguere se l'immagine proviene da products_image
        FROM products p
        JOIN categories c ON p.id = c.product_id
        LEFT JOIN games g ON p.id = g.product_id
        LEFT JOIN accessories a ON p.id = a.product_id
        LEFT JOIN consoles con ON p.id = con.product_id
        LEFT JOIN products_image pi ON p.id = pi.product_id AND pi.isCover = TRUE
        WHERE 1=1
    `;
    const queryParams = [];

    // Se il parametro "name" è presente, aggiunge un filtro sulla colonna "name"
    if (name) {
        sql += ' AND p.name LIKE ?';
        queryParams.push(`%${name}%`);
    }

    // Se il parametro "category" è presente, aggiunge un filtro sulla categoria
    if (category) {
        sql += ' AND c.category_name = ?';
        queryParams.push(category);
    }

    // Esegue la query con i parametri
    db.query(sql, queryParams, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database query failed' });


        // Mappa i risultati per gestire le immagini
        const products = results.map(product => {
            product.image_url = product.final_image
                ? (isAbsoluteUrl(product.final_image) ? product.final_image : `${req.imagePath}${product.final_image}`)
                : null;
            delete product.final_image; // Rimuove il campo di supporto
            return product;
        });

        res.json(products);
    });
}





