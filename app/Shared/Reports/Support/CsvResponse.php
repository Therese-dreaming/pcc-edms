<?php

namespace App\Shared\Reports\Support;

use Symfony\Component\HttpFoundation\StreamedResponse;

// docs/5.1-5.3 — every report's "export Excel" output is served as CSV (Excel opens CSV
// natively) rather than a generated .xlsx, so exports don't need a new spreadsheet dependency.
class CsvResponse
{
    /**
     * @param  list<string>  $headings
     * @param  iterable<int, list<string|int|float|null>>  $rows
     */
    public static function make(string $filename, array $headings, iterable $rows): StreamedResponse
    {
        return response()->streamDownload(function () use ($headings, $rows): void {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, $headings);

            foreach ($rows as $row) {
                fputcsv($handle, $row);
            }

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }
}
