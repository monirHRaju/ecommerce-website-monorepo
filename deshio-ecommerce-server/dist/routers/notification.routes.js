"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationRoutes = void 0;
const express_1 = __importDefault(require("express"));
const notification_controller_1 = require("../controllers/notification.controller");
const auth_middleware_1 = __importDefault(require("../middlewares/auth.middleware"));
const role_middleware_1 = __importDefault(require("../middlewares/role.middleware"));
const router = express_1.default.Router();
router.use(auth_middleware_1.default, (0, role_middleware_1.default)('admin'));
router.get('/', notification_controller_1.notificationControllers.getNotifications);
router.get('/unread-count', notification_controller_1.notificationControllers.getUnreadCount);
router.patch('/read-all', notification_controller_1.notificationControllers.markAllAsRead);
router.patch('/:id/read', notification_controller_1.notificationControllers.markAsRead);
router.delete('/:id', notification_controller_1.notificationControllers.deleteNotification);
exports.NotificationRoutes = router;
