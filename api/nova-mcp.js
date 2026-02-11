/**
 * Proxy for nova-mcp.fastmcp.app requests
 * Route: /api/nova-mcp/*
 */
export default async function handler(req, res) {
  // Get the path after /api/nova-mcp/
  const path = req.url.replace('/api/nova-mcp', '');
  
  // Build target URL
  const targetUrl = `https://nova-mcp.fastmcp.app${path}`;
  
  // Forward the request
  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        host: 'nova-mcp.fastmcp.app',
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' 
        ? JSON.stringify(req.body) 
        : undefined,
    });
    
    const data = await response.text();
    
    res.status(response.status);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
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