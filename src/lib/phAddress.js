// src/lib/phAddress.js
// Philippine PSGC address data, self-hosted under /public/ph-address/ and fetched
// same-origin so it passes the production CSP (connect-src 'self') — no external
// dependency. Each file is fetched at most once and cached. barangay.json is the
// big one (~4.8MB raw, ~1MB gzipped by Vercel) and is only fetched when the user
// reaches the barangay step.
const cache = {};
async function load(name) {
  if (!cache[name]) {
    cache[name] = fetch(`/ph-address/${name}.json`)
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []);
  }
  return cache[name];
}

export async function regions() {
  return load('region'); // [{ region_code, region_name }]
}
export async function provinces(regionCode) {
  return (await load('province')).filter((p) => p.region_code === regionCode); // [{ province_code, province_name }]
}
export async function cities(provinceCode) {
  return (await load('city')).filter((c) => c.province_code === provinceCode); // [{ city_code, city_name }]
}
export async function barangays(cityCode) {
  return (await load('barangay')).filter((b) => b.city_code === cityCode); // [{ brgy_code, brgy_name }]
}
