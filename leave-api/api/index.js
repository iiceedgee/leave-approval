const app = require('../src/app');
const db = app.get ? app.get('db') : app.db;
let seedPromise = null;
function ensureSeed() {
  if (!seedPromise) {
    seedPromise = db.seed().catch(e => { console.error('[seed]', e.message); seedPromise = null; throw e; });
  }
  return seedPromise;
}
module.exports = async (req, res) => {
  try { await ensureSeed(); } catch {}
  return app(req, res);
};
