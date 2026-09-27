import { db } from '../../config/database.js';

export class AuditService {
  /**
   * Records an audit log entry
   */
  static async record(entry, clientOrTx = db) {
    const {
      userId = null,
      action,
      entityType,
      entityId = null,
      metadata = null,
      ipAddress = null,
      userAgent = null,
    } = entry;

    return clientOrTx.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        metadata,
        ipAddress,
        userAgent,
      },
    });
  }

  static async getLogs(filters = {}) {
    const { userId, action, take = 100 } = filters;
    return await db.auditLog.findMany({
      where: {
        ...(userId ? { userId } : {}),
        ...(action ? { action } : {}),
      },
      take,
    });
  }
}

export default AuditService;
