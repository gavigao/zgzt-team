const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const http = require('node:http');
const { createRequire } = require('node:module');

const controllerFile = path.join(__dirname, '../src/controllers/adminController.js');
const routeFile = path.join(__dirname, '../src/routes/admin.js');
const backendRequire = createRequire(controllerFile);

function fixture(initial = []) {
  const rows = initial.map(row => ({ ...row }));
  const writes = [];
  const pool = {
    async query(sql, params) {
      if (sql === 'INSERT INTO seasons (name) VALUES (?)') {
        if (rows.some(row => row.name === params[0])) {
          throw Object.assign(new Error('Duplicate entry'), { code: 'ER_DUP_ENTRY' });
        }
        const row = { id: rows.length + 1, name: params[0], created_at: '2026-10-27 12:00:00' };
        rows.push(row);
        writes.push({ sql, params });
        return [{ insertId: row.id }];
      }
      if (sql === 'SELECT * FROM seasons WHERE id = ?') {
        return [rows.filter(row => row.id === params[0])];
      }
      throw new Error('Unexpected query: ' + sql);
    },
  };
  return { rows, writes, pool };
}

function controllerWithPool(pool) {
  const controllers = {};
  vm.runInNewContext(fs.readFileSync(controllerFile, 'utf8'), {
    exports: controllers,
    require(name) {
      if (name === '../db/index') return pool;
      if (name === 'bcrypt') return {};
      if (name === '../config/auth') return { BCRYPT_ROUNDS: 12 };
      return backendRequire(name);
    },
  });
  return controllers;
}

async function invoke(controller, body) {
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
  };
  await controller({ body }, res, error => { res.error = error; });
  return res;
}

test('creates the new season using a parameterized insert and returns its real id', async () => {
  const db = fixture([{ id: 1, name: '2025-2026' }]);
  const res = await invoke(controllerWithPool(db.pool).createSeason, { name: '2026-2027' });
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.data.id, 2);
  assert.equal(res.body.data.name, '2026-2027');
  assert.equal(db.rows[0].name, '2025-2026');
  assert.deepEqual(Array.from(db.writes[0].params), ['2026-2027']);
});

test('normalizes surrounding spaces and common dash variants', async () => {
  for (const name of [' 2026-2027 ', '2026 – 2027', '2026—2027', '2026 - 2027']) {
    const db = fixture();
    const res = await invoke(controllerWithPool(db.pool).createSeason, { name });
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.data.name, '2026-2027');
  }
});

test('rejects malformed, nonconsecutive or unsafe names without database writes', async () => {
  for (const name of [undefined, null, '', ' ', 2026, {}, [], '26-27', '2026', '2026/2027', '2026-2026', '2027-2026', '2026-2028', '0000-0001', '9999-10000', "2026-2027'; DROP TABLE seasons;--"]) {
    const db = fixture();
    const res = await invoke(controllerWithPool(db.pool).createSeason, { name });
    assert.equal(res.statusCode, 400, String(name));
    assert.equal(db.writes.length, 0);
  }
  const db = fixture();
  assert.equal((await invoke(controllerWithPool(db.pool).createSeason)).statusCode, 400);
});

test('supports future and historical seasons without hardcoding the current year', async () => {
  for (const name of ['1000-1001', '2018-2019', '2040-2041', '9998-9999']) {
    const db = fixture();
    assert.equal((await invoke(controllerWithPool(db.pool).createSeason, { name })).statusCode, 201);
  }
});

test('returns a helpful conflict for existing seasons', async () => {
  const db = fixture([{ id: 1, name: '2026-2027' }]);
  const res = await invoke(controllerWithPool(db.pool).createSeason, { name: '2026–2027' });
  assert.equal(res.statusCode, 409);
  assert.match(res.body.message, /已存在/);
  assert.equal(db.rows.length, 1);
  assert.equal(db.writes.length, 0);
});

test('handles concurrent uniqueness conflicts rather than returning 500', async () => {
  const db = fixture();
  const ctrl = controllerWithPool(db.pool).createSeason;
  const results = await Promise.all([invoke(ctrl, { name: '2026-2027' }), invoke(ctrl, { name: '2026-2027' })]);
  assert.deepEqual(results.map(res => res.statusCode).sort(), [201, 409]);
  assert.equal(db.rows.length, 1);
});

test('passes unrelated database failures to the existing error handler', async () => {
  const failure = new Error('Database unavailable');
  const res = await invoke(controllerWithPool({ async query() { throw failure; } }).createSeason, { name: '2026-2027' });
  assert.equal(res.error, failure);
});

test('the real admin route requires login, password change and admin/owner role', async () => {
  const express = backendRequire('express');
  const db = fixture();
  const controllers = controllerWithPool(db.pool);
  const module = { exports: {} };
  const { requirePasswordChanged } = backendRequire('../middleware/auth');
  const roles = backendRequire('../middleware/admin');
  vm.runInNewContext(fs.readFileSync(routeFile, 'utf8'), {
    module,
    require(name) {
      if (name === 'express') return express;
      if (name === '../controllers/adminController') return controllers;
      if (name === '../middleware/admin') return roles;
      if (name === '../middleware/upload') return { single: () => (_req, _res, next) => next() };
      if (name === '../middleware/auth') return {
        requirePasswordChanged,
        authenticate(req, res, next) {
          const role = req.headers['x-test-role'];
          if (!role) return res.status(401).json({ code: 401 });
          req.user = { id: 1, role, must_change_password: req.headers['x-test-password-change'] === 'yes' };
          next();
        },
      };
      throw new Error('Unexpected module: ' + name);
    },
  });
  const app = express();
  app.use(express.json());
  app.use('/api/admin', module.exports);
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const url = `http://127.0.0.1:${server.address().port}/api/admin/seasons`;
    const request = (headers = {}, name = '2026-2027') => fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ name }),
    });
    assert.equal((await request()).status, 401);
    assert.equal((await request({ 'x-test-role': 'user' })).status, 403);
    assert.equal((await request({ 'x-test-role': 'admin', 'x-test-password-change': 'yes' })).status, 428);
    assert.equal(db.writes.length, 0);
    assert.equal((await request({ 'x-test-role': 'admin' })).status, 201);
    assert.equal((await request({ 'x-test-role': 'owner' }, '2027-2028')).status, 201);
    assert.equal((await request({ 'x-test-role': 'admin' })).status, 409);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
