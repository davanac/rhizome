// path: /src/workers/minting.worker.js
// Background worker for processing async minting operations

import { v4 as uuidv4 } from 'uuid';
import * as MintingService from '#services/minting.service.js';
import * as BlockchainService from '#services/blockchain.service.js';
import * as ProjectsService from '#services/projects.service.js';
import * as ParticipantsService from '#services/participants.service.js';
import Config from '#config';

/**
 * Custom error class for partial NFT storage failures
 */
class PartialStorageError extends Error {
  constructor(successful, failed) {
    super(`Partial storage failure: ${failed.length} of ${successful.length + failed.length} failed`);
    this.name = 'PartialStorageError';
    this.successful = successful;
    this.failed = failed;
  }
}

/**
 * Minting Worker class
 * Polls for pending minting jobs and processes them
 */
export class MintingWorker {
  constructor() {
    this.workerId = `worker-${uuidv4().substring(0, 8)}`;
    this.isRunning = false;
    this.pollInterval = parseInt(process.env.MINTING_POLL_INTERVAL_MS) || 5000;
    this.maxRetries = parseInt(process.env.MINTING_MAX_RETRIES) || 1;
  }

  /**
   * Starts the worker polling loop
   */
  async start() {
    this.isRunning = true;
    console.log(`=== [WORKER ${this.workerId}] Starting minting worker === key: 300001 ===`);
    console.log(`    Poll interval: ${this.pollInterval}ms`);
    console.log(`    Max retries: ${this.maxRetries}`);
    console.log(`    Timestamp: ${new Date().toISOString()}`);
    console.log('=================================');

    // Release any stale jobs from crashed workers
    const staleResult = await MintingService.releaseStaleJobs();
    if (staleResult.releasedCount > 0) {
      console.log(`=== [WORKER ${this.workerId}] Released ${staleResult.releasedCount} stale jobs ===`);
    }

    // Main polling loop
    while (this.isRunning) {
      try {
        await this.processNextJob();
      } catch (error) {
        console.log(`=== [WORKER ${this.workerId}] Error in poll cycle === key: 300002 ===`);
        console.dir(error, { depth: null, colors: true });
        console.log('=================================');
      }

      await this.sleep(this.pollInterval);
    }

    console.log(`=== [WORKER ${this.workerId}] Worker stopped ===`);
  }

  /**
   * Processes the next available job
   */
  async processNextJob() {
    // Claim next job
    const job = await MintingService.claimNextJob(this.workerId);
    if (!job) {
      return; // No jobs available
    }

    const startTime = Date.now();
    console.log(`=== [WORKER ${this.workerId}] Processing job === key: 300003 ===`);
    console.log(`    Operation ID: ${job.id}`);
    console.log(`    Project ID: ${job.project_id}`);
    console.log(`    Attempt: ${job.attempt_count}`);
    console.log(`    Timestamp: ${new Date().toISOString()}`);
    console.log('=================================');

    try {
      // Update project status to 'processing' (5)
      await ProjectsService.updateProjectStatusById(job.project_id, 5);

      // Update operation to 'processing'
      await MintingService.updateOperationStatus(job.id, {
        status: 'processing',
        startedAt: new Date()
      });

      // Phase 1: Submit blockchain transaction
      const receipt = await this.executeBlockchainRegistration(job);

      // Phase 2: Fetch NFT data from chain
      const nfts = await this.fetchNFTsFromChain(job);

      // Phase 3: Store NFT data in database
      await this.storeNFTData(job, nfts);

      // Phase 4: Mark as completed
      await this.completeJob(job, receipt, startTime);

    } catch (error) {
      await this.handleError(job, error);
    }
  }

  /**
   * Executes blockchain registration
   */
  async executeBlockchainRegistration(job) {
    console.log(`=== [WORKER] Phase 1: Blockchain submission === key: 300004 ===`);
    console.log(`    Operation ID: ${job.id}`);
    console.log(`    Timestamp: ${new Date().toISOString()}`);
    console.log('=================================');

    const mintingData = job.minting_data;
    const receipt = await BlockchainService.registerProjectOnChain(mintingData);

    if (receipt?.success === false) {
      const error = new Error(`Blockchain registration failed: ${receipt.message}`);
      error.phase = 'blockchain_submission';
      error.code = receipt.errorCode || 'BLOCKCHAIN_ERROR';
      error.originalError = receipt.fromError;
      throw error;
    }

    console.log(`=== [WORKER] Phase 1 completed === key: 300005 ===`);
    console.log(`    TX Hash: ${receipt.hash}`);
    console.log(`    Block: ${receipt.blockNumber}`);
    console.log(`    Gas used: ${receipt.gasUsed?.toString()}`);
    console.log('=================================');

    return receipt;
  }

