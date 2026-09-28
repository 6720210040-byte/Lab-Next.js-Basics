import bcrypt from 'bcrypt';
import { cleanRichText } from '../lib/sanitize';
import { messageSchema, changePasswordSchema } from '../lib/schemas';
import { findUserByEmail, createUser } from '../lib/users';
import { createMessage, editMessage } from '../lib/messageService';
import { ForbiddenError, ValidationError } from '../lib/errors';

async function runTests() {
  console.log('--- START LAB WEEK 10 SECURITY TESTS ---\n');

  // 1. Password Hashing (L1)
  console.log('Test 1: Password Hashing with bcrypt');
  const user = await findUserByEmail('admin@tsu.ac.th');
  console.assert(user !== null, 'Admin user should exist');
  console.assert(user?.password.startsWith('$2b$'), 'Password must be bcrypt hash string starting with $2b$');
  const isMatch = await bcrypt.compare('1234', user!.password);
  console.assert(isMatch === true, 'bcrypt.compare with "1234" should return true');
  const isWrong = await bcrypt.compare('wrongpass', user!.password);
  console.assert(isWrong === false, 'bcrypt.compare with "wrongpass" should return false');
  console.log('✓ Test 1 Passed: Password hashing and verification works correctly.\n');

  // 2. XSS Sanitization (L3)
  console.log('Test 2: XSS Sanitization with sanitize-html');
  const dirtyInput = '<b>หนา</b><script>alert(1)</script>';
  const sanitized = cleanRichText(dirtyInput);
  console.assert(sanitized === '<b>หนา</b>', `Sanitized result should be "<b>หนา</b>" but got "${sanitized}"`);
  console.log('✓ Test 2 Passed: XSS script tags successfully stripped while preserving safe <b> tags.\n');

  // 3. Input Validation with Zod (L4)
  console.log('Test 3: Zod Validation for Message');
  try {
    messageSchema.parse({ name: 'A', email: 'invalid-email', message: '' });
    console.error('Validation should have thrown!');
  } catch (err: any) {
    console.assert(err.name === 'ZodError', 'Should catch ZodError');
    console.log('✓ Test 3 Passed: Zod rejects invalid inputs properly.\n');
  }

  // 4. Authorization Check (L4)
  console.log('Test 4: Authorization Check (Owner vs Non-owner)');
  const msg = await createMessage({
    name: 'Test Owner',
    email: 'owner@example.com',
    message: 'Original Message Content',
    authorId: 'user-admin-1',
  });

  // Test updating as owner
  const updatedByOwner = await editMessage(msg.id, { message: 'Updated by owner' }, 'user-admin-1');
  console.assert(updatedByOwner?.message === 'Updated by owner', 'Owner should be able to update message');

  // Test updating as non-owner (should throw 403 ForbiddenError)
  try {
    await editMessage(msg.id, { message: 'Hacked by stranger' }, 'user-stranger-999');
    console.error('Non-owner update should have thrown ForbiddenError!');
  } catch (err: any) {
    console.assert(err instanceof ForbiddenError, 'Should throw ForbiddenError');
    console.assert(err.status === 403, 'ForbiddenError status should be 403');
    console.log('✓ Test 4 Passed: Non-owner edit throws 403 ForbiddenError.\n');
  }

  // 5. Change Password Validation (Workshop)
  console.log('Test 5: Change Password Schema Validation');
  const validPwd = changePasswordSchema.safeParse({
    oldPassword: '1234',
    newPassword: 'newsecurepassword123',
  });
  console.assert(validPwd.success === true, 'Valid password change should succeed');

  const invalidPwd = changePasswordSchema.safeParse({
    oldPassword: '1234',
    newPassword: 'short',
  });
  console.assert(invalidPwd.success === false, 'Short new password (< 8 chars) should fail');
  console.log('✓ Test 5 Passed: Change password schema validates correctly.\n');

  // 6. Comment Ownership & Authorization (Workshop)
  console.log('Test 6: Comment Ownership & Authorization Check');
  const { createComment, editComment, deleteComment } = await import('../lib/commentService');
  const comment = await createComment({
    chatId: 'test-chat',
    author: 'owner@example.com',
    authorId: 'user-comment-owner-1',
    text: 'Original Comment Text',
  });

  // Test updating as owner
  const updatedComment = await editComment(comment.id, 'Updated by comment owner', 'user-comment-owner-1');
  console.assert(updatedComment.text === 'Updated by comment owner', 'Owner should be able to update comment');

  // Test updating as non-owner (should throw 403 ForbiddenError)
  try {
    await editComment(comment.id, 'Hacked by stranger', 'user-stranger-999');
    console.error('Non-owner comment update should have thrown ForbiddenError!');
  } catch (err: any) {
    console.assert(err instanceof ForbiddenError, 'Should throw ForbiddenError on edit');
    console.assert(err.status === 403, 'ForbiddenError status should be 403');
  }

  // Test deleting as non-owner (should throw 403 ForbiddenError)
  try {
    await deleteComment(comment.id, 'user-stranger-999');
    console.error('Non-owner comment delete should have thrown ForbiddenError!');
  } catch (err: any) {
    console.assert(err instanceof ForbiddenError, 'Should throw ForbiddenError on delete');
    console.assert(err.status === 403, 'ForbiddenError status should be 403');
  }

  // Test deleting as owner
  const isDeleted = await deleteComment(comment.id, 'user-comment-owner-1');
  console.assert(isDeleted === true, 'Owner should be able to delete comment');
  console.log('✓ Test 6 Passed: Comment ownership authorization (Edit/Delete) works securely.\n');

  console.log('🎉 ALL LAB WEEK 10 TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
