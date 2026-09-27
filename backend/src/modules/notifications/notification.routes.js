import { Router } from 'express';
import NotificationService from './notification.service.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import ApiResponse from '../../utils/apiResponse.js';
import { validate } from '../../middleware/validate.middleware.js';
import { idParamSchema } from '../../utils/request.schema.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const notifications = await NotificationService.getUserNotifications(req.user.id);
    return ApiResponse.success(res, 'Notifications retrieved.', { notifications });
  } catch (err) {
    next(err);
  }
});

router.patch('/read-all', async (req, res, next) => {
  try {
    const notifications = await NotificationService.markAllAsRead(req.user.id);
    return ApiResponse.success(res, 'Notifications marked as read.', { notifications });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/read', validate(idParamSchema, 'params'), async (req, res, next) => {
  try {
    const notification = await NotificationService.markAsRead(req.params.id, req.user.id);
    if (!notification) {
      return ApiResponse.error(res, 'Notification not found.', 'RESOURCE_NOT_FOUND', 404);
    }
    return ApiResponse.success(res, 'Notification marked as read.', { notification });
  } catch (err) {
    next(err);
  }
});

export default router;
