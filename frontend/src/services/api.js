/**
 * API Service
 * ===========
 * Centralised HTTP helpers for communicating with the FastAPI backend.
 * The base URL is read from the VITE_API_URL environment variable so
 * it can differ between local development and production.
 */

const API_BASE = import.meta.env.VITE_API_URL ;

/**
 * Upload a SCADA CSV file and return the analysis results.
 *
 * @param {File}   file           - The CSV File object from an <input>.
 * @param {number} ratedPowerKw   - Turbine rated power in kW.
 * @returns {Promise<object>}     - Parsed JSON response.
 */
export async function uploadCSV(file, ratedPowerKw = 2000) {
    const form = new FormData();
    form.append("file", file);
    form.append("rated_power_kw", String(ratedPowerKw));

    const res = await fetch(`${API_BASE}/api/v1/upload`, {
        method: "POST",
        body: form,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        const detail = err.detail;
        if (typeof detail === "string") {
            throw new Error(detail);
        } else if (detail && detail.message) {
            // Structured validation error
            const msgs = [detail.message, ...(detail.errors || [])];
            throw new Error(msgs.join(" | "));
        } else {
            throw new Error(JSON.stringify(detail));
        }
    }

    return res.json();
}

/**
 * Run the analysis on auto-generated sample data (no file needed).
 *
 * @param {number} ratedPowerKw - Turbine rated power in kW.
 * @returns {Promise<object>}
 */
export async function analyzeSample(ratedPowerKw = 2000) {
    const res = await fetch(
        `${API_BASE}/api/v1/analyze-sample?rated_power_kw=${ratedPowerKw}`,
        { method: "POST" }
    );

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(
            typeof err.detail === "string"
                ? err.detail
                : JSON.stringify(err.detail)
        );
    }

    return res.json();
}

/**
 * Simple health-check call.
 *
 * @returns {Promise<object>}
 */
export async function healthCheck() {
    const res = await fetch(`${API_BASE}/api/v1/health`);
    return res.json();
}
