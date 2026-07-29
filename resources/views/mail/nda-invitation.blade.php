<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Research Team NDA — Signature Requested</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; color: #1f2937; margin: 0; padding: 24px; background-color: #f3f4f6;">
    <table role="presentation" width="100%" style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 24px;">
        <tr>
            <td>
                <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #8b1a1a; font-weight: bold; margin: 0 0 8px;">
                    {{ config('pdf.institution_name', 'PCC-EDMS') }}
                </p>
                <h1 style="font-size: 18px; margin: 0 0 16px;">Your signature is requested</h1>
                <p style="font-size: 14px; line-height: 1.5; margin: 0 0 12px;">Hello {{ $memberName }},</p>
                <p style="font-size: 14px; line-height: 1.5; margin: 0 0 12px;">
                    You have been listed as a research team member for the study
                    <strong>&ldquo;{{ $researchTitle }}&rdquo;</strong> (Research Team NDA {{ $trackingNumber }}).
                    Please review and sign the Non-Disclosure Agreement using your personal signing link below.
                </p>

                <p style="margin: 20px 0;">
                    <a href="{{ $signingUrl }}" style="display: inline-block; background-color: #8b1a1a; color: #ffffff; text-decoration: none; padding: 12px 22px; border-radius: 6px; font-size: 14px; font-weight: bold;">
                        Review &amp; sign the NDA
                    </a>
                </p>

                <p style="font-size: 13px; line-height: 1.5; color: #6b7280; margin: 0 0 6px;">
                    This link is unique to you, can be used only once, and expires on
                    <strong>{{ $expiresAt }}</strong>. Do not forward it — anyone with the link could sign in your name.
                </p>

                <p style="font-size: 12px; color: #6b7280; margin: 24px 0 0; border-top: 1px solid #e5e7eb; padding-top: 12px;">
                    If you weren&rsquo;t expecting this, you can ignore this email or contact the research team leader.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
