import db from '../config/db.js';

// Funzione per aggiornare lo stock dinamicamente
export function adjustStock(req, res) {
  // Estrazione dei parametri productId e quantityChange dal corpo della richiesta
  const { productId, quantityChange } = req.body;

  // Log dei parametri ricevuti con icona per tenere traccia dell'azione
  console.log(`🛒 Richiesta di aggiornamento stock: prodotto ID ${productId}, cambiamento quantità: ${quantityChange}`);

  // Verifica che i dati necessari siano presenti
  if (!productId || quantityChange === undefined) {
    console.log('❌ Errore: Dati mancanti');
    return res.status(400).json({ message: 'Dati mancanti' });
  }

  // Query per recuperare l'attuale stock del prodotto con l'ID specificato
  db.query('SELECT stock FROM products WHERE id = ?', [productId], (err, results) => {
    // Gestione errori nella query
    if (err) {
      console.error('⚠️ Errore nel recupero dello stock:', err);
      return res.status(500).json({ message: 'Errore del server' });
    }

    // Verifica che il prodotto esista nel database
    if (results.length === 0) {
      console.log(`❌ Prodotto non trovato: ID ${productId}`);
      return res.status(404).json({ message: 'Prodotto non trovato' });
    }

    // Estrazione dello stock attuale del prodotto
    const currentStock = results[0].stock;
    console.log(`📦 Stock attuale del prodotto ID ${productId}: ${currentStock}`);

    // Calcolo del nuovo stock
    const newStock = currentStock + quantityChange;
    console.log(`🔄 Nuovo stock calcolato per il prodotto ID ${productId}: ${newStock}`);

    // Verifica che lo stock non vada in negativo
    if (newStock < 0) {
      console.log(`❌ Errore: Stock insufficiente per il prodotto ID ${productId}`);
      return res.status(400).json({ message: 'Stock insufficiente' });
    }

    // Query per aggiornare lo stock nel database
    db.query('UPDATE products SET stock = ? WHERE id = ?', [newStock, productId], (updateErr) => {
      // Gestione errori nell'aggiornamento dello stock
      if (updateErr) {
        console.error('⚠️ Errore aggiornamento stock:', updateErr);
        return res.status(500).json({ message: 'Errore del server' });
      }

      // Log per confermare l'aggiornamento dello stock con successo
      console.log(`✅ Stock aggiornato con successo per il prodotto ID ${productId}: nuovo stock ${newStock}`);
      // Risposta al client con il nuovo valore dello stock
      res.json({ message: 'Stock aggiornato', newStock });
    });
  });
}


// Funzione per aggiornare lo stock dei prodotti dopo un acquisto
export function updateStockAfterPurchase(req, res) {
  const { cartItems } = req.body;

  if (!cartItems || cartItems.length === 0) {
    return res.status(400).json({ message: 'Nessun prodotto nel carrello' });
  }

  // Log per vedere i cartItems ricevuti
  console.log("🛒  Cart items ricevuti:", cartItems);

  // Itera sui prodotti e aggiorna lo stock
  let queries = cartItems.map(item => {
    return new Promise((resolve, reject) => {
      db.query(
        'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
        [item.quantity, item.id, item.quantity],
        (err, results) => {
          if (err) return reject(err);
          if (results.affectedRows === 0) {
            return reject(`Stock insufficiente per il prodotto ID ${item.id}`);
          }

          // Dopo l'aggiornamento, recupera lo stock rimanente
          db.query('SELECT stock FROM products WHERE id = ?', [item.id], (selectErr, selectResults) => {
            if (selectErr) return reject(selectErr);

            const remainingStock = selectResults[0].stock;
            console.log(`🛒 Prodotto ID ${item.id}: stock rimanente dopo l'acquisto: ${remainingStock}`);
            resolve();
          });
        }
      );
    });
  });

  // Esegui tutte le query in parallelo
  Promise.all(queries)
    .then(() => {
      // Svuota il carrello (senza necessità di customerId)
      db.query('DELETE FROM cart', (err) => {
        if (err) {
          console.error('Errore durante lo svuotamento del carrello:', err);
          return res.status(500).json({ message: 'Errore durante lo svuotamento del carrello', error: err });
        }

        // Risposta positiva se tutte le operazioni sono riuscite
        res.json({ message: 'Stock aggiornato e carrello svuotato con successo' });
      });
    })
    .catch(err => {
      console.error('Errore nell’aggiornamento dello stock:', err);
      res.status(500).json({ message: 'Errore nell’aggiornamento dello stock', error: err });
    });
}
