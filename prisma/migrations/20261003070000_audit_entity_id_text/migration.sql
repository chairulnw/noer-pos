-- Entitas yang diaudit tidak selalu berkunci UUID (mis. settings dikunci per nama key).
ALTER TABLE "audit_log" ALTER COLUMN "entity_id" TYPE TEXT USING "entity_id"::text;
