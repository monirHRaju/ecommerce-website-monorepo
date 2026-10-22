"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethodRoutes = void 0;
const express_1 = __importDefault(require("express"));
const paymentMethod_controller_1 = require("../controllers/paymentMethod.controller");
const auth_middleware_1 = __importDefault(require("../middlewares/auth.middleware"));
const role_middleware_1 = __importDefault(require("../middlewares/role.middleware"));
const router = express_1.default.Router();
// Public
router.get('/', paymentMethod_controller_1.paymentMethodControllers.getActivePaymentMethods);
// Admin only
router.use(auth_middleware_1.default, (0, role_middleware_1.default)('admin'));
router.get('/all', paymentMethod_controller_1.paymentMethodControllers.getAllPaymentMethods);
router.post('/', paymentMethod_controller_1.paymentMethodControllers.createPaymentMethod);
router.patch('/:id', paymentMethod_controller_1.paymentMethodControllers.updatePaymentMethod);
router.delete('/:id', paymentMethod_controller_1.paymentMethodControllers.deletePaymentMethod);
exports.PaymentMethodRoutes = router;
