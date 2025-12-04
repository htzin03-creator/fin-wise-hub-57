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

async function getTransactions(apiKey: string, accountId: string, from?: string) {
  console.log('Fetching transactions for account:', accountId);
  
  let url = `${PLUGGY_API_URL}/transactions?accountId=${accountId}&pageSize=500`;
  if (from) url += `&from=${from}`;
  
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

// Helper function to get authenticated user from JWT
async function getAuthenticatedUser(req: Request, supabase: any): Promise<string> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    throw new Error('Missing authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    console.error('Auth error:', error);
    throw new Error('Invalid or expired token');
  }

  console.log('Authenticated user:', user.id);
  return user.id;
}

// Helper function to verify user owns the connection
async function verifyConnectionOwnership(
  supabase: any, 
  connectionId: string, 
  userId: string
): Promise<void> {
  const { data: connection, error } = await supabase
    .from('bank_connections')
    .select('user_id')
    .eq('id', connectionId)
    .single();

  if (error || !connection) {
    throw new Error('Connection not found');
  }

  if (connection.user_id !== userId) {
    console.error('Authorization failed: user', userId, 'tried to access connection owned by', connection.user_id);
    throw new Error('Not authorized to access this connection');
  }

  console.log('Connection ownership verified for user:', userId);
}

// deno-lint-ignore no-explicit-any
async function syncBankData(
  apiKey: string, 
  itemId: string, 
  connectionId: string, 
  userId: string,
  supabase: any
) {
  console.log('Starting sync for item:', itemId, 'connection:', connectionId, 'user:', userId);
  
  // Get accounts from Pluggy
  const accountsResponse = await getAccounts(apiKey, itemId);
  const accounts = accountsResponse.results || [];
  
  console.log(`Found ${accounts.length} accounts from Pluggy`);
  
  let syncedAccountsCount = 0;
  let syncedTransactionsCount = 0;
  
  // deno-lint-ignore no-explicit-any
  for (const account of accounts as any[]) {
    console.log(`Processing account: ${account.name} (${account.id}), balance: ${account.balance}`);
    
    // Check if account already exists
    const { data: existingAccount } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('pluggy_account_id', account.id)
      .maybeSingle();
    
    let bankAccountId: string;
    
    if (existingAccount) {
      // Update existing account
      console.log('Updating existing account:', existingAccount.id);
      await supabase
        .from('bank_accounts')
        .update({
          name: account.name,
          type: account.type,
          subtype: account.subtype,
          balance: account.balance,
          currency: account.currencyCode || 'BRL',
          bank_data: account,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingAccount.id);
      
      bankAccountId = existingAccount.id;
    } else {
      // Insert new account
      console.log('Creating new account');
      const { data: newAccount, error: insertError } = await supabase
        .from('bank_accounts')
        .insert({
          user_id: userId,
          bank_connection_id: connectionId,
          pluggy_account_id: account.id,
          name: account.name,
          type: account.type,
          subtype: account.subtype,
          balance: account.balance,
          currency: account.currencyCode || 'BRL',
          bank_data: account,
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error inserting account:', insertError);
        continue;
      }
      bankAccountId = newAccount.id;
    }
    
    syncedAccountsCount++;
    
    // Fetch transactions for this account (last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    try {
      const transactionsResponse = await getTransactions(
        apiKey, 
        account.id,
        threeMonthsAgo.toISOString().split('T')[0]
      );
      const transactions = transactionsResponse.results || [];
      
      console.log(`Found ${transactions.length} transactions for account ${account.name}`);
      
      // deno-lint-ignore no-explicit-any
      for (const tx of transactions as any[]) {
        // Check if transaction already exists
        const { data: existingTx } = await supabase
          .from('bank_transactions')
          .select('id')
          .eq('pluggy_transaction_id', tx.id)
          .maybeSingle();
        
        if (!existingTx) {
          const { error: txError } = await supabase
            .from('bank_transactions')
            .insert({
              user_id: userId,
              bank_account_id: bankAccountId,
              pluggy_transaction_id: tx.id,
              description: tx.description,
              amount: tx.amount,
              date: tx.date,
              type: tx.type,
              category: tx.category,
              payment_data: tx,
            });
          
          if (!txError) {
            syncedTransactionsCount++;
          } else {
            console.error('Error inserting transaction:', txError);
          }
        }
      }
    } catch (txError) {
      console.error('Error fetching transactions:', txError);
    }
  }
  
  // Update last_sync_at on connection
  await supabase
    .from('bank_connections')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('id', connectionId);
  
  console.log(`Sync complete: ${syncedAccountsCount} accounts, ${syncedTransactionsCount} transactions`);
  
  return {
    accounts: syncedAccountsCount,
    transactions: syncedTransactionsCount,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client for operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user from JWT token - NEVER trust client-supplied userId
    const authenticatedUserId = await getAuthenticatedUser(req, supabase);

    const { action, itemId, accountId, connectionId, from } = await req.json();
    console.log('Pluggy function called with action:', action, 'by user:', authenticatedUserId);

    const apiKey = await getPluggyApiKey();

    let result;

    switch (action) {
      case 'create-connect-token':
        const connectToken = await createConnectToken(apiKey);
        result = { connectToken };
        break;

      case 'get-accounts':
        if (!itemId) throw new Error('itemId is required');
        result = await getAccounts(apiKey, itemId);
        break;

      case 'get-transactions':
        if (!accountId) throw new Error('accountId is required');
        result = await getTransactions(apiKey, accountId, from);
        break;

      case 'sync':
        if (!itemId) throw new Error('itemId is required');
        if (!connectionId) throw new Error('connectionId is required');
        
        // Verify the authenticated user owns this connection before syncing
        await verifyConnectionOwnership(supabase, connectionId, authenticatedUserId);
        
        // Use authenticated userId, NOT client-supplied value
        result = await syncBankData(apiKey, itemId, connectionId, authenticatedUserId, supabase);
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
    
    // Return appropriate status codes
    const status = message.includes('authorization') || message.includes('authorized') || message.includes('token') 
      ? 401 
      : 500;
    
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
