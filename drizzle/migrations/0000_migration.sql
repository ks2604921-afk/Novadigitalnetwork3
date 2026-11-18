-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Phone accounts (server-only)
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL UNIQUE,
  display_name text,
  pin_hash text,
  pin_salt text,
  is_blocked boolean NOT NULL DEFAULT false,
  subscription_status text NOT NULL DEFAULT 'expired',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.users TO service_role;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code text NOT NULL,
  consumed boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX otp_codes_phone_idx ON public.otp_codes (phone, created_at DESC);
GRANT ALL ON public.otp_codes TO service_role;
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.sessions (
  token text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_idx ON public.sessions (user_id);
GRANT ALL ON public.sessions TO service_role;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.watching_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  avatar text NOT NULL DEFAULT 'orbit',
  kid boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX watching_profiles_user_idx ON public.watching_profiles (user_id);
GRANT ALL ON public.watching_profiles TO service_role;
ALTER TABLE public.watching_profiles ENABLE ROW LEVEL SECURITY;

-- Push (server-only)
CREATE TABLE public.nova_push_config (
  id integer PRIMARY KEY CHECK (id = 1),
  public_key text NOT NULL,
  private_jwk jsonb NOT NULL
);
GRANT ALL ON public.nova_push_config TO service_role;
ALTER TABLE public.nova_push_config ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.nova_push_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL UNIQUE,
  subscription jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.nova_push_devices TO service_role;
ALTER TABLE public.nova_push_devices ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.nova_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  path text NOT NULL DEFAULT '/',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nova_announcements TO authenticated;
GRANT ALL ON public.nova_announcements TO service_role;
ALTER TABLE public.nova_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage announcements" ON public.nova_announcements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Storage providers (admin only)
CREATE TABLE public.storage_providers (
  id text PRIMARY KEY,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  connection_status text NOT NULL DEFAULT 'not_configured',
  is_active boolean NOT NULL DEFAULT false,
  is_enabled boolean NOT NULL DEFAULT false,
  last_test_message text,
  last_tested_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX storage_providers_one_active ON public.storage_providers (is_active) WHERE is_active;
CREATE TRIGGER storage_providers_updated_at BEFORE UPDATE ON public.storage_providers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
GRANT SELECT, INSERT, UPDATE, DELETE ON public.storage_providers TO authenticated;
GRANT ALL ON public.storage_providers TO service_role;
ALTER TABLE public.storage_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage storage providers" ON public.storage_providers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Catalog
CREATE TABLE public.shows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  thumbnail_url text,
  banner_url text,
  mobile_banner_url text,
  banner_start_at timestamptz,
  banner_end_at timestamptz,
  video_url text,
  video_asset_id uuid,
  category text,
  content_type text NOT NULL DEFAULT 'movie',
  genres text[] NOT NULL DEFAULT '{}',
  languages text[] NOT NULL DEFAULT '{}',
  rating numeric,
  release_year integer,
  is_featured boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX shows_published_idx ON public.shows (is_published, created_at DESC);
CREATE TRIGGER shows_updated_at BEFORE UPDATE ON public.shows FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
GRANT SELECT ON public.shows TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shows TO authenticated;
GRANT ALL ON public.shows TO service_role;
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads published shows" ON public.shows FOR SELECT TO anon, authenticated USING (is_published);
CREATE POLICY "Admins manage shows" ON public.shows FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  season_number integer NOT NULL,
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (show_id, season_number)
);
CREATE TRIGGER seasons_updated_at BEFORE UPDATE ON public.seasons FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
GRANT SELECT ON public.seasons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seasons TO authenticated;
GRANT ALL ON public.seasons TO service_role;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads seasons of published shows" ON public.seasons FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.shows s WHERE s.id = show_id AND s.is_published));
CREATE POLICY "Admins manage seasons" ON public.seasons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  season_id uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  episode_number integer NOT NULL,
  title text NOT NULL,
  description text,
  thumbnail_url text,
  stream_url text,
  duration_seconds integer,
  release_date date,
  language text,
  access_tier text NOT NULL DEFAULT 'free',
  publish_status text NOT NULL DEFAULT 'published',
  scheduled_at timestamptz,
  video_asset_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (season_id, episode_number)
);
CREATE INDEX episodes_show_idx ON public.episodes (show_id);
CREATE TRIGGER episodes_updated_at BEFORE UPDATE ON public.episodes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
GRANT SELECT ON public.episodes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.episodes TO authenticated;
GRANT ALL ON public.episodes TO service_role;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads published episodes" ON public.episodes FOR SELECT TO anon, authenticated
  USING (publish_status = 'published' AND EXISTS (SELECT 1 FROM public.shows s WHERE s.id = show_id AND s.is_published));
