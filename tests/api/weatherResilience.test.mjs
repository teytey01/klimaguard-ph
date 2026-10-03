// Regression tests for the Open-Meteo weather resilience fallback.
// Root cause this guards: when Open-Meteo returns HTTP 429 (free-tier daily
// quota exhausted), /api/weather + /api/agriculture used to hard-fail. The
// client now keeps a last-known-good reading per location and serves it marked
// `stale` instead of throwing — only throwing when no prior reading exists.
//
// Runs on Node's built-in test runner with native TypeScript type stripping:
//   npm test
import { test } from "node:test";
import assert from "node:assert/strict";

// The client reads NEXT_PUBLIC_OPEN_METEO_BASE at call time; set it before import.
process.env.NEXT_PUBLIC_OPEN_METEO_BASE = "https://example.test/v1";

const { fetchOpenMeteoWeather } = await import("../../src/lib/api/weather.ts");

const LOC = { name: "Calamba", province: "Laguna", lat: 14.2117, lon: 121.1653 };

/** A minimal valid Open-Meteo forecast payload. */
function okPayload() {
  return {
    current: {
      temperature_2m: 30,
      apparent_temperature: 33,
      relative_humidity_2m: 80,
      precipitation_probability: 40,
      weather_code: 61,
      wind_speed_10m: 12,
    },
    daily: {
      time: ["2026-10-04", "2026-10-05"],
      weather_code: [61, 3],
      temperature_2m_max: [31, 32],
      temperature_2m_min: [24, 25],
      precipitation_probability_max: [60, 30],
    },
  };
}

function mockFetch(responder) {
  globalThis.fetch = async () => responder();
}

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

test("returns fresh data on success and populates the last-known-good cache", async () => {
  mockFetch(() => jsonResponse(200, okPayload()));
  const data = await fetchOpenMeteoWeather(LOC);
  assert.equal(data.source, "Open-Meteo");
  assert.equal(data.current.temperatureC, 30);
  assert.equal(data.forecast.length, 2);
  assert.notEqual(data.stale, true, "fresh data must not be marked stale");
});

test("serves stale last-known-good data (not an error) when Open-Meteo returns 429", async () => {
  // Prime the cache with a success for this location.
  mockFetch(() => jsonResponse(200, okPayload()));
  await fetchOpenMeteoWeather(LOC);

  // Now the quota is exhausted.
  mockFetch(() => jsonResponse(429, { error: true, reason: "Daily API request limit exceeded." }));
  const data = await fetchOpenMeteoWeather(LOC);

  assert.equal(data.stale, true, "fallback reading must be flagged stale");
  assert.ok(data.notice && data.notice.length > 0, "stale reading carries a Filipino notice");
  assert.equal(data.current.temperatureC, 30, "stale reading keeps the last good values");
  assert.equal(data.location.lat, LOC.lat);
});

test("throws when the provider fails and there is no prior reading to fall back to", async () => {
  const freshLoc = { name: "Baguio", province: "Benguet", lat: 16.4023, lon: 120.596 };
  mockFetch(() => jsonResponse(429, { error: true, reason: "Daily API request limit exceeded." }));
  await assert.rejects(() => fetchOpenMeteoWeather(freshLoc), /Hindi makuha ang panahon/);
});
