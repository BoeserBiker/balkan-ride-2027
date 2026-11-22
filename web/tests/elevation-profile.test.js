import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildElevationProfile,
  renderElevationProfile,
  sampleElevationProfile,
} from '../src/elevation-profile.js';

test('builds cumulative distance and interpolates missing GPX elevations', () => {
  const profile = buildElevationProfile([[
    [0, 0, 100],
    [0, 0.01, null],
    [0, 0.02, 300],
  ]]);

  assert.equal(profile.elevationMode, 'interpolated');
  assert.ok(profile.totalDistanceKm > 2.2 && profile.totalDistanceKm < 2.23);
  assert.equal(profile.points[1].elevationMeters, 200);
  assert.equal(sampleElevationProfile(profile, 0.5).elevationMeters, 200);
});

test('uses a clearly identified interpolated ascent estimate when GPX has no elevations', () => {
  const profile = buildElevationProfile([[
    [0, 0, null],
    [0, 0.02, null],
  ]], 600);

  assert.equal(profile.elevationMode, 'estimated-gain');
  assert.equal(sampleElevationProfile(profile, 0.5).elevationMeters, 300);
  assert.match(renderElevationProfile(profile), /gleichmäßig interpoliert \(Schätzwert\)/);
});

test('scrubber samples the route position and clamps progress to the track', () => {
  const profile = buildElevationProfile([[
    [45, 15, 500],
    [45, 15.02, 700],
  ]]);

  const middle = sampleElevationProfile(profile, 0.5);
  assert.equal(middle.latitude, 45);
  assert.ok(Math.abs(middle.longitude - 15.01) < 0.00001);
  assert.equal(middle.elevationMeters, 600);
  assert.equal(sampleElevationProfile(profile, 2).longitude, 15.02);
});

test('does not render a profile when a day has no route track', () => {
  assert.equal(buildElevationProfile([], 100), null);
  assert.match(renderElevationProfile(null), /kein Straßen-Track verfügbar/);
});
