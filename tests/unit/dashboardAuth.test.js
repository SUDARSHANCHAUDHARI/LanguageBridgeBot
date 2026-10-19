/**
 * Dashboard auth and error responses
 */

const express = require('express');
const request = require('supertest');

jest.mock('../../src/services/databaseService', () => ({
  getAllActiveGroups: jest.fn().mockRejectedValue(new Error('db host internal-host unreachable')),
  getGroupStats: jest.fn(),
}));

const { safeEqual } = require('../../src/middleware/security');
const dashboardRouter = require('../../src/dashboard/index');

const app = express();
app.use('/dashboard', dashboardRouter);

describe('safeEqual', () => {
  it('matches equal strings only', () => {
    expect(safeEqual('secret', 'secret')).toBe(true);
    expect(safeEqual('secret', 'secreT')).toBe(false);
  });

  it('returns false on length mismatch or non-strings instead of throwing', () => {
    expect(safeEqual('short', 'much-longer-secret')).toBe(false);
    expect(safeEqual(undefined, 'secret')).toBe(false);
    expect(safeEqual(['secret'], 'secret')).toBe(false);
  });
});

describe('dashboard', () => {
  it('rejects a wrong or missing token', async () => {
    expect((await request(app).get('/dashboard/groups')).status).toBe(401);
    expect((await request(app).get('/dashboard/groups').set('Authorization', 'x')).status).toBe(401);
  });

  it('returns a generic 500 message and logs the real error', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const response = await request(app)
      .get('/dashboard/groups')
      .set('Authorization', 'test_dashboard_secret');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error' });
    expect(JSON.stringify(spy.mock.calls.map((call) => String(call[1])))).toContain('internal-host');
    spy.mockRestore();
  });
});
