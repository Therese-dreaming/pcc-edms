<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify your email address</title>
</head>
{{-- Redesign system (.claude/skills/redesign): neutral surfaces, a single dark-red accent, a
     rounded soft-shadow card. Email clients ignore webfonts, so the stack falls back to Arial. --}}
<body style="margin: 0; padding: 0; background-color: #f7f7f7; font-family: 'Inter', 'Segoe UI', Arial, Helvetica, sans-serif; color: #171717;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7f7f7; padding: 32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; margin: 0 auto;">
                    {{-- Brand header --}}
                    <tr>
                        <td align="center" style="padding: 0 0 20px;">
                            <img src="{{ $logoUrl }}" alt="{{ config('pdf.institution_name', 'Pasig Catholic College') }}" width="52" height="52" style="display: block; width: 52px; height: 52px; margin: 0 auto 10px;">
                            <div style="font-size: 15px; font-weight: 700; letter-spacing: -0.01em; color: #171717;">PCC&nbsp;EDMS</div>
                            <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: #8a8a8e; margin-top: 2px;">
                                {{ config('pdf.institution_name', 'Pasig Catholic College') }}
                            </div>
                        </td>
                    </tr>

                    {{-- Card --}}
                    <tr>
                        <td style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 16px; padding: 32px;">
                            <p style="margin: 0 0 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #8b1a1a;">
                                Confirm your account
                            </p>
                            <h1 style="margin: 0 0 16px; font-size: 22px; line-height: 1.3; font-weight: 700; letter-spacing: -0.02em; color: #171717;">
                                Verify your email address
                            </h1>

                            <p style="margin: 0 0 12px; font-size: 14px; line-height: 1.6; color: #52525b;">
                                Hello{{ $user->name ? ' ' . e($user->name) : '' }},
                            </p>
                            <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #52525b;">
                                Please confirm this is your email address to activate your PCC&nbsp;EDMS account.
                                Click the button below and you'll be ready to sign in.
                            </p>

                            {{-- Button --}}
                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 24px;">
                                <tr>
                                    <td style="border-radius: 9999px; background-color: #8b1a1a;">
                                        <a href="{{ $url }}" target="_blank" style="display: inline-block; padding: 13px 28px; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 9999px;">
                                            Verify email address
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0 0 20px; font-size: 13px; line-height: 1.6; color: #8a8a8e;">
                                This link expires in {{ config('auth.verification.expire', 60) }} minutes. If it expires,
                                sign in again and we'll send a fresh one.
                            </p>

                            <div style="border-top: 1px solid #e0e0e0; padding-top: 16px;">
                                <p style="margin: 0 0 6px; font-size: 12px; line-height: 1.6; color: #8a8a8e;">
                                    If the button doesn't work, copy and paste this link into your browser:
                                </p>
                                <p style="margin: 0; font-size: 12px; line-height: 1.5; word-break: break-all;">
                                    <a href="{{ $url }}" target="_blank" style="color: #8b1a1a; text-decoration: none;">{{ $url }}</a>
                                </p>
                            </div>
                        </td>
                    </tr>

                    {{-- Footer --}}
                    <tr>
                        <td style="padding: 20px 8px 0; text-align: center;">
                            <p style="margin: 0 0 4px; font-size: 12px; line-height: 1.6; color: #8a8a8e;">
                                If you didn't create a PCC&nbsp;EDMS account, you can safely ignore this email.
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #8a8a8e;">
                                &copy; {{ date('Y') }} {{ config('pdf.institution_name', 'Pasig Catholic College') }} — Electronic Document Management System
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
