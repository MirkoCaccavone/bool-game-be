// Definizione della funzione middleware per la gestione degli errori
function errorHandler(err, req, res, next) {
    // Imposta il codice di stato della risposta a 500 (Errore interno del server)
    res.status(500);

    // Invia una risposta JSON contenente il messaggio di errore
    res.json({
        error: err.message, // err.message contiene una descrizione leggibile dell'errore
    });
};

// Esporta la funzione errorHandler in modo che possa essere utilizzata in altre parti dell'applicazione
module.exports = errorHandler;