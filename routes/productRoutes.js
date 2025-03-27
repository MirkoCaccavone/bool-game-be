import express from "express";
import { index, show, search } from "../controllers/productController.js";

const router = express.Router();

// search cerca un elemento
router.route("/search").get(search);
// index visualizza tutti gli elementi
router.route("/").get(index);
// show visualizza un singolo elemento
router.route("/:id").get(show);

export default router;