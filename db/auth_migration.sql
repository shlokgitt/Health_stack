-- ============================================================
-- Health Resilience Authentication
-- ============================================================

CREATE TABLE IF NOT EXISTS app_user (
    user_id BIGSERIAL PRIMARY KEY,

    phc_id VARCHAR(12)
        REFERENCES phc(phc_id)
        ON DELETE SET NULL,

    username VARCHAR(100) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    role VARCHAR(30) NOT NULL DEFAULT 'PHC'
        CHECK (role IN ('PHC', 'DISTRICT_ADMIN', 'STATE_ADMIN')),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    last_login_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_app_user_phc
    ON app_user(phc_id);

CREATE INDEX IF NOT EXISTS idx_app_user_active
    ON app_user(is_active);


CREATE TABLE IF NOT EXISTS user_session (
    session_id UUID PRIMARY KEY,

    user_id BIGINT NOT NULL
        REFERENCES app_user(user_id)
        ON DELETE CASCADE,

    token_hash CHAR(64) NOT NULL UNIQUE,

    expires_at TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_session_token
    ON user_session(token_hash);

CREATE INDEX IF NOT EXISTS idx_user_session_expiry
    ON user_session(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_session_user
    ON user_session(user_id);