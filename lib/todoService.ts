import * as TodoModel from './todos';
import { Priority, Todo } from './todos';
import { NotFoundError, ValidationError } from './errors';

const VALID_PRIORITIES: Priority[] = ['low', 'medium', 'high'];

export function createTodo(data: {
  title?: string;
  description?: string;
  priority?: Priority;
}) {
  if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
    throw new ValidationError('กรุณาระบุชื่อรายการ (title ห้ามเป็นค่าว่าง)');
  }

  const priority = data.priority ?? 'medium';
  if (!VALID_PRIORITIES.includes(priority)) {
    throw new ValidationError('priority ต้องเป็น low, medium หรือ high เท่านั้น');
  }

  return TodoModel.addTodo({
    title: data.title.trim(),
    description: data.description?.trim() ?? '',
    completed: false,
    priority,
  });
}

export function listTodos(filter?: {
  search?: string;
  completed?: boolean;
  priority?: Priority;
}) {
  let items = TodoModel.getTodos();

  if (filter?.search) {
    const q = filter.search.toLowerCase();
    items = items.filter(
      (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
    );
  }

  if (filter?.completed !== undefined) {
    items = items.filter((t) => t.completed === filter.completed);
  }

  if (filter?.priority) {
    items = items.filter((t) => t.priority === filter.priority);
  }

  return items;
}

export function getTodoById(id: string) {
  const item = TodoModel.findTodoById(id);
  if (!item) {
    throw new NotFoundError('ไม่พบรายการงานนี้');
  }
  return item;
}

export function editTodo(
  id: string,
  updates: Partial<{
    title: string;
    description: string;
    completed: boolean;
    priority: Priority;
  }>
) {
  // Validate title if present
  if (updates.title !== undefined) {
    if (typeof updates.title !== 'string' || updates.title.trim() === '') {
      throw new ValidationError('ชื่อรายการห้ามเป็นค่าว่าง');
    }
  }

  // Validate priority if present
  if (updates.priority !== undefined) {
    if (!VALID_PRIORITIES.includes(updates.priority)) {
      throw new ValidationError('priority ต้องเป็น low, medium หรือ high เท่านั้น');
    }
  }

  // Validate completed if present
  if (updates.completed !== undefined && typeof updates.completed !== 'boolean') {
    throw new ValidationError('completed ต้องเป็น true หรือ false');
  }

  const updated = TodoModel.updateTodo(id, updates);
  if (!updated) {
    throw new NotFoundError('ไม่พบรายการงานนี้');
  }
  return updated;
}

export function removeTodo(id: string) {
  const deleted = TodoModel.deleteTodo(id);
  if (!deleted) {
    throw new NotFoundError('ไม่พบรายการงานนี้');
  }
  return true;
}
