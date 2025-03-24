// Definisce una funzione middleware per gestire le richieste non trovate (404)
export default function notFound(req, res, next) {
    // Imposta lo stato della risposta HTTP a 404 (Not Found)
    res.status(404);

    // Invia una risposta JSON con un messaggio di errore
    res.json({
        error: "Not Found", // Descrizione dell'errore
        message: "Pagina non trovata" // Messaggio più dettagliato
    });
}


