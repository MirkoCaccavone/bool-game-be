import db from '../config/db.js';

//  Creo un nuovo ordine quando il carrello viene confermato
export const createOrder = async (req, res) => {
    try {
        // Recupero tutti i prodotti nel carrello
        const cartQuery = `SELECT * FROM orderitem INNER JOIN products ON orderitem.productId = products.id`;
        const [cartItems] = await db.execute(cartQuery);

        // Se il carrello è vuoto, impedisce la creazione dell'ordine
        if (cartItems.length === 0) {
            return res.status(400).json({ message: "Il carrello è vuoto" });
        }

        // Calcolo il totale dell'ordine sommando il prezzo di ogni prodotto 
        const totalAmount = cartItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

        // Inserisco il nuovo ordine nella tabella 'orders' con lo stato 'pending'
        const createOrderQuery = `INSERT INTO orders (totalAmount, status) VALUES (?, 'pending')`;
        const [orderResult] = await db.execute(createOrderQuery, [totalAmount]);

        // Ottiengo l'ID dell'ordine appena creato
        const orderId = orderResult.insertId;

        // Trasferisce i prodotti dal carrello all'ordine
        const clearCartQuery = `DELETE FROM orderitem`;
        await db.execute(clearCartQuery);

        res.json({ message: "Ordine creato con successo", orderId, totalAmount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Errore nella creazione dell'ordine" });
    }
};

// Recupero tutti gli ordini confermati
export const getOrders = async (req, res) => {
    try {
        const query = `SELECT * FROM orders`;
        const [orders] = await db.execute(query);
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Errore nel recupero degli ordini" });
    }
};

// Recupero i dettagli di un ordine specifico, inclusi i prodotti acquistati
export const getOrderDetails = async (req, res) => {
    const { orderId } = req.params;

    try {
        const query = `SELECT products.name, order_details.quantity, order_details.price 
                        FROM order_details 
                        INNER JOIN products ON order_details.productId = products.id 
                        WHERE order_details.orderId = ?`;
        const [orderDetails] = await db.execute(query, [orderId]);

        // Rispondo con i dettagli dell'ordine
        res.json(orderDetails);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Errore nel recupero dei dettagli dell'ordine" });
    }
};
