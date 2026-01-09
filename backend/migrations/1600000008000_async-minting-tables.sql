-- Async Minting System Migration
-- Introduces PostgreSQL-backed job queue for blockchain operations
-- Status flow: frozen (3) -> processing (5) -> completed (4) or error (6)

-- Add new project statuses
INSERT INTO public.project_status (id, status_name) VALUES
(5, 'processing'),
(6, 'error')
ON CONFLICT (id) DO NOTHING;

-- Main job queue table for minting operations
CREATE TABLE public.minting_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,

    -- Job state: pending -> claimed -> processing -> completed/failed/retrying
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'claimed', 'processing', 'completed', 'failed', 'retrying')),

    -- Retry management
    attempt_count INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 1,
    next_retry_at TIMESTAMP WITH TIME ZONE,

    -- Worker tracking (for distributed locking)
    worker_id VARCHAR(100),
    claimed_at TIMESTAMP WITH TIME ZONE,

    -- Input data snapshot (frozen at job creation time)
    minting_data JSONB NOT NULL,

    -- Blockchain results
    tx_hash VARCHAR(66),
    block_number BIGINT,
    gas_used BIGINT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Ensure only one active minting operation per project
-- Prevents duplicate minting attempts
CREATE UNIQUE INDEX idx_minting_ops_unique_active
    ON public.minting_operations(project_id)
    WHERE status IN ('pending', 'claimed', 'processing', 'retrying');

-- Error tracking table for debugging and admin review
CREATE TABLE public.minting_operation_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_id UUID NOT NULL REFERENCES public.minting_operations(id) ON DELETE CASCADE,

    -- Error details
    error_type VARCHAR(100) NOT NULL,
    error_code VARCHAR(50),
    error_message TEXT NOT NULL,
    error_stack TEXT,

    -- Context
    attempt_number INTEGER NOT NULL,
    phase VARCHAR(50) NOT NULL CHECK (phase IN (
        'blockchain_submission',
        'blockchain_confirmation',
        'nft_fetch',
        'db_storage'
    )),

    -- For partial failures (tracks which participants succeeded/failed)
    successful_participants JSONB DEFAULT '[]',
    failed_participants JSONB DEFAULT '[]',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Individual NFT minting results per participant
-- Enables partial failure recovery on retries
CREATE TABLE public.minting_nft_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_id UUID NOT NULL REFERENCES public.minting_operations(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES public.project_participants(id) ON DELETE CASCADE,

    -- NFT data from blockchain
    token_id VARCHAR(100),
    token_uri TEXT,
    nft_address VARCHAR(42),

    -- Status tracking: pending -> minted -> stored or failed
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'minted', 'stored', 'failed')),
    error_message TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    -- Prevent duplicate entries per operation/participant
    UNIQUE(operation_id, participant_id)
);

-- Performance indexes

-- For worker job polling: find pending/retrying jobs efficiently
CREATE INDEX idx_minting_ops_status_retry
    ON public.minting_operations(status, next_retry_at)
    WHERE status IN ('pending', 'retrying');

-- For looking up operations by project
CREATE INDEX idx_minting_ops_project
    ON public.minting_operations(project_id);

-- For detecting stale claimed jobs (crashed workers)
CREATE INDEX idx_minting_ops_claimed
    ON public.minting_operations(worker_id, claimed_at)
    WHERE status = 'claimed';

-- For fetching errors by operation
CREATE INDEX idx_minting_errors_operation
    ON public.minting_operation_errors(operation_id);

-- For fetching NFT results by operation
CREATE INDEX idx_minting_nft_results_operation
    ON public.minting_nft_results(operation_id);

-- For fetching NFT results by participant
CREATE INDEX idx_minting_nft_results_participant
    ON public.minting_nft_results(participant_id);

-- Add comments for documentation
COMMENT ON TABLE public.minting_operations IS 'Job queue for async blockchain minting operations';
COMMENT ON TABLE public.minting_operation_errors IS 'Error history for minting operations, enables admin debugging';
COMMENT ON TABLE public.minting_nft_results IS 'Per-participant NFT minting results for partial failure recovery';

COMMENT ON COLUMN public.minting_operations.status IS 'Job lifecycle: pending -> claimed -> processing -> completed/failed/retrying';
COMMENT ON COLUMN public.minting_operations.minting_data IS 'Snapshot of all data needed for blockchain registration';
COMMENT ON COLUMN public.minting_operations.tx_hash IS 'Blockchain transaction hash when submitted';
COMMENT ON COLUMN public.minting_operation_errors.phase IS 'Which phase of minting failed: blockchain_submission, blockchain_confirmation, nft_fetch, or db_storage';

DO $$
BEGIN
    RAISE NOTICE 'Async minting system tables created successfully';
    RAISE NOTICE 'Added project statuses: processing (5), error (6)';
    RAISE NOTICE 'Created tables: minting_operations, minting_operation_errors, minting_nft_results';
END $$;
