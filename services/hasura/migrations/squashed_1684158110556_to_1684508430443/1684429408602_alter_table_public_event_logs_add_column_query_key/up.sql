alter table "public"."event_logs" add column "query_key" jsonb
 null default jsonb_build_array();