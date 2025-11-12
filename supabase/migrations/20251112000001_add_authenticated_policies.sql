-- Add RLS policies for authenticated users to access dashboard data

-- Authenticated users have full access to personas
CREATE POLICY "Authenticated users full access personas"
  ON public.personas
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users have full access to leads
CREATE POLICY "Authenticated users full access leads"
  ON public.leads
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users have full access to assignments
CREATE POLICY "Authenticated users full access assignments"
  ON public.assignments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users have full access to events
CREATE POLICY "Authenticated users full access events"
  ON public.events
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users have full access to variants
CREATE POLICY "Authenticated users full access variants"
  ON public.variants
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users have full access to variant_stats
CREATE POLICY "Authenticated users full access variant_stats"
  ON public.variant_stats
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users have full access to error_log
CREATE POLICY "Authenticated users full access error_log"
  ON public.error_log
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users have full access to sync_state
CREATE POLICY "Authenticated users full access sync_state"
  ON public.sync_state
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anon users to insert leads (for public lead form)
CREATE POLICY "Anon users can insert leads"
  ON public.leads
  FOR INSERT
  TO anon
  WITH CHECK (true);
