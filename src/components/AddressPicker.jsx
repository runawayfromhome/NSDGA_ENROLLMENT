// src/components/AddressPicker.jsx
// Philippine address cascade: Region → Province/District → City/Municipality →
// Barangay (data from `select-philippines-address`, PSGC). Only House No. & Street
// is typed. Emits a patch to merge into the form: the part NAMES (for display),
// the part CODES (so a resumed draft can re-populate the dropdowns), and a
// composed `address` string for everything that already reads form.address.
import { useEffect, useState } from 'react';
import { regions, provinces, cities, barangays } from '../lib/phAddress';

const compose = (v) =>
  [v.houseStreet, v.barangay, v.city, v.province, v.region]
    .map((s) => (s || '').trim())
    .filter(Boolean)
    .join(', ');

const AddressPicker = ({ value, onChange, disabled }) => {
  const [regionList, setRegionList] = useState([]);
  const [provinceList, setProvinceList] = useState([]);
  const [cityList, setCityList] = useState([]);
  const [brgyList, setBrgyList] = useState([]);

  useEffect(() => { regions().then((r) => setRegionList(r || [])).catch(() => setRegionList([])); }, []);
  // Restore downstream lists from any saved codes (draft resume), and reload on change.
  useEffect(() => {
    if (value.regionCode) provinces(value.regionCode).then((p) => setProvinceList(p || [])).catch(() => setProvinceList([]));
    else setProvinceList([]);
  }, [value.regionCode]);
  useEffect(() => {
    if (value.provinceCode) cities(value.provinceCode).then((c) => setCityList(c || [])).catch(() => setCityList([]));
    else setCityList([]);
  }, [value.provinceCode]);
  useEffect(() => {
    if (value.cityCode) barangays(value.cityCode).then((b) => setBrgyList(b || [])).catch(() => setBrgyList([]));
    else setBrgyList([]);
  }, [value.cityCode]);

  const patch = (p) => { const merged = { ...value, ...p }; onChange({ ...p, address: compose(merged) }); };

  const onRegion = (e) => {
    const code = e.target.value;
    const name = regionList.find((r) => r.region_code === code)?.region_name || '';
    patch({ regionCode: code, region: name, provinceCode: '', province: '', cityCode: '', city: '', barangay: '' });
  };
  const onProvince = (e) => {
    const code = e.target.value;
    const name = provinceList.find((p) => p.province_code === code)?.province_name || '';
    patch({ provinceCode: code, province: name, cityCode: '', city: '', barangay: '' });
  };
  const onCity = (e) => {
    const code = e.target.value;
    const name = cityList.find((c) => c.city_code === code)?.city_name || '';
    patch({ cityCode: code, city: name, barangay: '' });
  };
  const onBarangay = (e) => patch({ barangay: e.target.value });

  const lbl = 'block font-semibold text-xs text-gray-600 mb-1.5';
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className={lbl}>Region <span className="text-red-500">*</span></span>
          <select className="ip" value={value.regionCode || ''} onChange={onRegion} disabled={disabled}>
            <option value="">{regionList.length ? 'Select region…' : 'Loading…'}</option>
            {regionList.map((o) => <option key={o.region_code} value={o.region_code}>{o.region_name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className={lbl}>Province / District <span className="text-red-500">*</span></span>
          <select className="ip" value={value.provinceCode || ''} onChange={onProvince} disabled={disabled || !value.regionCode}>
            <option value="">Select province…</option>
            {provinceList.map((o, i) => <option key={`${o.province_code}-${i}`} value={o.province_code}>{o.province_name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className={lbl}>City / Municipality <span className="text-red-500">*</span></span>
          <select className="ip" value={value.cityCode || ''} onChange={onCity} disabled={disabled || !value.provinceCode}>
            <option value="">Select city…</option>
            {cityList.map((o) => <option key={o.city_code} value={o.city_code}>{o.city_name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className={lbl}>Barangay <span className="text-red-500">*</span></span>
          <select className="ip" value={value.barangay || ''} onChange={onBarangay} disabled={disabled || !value.cityCode}>
            <option value="">Select barangay…</option>
            {brgyList.map((o) => <option key={o.brgy_code} value={o.brgy_name}>{o.brgy_name}</option>)}
          </select>
        </label>
      </div>
      <label className="block">
        <span className="block font-semibold text-xs text-gray-600 mb-1.5">House No. &amp; Street <span className="text-red-500">*</span></span>
        <input className="ip" value={value.houseStreet || ''} onChange={(e) => patch({ houseStreet: e.target.value })} placeholder="e.g. 12 Bayan-bayanan Ave" maxLength={120} disabled={disabled} />
      </label>
      {value.address && <p className="text-[11px] text-slate-400">Full address: {value.address}</p>}
      <style>{`.ip{width:100%;border:1px solid #E5E7EB;border-radius:.6rem;padding:.6rem .8rem;font-size:.875rem;outline:none;background:#fff}.ip:focus{border-color:#800000}.ip:disabled{background:#f8f9fa;color:#9ca3af}`}</style>
    </div>
  );
};

export default AddressPicker;
