// Structured JSON logging for Cloud Logging (Firebase App Hosting / Cloud Run).
//
// Cloud Run's default logging agent infers severity from which stream a
// console call writes to -- but Node's console.warn and console.error both
// write to stderr, so a "partial" run and a "failed" run would otherwise
// collapse into the same severity in Cloud Logging, making them
// impossible to tell apart in an alerting policy. Writing a JSON payload
// with an explicit `severity` field to stdout is the documented way both
// Cloud Run and Cloud Functions v2 pick up the real severity instead.
//
// This file is intentionally duplicated (not imported) into functions/ --
// see functions/structuredLog.js -- because Firebase Functions deploys
// only the functions/ directory's own contents, with no access to the
// rest of this repo at deploy time.
export function logEvent({
    severity = 'INFO',
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
