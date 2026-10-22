"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = exports.LOW_STOCK_THRESHOLD = void 0;
const notification_model_1 = __importDefault(require("../models/notification.model"));
exports.LOW_STOCK_THRESHOLD = 5;
const createNotification = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield notification_model_1.default.create(data);
    }
    catch (err) {
        console.error('[Notification] Failed to create notification:', err.message);
    }
});
exports.createNotification = createNotification;
