import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';

describe('Institutions Module', () => {
  let app: FastifyInstance;
  let adminToken: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Get admin token for authenticated requests
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'admin@senum.sn',
        password: 'Admin@2026',
      },
    });

    const { token } = JSON.parse(loginResponse.payload);
    adminToken = token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/institutions', () => {
    it('should return 401 without authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/institutions',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return list of institutions with valid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/institutions',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data).toBeDefined();
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/institutions?page=1&limit=5',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.pagination).toBeDefined();
      expect(body.pagination.page).toBe(1);
      expect(body.pagination.limit).toBe(5);
    });
  });

  describe('GET /api/institutions/:id', () => {
    it('should return 404 for non-existent institution', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/institutions/00000000-0000-0000-0000-000000000000',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /api/institutions', () => {
    it('should return 400 for missing required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/institutions',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        payload: {
          nom: 'Test Institution',
          // Missing code, ministere, responsable fields
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
