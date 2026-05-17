CREATE POLICY "Users create own withdrawals"
ON public.withdrawals
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND status = 'pending'::withdrawal_status);