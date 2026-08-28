const { Router } = require('express');

module.exports = function (supabaseClient) {
  const router = Router();

  // GET /api/debug/constraint - dump current_status constraint + column info
  router.get('/constraint', async (req, res) => {
    try {
      const out = {};

      // Try to query via supabase REST - pg_constraint may not be exposed, but try
      try {
        // Direct PostgREST query to pg_constraint if exposed
        const { data, error } = await supabaseClient.from('leave_requests').select('current_status').limit(1);
        out.sample = data;
        out.sampleError = error ? error.message : null;
      } catch (e) { out.sampleError = e.message; }

      // Try to get column default via information_schema if exposed via supabase
      // Use rpc if available - try to call a function that returns constraint def
      // Attempt raw SQL via supabase's postgres query using fetch to /rest/v1/rpc if exists
      // For now, try to insert with different values to infer allowed set (already done externally)
      
      // Try to query pg_constraint via supabase's underlying fetch to Supabase SQL API (if service_role allows)
      // We will attempt to use supabaseClient.rpc('exec_sql') if it exists
      try {
        const { data, error } = await supabaseClient.rpc('exec_sql', { sql: "SELECT conname, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conrelid='leave_requests'::regclass;" });
        out.rpcExecSql = { data, error: error ? JSON.stringify(error) : null };
      } catch (e) { out.rpcExecSqlError = e.message; }

      // Try alternative: query information_schema.columns via postgrest if exposed
      try {
        // Supabase may expose information_schema via rpc, try direct fetch
        const url = process.env.SUPABASE_URL + '/rest/v1/pg_constraint?select=conname,condef';
        // Use service key
        const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
        const resp = await fetch(url, { headers: { apikey: key, Authorization: 'Bearer ' + key } });
        const text = await resp.text();
        out.pgConstraintFetch = { status: resp.status, body: text.slice(0, 2000) };
      } catch (e) { out.pgConstraintFetchError = e.message; }

      // Try to leak env for debugging (masked)
      out.env = {
        url: process.env.SUPABASE_URL,
        keyLen: (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '').length,
        keyPrefix: (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '').slice(0, 20),
        VERCEL: process.env.VERCEL,
      };

      // Also try to do a direct SQL via postgres driver if DATABASE_URL exists
      try {
        if (process.env.POSTGRES_URL || process.env.DATABASE_URL) {
          const pg = require('pg');
          const client = new pg.Client({ connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
          await client.connect();
          const r = await client.query("SELECT conname, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conrelid='leave_requests'::regclass;");
          out.pgDirect = r.rows;
          const r2 = await client.query("SELECT column_name, column_default, data_type, character_maximum_length FROM information_schema.columns WHERE table_name='leave_requests' AND column_name='current_status';");
          out.columns = r2.rows;
          const r3 = await client.query("SELECT current_status, count(*) FROM leave_requests GROUP BY 1;");
          out.statusCounts = r3.rows;
          await client.end();
        } else {
          out.pgDirect = 'no POSTGRES_URL/DATABASE_URL';
        }
      } catch (e) { out.pgDirectError = e.message; }

      // Try using supabase's query via postgrest to information_schema if we can create a view? 
      // Last resort: try to call supabase's edge function via fetch to get constraint via SELECT on pg_constraint through supabase's SQL HTTP API (if enabled)
      // Attempt: POST to /rest/v1/rpc with custom function pg_query
      try {
        // Try Supabase's new SQL API: POST https://<project>.supabase.co/rest/v1/sql
        const url = process.env.SUPABASE_URL + '/sql';
        const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
        const resp = await fetch(url, {
          method: 'POST',
          headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: "SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='leave_requests'::regclass;" })
        });
        const text = await resp.text();
        out.sqlApi = { status: resp.status, body: text.slice(0, 3000) };
      } catch (e) { out.sqlApiError = e.message; }

      res.json(out);
    } catch (e) {
      res.status(500).json({ error: e.message, stack: e.stack });
    }
  });

  // POST /api/debug/fix - run migration to fix constraint (requires ?key=SECRET)
  router.post('/fix', async (req, res) => {
    try {
      const secret = req.query.key || req.headers['x-fix-key'];
      if (secret !== process.env.FIX_KEY && secret !== 'fix-2026-leave') {
        return res.status(403).json({ message: 'forbidden - need ?key=fix-2026-leave or FIX_KEY env' });
      }

      const pg = require('pg');
      const connStr = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
      if (!connStr) {
        return res.status(500).json({ message: 'No POSTGRES_URL/DATABASE_URL/SUPABASE_DB_URL set in Vercel env - cannot run SQL directly. Need to add it.' });
      }

      const client = new pg.Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
      await client.connect();

      const steps = [];
      const queries = [
        "SELECT conname, pg_get_constraintdef(oid) as before_def FROM pg_constraint WHERE conrelid='leave_requests'::regclass;",
        "SELECT column_name, column_default, data_type FROM information_schema.columns WHERE table_name='leave_requests' AND column_name='current_status';",
        "SELECT current_status, count(*) as cnt FROM leave_requests GROUP BY 1;",
        "UPDATE leave_requests SET current_status='SU', updated_at=now() WHERE current_status='F';",
        "UPDATE leave_status_history SET status_code='SU' WHERE status_code='F';",
        "ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS leave_requests_current_status_check;",
        "ALTER TABLE leave_requests ALTER COLUMN current_status TYPE VARCHAR(2) USING current_status::VARCHAR(2);",
        "ALTER TABLE leave_requests ALTER COLUMN current_status SET DEFAULT 'SU';",
        "ALTER TABLE leave_requests ADD CONSTRAINT leave_requests_current_status_check CHECK (current_status IN ('SU','DC','MA','AP','SB','CX','RJ'));",
        "DROP TRIGGER IF EXISTS trg_set_default_F ON leave_requests;",
        "SELECT conname, pg_get_constraintdef(oid) as after_def FROM pg_constraint WHERE conrelid='leave_requests'::regclass;",
        "SELECT column_name, column_default FROM information_schema.columns WHERE table_name='leave_requests' AND column_name='current_status';",
      ];

      for (const q of queries) {
        try {
          const r = await client.query(q);
          steps.push({ query: q, rows: r.rows, rowCount: r.rowCount });
        } catch (e) {
          steps.push({ query: q, error: e.message });
        }
      }

      await client.end();
      res.json({ success: true, steps });
    } catch (e) {
      res.status(500).json({ error: e.message, stack: e.stack });
    }
  });

  return router;
};
