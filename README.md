1. npm init
2. npm i espress cors mysql2 dotenv stripe nodemailer

rotte che serviranno

per i prodotti 

index    per visualizzare tutti i prodotti (ok)
show     per visualizzare un solo prodotto per id
search    per cercare i prodotti tramite nome 
vediamo come scalare i prodotti

nel carrello
modifyQuantity    per rimuovere il prodotto dal carrello


per ordini
createOrder   per creare un ordine
showOrder    per cercare un ordine tramite ID

payment    gestire i pagamenti e invio email


TEST ROTTE BE

<!-- creazione dell'ordine -->
POST: http://localhost:3000/api/orders/create

body-raw

{
  "customer_id": 1,
  "total": 100,
  "shipping_cost": 8,
  "status": "Spedito"
}

<!-- aggiunta di un prodotto al carrello -->
POST: http://localhost:3000/api/cart/add

body-raw

{
  "customer_id": 1,
  "product_id": 3, 
  "quantity": 3
}

<!-- modifica delle quantità del prodotto nel carrello, non si può superare il limite di stock ne scendere sotto a 1 unità per prodotto-->
PUT: http://localhost:3000/api/cart/update

body-raw

{
  "customer_id": 1,
  "product_id": 3,
  "quantity": 1
}

<!-- possibilità di rimuovere un prodotto dal carrello -->
DELETE: http://localhost:3000/api/cart/remove

body-raw

{
  "customer_id": 1,
  "product_id": 3
}

<!-- inizializzazione del pagamento con Stripe -->
POST: http://localhost:3000/api/payment/process

body-raw

{
  "order_id": 5,
  "customer_id": 4
}

<!-- verifica dell'effettuato pagamento (la rotta funzionerà una volta implementato il FE) -->
POST: http://localhost:3000/api/payment/verify

body-raw 

{
  "paymentIntentId": "qui andrà inserita la chiave che restituisce /payment/process",
  "order_id": 5,
  "customerEmail": "sceglieremo una mail per l'acquirente",
}

<!-- ricerca tutti i prodotti -->
GET: http://localhost:3000/api/products


<!-- ricerca prodotto tramite id -->
http://localhost:3000/api/products/3


<!-- ricerca tramite nome  -->
http://localhost:3000/api/products/search?name=play

<!-- ricerca tramite categoria -->
http://localhost:3000/api/products/search?category=gioco