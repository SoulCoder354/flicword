create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Remove any prior schedule with the same name
do $$
begin
  perform cron.unschedule('flicword-wotd-daily');
exception when others then null;
end $$;

select
cron.schedule(
  'flicword-wotd-daily',
  '0 0 * * *',
  $$
  select
    net.http_post(
      url := 'https://guzmrqfftzscufxjpoep.supabase.co/functions/v1/generate-word-of-the-day',
      headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1em1ycWZmdHpzY3VmeGpwb2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MDg4NDIsImV4cCI6MjA5MzM4NDg0Mn0.2SR9oKppJ4ftCfiJoSgmPDkXfv0g90rOSo6QOUKWLvE","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1em1ycWZmdHpzY3VmeGpwb2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MDg4NDIsImV4cCI6MjA5MzM4NDg0Mn0.2SR9oKppJ4ftCfiJoSgmPDkXfv0g90rOSo6QOUKWLvE"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);