  /**
   * Fetches NFT data from blockchain
   */
  async fetchNFTsFromChain(job) {
    console.log(`=== [WORKER] Phase 2: Fetching NFTs === key: 300006 ===`);
    console.log(`    Project ID: ${job.project_id}`);
    console.log('=================================');

    const nfts = await BlockchainService.getNFTsForProject(job.minting_data.projectId);

    if (nfts?.success === false) {
      const error = new Error(`NFT fetch failed: ${nfts.message}`);
      error.phase = 'nft_fetch';
      error.code = nfts.errorCode || 'NFT_FETCH_ERROR';
      throw error;
    }

    if (!nfts || !nfts[0] || nfts[0].length === 0) {
      const error = new Error('No NFT data returned from blockchain');
      error.phase = 'nft_fetch';
      error.code = 'NO_NFT_DATA';
      throw error;
    }

    console.log(`=== [WORKER] Phase 2 completed === key: 300007 ===`);
    console.log(`    NFT count: ${nfts[0].length}`);
    console.log('=================================');

    return nfts;
  }

  /**
   * Stores NFT data in database
   */
  async storeNFTData(job, nfts) {
    console.log(`=== [WORKER] Phase 3: Storing NFTs in database === key: 300008 ===`);
    console.log(`    Operation ID: ${job.id}`);
    console.log(`    NFT count: ${nfts[0].length}`);
    console.log('=================================');

    // Check which NFTs are already stored (for retry recovery)
    const existingResults = await MintingService.getNFTResults(job.id);
    const storedParticipants = new Set(
      (existingResults.data || [])
        .filter(r => r.status === 'stored')
        .map(r => r.participant_id)
    );

    const usernames = nfts[0];
    const participantIds = nfts[1];
    const tokenIds = nfts[2].map(id => id.toString());
    const tokenURIs = nfts[3];

    const successful = [];
    const failed = [];

    for (let i = 0; i < usernames.length; i++) {
      const participantId = participantIds[i];
      const tokenId = tokenIds[i];
      const tokenUri = tokenURIs[i];

      // Skip already stored NFTs
      if (storedParticipants.has(participantId)) {
        console.log(`    Skipping already stored NFT for participant ${participantId}`);
        successful.push({ participantId, tokenId, username: usernames[i] });
        continue;
      }

      try {
        // Store in project_participants table
        await ParticipantsService.setNFT(job.project_id, participantId, {
          nft_address: Config.WEB3.CONTRACTS_ADDRESSES.rhizomeNFT,
          nft_token_id: tokenId,
          nft_token_uri: tokenUri,
        });

        // Track in minting_nft_results
        await MintingService.upsertNFTResult(job.id, participantId, {
          status: 'stored',
          tokenId,
          tokenUri,
          nftAddress: Config.WEB3.CONTRACTS_ADDRESSES.rhizomeNFT
        });

        successful.push({ participantId, tokenId, username: usernames[i] });
        console.log(`    Stored NFT ${i + 1}/${usernames.length}: ${usernames[i]} (token ${tokenId})`);

      } catch (error) {
        // Track failure
        await MintingService.upsertNFTResult(job.id, participantId, {
          status: 'failed',
          tokenId,
          tokenUri,
          nftAddress: Config.WEB3.CONTRACTS_ADDRESSES.rhizomeNFT,
          errorMessage: error.message
        });

        failed.push({
          participantId,
          tokenId,
          username: usernames[i],
          error: error.message
        });
        console.log(`    FAILED NFT ${i + 1}/${usernames.length}: ${usernames[i]} - ${error.message}`);
      }
    }

    console.log(`=== [WORKER] Phase 3 completed === key: 300009 ===`);
    console.log(`    Successful: ${successful.length}`);
    console.log(`    Failed: ${failed.length}`);
    console.log('=================================');

    // If any failed, throw partial error
    if (failed.length > 0) {
      throw new PartialStorageError(successful, failed);
    }
  }

