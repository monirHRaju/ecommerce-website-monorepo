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
exports.notificationControllers = void 0;
const notification_model_1 = __importDefault(require("../models/notification.model"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const sendResponse_1 = __importDefault(require("../utils/sendResponse"));
// GET /api/v1/notifications
const getNotifications = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.isRead === 'true')
        filter.isRead = true;
    if (req.query.isRead === 'false')
        filter.isRead = false;
    const [notifications, total] = yield Promise.all([
        notification_model_1.default.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        notification_model_1.default.countDocuments(filter),
    ]);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Notifications retrieved',
        data: notifications,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
}));
// GET /api/v1/notifications/unread-count
const getUnreadCount = (0, asyncHandler_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const count = yield notification_model_1.default.countDocuments({ isRead: false });
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Unread count retrieved',
        data: { count },
    });
}));
// PATCH /api/v1/notifications/:id/read
const markAsRead = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const notification = yield notification_model_1.default.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!notification)
        throw new AppError_1.default('Notification not found', 404);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Notification marked as read',
        data: notification,
    });
}));
// PATCH /api/v1/notifications/read-all
const markAllAsRead = (0, asyncHandler_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield notification_model_1.default.updateMany({ isRead: false }, { isRead: true });
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: `${result.modifiedCount} notifications marked as read`,
    });
}));
// DELETE /api/v1/notifications/:id
const deleteNotification = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const notification = yield notification_model_1.default.findByIdAndDelete(req.params.id);
    if (!notification)
        throw new AppError_1.default('Notification not found', 404);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Notification deleted',
    });
}));
exports.notificationControllers = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
};
