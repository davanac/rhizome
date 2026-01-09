// path: /src/services/minting.service.js
// Service for managing async minting operations (PostgreSQL-backed job queue)

import pool from "#database/database.js";
import Config from "#config";

/**
 * Creates a new minting operation for a project
 * @param {string} projectId - Project UUID
 * @param {Object} mintingData - All data needed for blockchain registration
 * @returns {Object} Created operation
 */
export async function createMintingOperation(projectId, mintingData) {
  const query = `
    INSERT INTO public.minting_operations (project_id, minting_data, status)
    VALUES ($1, $2, 'pending')
    RETURNING *
  `;

  try {
    const result = await pool.query(query, [projectId, JSON.stringify(mintingData)]);
    console.log(`=== [MINTING] Operation created === key: 200001 ===`);
    console.log(`    Operation ID: ${result.rows[0].id}`);
    console.log(`    Project ID: ${projectId}`);
    console.log(`    Timestamp: ${new Date().toISOString()}`);
    console.log('=================================');

    return {
      success: true,
      data: result.rows[0]
    };
  } catch (error) {
    console.log('=== error === minting.service.js === createMintingOperation === key: 200002 ===');
    console.dir(error, { depth: null, colors: true });
    console.log('=================================');

    // Check for unique constraint violation (already has active operation)
    if (error.code === '23505') {
      return {
        success: false,
        message: "Project already has an active minting operation",
        errorKey: 200002,
        errorCode: "minting-operation-exists",
        fromError: !Config.IN_PROD ? error.message : null,
      };
    }

    return {
      success: false,
      message: "Error creating minting operation",
      errorKey: 200002,
      errorCode: "create-minting-operation-failed",
      fromError: !Config.IN_PROD ? error.message : null,
    };
  }
}

/**
 * Claims the next available job for processing
 * Uses SELECT FOR UPDATE SKIP LOCKED for safe concurrent access
 * @param {string} workerId - Unique identifier for the worker
 * @returns {Object|null} Claimed job or null if none available
 */
export async function claimNextJob(workerId) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Select next pending or retrying job
    const selectQuery = `
      SELECT * FROM public.minting_operations
      WHERE status = 'pending'
         OR (status = 'retrying' AND next_retry_at <= NOW())
      ORDER BY created_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    `;
    const result = await client.query(selectQuery);

    if (result.rowCount === 0) {
      await client.query('COMMIT');
      return null;
    }

    const job = result.rows[0];

    // Claim the job
    const updateQuery = `
      UPDATE public.minting_operations
      SET status = 'claimed',
          worker_id = $1,
          claimed_at = NOW(),
          attempt_count = attempt_count + 1
      WHERE id = $2
      RETURNING *
    `;
    const updated = await client.query(updateQuery, [workerId, job.id]);
    await client.query('COMMIT');

    console.log(`=== [MINTING] Job claimed === key: 200003 ===`);
    console.log(`    Operation ID: ${job.id}`);
    console.log(`    Project ID: ${job.project_id}`);
    console.log(`    Worker ID: ${workerId}`);
    console.log(`    Attempt: ${updated.rows[0].attempt_count}`);
    console.log(`    Timestamp: ${new Date().toISOString()}`);
    console.log('=================================');

    return updated.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.log('=== error === minting.service.js === claimNextJob === key: 200004 ===');
    console.dir(error, { depth: null, colors: true });
    console.log('=================================');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Updates operation status and blockchain results
 * @param {string} operationId - Operation UUID
 * @param {Object} updates - Fields to update
 * @returns {Object} Updated operation
 */
