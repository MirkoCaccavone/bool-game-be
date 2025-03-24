import express from "express";
const router = express.Router();

const productController = require("../controllers/productController");

// index visualizza tutti gli elementi
router.route("/", productController.index);
// show visualizza un singolo elemento
router.route("/:id", productController.show);
// search cerca un elemento
router.route("/search", productController.search);

export default router;