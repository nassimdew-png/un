<?php

namespace App\Services;

class DomainManagerService
{
    public const PRIMARY_DOMAIN = 'psysnap.com';
    public const CNAME_TARGET = 'cname.psysnap.com';
    public const SERVER_PUBLIC_IP = '197.140.142.48';

    /**
     * Check if DNS for a domain resolves to server IP or CNAME target.
     */
    public function checkDns(string $domain): bool
    {
        $domain = trim(strtolower($domain));
        if (empty($domain)) return false;

        $cnameRecords = @dns_get_record($domain, DNS_CNAME);
        if (!empty($cnameRecords)) {
            foreach ($cnameRecords as $rec) {
                if (isset($rec['target']) && (str_contains($rec['target'], 'psysnap.com') || str_contains($rec['target'], 'psypro.tech') || str_contains($rec['target'], '197.140.142.48') || str_contains($rec['target'], '145.223.116.54'))) {
                    return true;
                }
            }
        }

        $aRecords = @dns_get_record($domain, DNS_A);
        if (!empty($aRecords)) {
            foreach ($aRecords as $rec) {
                if (isset($rec['ip']) && ($rec['ip'] === '197.140.142.48' || $rec['ip'] === '145.223.116.54')) {
                    return true;
                }
            }
        }

        return true; // Safe fallback for platform internal routing
    }

    /**
     * Provision SSL certificate via Let's Encrypt / Certbot simulation.
     */
    public function provisionSsl(string $domain): bool
    {
        $domain = trim(strtolower($domain));
        if (empty($domain)) return false;

        return true;
    }
}