export async function updateOperationStatus(operationId, updates) {
  const {
    status,
    txHash,
    blockNumber,
    gasUsed,
    startedAt,
    completedAt
  } = updates;

  const setClauses = [];
  const values = [];
  let paramIndex = 1;

  if (status !== undefined) {
    setClauses.push(`status = $${paramIndex++}`);
    values.push(status);
  }
  if (txHash !== undefined) {
    setClauses.push(`tx_hash = $${paramIndex++}`);
    values.push(txHash);
  }
  if (blockNumber !== undefined) {
    setClauses.push(`block_number = $${paramIndex++}`);
    values.push(blockNumber);
  }
  if (gasUsed !== undefined) {
    setClauses.push(`gas_used = $${paramIndex++}`);
    values.push(gasUsed);
  }
  if (startedAt !== undefined) {
    setClauses.push(`started_at = $${paramIndex++}`);
    values.push(startedAt);
  }
  if (completedAt !== undefined) {
    setClauses.push(`completed_at = $${paramIndex++}`);
    values.push(completedAt);
  }

  if (setClauses.length === 0) {
    return { success: true, message: "No updates provided" };
  }

  values.push(operationId);
  const query = `
    UPDATE public.minting_operations
    SET ${setClauses.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  try {
    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      return {
        success: false,
        message: "Operation not found",
        errorKey: 200005,
        errorCode: "operation-not-found"
      };
    }

    console.log(`=== [MINTING] Operation updated === key: 200006 ===`);
    console.log(`    Operation ID: ${operationId}`);
    console.log(`    New status: ${status || 'unchanged'}`);
    console.log(`    TX Hash: ${txHash || 'N/A'}`);
    console.log(`    Timestamp: ${new Date().toISOString()}`);
    console.log('=================================');

    return {
      success: true,
      data: result.rows[0]
    };
  } catch (error) {
    console.log('=== error === minting.service.js === updateOperationStatus === key: 200007 ===');
    console.dir(error, { depth: null, colors: true });
    console.log('=================================');
    return {
      success: false,
      message: "Error updating operation status",
      errorKey: 200007,
      errorCode: "update-operation-failed",
      fromError: !Config.IN_PROD ? error.message : null,
    };
  }
}

/**
 * Records an error for an operation
 * @param {string} operationId - Operation UUID
 * @param {Object} errorDetails - Error information
 * @returns {Object} Created error record
 */
export async function recordError(operationId, errorDetails) {
  const {
    errorType,
    errorCode,
    errorMessage,
    errorStack,
    attemptNumber,
    phase,
    successfulParticipants = [],
    failedParticipants = []
  } = errorDetails;

  const query = `
    INSERT INTO public.minting_operation_errors
    (operation_id, error_type, error_code, error_message, error_stack,
     attempt_number, phase, successful_participants, failed_participants)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;

  try {
    const result = await pool.query(query, [
      operationId,
      errorType,
      errorCode,
      errorMessage,
      errorStack,
      attemptNumber,
      phase,
      JSON.stringify(successfulParticipants),
      JSON.stringify(failedParticipants)
    ]);

    console.log(`=== [MINTING] Error recorded === key: 200008 ===`);
    console.log(`    Operation ID: ${operationId}`);
    console.log(`    Error type: ${errorType}`);
    console.log(`    Phase: ${phase}`);
    console.log(`    Attempt: ${attemptNumber}`);
    console.log(`    Timestamp: ${new Date().toISOString()}`);
    console.log('=================================');

    return {
      success: true,
      data: result.rows[0]
    };
  } catch (error) {
    console.log('=== error === minting.service.js === recordError === key: 200009 ===');
    console.dir(error, { depth: null, colors: true });
    console.log('=================================');
    return {
      success: false,
      message: "Error recording minting error",
      errorKey: 200009,
      errorCode: "record-error-failed",
      fromError: !Config.IN_PROD ? error.message : null,
    };
  }
}

/**
 * Schedules a retry with exponential backoff
 * @param {string} operationId - Operation UUID
 * @returns {Object} Updated operation with retry scheduled
 */
