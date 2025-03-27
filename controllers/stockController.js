import db from '../config/db.js';

// Funzione per aggiornare lo stock del prodotto
function aggiornaStock(req, res) {
  const { productId, newQuantity, currentQuantity } = req.body;

  // Recupera i dettagli del prodotto dal database
  db.query('SELECT * FROM products WHERE id = ?', [productId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Errore nel recupero del prodotto' });
    }

    // Se il prodotto non esiste, restituisce un errore
    if (results.length === 0) {
      return res.status(404).json({ message: 'Prodotto non trovato' });
    }

    const prodotto = results[0];

    // Controlla che la nuova quantità non sia negativa
    if (newQuantity < 0) {
      return res.status(400).json({ message: 'La quantità non può essere negativa' });
    }

    // Calcola la differenza tra la nuova quantità e la quantità attuale
    const quantityDifference = newQuantity - currentQuantity;

    // Se la quantità aumenta, verifica la disponibilità in stock e aggiorna
    if (quantityDifference > 0) {
      // Se la quantità aumenta, decrementa lo stock nel database
      if (prodotto.stock < quantityDifference) {
        return res.status(400).json({ message: 'Non ci sono abbastanza prodotti in stock per questa quantità' });
      }

      // Aggiorna lo stock riducendo la quantità richiesta
      db.query('UPDATE products SET stock = stock - ? WHERE id = ?', [quantityDifference, productId], (updateErr) => {
        if (updateErr) {
          console.error(updateErr);
          return res.status(500).json({ message: 'Errore nell\'aggiornamento dello stock' });
        }

        return res.status(200).json({ message: 'Stock aggiornato con successo' });
      });

      // Se la quantità diminuisce, aumenta lo stock nel database
    } else if (quantityDifference < 0) {

      // Se la quantità diminuisce, incrementa lo stock nel database
      db.query('UPDATE products SET stock = stock + ? WHERE id = ?', [-quantityDifference, productId], (updateErr) => {
        if (updateErr) {
          console.error(updateErr);
          return res.status(500).json({ message: 'Errore nell\'aggiornamento dello stock' });
        }

        return res.status(200).json({ message: 'Stock aggiornato con successo' });
      });
    }
  });
}

export default aggiornaStock;
