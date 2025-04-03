import dotenv from 'dotenv';
import stripePackage from 'stripe';
import nodemailer from 'nodemailer';

dotenv.config();

// Inizializza Stripe con la chiave segreta
const stripe = stripePackage(process.env.STRIPE_SECRET_KEY);


// =============================
// Creazione della sessione di pagamento con Stripe
// =============================
export const createCheckoutSession = async (req, res) => {
    // Estrai il carrello e i dettagli utente dalla richiesta
    const { cartItems, userDetails } = req.body;

    console.log('🛍️ Carrello ricevuto:', cartItems);
    console.log('📧 Dettagli utente ricevuti:', userDetails);

    // Calcola il totale dell'ordine in centesimi (Stripe richiede l'importo in centesimi)
    const amount = Math.round(cartItems.reduce((total, item) => total + item.price * 100 * item.quantity, 0));
    console.log('💰 Totale calcolato:', amount / 100);

    try {
        // Crea un PaymentIntent con l'importo calcolato
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'eur',
            payment_method_types: ['card'], // Specifica che si accettano pagamenti con carta di credito
            metadata: {
                userDetails: JSON.stringify(userDetails),  // Salva i dettagli utente nei metadati
                cartItems: JSON.stringify(cartItems),  // Salva i dettagli del carrello nei metadati
            },
        });

        // Verifica che il client_secret sia stato creato correttamente
        if (!paymentIntent.client_secret) {
            throw new Error("❌ Client secret non generato correttamente.");
        }

        console.log('✅ PaymentIntent creato con successo:', paymentIntent.id);

        // Restituisci il client_secret per la sessione
        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error('❌ Errore nella creazione della sessione:', error);
        res.status(500).json({ error: error.message || "Errore sconosciuto durante la creazione della sessione di pagamento." });
    }
};


// =============================
// Funzione per inviare email di conferma ordine e finta fattura
// =============================
const sendConfirmationEmail = async (userDetails, cartItems, total) => {

    // Email del destinatario
    const customerEmail = process.env.CUSTOMER_EMAIL;

    // Configura il trasportatore per inviare le email tramite Gmail
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,  // Email mittente
            pass: process.env.EMAIL_PASS,  // Password dell'email mittente
        },
        tls: {
            rejectUnauthorized: false, // Permette connessioni TLS non verificate
        },
    });

    // Email di conferma per l'ordine
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: customerEmail,  // Destinatario (cliente)
        subject: '📜 Riepilogo Acquisto - Dettagli Ordine',
        text: `
            📦 Nuovo ordine ricevuto:

            🧑‍💼 Dettagli Acquirente:
            Nome: ${userDetails.firstName} ${userDetails.lastName}
            Email: ${userDetails.email}
            Indirizzo: ${userDetails.address}, ${userDetails.city}, ${userDetails.state} - ${userDetails.postalCode}
            Codice Fiscale: ${userDetails.fiscalCode}

            🛍️ Dettagli ordine:
            ${cartItems.map(item => `
                - ${item.name} x ${item.quantity}: €${(item.price * item.quantity).toFixed(2)}
            `).join('')}

            💳 Totale: €${total.toFixed(2)}

            🎉 Grazie per il tuo acquisto!
        `,
    };

    // Crea le opzioni per l'invio della finta fattura
    const invoiceMailOptions = {
        from: process.env.EMAIL_USER,
        to: customerEmail,  // Destinatario (cliente)
        subject: 'Finta Fattura per Ordine',
        text: `
            Fattura Fittizia per Ordine:

            Fattura emessa per il seguente ordine effettuato da ${userDetails.firstName} ${userDetails.lastName}:

            Indirizzo di fatturazione:
            ${userDetails.address}, ${userDetails.city}, ${userDetails.state} - ${userDetails.postalCode}
            Codice Fiscale: ${userDetails.fiscalCode}

            Dettagli Ordine:
            ${cartItems.map(item => `
                - ${item.name} x ${item.quantity}: €${(item.price * item.quantity).toFixed(2)}
            `).join('')}

            💳 Totale dell'ordine: €${total.toFixed(2)}

            🎉 Grazie per il tuo acquisto! Questa è una fattura fittizia per scopi di prova.
        `,
    };

    try {
        // Invia l'email di riepilogo e conferma ordine al cliente
        await transporter.sendMail(mailOptions);
        console.log('✅ Email di riepilogo e conferma inviata');

        // Invia la finta fattura al cliente
        await transporter.sendMail(invoiceMailOptions);
        console.log('✅ Finta fattura inviata');

    } catch (error) {
        console.error("❌ Errore nell'invio dell'email:", error);
    }
};


// =============================
// Endpoint per confermare il pagamento e inviare le email
// =============================
export const confirmPaymentAndSendEmails = async (req, res) => {

    // Estrai i dati dalla richiesta
    let { userDetails, cartItems, total } = req.body;

    console.log('📥 Ricevuta richiesta di conferma pagamento');

    total = Number(total);

    console.log('💰 Totale convertito in numero:', total);

    try {
        // Invia le email di conferma e la finta fattura al cliente
        await sendConfirmationEmail(userDetails, cartItems, total);
        console.log('✅ Email inviate con successo');
        // Risponde con un messaggio di successo
        res.status(200).send({ message: '📧 Email inviate con successo' });
    } catch (error) {
        console.error('❌ Errore nell\'invio delle email:', error);
        res.status(500).json({ error: '❌ Errore nell\'invio delle email' });
    }
};
