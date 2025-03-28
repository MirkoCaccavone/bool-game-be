// Importo dotenv per caricare le variabili d'ambiente
import dotenv from 'dotenv';
dotenv.config();

// Importo Stripe per gestire i pagamenti
import Stripe from 'stripe';

// Servizio per inviare mail
import nodemailer from 'nodemailer';

// Importo la configurazione del database
import db from '../config/db.js';

// Inizializzo Stripe con la chiave segreta dalle variabili d'ambiente
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

// Funzione per inviare una mail di conferma al cliente
function sendConfirmationEmail(customerEmail) {
    // Configurazione del servizio di invio email
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    // Contenuto dell'email
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: customerEmail,
        subject: 'Conferma pagamento',
        text: 'Il tuo pagamento è stato completato con successo e l\'ordine è stato aggiornato.',
    };

    // Invio dell'email
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.error('Errore nell\'invio della mail:', err);
        } else {
            console.log('Email inviata: ' + info.response);
        }
    });
}

// Funzione per iniziare il processo di pagamento e generare un PaymentIntent con Stripe
export function processPayment(req, res) {
    const { cartItems } = req.body;

    if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({ message: 'Il carrello è vuoto.' });
    }

    const totalAmount = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shippingCost = 10; // o calcolalo in base alla logica della tua app
    const total = totalAmount + shippingCost;

    // Creazione di un PaymentIntent su Stripe
    stripe.paymentIntents.create({
        amount: total * 100, // Stripe lavora con centesimi
        currency: 'eur',
        metadata: { cartItems },
    })
        .then((paymentIntent) => {
            res.json({ clientSecret: paymentIntent.client_secret });
        })
        .catch((err) => {
            console.error('Errore nella creazione del PaymentIntent:', err);
            return res.status(500).json({ message: 'Errore nella creazione del pagamento.' });
        });
}

// Funzione per verificare il pagamento e aggiornare lo stato dell'ordine
export function verifyPayment(req, res) {
    const { paymentIntentId } = req.body;

    // Controllo che il paymentIntentId sia stato fornito
    if (!paymentIntentId) {
        return res.status(400).json({ message: "L'ID del pagamento è necessario." });
    }

    // Recupero i dettagli del pagamento da Stripe
    stripe.paymentIntents.retrieve(paymentIntentId)
        .then((paymentIntent) => {
            if (paymentIntent.status !== 'succeeded') {
                return res.status(400).json({ message: "Il pagamento non è andato a buon fine." });
            }

            // Recupero l'ID dell'ordine dai metadati
            const orderId = paymentIntent.metadata.order_id;

            if (!orderId) {
                return res.status(400).json({ message: "Ordine non trovato nei metadati del pagamento." });
            }

            // Inizio della transazione per l'aggiornamento dell'ordine
            db.beginTransaction((err) => {
                if (err) {
                    console.error('Errore nell\'iniziare la transazione:', err);
                    return res.status(500).json({ message: 'Errore nell\'iniziare la transazione.' });
                }

                // Aggiornamento dello stato dell'ordine a "Pagato"
                const sqlUpdateOrder = 'UPDATE orders SET status = "Pagato" WHERE id = ?';
                db.query(sqlUpdateOrder, [orderId], (err) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error("Errore nell'aggiornamento dell'ordine:", err);
                            return res.status(500).json({ message: "Errore nell'aggiornamento dell'ordine." });
                        });
                    }

                    // Recupera i dettagli dell'ordine, inclusa l'email del cliente
                    const sqlGetEmail = `
                        SELECT o.id, o.customer_email
                        FROM orders o
                        WHERE o.id = ?`;

                    db.query(sqlGetEmail, [orderId], (err, orderDetails) => {
                        if (err) {
                            return db.rollback(() => {
                                console.error("Errore nel recupero dei dettagli dell'ordine:", err);
                                return res.status(500).json({ message: "Errore nel recupero dei dettagli dell'ordine." });
                            });
                        }

                        if (orderDetails.length === 0) {
                            return db.rollback(() => {
                                return res.status(404).json({ message: "Dettagli dell'ordine non trovati." });
                            });
                        }

                        // Invio dell'email di conferma
                        sendConfirmationEmail(orderDetails[0].customer_email);

                        // Completamento della transazione
                        db.commit((err) => {
                            if (err) {
                                return db.rollback(() => {
                                    console.error('Errore nel commettere la transazione:', err);
                                    return res.status(500).json({ message: 'Errore nella conferma del pagamento.' });
                                });
                            }

                            res.json({ message: "Pagamento verificato e ordine aggiornato." });
                        });
                    });
                });
            });
        })
        .catch((err) => {
            console.error("Errore nella verifica del pagamento:", err);
            return res.status(500).json({ message: "Errore nella verifica del pagamento." });
        });
}
