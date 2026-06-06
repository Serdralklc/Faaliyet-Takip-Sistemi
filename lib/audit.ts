import { prisma } from "./prisma";

interface AuditParams {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: object;
  newValue?: object;
  ipAddress?: string;
  description?: string;
}

export async function createAuditLog(params: AuditParams) {
  return prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      oldValue: params.oldValue ?? undefined,
      newValue: params.newValue ?? undefined,
      ipAddress: params.ipAddress,
      description: params.description,
    },
  });
}

export const ACTIONS = {
  USER_CREATED: "KULLANICI_OLUSTURULDU",
  USER_INVITED: "KULLANICI_DAVET_EDILDI",
  USER_APPROVED: "KULLANICI_ONAYLANDI",
  USER_REJECTED: "KULLANICI_REDDEDILDI",
  PASSWORD_SET: "SIFRE_OLUSTURULDU",
  ROLE_CHANGED: "ROL_DEGISTIRILDI",
  IL_ASSIGNED: "IL_ATANDI",
  BOLGE_ASSIGNED: "BOLGE_ATANDI",
  TASK_TRANSFERRED: "GOREV_DEVRI_YAPILDI",
  USER_DEACTIVATED: "KULLANICI_PASIFLESTIRILDI",
  ACTIVITY_CREATED: "FAALIYET_OLUSTURULDU",
  ACTIVITY_UPDATED: "FAALIYET_GUNCELLENDI",
  ACTIVITY_DELETED: "FAALIYET_SILINDI",
};
