
-- Add participant_visibility column to activities
ALTER TABLE activities ADD COLUMN participant_visibility text NOT NULL DEFAULT 'public';

-- Allow organizers to insert bookings (for adding guests with user_id = null)
CREATE POLICY "Organizers can add guests" ON bookings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM activity_sessions s
      JOIN activities a ON s.activity_id = a.id
      WHERE s.id = bookings.session_id AND a.organizer_id = auth.uid()
    )
  );

-- Allow organizers to delete bookings (for removing guests)
CREATE POLICY "Organizers can delete guest bookings" ON bookings
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM activity_sessions s
      JOIN activities a ON s.activity_id = a.id
      WHERE s.id = bookings.session_id AND a.organizer_id = auth.uid()
    )
  );