CREATE POLICY "Admins manage episodes" ON public.episodes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Media metadata (admin only)
CREATE TABLE public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id text REFERENCES public.storage_providers(id) ON DELETE SET NULL,
  show_id uuid REFERENCES public.shows(id) ON DELETE SET NULL,
  episode_id uuid REFERENCES public.episodes(id) ON DELETE SET NULL,
  replaced_asset_id uuid REFERENCES public.media_assets(id) ON DELETE SET NULL,
  asset_kind text NOT NULL,
  original_filename text NOT NULL,
  mime_type text NOT NULL,
  file_size_bytes bigint NOT NULL,
  duration_seconds integer,
  width integer,
  height integer,
  storage_key text,
  thumbnail_key text,
  hls_manifest_key text,
  dash_manifest_key text,
  playback_manifest_ref text,
  upload_status text NOT NULL DEFAULT 'pending',
  processing_status text NOT NULL DEFAULT 'pending',
  error_message text,
  is_current boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX media_assets_show_idx ON public.media_assets (show_id);
CREATE INDEX media_assets_episode_idx ON public.media_assets (episode_id);
CREATE TRIGGER media_assets_updated_at BEFORE UPDATE ON public.media_assets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage media assets" ON public.media_assets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.shows ADD CONSTRAINT shows_video_asset_id_fkey FOREIGN KEY (video_asset_id) REFERENCES public.media_assets(id) ON DELETE SET NULL;
ALTER TABLE public.episodes ADD CONSTRAINT episodes_video_asset_id_fkey FOREIGN KEY (video_asset_id) REFERENCES public.media_assets(id) ON DELETE SET NULL;

CREATE TABLE public.video_processing_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
  job_type text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  progress integer NOT NULL DEFAULT 0,
  provider_job_id text,
  output_key text,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX video_processing_jobs_asset_idx ON public.video_processing_jobs (asset_id);
CREATE TRIGGER video_processing_jobs_updated_at BEFORE UPDATE ON public.video_processing_jobs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_processing_jobs TO authenticated;
GRANT ALL ON public.video_processing_jobs TO service_role;
ALTER TABLE public.video_processing_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage processing jobs" ON public.video_processing_jobs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.video_subtitles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id text REFERENCES public.storage_providers(id) ON DELETE SET NULL,
  show_id uuid REFERENCES public.shows(id) ON DELETE SET NULL,
  episode_id uuid REFERENCES public.episodes(id) ON DELETE SET NULL,
  label text NOT NULL,
  language_code text NOT NULL,
  format text NOT NULL,
  original_filename text NOT NULL,
  file_size_bytes bigint NOT NULL,
  storage_key text,
  upload_status text NOT NULL DEFAULT 'pending',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX video_subtitles_episode_idx ON public.video_subtitles (episode_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_subtitles TO authenticated;
GRANT ALL ON public.video_subtitles TO service_role;
ALTER TABLE public.video_subtitles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage subtitles" ON public.video_subtitles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Live TV
CREATE TABLE public.live_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  stream_url text NOT NULL,
  logo_url text,
  category text NOT NULL DEFAULT 'Entertainment',
  language text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER live_channels_updated_at BEFORE UPDATE ON public.live_channels FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
GRANT SELECT ON public.live_channels TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.live_channels TO authenticated;
GRANT ALL ON public.live_channels TO service_role;
ALTER TABLE public.live_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active channels" ON public.live_channels FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "Admins manage channels" ON public.live_channels FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Clips & Coming Soon
CREATE TABLE public.discovery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  video_url text NOT NULL,
  release_at timestamptz,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.discovery_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.discovery_items TO authenticated;
GRANT ALL ON public.discovery_items TO service_role;
ALTER TABLE public.discovery_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads published discovery items" ON public.discovery_items FOR SELECT TO anon, authenticated USING (is_published);
CREATE POLICY "Admins manage discovery items" ON public.discovery_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));