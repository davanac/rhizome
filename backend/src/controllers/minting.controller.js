// path: /src/controllers/minting.controller.js
// Controller for minting status endpoints

import * as MintingService from "#services/minting.service.js";
import Config from "#config";

/**
 * GET /api/v1/projects/:projectId/minting-status
 * Get current minting status for a project
 */
export const getMintingStatus = async (req, reply) => {
  const { projectId } = req.params;

  const result = await MintingService.getMintingStatus(projectId);

  if (result.success === false) {
    // No minting operation found - this is normal for projects that haven't been minted yet
    return reply.status(404).send({
      success: false,
      message: result.message,
      errorCode: result.errorCode,
    });
  }

  const operation = result.data;

  // Format response based on status
  const response = {
    success: true,
    projectId,
    operationId: operation.id,
    status: operation.status,
    attemptCount: operation.attempt_count,
    maxAttempts: operation.max_attempts,
    createdAt: operation.created_at,
  };

  // Add phase-specific data
  if (operation.status === 'processing' || operation.status === 'claimed') {
    response.startedAt = operation.started_at;
    response.message = "Minting in progress. Please wait...";
  }

  if (operation.status === 'completed') {
    response.txHash = operation.tx_hash;
    response.blockNumber = operation.block_number;
    response.gasUsed = operation.gas_used;
    response.completedAt = operation.completed_at;
    response.message = "Minting completed successfully.";
  }

  if (operation.status === 'failed') {
    response.lastError = operation.recent_errors?.[0] || null;
    response.message = "Minting failed. Please contact admin for retry.";
  }

  if (operation.status === 'retrying') {
    response.nextRetryAt = operation.next_retry_at;
    response.lastError = operation.recent_errors?.[0] || null;
    response.message = `Minting will retry automatically at ${operation.next_retry_at}.`;
  }

  if (operation.status === 'pending') {
    response.message = "Minting queued. Will start shortly...";
  }

  return reply.send(response);
};

/**
 * GET /api/v1/admin/minting/operations
 * List all minting operations (admin only)
 */
export const getAllMintingOperations = async (req, reply) => {
  const { status, limit, offset } = req.query;

  const result = await MintingService.getAllOperations({
    status,
    limit: parseInt(limit) || 50,
    offset: parseInt(offset) || 0,
  });

  if (result.success === false) {
    return reply.status(500).send({
      success: false,
      message: result.message,
      errorCode: result.errorCode,
      errorKey: result.errorKey,
    });
  }

  return reply.send({
    success: true,
    data: result.data,
    count: result.count,
    total: result.total,
  });
};

/**
 * GET /api/v1/admin/minting/failed
 * List all failed minting operations (admin only)
 */
export const getFailedMintingOperations = async (req, reply) => {
  const result = await MintingService.getFailedOperations();

  if (result.success === false) {
    return reply.status(500).send({
      success: false,
      message: result.message,
      errorCode: result.errorCode,
      errorKey: result.errorKey,
    });
  }

  return reply.send({
    success: true,
    data: result.data,
    count: result.count,
  });
};

/**
 * GET /api/v1/admin/minting/:operationId
 * Get detailed minting operation info (admin only)
 */
export const getMintingOperationDetails = async (req, reply) => {
  const { operationId } = req.params;

  const result = await MintingService.getOperationById(operationId);

  if (result.success === false) {
    return reply.status(404).send({
      success: false,
      message: result.message,
      errorCode: result.errorCode,
    });
  }

  return reply.send({
    success: true,
    data: result.data,
  });
};

/**
 * POST /api/v1/admin/minting/:operationId/retry
 * Manually retry a failed operation (admin only)
 */
export const retryMintingOperation = async (req, reply) => {
  const { operationId } = req.params;

  const result = await MintingService.retryOperation(operationId);

  if (result.success === false) {
    return reply.status(400).send({
      success: false,
      message: result.message,
      errorCode: result.errorCode,
    });
  }

  console.log(`=== [ADMIN] Manual retry triggered === key: 400001 ===`);
  console.log(`    Operation ID: ${operationId}`);
  console.log(`    Admin user: ${req.user?.userId || 'unknown'}`);
  console.log(`    Timestamp: ${new Date().toISOString()}`);
  console.log('=================================');

  return reply.send({
    success: true,
    message: result.message,
    data: result.data,
  });
};

/**
 * GET /api/v1/admin/projects/:projectId/minting-history
 * Get full minting history for a project (admin only)
 */
export const getProjectMintingHistory = async (req, reply) => {
  const { projectId } = req.params;

  const result = await MintingService.getProjectMintingHistory(projectId);

  if (result.success === false) {
    return reply.status(500).send({
      success: false,
      message: result.message,
      errorCode: result.errorCode,
      errorKey: result.errorKey,
    });
  }

  return reply.send({
    success: true,
    data: result.data,
    count: result.count,
  });
};
