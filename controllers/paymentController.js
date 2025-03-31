import dotenv from 'dotenv';
import stripePackage from 'stripe';
import nodemailer from 'nodemailer';

dotenv.config();

// Inizializza Stripe con la chiave segreta
const stripe = stripePackage(process.env.STRIPE_SECRET_KEY);

// Creazione sessione di pagamento
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
            payment_method_types: ['card'],
            metadata: {
                userDetails: JSON.stringify(userDetails),
                cartItems: JSON.stringify(cartItems),
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

// Funzione per inviare le email di conferma e fattura al cliente
const sendConfirmationEmail = async (userDetails, cartItems, total) => {

    // Email del destinatario
    const customerEmail = process.env.CUSTOMER_EMAIL; 

    // Configura il trasportatore per inviare le email tramite Gmail
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false, // Ignora la verifica del certificato TLS
        },
    });

    // Email di conferma per l'ordine
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: customerEmail,
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
        to: customerEmail,
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

// Endpoint per confermare il pagamento e inviare le email
export const confirmPaymentAndSendEmails = async (req, res) => {

    // Estrai i dati dalla richiesta
    let { userDetails, cartItems, total } = req.body;

    console.log('📥 Ricevuta richiesta di conferma pagamento');

    total = Number(total); 

    console.log('💰 Totale convertito in numero:', total); 

    try {
        await sendConfirmationEmail(userDetails, cartItems, total);
        console.log('✅ Email inviate con successo'); 
        res.status(200).send({ message: '📧 Email inviate con successo' });
    } catch (error) {
        console.error('❌ Errore nell\'invio delle email:', error);
        res.status(500).json({ error: '❌ Errore nell\'invio delle email' });
    }
};




    // // Mappa gli articoli del carrello per creare i line_items per Stripe
    // const line_items = cartItems.map(item => {
    //     // Verifica che il prezzo del prodotto sia valido
    //     if (!item.price || isNaN(item.price) || item.price <= 0) {
    //         return res.status(400).send('❌ Prezzo non valido per un prodotto.');
    //     }
    //     return {
    //         price_data: {
    //             currency: 'eur',
    //             product_data: {
    //                 name: item.name,
    //                 images: [item.image_url],
    //             },
    //             unit_amount: Math.round(item.price * 100), // Arrotonda il prezzo in centesimi
    //         },
    //         quantity: item.quantity,
    //     };
    // });

// // Inizializza Stripe con la tua chiave segreta
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// // Funzione per inviare le email
// const sendConfirmationEmails = async (userDetails, cart) => {

//     // Configura il trasportatore Nodemailer
//     const transporter = nodemailer.createTransport({
//         service: 'gmail',
//         auth: {
//             user: process.env.EMAIL_USER,  // Utente per l'autenticazione
//             pass: process.env.EMAIL_PASS,  // Password per l'autenticazione
//         },
//     });

//     // Email al venditore
//     const sellerEmailOptions = {
//         from: process.env.EMAIL_USER,
//         to: process.env.CUSTOMER_EMAIL,
//         subject: 'Nuovo Ordine Ricevuto',
//         text: `Nuovo ordine ricevuto da ${userDetails.firstName} ${userDetails.lastName}.
        
//         Dettagli dell'utente:
//         Nome: ${userDetails.firstName} ${userDetails.lastName}
//         Indirizzo: ${userDetails.address}
//         Città: ${userDetails.city}
//         CAP: ${userDetails.postalCode}
//         Stato: ${userDetails.state}
//         Email: ${userDetails.email}
//         Codice Fiscale: ${userDetails.fiscalCode}

//         Dettagli dell'ordine:
//         ${cart.map(product => `${product.name} x ${product.quantity} - €${(product.price * product.quantity).toFixed(2)}`).join('\n')}

//         Totale: €${cart.reduce((total, product) => total + product.price * product.quantity, 0).toFixed(2)}`,
//     };

//     // Email al compratore (Finta fattura)
//     const buyerEmailOptions = {
//         from: process.env.EMAIL_USER,
//         to: userDetails.email,
//         subject: 'Fattura Ordine',
//         text: `Grazie per aver acquistato da noi, ${userDetails.firstName}!
//         Ecco la tua fattura:
//         ${cart.map(product => `${product.name} x ${product.quantity} - €${(product.price * product.quantity).toFixed(2)}`).join('\n')}
//         Totale: €${cart.reduce((total, product) => total + product.price * product.quantity, 0).toFixed(2)}`,
//     };

//     try {
//         // Invia le email
//         await transporter.sendMail(sellerEmailOptions);
//         await transporter.sendMail(buyerEmailOptions);
//         console.log('✅ Email inviate con successo');
//     } catch (error) {
//         console.error('❌ Errore nell\'invio delle email:', error);
//     }
// };

// // Funzione per creare la sessione di pagamento
// export const createCheckoutSession = async (req, res) => {

//     // Ottenere anche i dettagli dell'utente
//     const { cartItems, userDetails } = req.body;

//     // Log per verificare i cartItems ricevuti dalla richiesta
//     console.log('🛒 Cart Items:', cartItems);
//     // Ottenere anche i dettagli dell'utente
//     console.log('👤 User Details:', userDetails);

//     // Mappa gli articoli del carrello per creare i line_items per Stripe
//     const line_items = cartItems.map(item => {
//         // Verifica che il prezzo del prodotto sia valido
//         if (!item.price || isNaN(item.price) || item.price <= 0) {
//             return res.status(400).send('❌ Prezzo non valido per un prodotto.');
//         }
//         return {
//             price_data: {
//                 currency: 'eur',
//                 product_data: {
//                     name: item.name,
//                     images: [item.image_url],
//                 },
//                 unit_amount: item.price * 100,
//             },
//             quantity: item.quantity,
//         };
//     });

//     try {
//         // Crea la sessione di checkout con Stripe
//         const session = await stripe.checkout.sessions.create({
//             payment_method_types: ['card'],
//             line_items,
//             mode: 'payment',
//             success_url: `${process.env.FE_APP}/home?session_id={CHECKOUT_SESSION_ID}`,
//             cancel_url: `${process.env.FE_APP}/checkout`,
//         });

//         // Log per la sessione di pagamento creata
//         console.log('💳 Session ID:', session.id);

//         // Invia le email di conferma al venditore e al compratore
//         await sendConfirmationEmails(userDetails, cartItems);

//         // Log per session ID
//         console.log('Session ID:', session.id);

//         // Risposta con l'ID della sessione Stripe
//         res.json({ sessionId: session.id, message: "✅ Pagamento simulato con successo" });
//     } catch (error) {
//         console.error('❌ Errore nel pagamento:', error);
//         res.status(500).json({ error: error.message });
//     }
// };

