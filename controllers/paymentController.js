// Importo dotenv per caricare le variabili d'ambiente
import dotenv from 'dotenv';
dotenv.config();

// Importo Stripe per gestire i pagamenti
import Stripe from 'stripe';

// Servizio per inviare mail
import nodemailer from 'nodemailer';

import db from '../config/db.js';

// Inizializzo Stripe con la chiave segreta dalle variabili d'ambiente
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

// Funzione per inviare una mail di conferma al cliente
function sendConfirmationEmail(customerEmail) {

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: customerEmail,
        subject: 'Conferma pagamento',
        text: 'Il tuo pagamento è stato completato con successo e l\'ordine è stato aggiornato.',
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.error('Errore nell\'invio della mail:', err);
        } else {
            console.log('Email inviata: ' + info.response);
        }
    });
}

// Funzione per gestire il pagamento
export function processPayment(req, res) {

    const { order_id, customer_id } = req.body;

    if (!order_id || !customer_id) {
        return res.status(400).json({ message: 'Ordine e cliente devono essere specificati.' });
    }

    const sqlGetOrder = 'SELECT total FROM orders WHERE id = ? AND customer_id = ?';

    db.query(sqlGetOrder, [order_id, customer_id], (err, result) => {
        if (err) {
            console.error("Errore nel recupero dell'ordine:", err);
            return res.status(500).json({ message: "Errore nel recupero dell'ordine." });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: "Ordine non trovato per il cliente." });
        }

        const totalAmount = result[0].total * 100;

        stripe.paymentIntents.create({
            amount: totalAmount,
            currency: 'eur',
            metadata: { order_id },
        })
            .then((paymentIntent) => {
                res.json({ clientSecret: paymentIntent.client_secret });
            })
            .catch((err) => {
                console.error('Errore nella creazione del PaymentIntent:', err);
                return res.status(500).json({ message: 'Errore nella creazione del pagamento.' });
            });
    });
}

// Funzione per verificare il pagamento e aggiornare lo stato dell'ordine
export function verifyPayment(req, res) {
    const { paymentIntentId, order_id, customerEmail } = req.body;

    if (!paymentIntentId || !order_id || !customerEmail) {
        return res.status(400).json({ message: 'PaymentIntent ID, Order ID e email cliente sono necessari.' });
    }

    console.log('Dati ricevuti:', { paymentIntentId, order_id, customerEmail });

    stripe.paymentIntents.retrieve(paymentIntentId)
        .then((paymentIntent) => {
            console.log('PaymentIntent recuperato:', paymentIntent);

            if (paymentIntent.status === 'succeeded') {
                const sqlUpdateOrderStatus = 'UPDATE orders SET status = "Pagato" WHERE id = ?';

                db.query(sqlUpdateOrderStatus, [order_id], (err) => {
                    if (err) {
                        console.error("Errore nell'aggiornamento dello stato dell'ordine:", err);
                        return res.status(500).json({ message: "Errore nell'aggiornamento dello stato dell'ordine." });
                    }

                    sendConfirmationEmail(customerEmail);
                    res.json({ message: 'Pagamento completato con successo e stato dell\'ordine aggiornato.' });
                });
            } else if (paymentIntent.status === 'requires_payment_method') {
                console.log('Pagamento non completato. Il PaymentIntent richiede un metodo di pagamento valido.');
                res.status(400).json({ message: 'Pagamento non completato. Si prega di fornire un metodo di pagamento valido.' });
            } else {
                console.log('Stato PaymentIntent sconosciuto:', paymentIntent.status);
                res.status(400).json({ message: 'Pagamento non completato.' });
            }
        })
        .catch((err) => {
            console.error('Errore nel recupero del PaymentIntent:', err);
            return res.status(500).json({ message: 'Errore nel recupero del PaymentIntent.' });
        });
}