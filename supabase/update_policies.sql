-- Allow anonymous access for the MVP phase, especially because the Capture form is public.
-- agency_settings intentionally stays private because it stores integration secrets.
CREATE POLICY "Enable all for anon" ON users FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon" ON clients FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon" ON contract_templates FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon" ON contracts FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon" ON projects FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon" ON project_columns FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon" ON tasks FOR ALL TO anon USING (true) WITH CHECK (true);
