-- Create notification_preferences table in the portal schema
CREATE TABLE IF NOT EXISTS portal.notification_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id uuid NOT NULL REFERENCES portal.organizations(id) ON DELETE CASCADE,
    enabled boolean NOT NULL DEFAULT true,
    frequency text NOT NULL DEFAULT 'daily'
        CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    delivery_time time NOT NULL DEFAULT '08:00',
    delivery_day_of_week smallint
        CHECK (delivery_day_of_week IS NULL OR (delivery_day_of_week BETWEEN 1 AND 7)),
    delivery_day_of_month smallint
        CHECK (delivery_day_of_month IS NULL OR (delivery_day_of_month BETWEEN 1 AND 28)),
    sections jsonb NOT NULL DEFAULT '{
        "summary": true,
        "new_bills": true,
        "abnormal_bills": true,
        "active_bill_calendar": true,
        "arrears_and_penalties": true,
        "site_lag_alerts": true,
        "low_balance_connections": true
    }'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for querying by org
CREATE INDEX IF NOT EXISTS idx_notification_preferences_org_id
    ON portal.notification_preferences(org_id);

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION portal.update_notification_preferences_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notification_preferences_updated_at
    BEFORE UPDATE ON portal.notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION portal.update_notification_preferences_updated_at();

-- RLS policies
ALTER TABLE portal.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can read their own preferences
CREATE POLICY "Users can read own notification preferences"
    ON portal.notification_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own notification preferences"
    ON portal.notification_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own notification preferences"
    ON portal.notification_preferences
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admins can read all preferences within their organization
CREATE POLICY "Admins can read org notification preferences"
    ON portal.notification_preferences
    FOR SELECT
    USING (
        org_id IN (
            SELECT (raw_user_meta_data->>'org_id')::uuid
            FROM auth.users
            WHERE id = auth.uid()
              AND raw_user_meta_data->>'role' = 'admin'
        )
    );
