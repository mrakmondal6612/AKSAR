import express from "express";
import { handleFetchNewsFunction, handleFetchNewsDetailsFunction } from "../controllers/news/news.controller";

// News route definition
const newsRoute = express.Router();

newsRoute.get("/get-news", handleFetchNewsFunction);
newsRoute.get("/get-news/:id", handleFetchNewsDetailsFunction);

export default newsRoute;
