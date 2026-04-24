const axios = require('axios');
const { getAccessToken } = require('../utils/auth');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function getPatients() {
  const token = await getAccessToken();
  const response = await axios.get(`${process.env.EPIC_FHIR_BASE_URL}/Patient`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/fhir+json'
    },
    params: { _count: 10 }
  });
  return response.data;
}

async function getObservations(patientId) {
  const token = await getAccessToken();
  const response = await axios.get(`${process.env.EPIC_FHIR_BASE_URL}/Observation`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/fhir+json'
    },
    params: {
      patient: patientId,
      category: 'laboratory',
      _count: 20
    }
  });
  return response.data;
}

function isAbnormal(observation) {
  const interpretation = observation.interpretation?.[0]?.coding?.[0]?.code;
  return ['H', 'L', 'HH', 'LL', 'A'].includes(interpretation);
}

async function getAbnormalLabsForAllPatients() {
  const patientsBundle = await getPatients();
  const patients = patientsBundle.entry || [];
  const alerts = [];

  for (const entry of patients) {
    const patient = entry.resource;
    const patientId = patient.id;
    const name = patient.name?.[0]?.text ||
      `${patient.name?.[0]?.given?.[0]} ${patient.name?.[0]?.family}` ||
      'Unknown';

    try {
      const obsBundle = await getObservations(patientId);
      const observations = obsBundle.entry || [];

      for (const obsEntry of observations) {
        const obs = obsEntry.resource;
        if (isAbnormal(obs)) {
          alerts.push({
            patientId,
            patientName: name,
            test: obs.code?.text || obs.code?.coding?.[0]?.display || 'Unknown test',
            value: obs.valueQuantity
              ? `${obs.valueQuantity.value} ${obs.valueQuantity.unit}`
              : 'See report',
            interpretation: obs.interpretation?.[0]?.coding?.[0]?.code,
            date: obs.effectiveDateTime || 'Unknown date'
          });
        }
      }
    } catch (err) {
      console.error(`Error fetching labs for patient ${patientId}:`, err.message);
    }
  }

  return alerts;
}

module.exports = { getPatients, getObservations, getAbnormalLabsForAllPatients };
async function getPatients() {
    const token = await getAccessToken();
    // Epic sandbox requires specific search params - using known test patients
    const response = await axios.get(`${process.env.EPIC_FHIR_BASE_URL}/Patient`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/fhir+json'
      },
      params: {
        family: 'Johnson',
        _count: 10
      }
    });
    return response.data;
  }