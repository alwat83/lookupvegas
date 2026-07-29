// LV-004 operational tool: runs the full validation framework
// (lib/archiveValidation.js) against the real daily_metrics collection.
// Read-only -- makes no writes. Exits non-zero if any check fails, so it
// can be run as a manual health check or wired into a CI/cron job later
// without further changes.
//
// Usage:
//   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
//     node scripts/validate-archive.mjs

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import {
    auditArchive,
    validateRanges,
    validateSourceFreshness,
    verifyCviArithmetic,
    readPrivateJetActivityIndex,
} from '../lib/archiveValidation.js';

initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'lookupvegas-337b3',
});

const db = getFirestore();

const snapshot = await db.collection('daily_metrics').get();
const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

console.log(`Loaded ${docs.length} document(s) from daily_metrics.\n`);

let exitCode = 0;

// 1. Archive-wide integrity: duplicates, gaps, ID/date mismatches, schema drift.
const archiveResult = auditArchive(docs);
console.log('=== Archive Integrity ===');
console.log(`Date range: ${archiveResult.dateRange ? `${archiveResult.dateRange.start} to ${archiveResult.dateRange.end}` : 'n/a'}`);
if (archiveResult.findings.duplicateDates.length > 0) {
    exitCode = 1;
    console.log('DUPLICATE DATES:', archiveResult.findings.duplicateDates);
}
if (archiveResult.findings.missingDates.length > 0) {
    exitCode = 1;
    console.log(`MISSING DATES (${archiveResult.findings.missingDates.length}):`, archiveResult.findings.missingDates);
}
if (archiveResult.findings.idMismatches.length > 0) {
    exitCode = 1;
    console.log('DOCUMENT ID / DATE MISMATCHES:', archiveResult.findings.idMismatches);
}
if (archiveResult.findings.dateFormatIssues.length > 0) {
    exitCode = 1;
    console.log('MALFORMED DATE FIELDS:', archiveResult.findings.dateFormatIssues);
}
if (archiveResult.findings.schemaDrift.length > 0) {
    exitCode = 1;
    console.log(`SCHEMA DRIFT (${archiveResult.findings.schemaDrift.length} document(s)):`);
    archiveResult.findings.schemaDrift.forEach(d => console.log(`  ${d.id}:`, d.issues));
}
if (archiveResult.ok) {
    console.log('No structural integrity issues found.');
}

// 2. Per-document range, freshness, and CVI-arithmetic checks.
console.log('\n=== Per-Document Checks ===');
let rangeIssueDocs = 0;
let outlierDocs = 0;
let staleDocs = 0;
let mismatchDocs = 0;
let notVerifiableDocs = 0;
// LV-008: tracks migration progress from the deprecated private_jet_count
// to the canonical private_jet_activity_index -- not a failure condition,
// purely informational. Disagreements are already caught above as schema
// drift (auditArchive -> validateDocumentSchema), not re-flagged here.
let canonicalJetFieldDocs = 0;
let legacyOnlyJetFieldDocs = 0;

for (const doc of docs) {
    const ranges = validateRanges(doc);
    if (!ranges.valid) {
        exitCode = 1;
        rangeIssueDocs++;
        console.log(`[RANGE] ${doc.id}:`, ranges.issues);
    }
    if (ranges.outliers.length > 0) {
        outlierDocs++;
        console.log(`[OUTLIER] ${doc.id}:`, ranges.outliers);
    }

    const freshness = validateSourceFreshness(doc);
    if (!freshness.allFresh) {
        staleDocs++;
        if (freshness.stale.length > 0) console.log(`[STALE SOURCE] ${doc.id}: ${freshness.stale.join(', ')}`);
    }

    const cvi = verifyCviArithmetic(doc);
    if (!cvi.verifiable) {
        notVerifiableDocs++;
    } else if (!cvi.match) {
        exitCode = 1;
        mismatchDocs++;
        console.log(`[CVI MISMATCH] ${doc.id}: stored=${cvi.stored} recomputed=${cvi.recomputed} diff=${cvi.diff}`);
    }

    const jetReading = readPrivateJetActivityIndex(doc);
    if (jetReading.source === 'canonical') canonicalJetFieldDocs++;
    else if (jetReading.source === 'legacy') legacyOnlyJetFieldDocs++;
}

console.log(`\nRange violations: ${rangeIssueDocs} document(s)`);
console.log(`Outliers flagged (informational, not failures): ${outlierDocs} document(s)`);
console.log(`Documents with a stale/fallback source: ${staleDocs}`);
console.log(`CVI arithmetic mismatches: ${mismatchDocs} document(s)`);
console.log(`Documents not verifiable (pre-LV-004 schema, missing component fields): ${notVerifiableDocs} document(s)`);
console.log(`Private-jet field migration: ${canonicalJetFieldDocs} using private_jet_activity_index, ${legacyOnlyJetFieldDocs} still legacy-only (private_jet_count)`);

console.log(`\n=== Result: ${exitCode === 0 ? 'PASS' : 'FAIL'} ===`);
process.exit(exitCode);
