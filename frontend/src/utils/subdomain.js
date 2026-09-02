/**
 * Extracts tenant subdomain or custom domain from current window location hostname.
 * Returns null if accessing from root platform domain, localhost, or IP address.
 */
export function getTenantSubdomain() {
  const hostname = window.location.hostname;
  
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === 'psypro.tech' ||
    hostname === 'www.psypro.tech' ||
    hostname === 'admin.psypro.tech' ||
    /^\d+\.\d+\.\d+\.\d+$/.test(hostname)
  ) {
    // Check if query parameter ?tenant= or ?subdomain= exists for local testing
    const params = new URLSearchParams(window.location.search);
    const querySub = params.get('tenant') || params.get('subdomain');
    return querySub || null;
  }

  if (hostname.endsWith('.psypro.tech')) {
    const sub = hostname.replace('.psypro.tech', '').trim();
    if (sub && sub !== 'www' && sub !== 'admin' && sub !== 'api') {
      return sub;
    }
    return null;
  }

  // Custom Domain attached to a tenant (e.g. cliniqueparis.com)
  return hostname;
}

export function isSubdomain() {
  return Boolean(getTenantSubdomain());
}
