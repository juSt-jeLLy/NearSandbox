/**
 * Proxy for nova-sdk.com/api requests
 * Route: /api/nova-sdk/*
 */
export default async function handler(req, res) {
  // Get the path after /api/nova-sdk/
  const path = req.url.replace('/api/nova-sdk', '');
  
  // Build target URL
  const targetUrl = `https://nova-sdk.com${path}`;
  
  // Forward the request
  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        host: 'nova-sdk.com', // Override host header
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' 
        ? JSON.stringify(req.body) 
        : undefined,
    });
    
    // Get response data
    const data = await response.text();
    
    // Forward response with CORS headers
    res.status(response.status);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle JSON or text
    try {
      res.json(JSON.parse(data));
    } catch {
      res.send(data);
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy request failed' });
  }
}