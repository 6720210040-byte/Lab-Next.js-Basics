import { POST as registerHandler } from '../app/api/register/route';
import { POST as loginHandler } from '../app/api/login/route';
import { POST as logoutHandler } from '../app/api/logout/route';
import { GET as authMeHandler } from '../app/api/auth/me/route';
import { GET as aggregateHandler } from '../app/api/aggregate/route';
import { GET as commentsGetHandler, POST as commentsPostHandler } from '../app/api/comments/route';
import { PATCH as commentsPatchHandler, DELETE as commentsDeleteHandler } from '../app/api/comments/[id]/route';

function getCookieFromHeaders(res: Response): string {
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return '';
  const match = setCookie.match(/session=([^;]+)/);
  return match ? `session=${match[1]}` : '';
}

async function runE2EVerification() {
  console.log('====================================================');
  console.log('🚀 STARTING FULL SYSTEM E2E VERIFICATION SUITE');
  console.log('====================================================\n');

  const randomSuffix = Date.now();
  const userA_Email = `user_a_${randomSuffix}@gmail.com`;
  const userA_Password = 'UserAPassword@123';

  const userB_Email = `user_b_${randomSuffix}@gmail.com`;
  const userB_Password = 'UserBPassword@456';

  // ----------------------------------------------------
  // 1. SIGN UP (REGISTER) SYSTEM
  // ----------------------------------------------------
  console.log('🔹 1. Testing Registration (Sign Up)...');
  
  // 1.1 Register User A
  const regReqA = new Request('http://localhost:3000/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userA_Email, password: userA_Password }),
  });
  const dummyCtx = { params: Promise.resolve({}) as Promise<any> };
  const regResA = await registerHandler(regReqA, dummyCtx);
  const regDataA = await regResA.json();
  console.log('   ✓ User A registered:', regResA.status, regDataA.message || regDataA);
  if (regResA.status !== 201) throw new Error('Registration failed for User A');

  // 1.2 Duplicate Email Detection
  const dupReq = new Request('http://localhost:3000/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userA_Email, password: 'anypassword' }),
  });
  const dupRes = await registerHandler(dupReq, dummyCtx);
  const dupData = await dupRes.json();
  console.log('   ✓ Duplicate email correctly rejected:', dupRes.status, dupData.error);
  if (dupRes.status === 200 || dupRes.status === 201) throw new Error('Duplicate registration should have been rejected');

  // 1.3 Register User B
  const regReqB = new Request('http://localhost:3000/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userB_Email, password: userB_Password }),
  });
  const regResB = await registerHandler(regReqB, dummyCtx);
  if (regResB.status !== 201) throw new Error('Registration failed for User B');
  console.log('   ✓ User B registered successfully');

  // ----------------------------------------------------
  // 2. SIGN IN (LOG IN) SYSTEM
  // ----------------------------------------------------
  console.log('\n🔹 2. Testing Login (Sign In) & Authentication...');

  // 2.1 Login with wrong password
  const badLoginReq = new Request('http://localhost:3000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userA_Email, password: 'wrongpassword' }),
  });
  const badLoginRes = await loginHandler(badLoginReq);
  console.log('   ✓ Wrong password login rejected:', badLoginRes.status);
  if (badLoginRes.status !== 401) throw new Error('Invalid login should return 401');

  // 2.2 Valid Login User A
  const loginReqA = new Request('http://localhost:3000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userA_Email, password: userA_Password }),
  });
  const loginResA = await loginHandler(loginReqA);
  const userACookie = getCookieFromHeaders(loginResA);
  const loginDataA = await loginResA.json();
  console.log('   ✓ User A login successful:', loginDataA.ok, 'Session Cookie:', userACookie);
  if (!userACookie) throw new Error('Session cookie not issued on login');

  // 2.3 Valid Login User B
  const loginReqB = new Request('http://localhost:3000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userB_Email, password: userB_Password }),
  });
  const loginResB = await loginHandler(loginReqB);
  const userBCookie = getCookieFromHeaders(loginResB);
  console.log('   ✓ User B login successful, Session Cookie issued');

  // 2.4 Verify /api/auth/me for User A
  const meReqA = new Request('http://localhost:3000/api/auth/me', {
    headers: { cookie: userACookie },
  });
  const meResA = await authMeHandler(meReqA);
  const meDataA = await meResA.json();
  console.log('   ✓ Auth me check User A:', meDataA);
  if (!meDataA.authenticated || meDataA.user?.email !== userA_Email) {
    throw new Error('User A session verification failed');
  }

  // ----------------------------------------------------
  // 3. BLOG AGGREGATOR SYSTEM
  // ----------------------------------------------------
  console.log('\n🔹 3. Testing Blog Aggregator (/api/aggregate)...');

  // 3.1 Products source
  const aggProductsReq = new Request('http://localhost:3000/api/aggregate?source=products');
  const aggProductsRes = await aggregateHandler(aggProductsReq);
  const aggProductsData = await aggProductsRes.json();
  console.log(`   ✓ Aggregator (Products): Fetched ${aggProductsData.external?.length || 0} items`);
  if (!Array.isArray(aggProductsData.external) || aggProductsData.external.length === 0) {
    throw new Error('Aggregator products source returned empty');
  }

  // 3.2 News source
  const aggNewsReq = new Request('http://localhost:3000/api/aggregate?source=news');
  const aggNewsRes = await aggregateHandler(aggNewsReq);
  const aggNewsData = await aggNewsRes.json();
  console.log(`   ✓ Aggregator (News): Fetched ${aggNewsData.external?.length || 0} items`);
  if (!Array.isArray(aggNewsData.external) || aggNewsData.external.length === 0) {
    throw new Error('Aggregator news source returned empty');
  }

  // ----------------------------------------------------
  // 4. COMMENTS SYSTEM & SECURITY
  // ----------------------------------------------------
  console.log('\n🔹 4. Testing Comments System & Security Rules...');

  // 4.1 Guest (Unauthenticated) posting comment -> must fail with 401/403
  const guestPostReq = new Request('http://localhost:3000/api/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId: 'blog-spa', text: 'Guest comment attempt' }),
  });
  const guestPostRes = await commentsPostHandler(guestPostReq, dummyCtx);
  console.log('   ✓ Guest commenting blocked:', guestPostRes.status);
  if (guestPostRes.status !== 401 && guestPostRes.status !== 403) {
    throw new Error('Unauthenticated comment creation should be rejected');
  }

  // 4.2 User A posting a comment with XSS attempt (Security check)
  const userAPostReq = new Request('http://localhost:3000/api/comments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: userACookie,
    },
    body: JSON.stringify({
      chatId: 'blog-spa',
      text: 'Great post! <script>alert("XSS")</script><b>Bold Text</b>',
    }),
  });
  const userAPostRes = await commentsPostHandler(userAPostReq, dummyCtx);
  const userAPostData = await userAPostRes.json();
  console.log('   ✓ User A posted comment successfully:', userAPostRes.status, userAPostData.comment?.id);
  if (userAPostRes.status !== 201 || !userAPostData.comment) {
    throw new Error('User A comment creation failed');
  }
  const commentId = userAPostData.comment.id;
  // Verify XSS script was stripped
  if (userAPostData.comment.text.includes('<script>')) {
    throw new Error('XSS Sanitization failed: <script> was not stripped');
  }
  console.log('   ✓ XSS script tag safely sanitized, content preserved:', userAPostData.comment.text);

  // 4.3 List comments for blog-spa
  const listReq = new Request('http://localhost:3000/api/comments?chatId=blog-spa', {
    headers: { cookie: userACookie },
  });
  const listRes = await commentsGetHandler(listReq, dummyCtx);
  const listData = await listRes.json();
  console.log('   ✓ List comments returned:', listData.comments.length, 'items, authenticated:', listData.authenticated);
  if (!listData.authenticated || !listData.comments.some((c: any) => c.id === commentId)) {
    throw new Error('Comment listing or auth status mismatch');
  }

  // 4.4 User B attempts to edit User A's comment (Authorization check -> must fail)
  const userBHackEditReq = new Request(`http://localhost:3000/api/comments/${commentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      cookie: userBCookie,
    },
    body: JSON.stringify({ text: 'Hacked by User B' }),
  });
  const userBHackEditRes = await commentsPatchHandler(userBHackEditReq, { params: Promise.resolve({ id: commentId }) });
  console.log('   ✓ Unauthorized comment edit by User B blocked:', userBHackEditRes.status);
  if (userBHackEditRes.status !== 403) {
    throw new Error('User B should not be permitted to edit User A comment');
  }

  // 4.5 User A edits their own comment (Owner permission -> must succeed)
  const userAEditReq = new Request(`http://localhost:3000/api/comments/${commentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      cookie: userACookie,
    },
    body: JSON.stringify({ text: 'Updated comment content by User A' }),
  });
  const userAEditRes = await commentsPatchHandler(userAEditReq, { params: Promise.resolve({ id: commentId }) });
  const userAEditData = await userAEditRes.json();
  console.log('   ✓ Owner (User A) edited comment successfully:', userAEditData.comment?.text);
  if (userAEditRes.status !== 200 || userAEditData.comment?.text !== 'Updated comment content by User A') {
    throw new Error('Owner comment edit failed');
  }

  // 4.6 User B attempts to delete User A's comment (Authorization check -> must fail)
  const userBHackDeleteReq = new Request(`http://localhost:3000/api/comments/${commentId}`, {
    method: 'DELETE',
    headers: { cookie: userBCookie },
  });
  const userBHackDeleteRes = await commentsDeleteHandler(userBHackDeleteReq, { params: Promise.resolve({ id: commentId }) });
  console.log('   ✓ Unauthorized comment delete by User B blocked:', userBHackDeleteRes.status);
  if (userBHackDeleteRes.status !== 403) {
    throw new Error('User B should not be permitted to delete User A comment');
  }

  // 4.7 User A deletes their own comment (Owner permission -> must succeed)
  const userADeleteReq = new Request(`http://localhost:3000/api/comments/${commentId}`, {
    method: 'DELETE',
    headers: { cookie: userACookie },
  });
  const userADeleteRes = await commentsDeleteHandler(userADeleteReq, { params: Promise.resolve({ id: commentId }) });
  console.log('   ✓ Owner (User A) deleted comment successfully:', userADeleteRes.status);
  if (userADeleteRes.status !== 200) {
    throw new Error('Owner comment delete failed');
  }

  // ----------------------------------------------------
  // 5. LOGOUT SYSTEM
  // ----------------------------------------------------
  console.log('\n🔹 5. Testing Logout...');
  const logoutRes = await logoutHandler();
  console.log('   ✓ Logout response:', logoutRes.status, 'Set-Cookie header:', logoutRes.headers.get('set-cookie'));
  if (logoutRes.status !== 200) throw new Error('Logout failed');

  console.log('\n====================================================');
  console.log('🎉 ALL E2E TESTS PASSED 100% SUCCESSFULLY!');
  console.log('====================================================\n');
}

runE2EVerification().catch((err) => {
  console.error('\n❌ E2E VERIFICATION FAILED:', err);
  process.exit(1);
});
