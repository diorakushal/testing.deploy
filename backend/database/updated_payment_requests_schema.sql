-- Updated payment_requests table schema with requester_user_id
-- This should match your current production schema plus the new column

CREATE TABLE public.payment_requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  requester_address character varying NOT NULL,
  requester_user_id uuid, -- NEW: Links to authenticated user account (users.id)
  amount numeric NOT NULL,
  token_symbol character varying DEFAULT 'USDC'::character varying,
  token_address character varying NOT NULL,
  chain_id character varying NOT NULL,
  chain_name character varying NOT NULL,
  caption text,
  status character varying DEFAULT 'open'::character varying,
  paid_by character varying,
  tx_hash character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  paid_at timestamp without time zone,
  wallet_type character varying,
  requester_wallet character varying,
  CONSTRAINT payment_requests_pkey PRIMARY KEY (id),
  CONSTRAINT payment_requests_requester_user_id_fkey FOREIGN KEY (requester_user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_payment_requests_requester_user_id ON public.payment_requests(requester_user_id);



