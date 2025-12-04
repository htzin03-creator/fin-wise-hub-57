-- Create table for bank connections
CREATE TABLE public.bank_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pluggy_item_id TEXT NOT NULL,
  connector_name TEXT,
  connector_logo TEXT,
  status TEXT DEFAULT 'active',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bank_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own bank connections" 
ON public.bank_connections FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bank connections" 
ON public.bank_connections FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bank connections" 
ON public.bank_connections FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bank connections" 
ON public.bank_connections FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_bank_connections_updated_at
BEFORE UPDATE ON public.bank_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();