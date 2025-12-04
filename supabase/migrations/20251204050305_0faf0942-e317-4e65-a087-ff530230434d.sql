-- Enable realtime for bank_transactions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.bank_transactions;

-- Also enable for bank_accounts to track balance changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.bank_accounts;