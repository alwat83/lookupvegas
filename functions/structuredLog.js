// Structured JSON logging for Cloud Functions v2 -- see
// lib/structuredLog.js in the main app for the full rationale. This file
// is a deliberate, small duplicate rather than a shared import: Firebase
// Functions deploys only the contents of this directory, with no access
// to the rest of the repo at deploy time.
function logEvent({
    severity = "INFO",
    event,
    message,
    snapshotDate = null,
    status = null,
    source = null,
    error = null,
    durationMs = null,
}) {
    console.log(JSON.stringify({
        severity,
        message,
        event,
        snapshot_date: snapshotDate,
        status,
        source,
        error,
        execution_time: new Date().toISOString(),
        duration_ms: durationMs,
    }));
}

module.exports = { logEvent };
