<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You've been added to a research team</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f7f7; font-family: 'Inter', 'Segoe UI', Arial, Helvetica, sans-serif; color: #171717;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7f7f7; padding: 32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; margin: 0 auto;">
                    <tr>
                        <td align="center" style="padding: 0 0 20px;">
                            <img src="{{ asset('images/logo-small.png') }}" alt="{{ config('pdf.institution_name', 'Pasig Catholic College') }}" width="52" height="52" style="display: block; width: 52px; height: 52px; margin: 0 auto 10px;">
                            <div style="font-size: 15px; font-weight: 700; letter-spacing: -0.01em; color: #171717;">PCC&nbsp;EDMS</div>
                            <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: #8a8a8e; margin-top: 2px;">
                                {{ config('pdf.institution_name', 'Pasig Catholic College') }}
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 16px; padding: 32px;">
                            <p style="margin: 0 0 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #8b1a1a;">
                                Research team
                            </p>
                            <h1 style="margin: 0 0 16px; font-size: 22px; line-height: 1.3; font-weight: 700; letter-spacing: -0.02em; color: #171717;">
                                You've been added as a co-researcher
                            </h1>

                            <p style="margin: 0 0 12px; font-size: 14px; line-height: 1.6; color: #52525b;">
                                Hello{{ $memberName ? ' ' . e($memberName) : '' }},
                            </p>
                            <p style="margin: 0 0 12px; font-size: 14px; line-height: 1.6; color: #52525b;">
                                <strong style="color: #171717;">{{ $leadName }}</strong> has listed you as a co-researcher on the
                                study <strong style="color: #171717;">&ldquo;{{ $researchTitle }}&rdquo;</strong>
                                (application {{ $trackingNumber }}), submitted to the PCC&nbsp;EDMS for review.
                            </p>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0 4px; background-color: #f7f7f7; border: 1px solid #e0e0e0; border-radius: 12px;">
                                <tr>
                                    <td style="padding: 14px 16px; font-size: 13px; line-height: 1.6; color: #52525b;">
                                        <strong style="color: #171717;">What happens next?</strong><br>
                                        Once the Data Protection Officer approves the application, you'll receive a separate
                                        email with your own secure link to review and sign the Research Team
                                        Non-Disclosure Agreement. <strong>No action is needed from you right now.</strong>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 20px 8px 0; text-align: center;">
                            <p style="margin: 0 0 4px; font-size: 12px; line-height: 1.6; color: #8a8a8e;">
                                If you weren't expecting this, you can ignore this email or contact the research team lead.
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
