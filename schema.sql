-- Barakat Family App — Database Schema
-- Run this once in your Postgres database before first use.

CREATE TABLE IF NOT EXISTS transactions (
  id          VARCHAR(32)   PRIMARY KEY,
  type        VARCHAR(10)   NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT          NOT NULL,
  amount      NUMERIC(12,2) NOT NULL,
  category    VARCHAR(50)   NOT NULL DEFAULT 'other',
  source      VARCHAR(50)   NOT NULL DEFAULT 'family',
  added_by    VARCHAR(100)  NOT NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id           VARCHAR(32)  PRIMARY KEY,
  from_member  VARCHAR(100) NOT NULL,
  to_member    VARCHAR(100) NOT NULL,
  text         TEXT         NOT NULL,
  read_by_ward BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
