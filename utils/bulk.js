const axios = require('axios');
const { getAccessToken } = require('./auth');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function kickOffBulkExport() {
  const token = await getAccessToken();
  const response = await axios.get(
    `${process.env.EPIC_FHIR_BASE_URL}/Group/${process.env.EPIC_GROUP_ID}/$export`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/fhir+json',
        Prefer: 'respond-async'
      }
    }
  );
  const pollUrl = response.headers['content-location'];
  console.log('Export kicked off. Polling URL:', pollUrl);
  return pollUrl;
}

async function pollForCompletion(pollUrl) {
  const token = await getAccessToken();
  console.log('Checking export status...');
  const response = await axios.get(pollUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  });
  if (response.status === 202) {
    const progress = response.headers['x-progress'];
    console.log('Still processing...', progress || '');
    return null;
  }
  if (response.status === 200) {
    console.log('Export complete!');
    return response.data;
  }
}

async function downloadNDJSON(fileUrl) {
  const token = await getAccessToken();
  const response = await axios.get(fileUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/fhir+ndjson'
    }
  });
  const lines = response.data.split('\n').filter(line => line.trim());
  return lines.map(line => JSON.parse(line));
}

function checkIfAbnormal(observation) {
  const interpretation = observation.interpretation?.[0]?.coding?.[0]?.code;
  return ['H', 'L', 'HH', 'LL', 'A', 'AA'].includes(interpretation);
}

async function getAbnormalLabs(patientFileUrl, observationFileUrl) {
  console.log('Downloading patient data...');
  const patients = await downloadNDJSON(patientFileUrl);
  console.log('Downloading observation data...');
  const observations = await downloadNDJSON(observationFileUrl);

  const patientMap = {};
  for (const patient of patients) {
    const name = patient.name?.[0]?.text ||
      `${patient.name?.[0]?.given?.[0] || ''} ${patient.name?.[0]?.family || ''}`.trim();
    patientMap[patient.id] = name || 'Unknown';
  }

  const alerts = [];
  for (const obs of observations) {
    if (checkIfAbnormal(obs)) {
      const patientId = obs.subject?.reference?.split('/')?.[1];
      alerts.push({
        patientId,
        patientName: patientMap[patientId] || 'Unknown',
        test: obs.code?.text || obs.code?.coding?.[0]?.display || 'Unknown test',
        value: obs.valueQuantity
          ? `${obs.valueQuantity.value} ${obs.valueQuantity.unit}`
          : 'See report',
        interpretation: obs.interpretation?.[0]?.coding?.[0]?.code,
        date: obs.effectiveDateTime || 'Unknown date'
      });
    }
  }

  console.log(`Found ${alerts.length} abnormal results out of ${observations.length} observations`);
  return alerts;
}

module.exports = { kickOffBulkExport, pollForCompletion, downloadNDJSON, getAbnormalLabs };