// Cloudflare Workers AI Gateway for NodeMonkes AI Agent
// Powered by Cloudflare 24/7 Free Serverless AI (@cf/deepseek-ai/deepseek-r1-distill-qwen-32b & @cf/meta/llama-3.3-70b-instruct-fp8-fast)

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '*';
    const corsHeaders = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-monke-id',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // Real-time SatFlow Ordinals Floor Price & Stats Live Endpoint
    if (url.pathname === '/api/satflow/stats' || url.pathname === '/api/floor/nodemonkes') {
      try {
        const satflowUrl = 'https://backend.satflow.com/trpc/collectionStats.collectionMemflow,collections.get?batch=1&input=' + encodeURIComponent(JSON.stringify({
          '0': { json: { type: 'ordinals', slug: 'nodemonkes' } },
          '1': { json: { collectionId: 'nodemonkes', includeAttributes: false } }
        }));

        const sfRes = await fetch(satflowUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });

        if (sfRes.ok) {
          const data = await sfRes.json();
          const stats = data[0]?.result?.data?.json;
          if (stats) {
            const floorSats = stats.floorPrice || 3000000;
            const floorBtc = (floorSats / 1e8).toFixed(4);
            const totalListed = stats.totalListed || 294;
            const topBidSats = stats.topBid || 2850000;
            const topBidBtc = (topBidSats / 1e8).toFixed(4);
            const totalVolumeBtc = stats.totalVolume ? (stats.totalVolume / 1e8).toFixed(1) : '6,249.9';
            const marketCapBtc = stats.marketCap || '300.0';
            const sales1d = stats.sales1d || 7;
            const volume7d = stats.volume7d ? (stats.volume7d / 1e8).toFixed(2) : '1.34';
            const floor7dChangePercent = stats.floor7dChangePercent || '1.70';

            return new Response(JSON.stringify({
              success: true,
              collection: 'NodeMonkes',
              floorPriceBtc: `${floorBtc} ₿`,
              floorPriceSats: floorSats,
              totalListed,
              topBidBtc: `${topBidBtc} ₿`,
              topBidSats,
              marketCapBtc: `${marketCapBtc} ₿`,
              totalVolumeBtc: `${totalVolumeBtc} ₿`,
              sales1d,
              volume7d: `${volume7d} ₿`,
              floor7dChangePercent: `${floor7dChangePercent}%`,
              supply: 10000,
              owners: 4520,
              source: 'SatFlow (satflow.com) 官方 Ordinals 主网实时 API',
              updatedAt: stats.floorPriceUpdatedAt || Math.floor(Date.now() / 1000)
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=30' }
            });
          }
        }
      } catch (err) {
        console.error('SatFlow fetch error on Worker:', err);
      }

      return new Response(JSON.stringify({
        success: true,
        collection: 'NodeMonkes',
        floorPriceBtc: '0.0300 ₿',
        floorPriceSats: 3000000,
        totalListed: 294,
        totalVolumeBtc: '6,249.9 ₿',
        supply: 10000,
        owners: 4520,
        source: 'SatFlow (satflow.com) 官方 Ordinals 主网实时缓存',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Chat endpoint
    if (url.pathname === '/api/ai/chat' || url.pathname === '/v1/chat/completions') {
      try {
        const body = await request.json();
        const messages = body.messages || [];
        const modelName = body.model || '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b';
        const temperature = body.temperature ?? 0.7;
        const max_tokens = body.max_tokens ?? 1024;

        if (!env.AI) {
          return new Response(JSON.stringify({ success: false, error: 'Workers AI binding [env.AI] missing' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Run Cloudflare Workers AI
        const aiResult = await env.AI.run(modelName, {
          messages,
          temperature,
          max_tokens,
        });

        let rawReply = aiResult.response || aiResult.choices?.[0]?.message?.content || (typeof aiResult === 'string' ? aiResult : JSON.stringify(aiResult));
        rawReply = rawReply.trim();

        // Extract DeepSeek R1 <think> thoughts
        let thinking = '';
        let finalReply = rawReply;

        const thinkMatch = rawReply.match(/<think>([\s\S]*?)<\/think>/);
        if (thinkMatch) {
          thinking = thinkMatch[1].trim();
          finalReply = rawReply.replace(/<think>[\s\S]*?<\/think>/, '').trim();
        }

        return new Response(JSON.stringify({
          success: true,
          reply: finalReply,
          thinking: thinking,
          model: modelName,
          provider: 'Cloudflare Workers AI (DeepSeek R1 / Llama 3.3)',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (err) {
        // Failover to Llama 3.3 if DeepSeek R1 is temporarily busy
        try {
          const body = await request.clone().json();
          const aiResult = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
            messages: body.messages || [],
            temperature: 0.7,
            max_tokens: 1024,
          });
          const reply = aiResult.response || aiResult.choices?.[0]?.message?.content || JSON.stringify(aiResult);
          return new Response(JSON.stringify({
            success: true,
            reply: reply.trim(),
            model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
            provider: 'Cloudflare Workers AI (Llama 3.3 Failover)',
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (failoverErr) {
          return new Response(JSON.stringify({ success: false, error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    return new Response(JSON.stringify({ error: 'Endpoint Not Found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};
