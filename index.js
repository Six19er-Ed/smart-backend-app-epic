const cron = require('node-cron');
const { kickOffBulkExport, pollForCompletion, getAbnormalLabs } = require('./utils/bulk');
const { sendAlertEmail } = require('./utils/mailer');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

async function runJob() {
  console.log('Starting bulk export job...');
  
  try {
    // Step 1: Kick off bulk export
    const pollUrl = await kickOffBulkExport();
    
    // Step 2: Poll until complete
    let result = null;
    while (!result) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // wait 5 seconds
      result = await pollForCompletion(pollUrl);
    }
    
    // Step 3: Get file URLs from result
    const patientFile = result.output.find(f => f.type === 'Patient')?.url;
    const observationFile = result.output.find(f => f.type === 'Observation')?.url;
    
    if (!patientFile || !observationFile) {
      console.log('Missing expected files in export result');
      return;
    }
    
    // Step 4: Detect abnormal labs
    const alerts = await getAbnormalLabs(patientFile, observationFile);
    
    // Step 5: Send email
    await sendAlertEmail(alerts);
    
    console.log('Job complete!');
  } catch (err) {
    console.error('Job failed:', err.message);
  }
}

// Schedule the job
console.log('Scheduler started. Cron:', process.env.CRON_SCHEDULE);
cron.schedule(process.env.CRON_SCHEDULE, runJob);

// Also run immediately on startup for testing
// Test email on startup to verify full pipeline
sendAlertEmail([
  { patientName: 'Demo Patient', test: 'Hemoglobin A1C', value: '12.5 %', interpretation: 'H', date: '2026-04-16' },
  { patientName: 'Demo Patient 2', test: 'Potassium', value: '2.8 mmol/L', interpretation: 'L', date: '2026-04-16' }
]).then(() => console.log('Demo email sent.'));

// Run actual bulk export job
runJob();
