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

<!-- ricerca tutti i prodotti -->
GET: http://localhost:3000/api/products


<!-- ricerca prodotto tramite id -->
http://localhost:3000/api/products/3


<!-- ricerca tramite nome  -->
http://localhost:3000/api/products/search?name=play

<!-- ricerca tramite categoria -->
http://localhost:3000/api/products/search?category=gioco