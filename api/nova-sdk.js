/**
 * Proxy for nova-sdk.com/api requests
 * Route: /api/nova-sdk/*
 */
export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(200).end();
    return;
  }

  // Get the path after /api/nova-sdk/
  const path = req.url.replace('/api/nova-sdk', '');
  
  // Build target URL - IMPORTANT: add /api prefix
  const targetUrl = `https://nova-sdk.com/api${path}`;
  
  console.log(`[NOVA SDK Proxy] ${req.method} ${req.url} -> ${targetUrl}`);
  
  // Forward the request
  try {
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || '',
      },
    };

    // Add body for POST/PUT/PATCH requests
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = typeof req.body === 'string' 
        ? req.body 
        : JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    
    // Get response data
    const data = await response.text();
    
    // Forward response with CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(response.status);
    
    // Handle JSON or text
    try {
      res.json(JSON.parse(data));
    } catch {
      res.send(data);
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy request failed', details: error.message });
  }
}