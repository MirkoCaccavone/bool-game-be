import express from "express";
import { index, show, search } from "../controllers/productController.js";

const router = express.Router();



// index visualizza tutti gli elementi
router.route("/", index);
// show visualizza un singolo elemento
router.route("/:id", show);
// search cerca un elemento
router.route("/search", search);

export default router;