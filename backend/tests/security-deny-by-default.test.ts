import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';

/**
 * Tests de non-régression — confinement des rôles (deny-by-default).
 * Ces tests VALIDENT la remédiation du pentest PINS-DPI-INTEROP-2026.
 * Ils échouent si une route admin répond autre chose que 403 à un non-admin.
 */

const JWT_SECRET = 'cf07a0752ff3f5e4d96ef6ef1c310d148225439a22422389d7748444df5d3606967f520271597f1b7b07ad3c4ed56c07fb81403ba0e8d8b201b72622b9125061';

function makeToken(role: string, institutionId?: string): string {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { id: 'test-user-id', email: `test-${role}@test.sn`, role, institutionId: institutionId || '0b02dede-cfe9-41e1-bc0e-eb48bee5db1b' },
    JWT_SECRET, { expiresIn: '1h' },
  );
}

describe('Security — deny-by-default RBAC', () => {
  let app: FastifyInstance;
  let adminToken: string;
  let institutionToken: string;
  let pendingToken: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    adminToken = makeToken('ADMIN');
    institutionToken = makeToken('INSTITUTION');
    pendingToken = makeToken('PENDING');
  }, 15000);

  afterAll(async () => {
    await app.close();
  });

  // =========================================================================
  // 1. Register — fermé aux anonymes et non-admin
  // =========================================================================
  describe('POST /api/auth/register — ADMIN only', () => {
    it('rejeté sans token → 401', async () => {
      const res = await app.inject({
        method: 'POST', url: '/api/auth/register',
        payload: { email: 'pentest@test.sn', password: 'Test1234!' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('rejeté avec INSTITUTION → 403', async () => {
      const res = await app.inject({
        method: 'POST', url: '/api/auth/register',
        headers: { Authorization: `Bearer ${institutionToken}` },
        payload: { email: 'pentest@test.sn', password: 'Test1234!' },
      });
      expect(res.statusCode).toBe(403);
    });

    it('rejeté avec PENDING → 403', async () => {
      const res = await app.inject({
        method: 'POST', url: '/api/auth/register',
        headers: { Authorization: `Bearer ${pendingToken}` },
        payload: { email: 'pentest@test.sn', password: 'Test1234!' },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // =========================================================================
  // 2. Routes admin strictes — refusées aux non-admin
  // =========================================================================
  const STRICT_ADMIN_ROUTES = [
    // Users
    { method: 'GET', url: '/api/users' },
    // Audit
    { method: 'GET', url: '/api/audit/logs' },
    { method: 'GET', url: '/api/audit/stats' },
    // Pilotage
    { method: 'GET', url: '/api/du/arbitrage' },
    // Imports
    { method: 'POST', url: '/api/import/questionnaire' },
    // Qualifications
    { method: 'GET', url: '/api/qualification' },
    // PTF admin
    { method: 'GET', url: '/api/admin/ptf' },
    // Organisations
    { method: 'GET', url: '/api/admin/organisations' },
    // Recensement back-office (ADMIN only)
    { method: 'GET', url: '/api/admin/recensement' },
    { method: 'GET', url: '/api/admin/recensement/stats' },
    { method: 'GET', url: '/api/admin/recensement/00000000-0000-0000-0000-000000000000' },
    { method: 'GET', url: '/api/admin/recensement/export/csv' },
    { method: 'PATCH', url: '/api/admin/recensement/00000000-0000-0000-0000-000000000000/qualification' },
  ];

  describe('Routes ADMIN strictes — INSTITUTION → 403', () => {
    for (const { method, url } of STRICT_ADMIN_ROUTES) {
      it(`${method} ${url}`, async () => {
        const res = await app.inject({
          method: method as any, url,
          headers: { Authorization: `Bearer ${institutionToken}` },
        });
        expect(res.statusCode).toBe(403);
      });
    }
  });

  describe('Routes ADMIN strictes — PENDING → 403', () => {
    for (const { method, url } of STRICT_ADMIN_ROUTES.slice(0, 4)) {
      it(`${method} ${url}`, async () => {
        const res = await app.inject({
          method: method as any, url,
          headers: { Authorization: `Bearer ${pendingToken}` },
        });
        expect(res.statusCode).toBe(403);
      });
    }
  });

  describe('Routes ADMIN strictes — ADMIN → pas 403', () => {
    for (const { method, url } of STRICT_ADMIN_ROUTES.slice(0, 3)) {
      it(`${method} ${url}`, async () => {
        const res = await app.inject({
          method: method as any, url,
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        expect(res.statusCode).not.toBe(403);
      });
    }
  });

  // =========================================================================
  // 3. Routes authentifiées — INSTITUTION peut accéder
  // =========================================================================
  const AUTH_ROUTES = [
    { method: 'GET', url: '/api/institutions' },
    { method: 'GET', url: '/api/submissions' },
    { method: 'GET', url: '/api/me/use-cases/incoming' },
    { method: 'GET', url: '/api/catalogue/propositions' },
    { method: 'GET', url: '/api/new-deal/programmes' },
  ];

  describe('Routes authentifiées — INSTITUTION → 200', () => {
    for (const { method, url } of AUTH_ROUTES) {
      it(`${method} ${url}`, async () => {
        const res = await app.inject({
          method: method as any, url,
          headers: { Authorization: `Bearer ${institutionToken}` },
        });
        expect(res.statusCode).toBe(200);
      });
    }
  });

  describe('Routes authentifiées — PENDING → 403', () => {
    for (const { method, url } of AUTH_ROUTES.slice(0, 3)) {
      it(`${method} ${url}`, async () => {
        const res = await app.inject({
          method: method as any, url,
          headers: { Authorization: `Bearer ${pendingToken}` },
        });
        expect(res.statusCode).toBe(403);
      });
    }
  });

  // =========================================================================
  // 5. Routes publiques — accessibles sans token
  // =========================================================================
  describe('Routes publiques — sans token → pas 401/403', () => {
    it('POST /api/public/recensement (400 validation, pas 401)', async () => {
      const res = await app.inject({
        method: 'POST', url: '/api/public/recensement',
        payload: { ministereTutelle: 'Primature', structureNom: 'X', typeStructure: 'DIRECTION', contactNom: 'X', contactFonction: 'X', contactEmail: 'x@x.sn', intitule: 'X', description: 'X', natures: ['Autre'], statutAvancement: 'IDEE_CONCEPTION', budgetFourchette: 'NON_CHIFFRE', sourceFinancement: 'BUDGET_NATIONAL', website: '' },
      });
      expect([200, 201, 400]).toContain(res.statusCode);
    });

    it('POST /api/auth/login → 400/401 (validation, pas 403)', async () => {
      const res = await app.inject({
        method: 'POST', url: '/api/auth/login',
        payload: { email: 'x@x.sn', password: 'x' },
      });
      expect([400, 401]).toContain(res.statusCode);
    });
  });

  // =========================================================================
  // 6. Sans token — routes protégées → 401
  // =========================================================================
  describe('Sans token — routes protégées → 401', () => {
    it('GET /api/users → 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/users' });
      expect(res.statusCode).toBe(401);
    });
    it('GET /api/admin/recensement → 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/admin/recensement' });
      expect(res.statusCode).toBe(401);
    });
    it('GET /api/institutions → 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/institutions' });
      expect(res.statusCode).toBe(401);
    });
  });
});
