<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $notificationSubject }}</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; color: #1f2937; margin: 0; padding: 24px; background-color: #f3f4f6;">
    <table role="presentation" width="100%" style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 24px;">
        <tr>
            <td>
                <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #8b1a1a; font-weight: bold; margin: 0 0 8px;">
                    {{ config('pdf.institution_name', 'PCC-EDMS') }}
                </p>
                <h1 style="font-size: 18px; margin: 0 0 16px;">{{ $notificationSubject }}</h1>
                <p style="font-size: 14px; line-height: 1.5; margin: 0 0 20px;">{{ $notificationBody }}</p>

                @if ($actionUrl)
                    <p style="margin: 0 0 20px;">
                        <a href="{{ $actionUrl }}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-size: 14px;">
                            View in PCC-EDMS
                        </a>
                    </p>
                @endif

                <p style="font-size: 12px; color: #6b7280; margin: 24px 0 0; border-top: 1px solid #e5e7eb; padding-top: 12px;">
                    This is an automated notification from PCC-EDMS. You can also view it in-app under Notifications.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
