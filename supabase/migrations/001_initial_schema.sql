-- ============================================
-- Panel Flyer Studio — Supabase Schema
-- Multi-tenant with Row-Level Security
-- ============================================

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT DEFAULT '',
  anthropic_api_key TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, now(), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Panel Events
CREATE TABLE IF NOT EXISTS panel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  panel_title TEXT DEFAULT '',
  panel_subtitle TEXT DEFAULT '',
  panel_purpose TEXT DEFAULT '',
  event_date TEXT DEFAULT '',
  event_date_full TEXT DEFAULT '',
  event_date_short TEXT DEFAULT '',
  event_date_minus1 TEXT DEFAULT '',
  discussion_points JSONB DEFAULT '[]'::jsonb,
  brief_topic_description TEXT DEFAULT '',
  panelists JSONB DEFAULT '[]'::jsonb,
  recording_link TEXT DEFAULT '',
  generated_emails JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Event Checklists
CREATE TABLE IF NOT EXISTS event_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES panel_events(id) ON DELETE SET NULL,
  event_type TEXT DEFAULT '',
  event_topic TEXT DEFAULT '',
  event_presenter TEXT DEFAULT '',
  event_date TEXT DEFAULT '',
  event_time TEXT DEFAULT '',
  allocated_ae TEXT DEFAULT '',
  number_of_speakers INTEGER DEFAULT 0,
  team_member TEXT DEFAULT '',
  team_lead TEXT DEFAULT '',
  sheet_url TEXT DEFAULT '',
  tasks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Event Panel Trackers
CREATE TABLE IF NOT EXISTS event_panel_trackers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES panel_events(id) ON DELETE SET NULL,
  event_name TEXT DEFAULT '',
  event_date TEXT DEFAULT '',
  product TEXT DEFAULT 'VET',
  sheet_name TEXT DEFAULT '',
  total_registrations INTEGER DEFAULT 0,
  total_icp_registrations INTEGER DEFAULT 0,
  total_non_icp_registrations INTEGER DEFAULT 0,
  total_attendees INTEGER DEFAULT 0,
  icp_attendees INTEGER DEFAULT 0,
  non_icp_attendees INTEGER DEFAULT 0,
  direct_registrations INTEGER DEFAULT 0,
  partner_registrations INTEGER DEFAULT 0,
  direct_msms_booked INTEGER DEFAULT 0,
  direct_icp_msms_booked INTEGER DEFAULT 0,
  bdr_msms_booked INTEGER DEFAULT 0,
  bdr_icp_msms_booked INTEGER DEFAULT 0,
  direct_msms_completed INTEGER DEFAULT 0,
  bdr_msms_completed INTEGER DEFAULT 0,
  total_icp_msms_booked INTEGER DEFAULT 0,
  total_icp_msms_completed INTEGER DEFAULT 0,
  attendee_list_link TEXT DEFAULT '',
  lead_list_shared_with_sales TEXT DEFAULT '',
  registrations JSONB DEFAULT '[]'::jsonb,
  raw_rows JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Custom Banner Templates
CREATE TABLE IF NOT EXISTS custom_banner_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Template',
  html_template TEXT DEFAULT '',
  variables JSONB DEFAULT '[]'::jsonb,
  cloned_from TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_panel_events_user ON panel_events(user_id);
CREATE INDEX IF NOT EXISTS idx_event_checklists_user ON event_checklists(user_id);
CREATE INDEX IF NOT EXISTS idx_event_panel_trackers_user ON event_panel_trackers(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_banner_templates_user ON custom_banner_templates(user_id);

-- ============================================
-- Row-Level Security (RLS)
-- Users can only access their own data
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE panel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_panel_trackers ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_banner_templates ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Panel Events: full CRUD on own data
CREATE POLICY "Users can view own events" ON panel_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own events" ON panel_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own events" ON panel_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own events" ON panel_events FOR DELETE USING (auth.uid() = user_id);

-- Event Checklists
CREATE POLICY "Users can view own checklists" ON event_checklists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own checklists" ON event_checklists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own checklists" ON event_checklists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own checklists" ON event_checklists FOR DELETE USING (auth.uid() = user_id);

-- Event Panel Trackers
CREATE POLICY "Users can view own trackers" ON event_panel_trackers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trackers" ON event_panel_trackers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trackers" ON event_panel_trackers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trackers" ON event_panel_trackers FOR DELETE USING (auth.uid() = user_id);

-- Custom Banner Templates
CREATE POLICY "Users can view own templates" ON custom_banner_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own templates" ON custom_banner_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON custom_banner_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON custom_banner_templates FOR DELETE USING (auth.uid() = user_id);
