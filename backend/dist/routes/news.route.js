"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const news_controller_1 = require("../controllers/news/news.controller");
// News route definition
const newsRoute = express_1.default.Router();
newsRoute.get("/get-news", news_controller_1.handleFetchNewsFunction);
newsRoute.get("/get-news/:id", news_controller_1.handleFetchNewsDetailsFunction);
exports.default = newsRoute;
