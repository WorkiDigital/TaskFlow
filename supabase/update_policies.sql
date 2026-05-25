-- Deprecated safety stub.
--
-- This file used to create permissive anon policies for the MVP. Do not use it
-- to configure production access. RLS hardening now lives in:
-- supabase/migrations/20260525160237_harden_rls_grants.sql

SELECT
  'Use the harden_rls_grants migration instead of enabling anonymous table access.'
  AS notice;
