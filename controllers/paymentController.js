import Stripe from 'stripe';
import nodemailer from 'nodemailer';

// Inizializza Stripe con la tua chiave segreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Funzione per inviare le email
const sendConfirmationEmails = async (userDetails, cart) => {

    // Configura il trasportatore Nodemailer
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,  // Utente per l'autenticazione
            pass: process.env.EMAIL_PASS,  // Password per l'autenticazione
        },
    });

    // Email al venditore
    const sellerEmailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.CUSTOMER_EMAIL,
        subject: 'Nuovo Ordine Ricevuto',
        text: `Nuovo ordine ricevuto da ${userDetails.firstName} ${userDetails.lastName}.
        
        Dettagli dell'utente:
        Nome: ${userDetails.firstName} ${userDetails.lastName}
        Indirizzo: ${userDetails.address}
        Città: ${userDetails.city}
        CAP: ${userDetails.postalCode}
        Stato: ${userDetails.state}
        Email: ${userDetails.email}
        Codice Fiscale: ${userDetails.fiscalCode}

        Dettagli dell'ordine:
        ${cart.map(product => `${product.name} x ${product.quantity} - €${(product.price * product.quantity).toFixed(2)}`).join('\n')}

        Totale: €${cart.reduce((total, product) => total + product.price * product.quantity, 0).toFixed(2)}`,
    };

    // Email al compratore (Finta fattura)
    const buyerEmailOptions = {
        from: process.env.EMAIL_USER,
        to: userDetails.email,
        subject: 'Fattura Ordine',
        text: `Grazie per aver acquistato da noi, ${userDetails.firstName}!
        Ecco la tua fattura:
        ${cart.map(product => `${product.name} x ${product.quantity} - €${(product.price * product.quantity).toFixed(2)}`).join('\n')}
        Totale: €${cart.reduce((total, product) => total + product.price * product.quantity, 0).toFixed(2)}`,
    };

    try {
        // Invia le email
        await transporter.sendMail(sellerEmailOptions);
        await transporter.sendMail(buyerEmailOptions);
        console.log('✅ Email inviate con successo');
    } catch (error) {
        console.error('❌ Errore nell\'invio delle email:', error);
    }
};

// Funzione per creare la sessione di pagamento
export const createCheckoutSession = async (req, res) => {

    // Ottenere anche i dettagli dell'utente
    const { cartItems, userDetails } = req.body;

    // Log per verificare i cartItems ricevuti dalla richiesta
    console.log('🛒 Cart Items:', cartItems);
    // Ottenere anche i dettagli dell'utente
    console.log('👤 User Details:', userDetails);

    // Mappa gli articoli del carrello per creare i line_items per Stripe
    const line_items = cartItems.map(item => {
        // Verifica che il prezzo del prodotto sia valido
        if (!item.price || isNaN(item.price) || item.price <= 0) {
            return res.status(400).send('❌ Prezzo non valido per un prodotto.');
        }
        return {
            price_data: {
                currency: 'eur',
                product_data: {
                    name: item.name,
                    images: [item.image_url],
                },
                unit_amount: item.price * 100,
            },
            quantity: item.quantity,
        };
    });

    try {
        // Crea la sessione di checkout con Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
            success_url: `${process.env.FE_APP}/home?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FE_APP}/checkout`,
        });

        // Log per la sessione di pagamento creata
        console.log('💳 Session ID:', session.id);

        // Invia le email di conferma al venditore e al compratore
        await sendConfirmationEmails(userDetails, cartItems);

        // Log per session ID
        console.log('Session ID:', session.id);

        // Risposta con l'ID della sessione Stripe
        res.json({ sessionId: session.id, message: "✅ Pagamento simulato con successo" });
    } catch (error) {
        console.error('❌ Errore nel pagamento:', error);
        res.status(500).json({ error: error.message });
    }
};

