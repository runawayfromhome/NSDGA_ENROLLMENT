# Local demo seed data

These scripts are intentionally outside `supabase/migrations/` and are never
run by `supabase db push`. They create and delete demo accounts, so use them
only against a local development database or an explicitly disposable project.

Passwords are supplied through PostgreSQL session settings and are not stored
in this repository. Set them only for the command that runs the script:

```powershell
$env:PGOPTIONS = "-c app.staff_password=Use-a-local-password-here -c app.student_password=Use-another-local-password-here"
supabase db execute --local --file "supabase\seed\staff.sql"
supabase db execute --local --file "supabase\seed\students.sql"
Remove-Item Env:PGOPTIONS
```

Use unique passwords for every local run. If any password from an older seed
file was used on a hosted project, rotate or delete that account immediately.
