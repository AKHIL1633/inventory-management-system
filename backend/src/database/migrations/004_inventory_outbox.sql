
CREATE TABLE IF NOT EXISTS inventory_outbox (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    event_id UUID NOT NULL UNIQUE,

    event_type VARCHAR(30) NOT NULL
        CHECK (event_type IN ('PURCHASE', 'SALE')),

    aggregate_type VARCHAR(50) NOT NULL DEFAULT 'PRODUCT',

    aggregate_id BIGINT NOT NULL,

    payload JSONB NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'PUBLISHED')),

    attempts INTEGER NOT NULL DEFAULT 0
        CHECK (attempts >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    published_at TIMESTAMPTZ,

    last_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_inventory_outbox_pending
    ON inventory_outbox(created_at, id)
    WHERE status = 'PENDING';

CREATE INDEX IF NOT EXISTS idx_inventory_outbox_event_type
    ON inventory_outbox(event_type);
