# Email Notification Setup

docs/4.3-esignature-notifications.md marks the email channel "required, mirrors in-app." The
code side of this is already done: every call to `NotificationService::notifyUser()` /
`notifyRole()` now queues an email (`App\Shared\Notifications\Mail\NotificationMail`) in addition
to creating the in-app `notifications` row that drives the bell. **Nothing else needs to
change in the codebase** — this file is only about the `.env` values needed to actually send
those emails instead of writing them to a log file.

## Current state (safe default, no setup needed)

`.env` currently has:
```
MAIL_MAILER=log
```

With `log`, every "email" this app sends is written to `storage/logs/laravel.log` instead of
actually being delivered. This is Laravel's default for local development — it's why you can run
this whole app today without any mail credentials and nothing breaks. Leave this as-is until
you're ready to send real email somewhere (staging, production, or manual testing).

To confirm it's working right now, without touching `.env`:
```bash
php artisan queue:work --stop-when-empty
tail -f storage/logs/laravel.log
```
Trigger any notification-worthy action in the app (submit a DPREQ application, endorse a REMIS
study, etc.) and you'll see a fully-rendered HTML email appear in the log.

## Switching to a real mailer

Pick **one** of the options below, fill in the values in `.env`, then restart the queue worker
(`php artisan queue:work`) — it caches config in memory on boot, so it won't pick up `.env`
changes made while it's already running.

### Option A — Mailtrap (recommended for testing before going live)
Mailtrap catches emails in a sandbox inbox instead of delivering them to real addresses — the
safest way to verify templates/links look right before pointing at a real provider.

1. Create a free account at mailtrap.io, create an inbox, open its "SMTP Settings" tab.
2. Set in `.env`:
   ```
   MAIL_MAILER=smtp
   MAIL_HOST=sandbox.smtp.mailtrap.io
   MAIL_PORT=2525
   MAIL_USERNAME=<from Mailtrap>
   MAIL_PASSWORD=<from Mailtrap>
   MAIL_ENCRYPTION=tls
   MAIL_FROM_ADDRESS="notifications@pcc-edms.test"
   MAIL_FROM_NAME="${APP_NAME}"
   ```

### Option B — A real SMTP account (school email, Gmail, Outlook, etc.)
1. Get SMTP host/port/username/password from whoever administers that mailbox. For Gmail
   specifically, you cannot use the account password directly — generate an
   [App Password](https://myaccount.google.com/apppasswords) (requires 2FA enabled) and use that
   instead.
2. Set in `.env`:
   ```
   MAIL_MAILER=smtp
   MAIL_HOST=<e.g. smtp.gmail.com>
   MAIL_PORT=587
   MAIL_USERNAME=<full email address>
   MAIL_PASSWORD=<password or app password>
   MAIL_ENCRYPTION=tls
   MAIL_FROM_ADDRESS="<same as MAIL_USERNAME, usually>"
   MAIL_FROM_NAME="${APP_NAME}"
   ```

### Option C — Mailgun (recommended for production)
Better deliverability and sending limits than personal SMTP once this is live for real DPO/ORD
staff.

1. Sign up at mailgun.com, verify a sending domain (add the DNS records it gives you — this step
   is what makes email actually deliverable, not just "sent").
2. `composer require symfony/mailgun-mailer symfony/http-client` (not installed yet — Laravel's
   Mailgun driver needs it).
3. Set in `.env`:
   ```
   MAIL_MAILER=mailgun
   MAILGUN_DOMAIN=<your verified domain>
   MAILGUN_SECRET=<from Mailgun dashboard>
   MAIL_FROM_ADDRESS="notifications@<your domain>"
   MAIL_FROM_NAME="${APP_NAME}"
   ```

### Option D — Amazon SES (if the school already runs on AWS)
1. In the AWS SES console: verify a sending domain or email address, request production access
   (new SES accounts start in a sandbox that can only send to verified addresses), create SMTP
   credentials (SES → "SMTP Settings" → "Create SMTP credentials" — these are different from your
   normal AWS access keys).
2. Set in `.env`:
   ```
   MAIL_MAILER=ses
   AWS_ACCESS_KEY_ID=<SES SMTP username>
   AWS_SECRET_ACCESS_KEY=<SES SMTP password>
   AWS_DEFAULT_REGION=<e.g. ap-southeast-1>
   MAIL_FROM_ADDRESS="notifications@<your verified domain>"
   MAIL_FROM_NAME="${APP_NAME}"
   ```
   Also `composer require aws/aws-sdk-php` if not already present.

## Verifying it actually sends

1. Restart the queue worker after any `.env` change: `php artisan queue:work`.
2. Log in as any seeded test account (see `GETTING_STARTED.md`) and trigger a notification-worthy
   action.
3. Check `php artisan queue:failed` — if the job shows up there instead of succeeding, the error
   message almost always points straight at the wrong credential/host/port.
4. For Option A (Mailtrap), check the Mailtrap inbox in the browser. For real providers, check the
   actual inbox of whatever address you sent to.

## What's NOT included

- **SMS** — docs/4.3 marks this "optional (confirm if needed for time-sensitive DPO whereabouts
  alerts)." Not built. `notifications.channel` already has an `sms` enum value if this becomes a
  confirmed requirement later, but there's no SMS gateway integration.
- **Per-user notification preferences** (e.g. "email me daily digest instead of per-event") —
  every notification-worthy event sends one email immediately, matching "mirrors in-app."
