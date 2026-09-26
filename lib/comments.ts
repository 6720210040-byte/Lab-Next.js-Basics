export interface Comment {
  id: string;
  chatId: string;
  author: string;
  content: string;
  createdAt: string;
}

const comments: Comment[] = [];

export function addComment(data: Omit<Comment, 'id' | 'createdAt'>) {
  const comment: Comment = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...data,
  };

  comments.push(comment);
  return comment;
}

export function getComments(chatId?: string) {
  return chatId ? comments.filter((comment) => comment.chatId === chatId) : comments;
}
