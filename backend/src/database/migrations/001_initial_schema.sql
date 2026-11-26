
CREATE TABLE IF NOT EXISTS products (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    sku VARCHAR(80) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_batches (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id),
    quantity_purchased NUMERIC(14, 3) NOT NULL
        CHECK (quantity_purchased > 0),
    quantity_remaining NUMERIC(14, 3) NOT NULL
        CHECK (quantity_remaining >= 0),
    unit_cost NUMERIC(14, 2) NOT NULL
        CHECK (unit_cost >= 0),
    purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT batch_remaining_not_exceed_purchased
        CHECK (quantity_remaining <= quantity_purchased)
);

CREATE TABLE IF NOT EXISTS sales (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reference VARCHAR(100) UNIQUE,
    total_revenue NUMERIC(14, 2) NOT NULL DEFAULT 0
        CHECK (total_revenue >= 0),
    total_cost NUMERIC(14, 2) NOT NULL DEFAULT 0
        CHECK (total_cost >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sale_id BIGINT NOT NULL REFERENCES sales(id),
    product_id BIGINT NOT NULL REFERENCES products(id),
    quantity_sold NUMERIC(14, 3) NOT NULL
        CHECK (quantity_sold > 0),
    unit_sale_price NUMERIC(14, 2) NOT NULL
        CHECK (unit_sale_price >= 0),
    revenue NUMERIC(14, 2) NOT NULL
        CHECK (revenue >= 0),
    cost_of_goods_sold NUMERIC(14, 2) NOT NULL DEFAULT 0
        CHECK (cost_of_goods_sold >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_item_batch_allocations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sale_item_id BIGINT NOT NULL REFERENCES sale_items(id),
    batch_id BIGINT NOT NULL REFERENCES inventory_batches(id),
    quantity_consumed NUMERIC(14, 3) NOT NULL
        CHECK (quantity_consumed > 0),
    unit_cost NUMERIC(14, 2) NOT NULL
        CHECK (unit_cost >= 0),
    total_cost NUMERIC(14, 2) NOT NULL
        CHECK (total_cost >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_sale_item_batch
        UNIQUE (sale_item_id, batch_id)
);

CREATE INDEX IF NOT EXISTS idx_batches_product_purchase_date
    ON inventory_batches(product_id, purchased_at, id);

CREATE INDEX IF NOT EXISTS idx_sale_items_product
    ON sale_items(product_id);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale
    ON sale_items(sale_id);

CREATE INDEX IF NOT EXISTS idx_allocations_batch
    ON sale_item_batch_allocations(batch_id);

CREATE INDEX IF NOT EXISTS idx_sales_created_at
    ON sales(created_at);
