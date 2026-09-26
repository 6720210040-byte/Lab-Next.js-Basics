import * as MessageModel from './messages';
import { NotFoundError, ValidationError } from './errors';

export function createMessage(data: { name: string; email: string; message: string }) {
  if (!data.name || !data.email || !data.message) {
    throw new ValidationError('ข้อมูลไม่ครบ');
  }
  return MessageModel.addMessage(data);
}

export function listMessages() {
  return MessageModel.getMessages();
}

export function getMessageById(id: string) {
  const message = MessageModel.getMessages().find((m) => m.id === id);
  if (!message) {
    throw new NotFoundError('ไม่พบข้อความนี้');
  }
  return message;
}

export function editMessage(id: string, updates: Partial<{ name: string; email: string; message: string }>) {
  if (updates.message !== undefined && updates.message.trim() === '') {
    throw new ValidationError('ข้อความห้ามเป็นค่าว่าง');
  }
  const updated = MessageModel.updateMessage(id, updates);
  if (!updated) {
    throw new NotFoundError('ไม่พบข้อความนี้');
  }
  return updated;
}

export function removeMessage(id: string) {
  const deleted = MessageModel.deleteMessage(id);
  if (!deleted) {
    throw new NotFoundError('ไม่พบข้อความนี้');
  }
  return true;
}
