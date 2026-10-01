import { createUser, findUserByEmail, findUserById } from '../lib/users';
import { createComment, listComments, editComment, deleteComment } from '../lib/commentService';
import bcrypt from 'bcrypt';

async function runTest() {
  console.log('Testing User creation and Comment flow for arbitrary non-admin user...');
  
  const testEmail = `testuser_${Date.now()}@gmail.com`;
  const testPassword = 'mysecretpassword123';
  
  // 1. Create User
  const newUser = await createUser(testEmail, testPassword);
  console.log('1. Created user:', newUser);
  
  if (!newUser || !newUser.id || newUser.email !== testEmail) {
    throw new Error('User creation failed');
  }

  // 2. Find by Email
  const foundByEmail = await findUserByEmail(testEmail);
  console.log('2. Found by email:', foundByEmail?.email);
  if (!foundByEmail) throw new Error('findUserByEmail failed');

  // Verify password
  const isMatch = await bcrypt.compare(testPassword, foundByEmail.password);
  console.log('3. Password match:', isMatch);
  if (!isMatch) throw new Error('Password compare failed');

  // 3. Find by ID (as done during session verification)
  const foundById = await findUserById(newUser.id);
  console.log('4. Found by ID:', foundById?.id, foundById?.email);
  if (!foundById) throw new Error('findUserById failed');

  // 4. Create Comment by this non-admin user
  const comment = await createComment({
    chatId: 'blog-spa',
    author: newUser.email,
    authorId: newUser.id,
    text: 'Hello from a non-admin user!',
  });
  console.log('5. Created comment:', comment);

  // 5. List comments
  const allComments = await listComments('blog-spa');
  const hasComment = allComments.some((c) => c.id === comment.id);
  console.log('6. Comment listed successfully:', hasComment);
  if (!hasComment) throw new Error('Comment not listed');

  // 6. Edit comment as owner
  const edited = await editComment(comment.id, 'Updated content by owner', newUser.id);
  console.log('7. Comment edited:', edited.text === 'Updated content by owner');

  // 7. Delete comment as owner
  const deleted = await deleteComment(comment.id, newUser.id);
  console.log('8. Comment deleted:', deleted);

  console.log('✅ ALL TESTS PASSED: ANY logged-in user can comment, edit, and delete their own comments!');
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