  /**
   * Completes a job successfully
   */
  async completeJob(job, receipt, startTime) {
    console.log(`=== [WORKER] Phase 4: Completing job === key: 300010 ===`);

    // Update operation to completed
    await MintingService.updateOperationStatus(job.id, {
      status: 'completed',
      txHash: receipt.hash,
      blockNumber: Number(receipt.blockNumber),
      gasUsed: receipt.gasUsed ? Number(receipt.gasUsed.toString()) : null,
      completedAt: new Date()
    });

    // Update project status to 'completed' (4)
    await ProjectsService.updateProjectStatusById(job.project_id, 4);

    const totalTime = Date.now() - startTime;
    console.log(`=== [WORKER ${this.workerId}] Job completed successfully === key: 300011 ===`);
    console.log(`    Operation ID: ${job.id}`);
    console.log(`    Project ID: ${job.project_id}`);
    console.log(`    TX Hash: ${receipt.hash}`);
    console.log(`    Total time: ${totalTime}ms`);
    console.log(`    Timestamp: ${new Date().toISOString()}`);
    console.log('=================================');
  }

  /**
   * Handles job errors
   */
  async handleError(job, error) {
    const phase = this.determineErrorPhase(error);

    console.log(`=== [WORKER ${this.workerId}] Job error === key: 300012 ===`);
    console.log(`    Operation ID: ${job.id}`);
    console.log(`    Phase: ${phase}`);
    console.log(`    Error: ${error.message}`);
    console.log(`    Attempt: ${job.attempt_count}`);
    console.log('=================================');

    // Record the error
    await MintingService.recordError(job.id, {
      errorType: error.name || 'Error',
      errorCode: error.code || 'UNKNOWN',
      errorMessage: error.message,
      errorStack: !Config.IN_PROD ? error.stack : null,
      attemptNumber: job.attempt_count,
      phase,
      successfulParticipants: error.successful || [],
      failedParticipants: error.failed || []
    });

    // Check if we should retry
    if (job.attempt_count < job.max_attempts) {
      const retryResult = await MintingService.scheduleRetry(job.id);
      console.log(`=== [WORKER] Scheduled retry === key: 300013 ===`);
      console.log(`    Next retry: ${retryResult.nextRetryAt?.toISOString()}`);
      console.log('=================================');
    } else {
      // Max retries reached - mark as failed
      await MintingService.updateOperationStatus(job.id, {
        status: 'failed',
        completedAt: new Date()
      });

      // Update project status to 'error' (6)
      await ProjectsService.updateProjectStatusById(job.project_id, 6);

      console.log(`=== [WORKER] Job failed permanently === key: 300014 ===`);
      console.log(`    Operation ID: ${job.id}`);
      console.log(`    Max attempts reached: ${job.max_attempts}`);
      console.log('=================================');
    }
  }

  /**
   * Determines the error phase based on error properties
   */
  determineErrorPhase(error) {
    // If phase is already set on error
    if (error.phase) {
      return error.phase;
    }

    const message = (error.message || '').toLowerCase();

    if (message.includes('insufficient') || message.includes('gas') || message.includes('nonce')) {
      return 'blockchain_submission';
    }
    if (message.includes('confirmation') || message.includes('timeout') || message.includes('receipt')) {
      return 'blockchain_confirmation';
    }
    if (message.includes('nft') && message.includes('fetch')) {
      return 'nft_fetch';
    }

    return 'db_storage';
  }

  /**
   * Utility sleep function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Stops the worker
   */
  stop() {
    console.log(`=== [WORKER ${this.workerId}] Stopping worker === key: 300015 ===`);
    this.isRunning = false;
  }
}

// Singleton instance for same-process deployment
let workerInstance = null;

/**
 * Starts the minting worker
 * @returns {MintingWorker} The worker instance
 */
export function startMintingWorker() {
  if (workerInstance) {
    console.log('=== [MINTING] Worker already running ===');
    return workerInstance;
  }

  workerInstance = new MintingWorker();
  workerInstance.start();
  return workerInstance;
}

/**
 * Stops the minting worker
 */
export function stopMintingWorker() {
  if (workerInstance) {
    workerInstance.stop();
    workerInstance = null;
  }
}

/**
 * Gets the current worker instance
 * @returns {MintingWorker|null}
 */
export function getMintingWorker() {
  return workerInstance;
}
