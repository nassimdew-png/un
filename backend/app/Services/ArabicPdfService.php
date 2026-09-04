<?php

namespace App\Services;

use ArPHP\I18N\Arabic;
use DOMDocument;
use DOMXPath;

class ArabicPdfService
{
    protected static ?Arabic $arabic = null;

    public static function getArabic(): Arabic
    {
        if (!self::$arabic) {
            self::$arabic = new Arabic();
        }
        return self::$arabic;
    }

    /**
     * Shape and prepare text for DomPDF
     */
    public static function shape(?string $text): string
    {
        if (!$text || !preg_match('/\p{Arabic}/u', $text)) {
            return $text ?? '';
        }
        return self::getArabic()->utf8Glyphs($text, 1000, false);
    }

    /**
     * Walk all text nodes of an HTML document, shaping Arabic glyphs
     * while keeping HTML tags, CSS styles, and attributes untouched.
     */
    public static function prepareHtmlForDomPdf(string $html): string
    {
        if (!preg_match('/\p{Arabic}/u', $html)) {
            return $html;
        }

        $arabic = self::getArabic();

        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML('<?xml encoding="UTF-8">' . $html, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();

        $xpath = new DOMXPath($dom);
        $textNodes = $xpath->query('//text()');

        foreach ($textNodes as $node) {
            $parentTag = strtolower($node->parentNode->nodeName ?? '');
            if (in_array($parentTag, ['script', 'style'])) {
                continue;
            }
            $val = $node->nodeValue;
            if ($val !== null && preg_match('/\p{Arabic}/u', $val)) {
                $node->nodeValue = $arabic->utf8Glyphs($val, 1000, false);
            }
        }

        $output = $dom->saveHTML();
        $output = preg_replace('/<\?xml[^>]*>\s*/i', '', $output);
        return $output;
    }
}
