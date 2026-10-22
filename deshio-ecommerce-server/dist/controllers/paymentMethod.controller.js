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
exports.paymentMethodControllers = void 0;
const paymentMethod_model_1 = __importDefault(require("../models/paymentMethod.model"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const sendResponse_1 = __importDefault(require("../utils/sendResponse"));
// GET /api/v1/payment-methods  (public — active only)
const getActivePaymentMethods = (0, asyncHandler_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const methods = yield paymentMethod_model_1.default.find({ isActive: true }).sort({ sortOrder: 1 });
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Active payment methods retrieved',
        data: methods,
    });
}));
// GET /api/v1/payment-methods/all  (admin)
const getAllPaymentMethods = (0, asyncHandler_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const methods = yield paymentMethod_model_1.default.find().sort({ sortOrder: 1 });
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'All payment methods retrieved',
        data: methods,
    });
}));
// POST /api/v1/payment-methods  (admin)
const createPaymentMethod = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, type, instructions, phoneNumber, qrImage, isActive, sortOrder } = req.body;
    if (!name || !type || !instructions) {
        throw new AppError_1.default('Name, type, and instructions are required', 400);
    }
    const method = yield paymentMethod_model_1.default.create({
        name,
        type,
        instructions,
        phoneNumber,
        qrImage,
        isActive: isActive !== null && isActive !== void 0 ? isActive : true,
        sortOrder: sortOrder !== null && sortOrder !== void 0 ? sortOrder : 0,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: 201,
        success: true,
        message: 'Payment method created',
        data: method,
    });
}));
// PATCH /api/v1/payment-methods/:id  (admin)
const updatePaymentMethod = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const method = yield paymentMethod_model_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!method)
        throw new AppError_1.default('Payment method not found', 404);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Payment method updated',
        data: method,
    });
}));
// DELETE /api/v1/payment-methods/:id  (admin)
const deletePaymentMethod = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const method = yield paymentMethod_model_1.default.findByIdAndDelete(req.params.id);
    if (!method)
        throw new AppError_1.default('Payment method not found', 404);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Payment method deleted',
        data: null,
    });
}));
exports.paymentMethodControllers = {
    getActivePaymentMethods,
    getAllPaymentMethods,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
};
