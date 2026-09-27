import { db } from '../../config/database.js';
import { emitUserNotification } from '../../socket/socket.server.js';

export class NotificationService {
  /**
   * Creates a notification in the database and broadcasts via Socket.IO
   */
  static async send(notificationData, clientOrTx = db, { emit = true } = {}) {
    const { userId, type = 'STATUS_UPDATE', title, message } = notificationData;
    const record = await clientOrTx.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        read: false,
      },
    });

    if (emit) emitUserNotification(userId, record);
    return record;
  }

  static async getUserNotifications(userId) {
    return await db.notification.findMany({
      where: { userId },
    });
  }

  static async markAsRead(notificationId, userId) {
    const notification = await db.notification.findUnique({ where: { id: notificationId } });
    if (!notification) return null;
    if (notification.userId !== userId) {
      const error = new Error('You can only update your own notifications.');
      error.status = 403;
      throw error;
    }
    return await db.notification.update({
      where: { id: notificationId },
      data: { read: true, readAt: new Date() },
    });
  }

  static async markAllAsRead(userId) {
    await db.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return await this.getUserNotifications(userId);
  }
}

export default NotificationService;
