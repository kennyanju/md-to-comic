-- MD to Comic: Cloudflare D1 Database Schema

-- 1. Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL DEFAULT 'anonymous',
  title       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'queued', -- queued, scripting, generating, compositing, done, failed
  stage       TEXT,
  progress    INTEGER DEFAULT 0,
  config      TEXT NOT NULL,                  -- JSON blob: { model, art_style, layout, etc. }
  char_roster TEXT,                           -- JSON blob: character consistency descriptions
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

-- 2. Pages Table
CREATE TABLE IF NOT EXISTS pages (
  id          TEXT PRIMARY KEY,
  job_id      TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  page_index  INTEGER NOT NULL,
  title       TEXT,
  layout_cfg  TEXT NOT NULL,                  -- JSON blob: { layout_type, border_style, etc. }
  page_r2_key TEXT,                           -- Assembled high-res page PNG key in R2
  status      TEXT NOT NULL DEFAULT 'pending',
  created_at  INTEGER NOT NULL
);

-- 3. Panels Table
CREATE TABLE IF NOT EXISTS panels (
  id              TEXT PRIMARY KEY,
  page_id         TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  job_id          TEXT NOT NULL,
  panel_index     INTEGER NOT NULL,
  shot_type       TEXT NOT NULL DEFAULT 'medium',
  scene_desc      TEXT NOT NULL,
  mood            TEXT,
  caption         TEXT,
  dialogue_json   TEXT,                       -- JSON array of dialogue bubbles
  prompt_used     TEXT,
  negative_prompt TEXT,
  image_r2_key    TEXT,                       -- Stored panel PNG key in R2
  image_url       TEXT,                       -- Public or pre-signed URL
  status          TEXT NOT NULL DEFAULT 'pending',
  error           TEXT,
  created_at      INTEGER NOT NULL
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_jobs_user ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_pages_job ON pages(job_id);
CREATE INDEX IF NOT EXISTS idx_panels_page ON panels(page_id);
CREATE INDEX IF NOT EXISTS idx_panels_job ON panels(job_id);
