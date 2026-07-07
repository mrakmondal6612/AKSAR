"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userUpdateRateLimiter = exports.loginRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.loginRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per 15 minutes
    message: {
        success: false,
        message: "Too many login attempts. Please try again after 15 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
exports.userUpdateRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 10 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per 15 minutes
    message: {
        success: false,
        message: "Too many update attempts. Please try again after 10 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
