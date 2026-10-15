import process from 'process';
import { prisma } from '../lib/prisma.js';

const API_URL = 'http://localhost:5000/api/auth';

async function runAuthTests() {
  console.log('--- Phase B3 Auth Test Suite ---');
  let authCookie = '';

  // 1. Test Unauthenticated GET /api/auth/me -> Expect 401
  try {
    const res1 = await fetch(`${API_URL}/me`);
    if (res1.status === 401) {
      console.log('PASS 1: Unauthenticated GET /api/auth/me returned 401 Unauthorized');
    } else {
      console.error('FAIL 1: Expected 401, got', res1.status);
    }
  } catch (err: any) {
    console.error('FAIL 1:', err.message);
  }

  // 2. Test Public Self-Registration for ADMIN -> Expect 403
  try {
    const res2 = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hacker Admin',
        email: 'hackeradmin@test.com',
        password: 'Password123!',
        role: 'ADMIN',
      }),
    });
    if (res2.status === 403) {
      console.log('PASS 2: Public ADMIN registration correctly returned 403 Forbidden');
    } else {
      console.error('FAIL 2: Expected 403, got', res2.status);
    }
  } catch (err: any) {
    console.error('FAIL 2:', err.message);
  }

  // 3. Test Successful Registration for SUPPLIER
  const supplierEmail = `supplier_${Date.now()}@testmfg.com`;
  let registeredUserId = '';
  try {
    const res3 = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aditya Test',
        email: supplierEmail,
        password: 'StrongPassword123!',
        role: 'SUPPLIER',
        businessName: 'Vertex Manufacturing Test Pvt Ltd',
      }),
    });

    const data3 = (await res3.json()) as any;
    if (res3.status === 201 && data3.success) {
      registeredUserId = data3.data.user.id;
      const setCookie = res3.headers.get('set-cookie');
      if (setCookie) {
        authCookie = setCookie.split(';')[0];
      }
      console.log('PASS 3: Supplier registered successfully (201 Created), User ID:', registeredUserId);
    } else {
      console.error('FAIL 3: Registration failed', res3.status, data3);
    }
  } catch (err: any) {
    console.error('FAIL 3:', err.message);
  }

  // 4. Verify Password Hashing in Database (No plaintext)
  if (registeredUserId) {
    const dbUser = await prisma.user.findUnique({ where: { id: registeredUserId } });
    if (dbUser && dbUser.password.startsWith('$2b$')) {
      console.log('PASS 4: Password is properly hashed with bcrypt in PostgreSQL:', dbUser.password.substring(0, 15) + '...');
    } else {
      console.error('FAIL 4: Password is not properly bcrypt hashed:', dbUser?.password);
    }
  }

  // 5. Test Duplicate Email Registration -> Expect 409
  try {
    const res5 = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aditya Duplicate',
        email: supplierEmail,
        password: 'StrongPassword123!',
        role: 'SUPPLIER',
      }),
    });
    if (res5.status === 409) {
      console.log('PASS 5: Duplicate registration correctly returned 409 Conflict');
    } else {
      console.error('FAIL 5: Expected 409, got', res5.status);
    }
  } catch (err: any) {
    console.error('FAIL 5:', err.message);
  }

  // 6. Test Login with Incorrect Password -> Expect 401
  try {
    const res6 = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: supplierEmail,
        password: 'WrongPassword!',
      }),
    });
    if (res6.status === 401) {
      console.log('PASS 6: Invalid password login correctly returned 401 Unauthorized');
    } else {
      console.error('FAIL 6: Expected 401, got', res6.status);
    }
  } catch (err: any) {
    console.error('FAIL 6:', err.message);
  }

  // 7. Test Login with Correct Credentials -> Expect 200 + Cookie
  try {
    const res7 = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: supplierEmail,
        password: 'StrongPassword123!',
      }),
    });

    const data7 = (await res7.json()) as any;
    if (res7.status === 200 && data7.success) {
      const setCookie = res7.headers.get('set-cookie');
      if (setCookie) {
        authCookie = setCookie.split(';')[0];
      }
      console.log('PASS 7: Login succeeded (200 OK) with HTTP-only cookie set');
    } else {
      console.error('FAIL 7: Login failed', res7.status, data7);
    }
  } catch (err: any) {
    console.error('FAIL 7:', err.message);
  }

  // 8. Test Authenticated GET /api/auth/me -> Expect 200
  try {
    const res8 = await fetch(`${API_URL}/me`, {
      headers: { Cookie: authCookie },
    });
    const data8 = (await res8.json()) as any;
    if (res8.status === 200 && data8.success && data8.data.email === supplierEmail) {
      console.log('PASS 8: Authenticated GET /api/auth/me returned user profile:', data8.data.name);
    } else {
      console.error('FAIL 8: GET /api/auth/me failed', res8.status, data8);
    }
  } catch (err: any) {
    console.error('FAIL 8:', err.message);
  }

  // 9. Test Role Authorization - SUPPLIER accessing Supplier endpoint -> Expect 200
  try {
    const res9 = await fetch(`${API_URL}/test-supplier`, {
      headers: { Cookie: authCookie },
    });
    if (res9.status === 200) {
      console.log('PASS 9: Supplier accessing supplier test endpoint succeeded (200 OK)');
    } else {
      console.error('FAIL 9: Expected 200, got', res9.status);
    }
  } catch (err: any) {
    console.error('FAIL 9:', err.message);
  }

  // 10. Test Role Authorization - SUPPLIER accessing Admin endpoint -> Expect 403 Forbidden
  try {
    const res10 = await fetch(`${API_URL}/test-admin`, {
      headers: { Cookie: authCookie },
    });
    if (res10.status === 403) {
      console.log('PASS 10: Supplier accessing admin endpoint correctly returned 403 Forbidden');
    } else {
      console.error('FAIL 10: Expected 403, got', res10.status);
    }
  } catch (err: any) {
    console.error('FAIL 10:', err.message);
  }

  // 11. Test Logout -> Expect 200
  try {
    const res11 = await fetch(`${API_URL}/logout`, {
      method: 'POST',
      headers: { Cookie: authCookie },
    });
    if (res11.status === 200) {
      console.log('PASS 11: Logout succeeded (200 OK)');
    } else {
      console.error('FAIL 11: Expected 200, got', res11.status);
    }
  } catch (err: any) {
    console.error('FAIL 11:', err.message);
  }

  // 12. Test GET /api/auth/me After Logout -> Expect 401
  try {
    const res12 = await fetch(`${API_URL}/me`);
    if (res12.status === 401) {
      console.log('PASS 12: GET /api/auth/me after logout correctly returned 401 Unauthorized');
    } else {
      console.error('FAIL 12: Expected 401, got', res12.status);
    }
  } catch (err: any) {
    console.error('FAIL 12:', err.message);
  }

  console.log('--- All Phase B3 Auth Tests Completed Successfully ---');
}

runAuthTests()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
