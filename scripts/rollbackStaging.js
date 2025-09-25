#!/usr/bin/env node

/**
 * Staging Environment Rollback Script
 */

const RollbackManager = require('./rollbackManager');

async function rollbackStaging() {
  console.log('Initiating staging environment rollback...');
  
  const rollbackManager = new RollbackManager();
  
  try {
    // Get the most recent successful rollback point
    const rollbackPoints = rollbackManager.listRollbackPoints('staging');
    const lastSuccessfulPoint = rollbackPoints.find(point => 
      point.metadata && point.metadata.type !== 'pre_rollback_backup'
    );
    
    if (!lastSuccessfulPoint) {
      throw new Error('No suitable rollback point found for staging environment');
    }
    
    console.log(`Rolling back to: ${lastSuccessfulPoint.id} (${lastSuccessfulPoint.version})`);
    
    // Execute the rollback
    const rollbackExecution = await rollbackManager.executeRollback(
      'staging', 
      lastSuccessfulPoint.id,
      {
        executedBy: 'automated_rollback',
        reason: 'deployment_failure'
      }
    );
    
    console.log('Staging rollback completed successfully');
    return rollbackExecution;
    
  } catch (error) {
    console.error('Staging rollback failed:', error.message);
    throw error;
  }
}

if (require.main === module) {
  rollbackStaging().catch(error => {
    console.error('Emergency staging rollback failed:', error);
    process.exit(1);
  });
}

module.exports = rollbackStaging;