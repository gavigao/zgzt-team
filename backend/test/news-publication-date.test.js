const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { normalizeNewsPublicationDate } = require('../src/utils/newsPublicationDate');

function controllerWithDatabase(record) {
  let stored = record ? { ...record } : null;
  const writes = [];
  const now = '2026-10-07 12:00:00';
  const pool = {
    async query(sql, params) {
      if (sql.startsWith('SELECT status, published_at')) return [stored ? [{ ...stored }] : []];
      if (sql.startsWith('SELECT * FROM news WHERE')) return [stored ? [{ ...stored }] : []];
      if (sql.startsWith('INSERT INTO news') || sql.startsWith('UPDATE news')) {
        writes.push({ sql, params });
        stored = {
          id: 1, title: params[0], status: params[5],
          published_at: params[6] ?? (params[7] === 'published' ? now : null),
        };
        return [{ insertId: 1, affectedRows: 1 }];
      }
      throw new Error(`Unexpected query: ${sql}`);
    },
  };
  const exports = {};
  const source = fs.readFileSync(path.join(__dirname, '../src/controllers/adminController.js'), 'utf8');
  vm.runInNewContext(source, {
    exports,
    require(name) {
      if (name === '../db/index') return pool;
      if (name === 'bcrypt') return {};
      if (name === '../config/auth') return { BCRYPT_ROUNDS: 12 };
      if (name === '../utils/newsPublicationDate') return { normalizeNewsPublicationDate };
      return require(name);
    },
  });
  return { controllers: exports, writes };
}

async function invoke(controller, body) {
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
  };
  await controller({ body, params: { id: 1 }, user: { id: 2 } }, res, error => {
    res.statusCode = error.statusCode || 500;
    res.body = { message: error.message };
  });
  return res;
}

test('supports chosen calendar dates beyond TIMESTAMP limits without UTC conversion', () => {
  for (const date of ['1000-01-01', '1969-12-31', '2024-02-29', '2040-01-01', '9999-12-31']) {
    assert.equal(normalizeNewsPublicationDate(date), `${date} 00:00:00`);
  }
  assert.equal(normalizeNewsPublicationDate('2026-08-22 18:30:45'), '2026-08-22 18:30:45');
  assert.equal(normalizeNewsPublicationDate('2026-08-22T18:30:45'), '2026-08-22 18:30:45');
});

test('rejects impossible dates, malformed values and invalid times', () => {
  for (const date of ['2026-02-29', '1900-02-29', '2026-04-31', '2026-13-01', '2026-00-01', '2026-01-00', '0999-01-01', '2026-1-1', 'invalid', 123, {}, '2026-01-01 24:00:00']) {
    assert.throws(() => normalizeNewsPublicationDate(date), { statusCode: 400 });
  }
});

test('create published news and drafts with a selected date', async () => {
  for (const status of ['draft', 'published']) {
    const { controllers, writes } = controllerWithDatabase();
    const res = await invoke(controllers.createNews, { title: '测试新闻', status, published_at: '2024-02-29' });
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.data.published_at, '2024-02-29 00:00:00');
    assert.equal(writes[0].params[6], '2024-02-29 00:00:00');
  }
});

test('create without a date retains legacy defaults: now for published, null for draft', async () => {
  for (const status of ['draft', 'published']) {
    const { controllers } = controllerWithDatabase();
    const res = await invoke(controllers.createNews, { title: '测试新闻', status });
    assert.equal(res.body.data.published_at, status === 'published' ? '2026-10-07 12:00:00' : null);
  }
});

test('editing unchanged date preserves the original timestamp and sorting position', async () => {
  const { controllers } = controllerWithDatabase({ status: 'published', published_at: '2026-08-22 18:30:45' });
  const res = await invoke(controllers.updateNews, { title: '修改正文', status: 'published', published_at: '2026-08-22' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.published_at, '2026-08-22 18:30:45');
});

test('changing a publication date saves the new selected day', async () => {
  const { controllers } = controllerWithDatabase({ status: 'published', published_at: '2026-08-22 18:30:45' });
  const res = await invoke(controllers.updateNews, { title: '更正日期', status: 'published', published_at: '2025-06-01' });
  assert.equal(res.body.data.published_at, '2025-06-01 00:00:00');
});

test('omitted, null and blank dates do not reset an existing publication date', async () => {
  for (const published_at of [undefined, null, '']) {
    const { controllers } = controllerWithDatabase({ status: 'published', published_at: '2026-08-22 18:30:45' });
    const res = await invoke(controllers.updateNews, { title: '修改正文', status: 'published', published_at });
    assert.equal(res.body.data.published_at, '2026-08-22 18:30:45');
  }
});

test('draft to published preserves the date chosen in the draft', async () => {
  const { controllers } = controllerWithDatabase({ status: 'draft', published_at: '2025-06-01 00:00:00' });
  const res = await invoke(controllers.updateNews, { title: '发布旧稿', status: 'published' });
  assert.equal(res.body.data.published_at, '2025-06-01 00:00:00');
});

test('legacy undated draft gets a publication date on first publish', async () => {
  const { controllers } = controllerWithDatabase({ status: 'draft', published_at: null });
  const res = await invoke(controllers.updateNews, { title: '发布旧稿', status: 'published' });
  assert.equal(res.body.data.published_at, '2026-10-07 12:00:00');
});

test('invalid input returns 400 before writing, and absent articles return 404', async () => {
  const { controllers, writes } = controllerWithDatabase();
  const invalid = await invoke(controllers.createNews, { title: '测试', status: 'published', published_at: '2026-02-30' });
  assert.equal(invalid.statusCode, 400);
  assert.equal(writes.length, 0);
  const missing = await invoke(controllers.updateNews, { title: '测试', status: 'published', published_at: '2025-01-01' });
  assert.equal(missing.statusCode, 404);
  assert.equal(writes.length, 0);
});
