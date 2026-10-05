-- S9: students cannot mark their own CAPRI response submitted.
--
-- submitted_at gates the certificate and decides which responses count as
-- paired outcomes. Only submitResponse() (service role) may set it, after the
-- answers have been scored. Students may still open their own response row;
-- they may not write anything else on it.
--
-- capri_answers policies are unchanged: a student writes their own answers
-- only while the response is unsubmitted. No data is modified.

DROP POLICY IF EXISTS "Students update own capri responses" ON public.capri_responses;
DROP POLICY IF EXISTS "Students insert own capri responses" ON public.capri_responses;
DROP POLICY IF EXISTS "Students open own capri responses" ON public.capri_responses;

CREATE POLICY "Students open own capri responses"
ON public.capri_responses FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = student_id
  AND submitted_at IS NULL
  AND duration_seconds IS NULL
);

-- Privileges as well as policies: a missing policy silently matches zero rows,
-- a missing privilege fails loudly. INSERT is granted back on the two columns
-- a student needs to open a response, so submitted_at cannot even be named.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.capri_responses FROM anon, authenticated;
GRANT INSERT (administration_id, student_id) ON public.capri_responses TO authenticated;
