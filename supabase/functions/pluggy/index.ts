import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLUGGY_API_URL = 'https://api.pluggy.ai';

async function getPluggyApiKey(): Promise<string> {
  const clientId = Deno.env.get('PLUGGY_CLIENT_ID');
  const clientSecret = Deno.env.get('PLUGGY_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('Pluggy credentials not configured');
  }

  console.log('Authenticating with Pluggy API...');
  
  const response = await fetch(`${PLUGGY_API_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, clientSecret }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Pluggy auth error:', errorText);
    throw new Error('Failed to authenticate with Pluggy');
  }

  const data = await response.json();
  console.log('Pluggy authentication successful');
  return data.apiKey;
}

async function createConnectToken(apiKey: string): Promise<string> {
  console.log('Creating Pluggy connect token...');
  
  const response = await fetch(`${PLUGGY_API_URL}/connect_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Pluggy connect token error:', errorText);
    throw new Error('Failed to create connect token');
  }

  const data = await response.json();
  console.log('Connect token created successfully');
  return data.accessToken;
}

async function getItem(apiKey: string, itemId: string) {
  console.log('Fetching Pluggy item:', itemId);
  
  const response = await fetch(`${PLUGGY_API_URL}/items/${itemId}`, {
    headers: { 'X-API-KEY': apiKey },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Pluggy get item error:', errorText);
    throw new Error('Failed to get item');
  }

  return response.json();
}

async function getAccounts(apiKey: string, itemId: string) {
  console.log('Fetching accounts for item:', itemId);
  
  const response = await fetch(`${PLUGGY_API_URL}/accounts?itemId=${itemId}`, {
    headers: { 'X-API-KEY': apiKey },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Pluggy get accounts error:', errorText);
    throw new Error('Failed to get accounts');
  }

  return response.json();
}

async function getTransactions(apiKey: string, accountId: string, from?: string, to?: string) {
  console.log('Fetching transactions for account:', accountId);
  
  let url = `${PLUGGY_API_URL}/transactions?accountId=${accountId}`;
  if (from) url += `&from=${from}`;
  if (to) url += `&to=${to}`;
  
  const response = await fetch(url, {
    headers: { 'X-API-KEY': apiKey },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Pluggy get transactions error:', errorText);
    throw new Error('Failed to get transactions');
  }

  return response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, itemId, accountId, from, to } = await req.json();
    console.log('Pluggy function called with action:', action);

    const apiKey = await getPluggyApiKey();

    let result;

    switch (action) {
      case 'create-connect-token':
        const connectToken = await createConnectToken(apiKey);
        result = { connectToken };
        break;

      case 'get-item':
        if (!itemId) throw new Error('itemId is required');
        result = await getItem(apiKey, itemId);
        break;

      case 'get-accounts':
        if (!itemId) throw new Error('itemId is required');
        result = await getAccounts(apiKey, itemId);
        break;

      case 'get-transactions':
        if (!accountId) throw new Error('accountId is required');
        result = await getTransactions(apiKey, accountId, from, to);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Pluggy function error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
