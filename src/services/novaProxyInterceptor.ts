/**
 * NOVA SDK Request Interceptor (Multi-Domain Support)
 * 
 * This module intercepts both fetch() and XMLHttpRequest to route
 * NOVA SDK API calls through the local Vite proxy in development.
 * 
 * Supports multiple NOVA domains:
 * - nova-sdk.com/api
 * - nova-mcp.fastmcp.app
 * 
 * Import this BEFORE any NOVA SDK usage (ideally in App.tsx)
 */

// NOVA SDK domains to proxy
const NOVA_DOMAINS = [
  'nova-sdk.com',
  'nova-mcp.fastmcp.app'
];

const shouldProxy = (url: string): boolean => {
  return import.meta.env.DEV && NOVA_DOMAINS.some(domain => url.includes(domain));
};

const getProxyUrl = (url: string): string => {
  // For nova-sdk.com/api -> /api
  if (url.includes('nova-sdk.com/api')) {
    return url.replace('https://nova-sdk.com', '');
  }
  
  // For nova-mcp.fastmcp.app -> /mcp-api
  if (url.includes('nova-mcp.fastmcp.app')) {
    return url.replace('https://nova-mcp.fastmcp.app', '/mcp-api');
  }
  
  return url;
};

// ============================================================================
// FETCH INTERCEPTOR
// ============================================================================
const originalFetch = window.fetch;

window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' 
    ? input 
    : input instanceof URL 
    ? input.toString() 
    : input.url;

  if (shouldProxy(url)) {
    const proxyUrl = getProxyUrl(url);
    
    console.log(`🔄 [NOVA Fetch Proxy] ${url}`);
    console.log(`   → ${proxyUrl}`);
    
    const proxyRequest = typeof input === 'string' || input instanceof URL
      ? proxyUrl
      : new Request(proxyUrl, input);
    
    return originalFetch(proxyRequest, init);
  }

  return originalFetch(input, init);
};

// ============================================================================
// XMLHttpRequest INTERCEPTOR
// ============================================================================
const OriginalXHR = window.XMLHttpRequest;

class ProxiedXMLHttpRequest extends OriginalXHR {
  private _url: string = '';
  private _method: string = '';

  open(method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null): void {
    const urlString = url.toString();
    this._method = method;
    this._url = urlString;

    if (shouldProxy(urlString)) {
      const proxyUrl = getProxyUrl(urlString);
      
      console.log(`🔄 [NOVA XHR Proxy] ${method} ${urlString}`);
      console.log(`   → ${proxyUrl}`);
      
      super.open(method, proxyUrl, async ?? true, username, password);
      return;
    }

    super.open(method, url, async ?? true, username, password);
  }
}

// Replace the global XMLHttpRequest with our proxied version
(window as any).XMLHttpRequest = ProxiedXMLHttpRequest;

console.log('✅ NOVA SDK interceptor initialized (Multi-domain support)');
console.log('   Proxying:', NOVA_DOMAINS.join(', '));

export {};