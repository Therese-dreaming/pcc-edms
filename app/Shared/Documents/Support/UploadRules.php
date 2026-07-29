<?php

namespace App\Shared\Documents\Support;

// Single source of truth for what the system accepts as an uploaded document, reused by every
// uploader (Form 1 attachments, revision responses, DPO additional-requirement fulfilment, OJT eval
// reports). FRS §XV supported formats: PDF, DOCX, XLSX, PPTX, JPG, PNG. Size limit confirmed
// 2026-07-07 (docs/9.1): 50 MB.
//
// NOTE: the Laravel rule alone can't accept a file PHP has already rejected — the deploy host's
// `upload_max_filesize` / `post_max_size` must be >= 50 MB (docs/9.1, docs/7.0).
class UploadRules
{
    public const MAX_KB = 51200; // 50 MB

    // `mimes` matches by extension; legacy Office extensions included since the FRS names the
    // modern ones and users routinely have both.
    public const EXTENSIONS = 'pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png';

    /**
     * @return array<int, mixed> validation rules for a single uploaded file.
     */
    public static function rules(bool $required = true): array
    {
        return [
            $required ? 'required' : 'nullable',
            'file',
            'mimes:' . self::EXTENSIONS,
            'max:' . self::MAX_KB,
        ];
    }

    /** Human-readable hint for the UI, e.g. "PDF, DOCX, XLSX, PPTX, JPG or PNG · up to 50 MB". */
    public static function hint(): string
    {
        return 'PDF, DOCX, XLSX, PPTX, JPG or PNG · up to 50 MB';
    }
}
