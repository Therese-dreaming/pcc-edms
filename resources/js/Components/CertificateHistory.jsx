// Certificate issuance history (stakeholder "Future Enhancements", built 2026-08-31) — shows
// each side of the clearance_certificates row (DPO and Ethics issue independently since
// 2026-07-25), including the exemption kind on the Ethics side.
export default function CertificateHistory({ certificate }) {
    if (!certificate || (!certificate.dpreq_issued_at && !certificate.remis_issued_at)) {
        return <p className="text-sm text-fg-tertiary">No certificate issued yet.</p>;
    }

    const fmt = (v) => (v ? String(v).slice(0, 10) : null);

    const rows = [];
    if (certificate.dpreq_issued_at) {
        rows.push({
            track: 'Data Privacy Clearance (DPO)',
            number: certificate.dpreq_certificate_number,
            issued: fmt(certificate.dpreq_issued_at),
            validUntil: fmt(certificate.dpreq_valid_until),
            signedBy: certificate.dpo_signed_by?.name ?? null,
        });
    }
    if (certificate.remis_issued_at) {
        const exempt = certificate.remis_certificate_kind === 'exemption';
        rows.push({
            track: exempt ? 'Certificate of Exemption (Ethics)' : 'Research Ethics Clearance (Ethics)',
            number: certificate.remis_certificate_number,
            issued: fmt(certificate.remis_issued_at),
            validUntil: fmt(certificate.remis_valid_until),
            signedBy: certificate.ethics_signed_by?.name ?? null,
        });
    }

    return (
        <div className="space-y-3">
            {rows.map((r) => (
                <div key={r.track} className="rounded-lg border border-border p-4 text-sm">
                    <p className="font-semibold text-fg-primary">{r.track}</p>
                    <p className="mt-1 text-fg-secondary">
                        Control No. <span className="font-semibold">{r.number}</span>
                    </p>
                    <p className="text-fg-secondary">
                        Issued {r.issued}
                        {r.validUntil ? ` · valid until ${r.validUntil}` : ''}
                        {r.signedBy ? ` · signed by ${r.signedBy}` : ''}
                    </p>
                </div>
            ))}
        </div>
    );
}
