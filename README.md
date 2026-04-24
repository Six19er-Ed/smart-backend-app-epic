# SMART Backend Lab Alert System

A Node.js backend service that uses SMART Backend Services authentication with Epic's FHIR API to automatically detect abnormal lab results via Bulk Data Export and send email alerts.

Built as Module 4 of the Medblocks FHIR Bootcamp.

## What It Does

1. Authenticates with Epic using JWT client credentials
2. Kicks off a FHIR Bulk Data Export for all patients and observations
3. Polls the async job until complete
4. Streams and parses NDJSON files
5. Scans lab observations for abnormal interpretation codes
6. Sends HTML email alerts via Nodemailer
7. Runs automatically on a cron schedule

## Key FHIR Concepts

- SMART Backend Services (system-level OAuth 2.0)
- RSA key pair generation and JWKS hosting
- JWT signing with RS384
- FHIR Bulk Data Access IG
- Asynchronous job polling pattern
- NDJSON streaming
- FHIR Observation interpretation codes

## Tech Stack

- Node.js, axios, node crypto, nodemailer, node-cron, Epic FHIR Sandbox

## Setup

1. Generate RSA key pair
2. Host JWKS via GitHub Pages
3. Register Backend Services app on fhir.epic.com
4. Configure .env with Client ID and Group ID
5. npm install
6. node index.js
