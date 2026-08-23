// src/lib/content.js
// Read/write the site's public content (managed by Admin) and upload images.
// Content lives in the `site_content` table (one JSON row per section); images
// go in the public `site-images` Storage bucket.
import { supabase } from './supabase';

// Read a section's JSON (public — anyone can read).
export async function getSection(section) {
  const { data, error } = await supabase.from('site_content').select('content').eq('section', section).maybeSingle();
  if (error) return {};
  return data?.content || {};
}

// Save a section's JSON (Admin/HeadAdmin only — enforced by RLS).
export async function saveSection(section, content) {
  const { data: u } = await supabase.auth.getUser();
  const { error } = await supabase.from('site_content').upsert({
    section, content, updated_at: new Date().toISOString(), updated_by: u?.user?.id || null,
  });
  return { ok: !error, error: error?.message };
}

// Upload an image and get its public URL.
export async function uploadSiteImage(file, folder = 'events') {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${folder}/${Date.now()}-${Math.random().toString(16).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('site-images').upload(path, file, {
    contentType: file.type || 'image/jpeg', upsert: false,
  });
  if (error) return { ok: false, error: error.message };
  const { data } = supabase.storage.from('site-images').getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}

// Public helper: published events, earliest date first.
export async function getPublishedEvents() {
  const content = await getSection('events');
  const items = (content.items || []).filter((e) => e.published);
  items.sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
  return items;
}

// Format an ISO date (YYYY-MM-DD) for display.
export function formatEventDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// --- Contact info (managed by Admin, shown in footer + Contact popup) --------
export const DEFAULT_CONTACT = {
  registrar: { email: 'registrar@nsdgamarikina.edu.ph', mobile: '+63 912 345 6789', landline: '(02) 8123 4567' },
  finance: { email: 'billing@nsdgamarikina.edu.ph', mobile: '+63 912 345 6789', landline: '(02) 8123 4567' },
  techSupport: { email: 'portalsupport@nsdgamarikina.edu.ph' },
  officeHours: 'Mon – Fri: 8:00 AM – 5:00 PM\nSat: 8:00 AM – 12:00 PM',
  generalEmail: 'nsga_marikina@yahoo.com',
  facebookUrl: 'https://facebook.com/nsdgamarikina',
};

// Returns the contact info with defaults filled in for any missing fields.
export async function getContact() {
  const c = await getSection('contact');
  return {
    ...DEFAULT_CONTACT,
    ...c,
    registrar: { ...DEFAULT_CONTACT.registrar, ...(c.registrar || {}) },
    finance: { ...DEFAULT_CONTACT.finance, ...(c.finance || {}) },
    techSupport: { ...DEFAULT_CONTACT.techSupport, ...(c.techSupport || {}) },
  };
}