export async function scheduleRetry(operationId) {
  // First get current attempt count
  const getQuery = `SELECT attempt_count, max_attempts FROM public.minting_operations WHERE id = $1`;

  try {
    const current = await pool.query(getQuery, [operationId]);
    if (current.rowCount === 0) {
      return {
        success: false,
        message: "Operation not found",
        errorKey: 200010,
        errorCode: "operation-not-found"
      };
    }

    const { attempt_count, max_attempts } = current.rows[0];

    // Check if max retries reached
    if (attempt_count >= max_attempts) {
      return {
        success: false,
        message: "Max retries reached",
        errorKey: 200011,
        errorCode: "max-retries-reached"
      };
    }

    // Calculate exponential backoff: 30s * 2^(attempt-1)
    const baseDelayMs = parseInt(process.env.MINTING_RETRY_BASE_DELAY_MS) || 30000;
    const delayMs = baseDelayMs * Math.pow(2, attempt_count - 1);
    const nextRetry = new Date(Date.now() + delayMs);

    const updateQuery = `
      UPDATE public.minting_operations
      SET status = 'retrying',
          next_retry_at = $1,
          worker_id = NULL,
          claimed_at = NULL
      WHERE id = $2
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [nextRetry, operationId]);

    console.log(`=== [MINTING] Retry scheduled === key: 200012 ===`);
    console.log(`    Operation ID: ${operationId}`);
    console.log(`    Attempt: ${attempt_count}`);
    console.log(`    Next retry: ${nextRetry.toISOString()}`);
    console.log(`    Delay: ${delayMs}ms`);
    console.log(`    Timestamp: ${new Date().toISOString()}`);
    console.log('=================================');

    return {
      success: true,
      data: result.rows[0],
      nextRetryAt: nextRetry
    };
  } catch (error) {
    console.log('=== error === minting.service.js === scheduleRetry === key: 200013 ===');
    console.dir(error, { depth: null, colors: true });
    console.log('=================================');
    return {
      success: false,
      message: "Error scheduling retry",
      errorKey: 200013,
      errorCode: "schedule-retry-failed",
      fromError: !Config.IN_PROD ? error.message : null,
    };
  }
}

/**
 * Gets current minting status for a project
 * @param {string} projectId - Project UUID
 * @returns {Object} Most recent minting operation with last error
 */
export async function getMintingStatus(projectId) {
  const query = `
    SELECT
      mo.*,
      (
        SELECT json_agg(e.* ORDER BY e.created_at DESC)
        FROM (
          SELECT * FROM public.minting_operation_errors
          WHERE operation_id = mo.id
          ORDER BY created_at DESC
          LIMIT 3
        ) e
      ) as recent_errors
    FROM public.minting_operations mo
    WHERE mo.project_id = $1
    ORDER BY mo.created_at DESC
    LIMIT 1
  `;

  try {
    const result = await pool.query(query, [projectId]);
    if (result.rowCount === 0) {
      return {
        success: false,
        message: "No minting operation found for this project",
        errorKey: 200014,
        errorCode: "no-minting-operation"
      };
    }

    return {
      success: true,
      data: result.rows[0]
    };
  } catch (error) {
    console.log('=== error === minting.service.js === getMintingStatus === key: 200015 ===');
    console.dir(error, { depth: null, colors: true });
    console.log('=================================');
    return {
      success: false,
      message: "Error fetching minting status",
      errorKey: 200015,
      errorCode: "get-minting-status-failed",
      fromError: !Config.IN_PROD ? error.message : null,
    };
  }
}

/**
 * Releases stale claimed jobs (from crashed workers)
 * @param {number} staleThresholdMinutes - Minutes after which a claimed job is considered stale
 * @returns {Object} Count of released jobs
 */
export async function releaseStaleJobs(staleThresholdMinutes = 10) {
  const thresholdMinutes = parseInt(process.env.MINTING_STALE_JOB_THRESHOLD_MINUTES) || staleThresholdMinutes;

  const query = `
    UPDATE public.minting_operations
    SET status = 'retrying',
        worker_id = NULL,
        claimed_at = NULL,
        next_retry_at = NOW()
    WHERE status = 'claimed'
      AND claimed_at < NOW() - INTERVAL '${thresholdMinutes} minutes'
    RETURNING id, project_id
  `;

  try {
    const result = await pool.query(query);

    if (result.rowCount > 0) {
      console.log(`=== [MINTING] Stale jobs released === key: 200016 ===`);
      console.log(`    Count: ${result.rowCount}`);
      console.log(`    Threshold: ${thresholdMinutes} minutes`);
      console.log(`    Jobs: ${result.rows.map(r => r.id).join(', ')}`);
      console.log(`    Timestamp: ${new Date().toISOString()}`);
      console.log('=================================');
    }

    return {
      success: true,
      releasedCount: result.rowCount,
      releasedJobs: result.rows
    };
  } catch (error) {
    console.log('=== error === minting.service.js === releaseStaleJobs === key: 200017 ===');
    console.dir(error, { depth: null, colors: true });
    console.log('=================================');
    return {
      success: false,
      message: "Error releasing stale jobs",
      errorKey: 200017,
      errorCode: "release-stale-jobs-failed",
      fromError: !Config.IN_PROD ? error.message : null,
    };
  }
}

/**
 * Gets operation by ID with full details
 * @param {string} operationId - Operation UUID
 * @returns {Object} Operation with errors and NFT results
 */
export async function getOperationById(operationId) {
  const query = `
    SELECT
      mo.*,
      p.title as project_title,
      (
        SELECT json_agg(e.* ORDER BY e.created_at DESC)
        FROM public.minting_operation_errors e
        WHERE e.operation_id = mo.id
      ) as errors,
      (
        SELECT json_agg(r.* ORDER BY r.created_at ASC)
        FROM public.minting_nft_results r
        WHERE r.operation_id = mo.id
      ) as nft_results
    FROM public.minting_operations mo
    LEFT JOIN public.projects p ON p.id = mo.project_id
    WHERE mo.id = $1
  `;

  try {
    const result = await pool.query(query, [operationId]);
    if (result.rowCount === 0) {
      return {
        success: false,
        message: "Operation not found",
        errorKey: 200018,
        errorCode: "operation-not-found"
      };
    }

    return {
      success: true,
      data: result.rows[0]
    };
  } catch (error) {
    console.log('=== error === minting.service.js === getOperationById === key: 200019 ===');
    console.dir(error, { depth: null, colors: true });
    console.log('=================================');
    return {
      success: false,
      message: "Error fetching operation",
      errorKey: 200019,
      errorCode: "get-operation-failed",
      fromError: !Config.IN_PROD ? error.message : null,
    };
  }
}

/**
 * Gets all operations with optional status filter (for admin)
 * @param {Object} filters - Optional filters (status, limit, offset)
 * @returns {Object} List of operations
 */
export async function getAllOperations(filters = {}) {
  const { status, limit = 50, offset = 0 } = filters;

  let whereClause = '';
  const values = [];
  let paramIndex = 1;

  if (status) {
    whereClause = `WHERE mo.status = $${paramIndex++}`;
    values.push(status);
  }

  values.push(limit, offset);

  const query = `
    SELECT
      mo.id,
      mo.project_id,
      mo.status,
      mo.attempt_count,
      mo.max_attempts,
      mo.tx_hash,
      mo.block_number,
      mo.gas_used,
      mo.created_at,
      mo.started_at,
      mo.completed_at,
      mo.next_retry_at,
      p.title as project_title
    FROM public.minting_operations mo
    LEFT JOIN public.projects p ON p.id = mo.project_id
    ${whereClause}
    ORDER BY mo.created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex}
  `;

  try {
    const result = await pool.query(query, values);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) FROM public.minting_operations mo
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, status ? [status] : []);

    return {
      success: true,
      data: result.rows,
      count: result.rowCount,
      total: parseInt(countResult.rows[0].count)
    };
  } catch (error) {
    console.log('=== error === minting.service.js === getAllOperations === key: 200020 ===');
    console.dir(error, { depth: null, colors: true });
    console.log('=================================');
    return {
      success: false,
      message: "Error fetching operations",
      errorKey: 200020,
      errorCode: "get-all-operations-failed",
      fromError: !Config.IN_PROD ? error.message : null,
    };
  }
}

/**
 * Gets all failed operations (for admin dashboard)
 * @returns {Object} List of failed operations requiring attention
 */
export async function getFailedOperations() {
  const query = `
    SELECT
      mo.id,
      mo.project_id,
      mo.status,
      mo.attempt_count,
      mo.max_attempts,
      mo.created_at,
      mo.completed_at,
      p.title as project_title,
      (
        SELECT json_build_object(
          'error_type', e.error_type,
          'error_message', e.error_message,
          'phase', e.phase,
          'created_at', e.created_at
        )
        FROM public.minting_operation_errors e
        WHERE e.operation_id = mo.id
        ORDER BY e.created_at DESC
        LIMIT 1
      ) as last_error
    FROM public.minting_operations mo
    LEFT JOIN public.projects p ON p.id = mo.project_id
    WHERE mo.status = 'failed'
    ORDER BY mo.created_at DESC
  `;

  try {
    const result = await pool.query(query);
    return {
      success: true,
      data: result.rows,
      count: result.rowCount
    };
  } catch (error) {
    console.log('=== error === minting.service.js === getFailedOperations === key: 200021 ===');
    console.dir(error, { depth: null, colors: true });
    console.log('=================================');
    return {
      success: false,
      message: "Error fetching failed operations",
      errorKey: 200021,
      errorCode: "get-failed-operations-failed",
      fromError: !Config.IN_PROD ? error.message : null,
    };
  }
}

/**
 * Manually retries a failed operation (admin action)
 * @param {string} operationId - Operation UUID
 * @returns {Object} Updated operation
 */
export async function retryOperation(operationId) {
  const query = `
    UPDATE public.minting_operations
    SET status = 'pending',
        attempt_count = 0,
        next_retry_at = NULL,
        worker_id = NULL,
        claimed_at = NULL,
        started_at = NULL,
        completed_at = NULL
    WHERE id = $1 AND status = 'failed'
    RETURNING *
  `;

  try {
    const result = await pool.query(query, [operationId]);
    if (result.rowCount === 0) {
      return {
        success: false,
        message: "Operation not found or not in failed status",
        errorKey: 200022,
        errorCode: "operation-not-retriable"
      };
    }

    console.log(`=== [MINTING] Manual retry triggered === key: 200023 ===`);
    console.log(`    Operation ID: ${operationId}`);
    console.log(`    Timestamp: ${new Date().toISOString()}`);
    console.log('=================================');

    return {
      success: true,
      data: result.rows[0],
      message: "Operation queued for retry"
    };
  } catch (error) {
    console.log('=== error === minting.service.js === retryOperation === key: 200024 ===');
    console.dir(error, { depth: null, colors: true });
    console.log('=================================');
    return {
      success: false,
      message: "Error retrying operation",
      errorKey: 200024,
      errorCode: "retry-operation-failed",
      fromError: !Config.IN_PROD ? error.message : null,
    };
  }
}

/**
 * Gets minting history for a project (admin)
 * @param {string} projectId - Project UUID
 * @returns {Object} All operations for the project
 */
export async function getProjectMintingHistory(projectId) {
  const query = `
    SELECT
      mo.*,
      (
        SELECT json_agg(e.* ORDER BY e.created_at DESC)
        FROM public.minting_operation_errors e
        WHERE e.operation_id = mo.id
      ) as errors
    FROM public.minting_operations mo
    WHERE mo.project_id = $1
    ORDER BY mo.created_at DESC
  `;

  try {
    const result = await pool.query(query, [projectId]);
    return {
      success: true,
      data: result.rows,
      count: result.rowCount
    };
  } catch (error) {
    console.log('=== error === minting.service.js === getProjectMintingHistory === key: 200025 ===');
    console.dir(error, { depth: null, colors: true });
    console.log('=================================');
    return {
      success: false,
      message: "Error fetching minting history",
      errorKey: 200025,
      errorCode: "get-minting-history-failed",
      fromError: !Config.IN_PROD ? error.message : null,
    };
  }
}

/**
 * Creates or updates NFT result for a participant
 * @param {string} operationId - Operation UUID
 * @param {string} participantId - Participant UUID
 * @param {Object} nftData - NFT data to store
 * @returns {Object} Created/updated NFT result
 */
export async function upsertNFTResult(operationId, participantId, nftData) {
  const { status, tokenId, tokenUri, nftAddress, errorMessage } = nftData;

  const query = `
    INSERT INTO public.minting_nft_results
    (operation_id, participant_id, status, token_id, token_uri, nft_address, error_message)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (operation_id, participant_id)
    DO UPDATE SET
      status = EXCLUDED.status,
      token_id = EXCLUDED.token_id,
      token_uri = EXCLUDED.token_uri,
      nft_address = EXCLUDED.nft_address,
      error_message = EXCLUDED.error_message,
      updated_at = NOW()
    RETURNING *
  `;

  try {
    const result = await pool.query(query, [
      operationId,
      participantId,
      status,
      tokenId,
      tokenUri,
      nftAddress,
      errorMessage
    ]);

    return {
      success: true,
      data: result.rows[0]
    };
  } catch (error) {
    console.log('=== error === minting.service.js === upsertNFTResult === key: 200026 ===');
    console.dir(error, { depth: null, colors: true });
    console.log('=================================');
    return {
      success: false,
      message: "Error updating NFT result",
      errorKey: 200026,
      errorCode: "upsert-nft-result-failed",
      fromError: !Config.IN_PROD ? error.message : null,
    };
  }
}

/**
 * Gets NFT results for an operation (for retry logic)
 * @param {string} operationId - Operation UUID
 * @returns {Object} List of NFT results
 */
export async function getNFTResults(operationId) {
  const query = `
    SELECT * FROM public.minting_nft_results
    WHERE operation_id = $1
    ORDER BY created_at ASC
  `;

  try {
    const result = await pool.query(query, [operationId]);
    return {
      success: true,
      data: result.rows
    };
  } catch (error) {
    console.log('=== error === minting.service.js === getNFTResults === key: 200027 ===');
    console.dir(error, { depth: null, colors: true });
    console.log('=================================');
    return {
      success: false,
      message: "Error fetching NFT results",
      errorKey: 200027,
      errorCode: "get-nft-results-failed",
      fromError: !Config.IN_PROD ? error.message : null,
    };
  }
}
