<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Set up your PCC-EDMS account</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; color: #1f2937; margin: 0; padding: 24px; background-color: #f3f4f6;">
    <table role="presentation" width="100%" style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 24px;">
        <tr>
            <td>
                <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #8b1a1a; font-weight: bold; margin: 0 0 8px;">
                    {{ config('pdf.institution_name', 'PCC-EDMS') }}
                </p>
                <h1 style="font-size: 18px; margin: 0 0 16px;">Set up your account</h1>

                <p style="font-size: 14px; line-height: 1.5; margin: 0 0 12px;">Hello {{ $memberName }},</p>
                <p style="font-size: 14px; line-height: 1.5; margin: 0 0 12px;">
                    {{ $adviserName }} has added you to <strong>{{ $cohortName }}</strong> on PCC-EDMS,
                    the system for research ethics and data privacy clearances. Use the link below to
                    finish setting up your account and choose a password.
                </p>

                <p style="margin: 20px 0;">
                    <a href="{{ $acceptUrl }}" style="display: inline-block; background-color: #8b1a1a; color: #ffffff; text-decoration: none; padding: 12px 22px; border-radius: 6px; font-size: 14px; font-weight: bold;">
                        Set up my account
                    </a>
                </p>

                <p style="font-size: 13px; line-height: 1.5; color: #6b7280; margin: 0 0 6px;">
                    This link is unique to you, can be used only once, and expires on
                    <strong>{{ $expiresAt }}</strong>. Please don&rsquo;t forward it.
                </p>

                <p style="font-size: 12px; color: #6b7280; margin: 24px 0 0; border-top: 1px solid #e5e7eb; padding-top: 12px;">
                    If you weren&rsquo;t expecting this, you can ignore this email or contact your adviser.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
