export type Priority = 'low' | 'medium' | 'high';

export interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
}

// Memory storage for Workshop (Ready to migrate to DB in Week 9)
const todos: Todo[] = [
  {
    id: 'todo-1',
    title: 'ทำแลป Week 8 Next.js API Routes',
    description: 'เรียนรู้เรื่อง Controller, Service, Model และ Error Handling',
    completed: true,
    priority: 'high',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'todo-2',
    title: 'เตรียมตัวสอบกลางภาค',
    description: 'ทบทวนสถาปัตยกรรม Server-side และ RESTful API',
    completed: false,
    priority: 'medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function addTodo(data: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date().toISOString();
  const item: Todo = {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    ...data,
  };
  todos.push(item);
  return item;
}

export function getTodos() {
  return todos;
}

export function findTodoById(id: string) {
  return todos.find((t) => t.id === id) ?? null;
}

export function updateTodo(id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) {
  const index = todos.findIndex((t) => t.id === id);
  if (index === -1) return null;
  todos[index] = {
    ...todos[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  return todos[index];
}

export function deleteTodo(id: string) {
  const index = todos.findIndex((t) => t.id === id);
  if (index === -1) return false;
  todos.splice(index, 1);
  return true;
}
