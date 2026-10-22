"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const paymentMethodSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    instructions: { type: String, required: true },
    phoneNumber: { type: String, trim: true },
    qrImage: { type: String },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
}, { timestamps: true });
const PaymentMethod = (0, mongoose_1.model)('PaymentMethod', paymentMethodSchema);
exports.default = PaymentMethod;
