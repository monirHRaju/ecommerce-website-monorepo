"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const notificationSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: ['order', 'product', 'payment', 'user', 'review', 'system'],
        required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    referenceId: { type: mongoose_1.Schema.Types.ObjectId },
    referenceModel: {
        type: String,
        enum: ['Order', 'Product', 'User', 'Review'],
    },
    isRead: { type: Boolean, default: false },
}, { timestamps: true });
notificationSchema.index({ isRead: 1, createdAt: -1 });
const Notification = (0, mongoose_1.model)('Notification', notificationSchema);
exports.default = Notification;
