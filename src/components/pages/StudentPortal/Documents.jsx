// Student Documents — upload the required admission documents (private storage),
// see verification status, and re-view what was uploaded.
import React, { useEffect, useRef, useState } from 'react';
import StudentSidebar from '../../StudentSidebar';
import Header from '../../Header';
import { HiOutlineDocumentText, HiOutlineUpload, HiOutlineEye, HiOutlineInformationCircle } from "react-icons/hi";
import { getMyApplication, uploadStudentDoc, signedDocUrl, REQUIRED_DOCS, DOC_STATUS_STYLE } from '../../../lib/student';

const Documents = () => {
  const [app, setApp] = useState(undefined);
  const [busyKey, setBusyKey] = useState(null);
  const [error, setError] = useState('');
  const inputs = useRef({});

  const load = async () => setApp(await getMyApplication());
  useEffect(() => { load(); }, []);

  const pick = (key) => inputs.current[key]?.click();

  const onFile = async (key, file) => {
    if (!file || !app) return;
    if (file.size > 5 * 1024 * 1024) { setError('File is too large (max 5MB).'); return; }
    setError(''); setBusyKey(key);
    const res = await uploadStudentDoc(app.id, key, file);
    setBusyKey(null);
    if (!res.ok) { setError(res.error || 'Upload failed.'); return; }
    setApp({ ...app, documents: res.documents });
  };

  const view = async (path) => { const url = await signedDocUrl(path); if (url) window.open(url, '_blank'); };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <StudentSidebar activePage="Documents" />
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col">
        <Header showSearch={false} />
        <main className="flex-1 p-8 md:p-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 mb-1">My Documents</h1>
            <p className="text-slate-500 text-[15px] mb-6">Upload clear scans or photos (PDF/JPG/PNG, max 5MB each).</p>

            {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}
            {app === undefined && <p className="text-slate-400 text-sm">Loading…</p>}
            {app === null && <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-slate-500">Apply first to upload documents.</div>}

            {app && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                <ul className="divide-y divide-gray-50">
                  {REQUIRED_DOCS.map(({ key, label }) => {
                    const doc = app.documents?.[key];
                    const st = DOC_STATUS_STYLE[doc?.status || 'none'];
                    return (
                      <li key={key} className="flex items-center justify-between py-4 gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <span className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 shrink-0"><HiOutlineDocumentText size={20} /></span>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 text-[15px]">{label}</p>
                            {doc?.name && <p className="text-[12px] text-slate-400 truncate">{doc.name}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`inline-flex px-4 py-1.5 rounded-full text-[11px] font-bold ${st.cls}`}>{st.label}</span>
                          {doc?.path && (
                            <button onClick={() => view(doc.path)} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600" title="View"><HiOutlineEye size={18} /></button>
                          )}
                          <input ref={(el) => (inputs.current[key] = el)} type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => onFile(key, e.target.files?.[0])} />
                          <button onClick={() => pick(key)} disabled={busyKey === key}
                            className="flex items-center gap-1.5 bg-[#800000] text-white px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-[#600000] disabled:opacity-60">
                            <HiOutlineUpload size={16} />{busyKey === key ? 'Uploading…' : doc?.path ? 'Replace' : 'Upload'}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-6 flex items-start gap-2 text-[12px] text-slate-500">
                  <HiOutlineInformationCircle size={18} className="text-[#800000] shrink-0 mt-0.5" />
                  <p>Your documents are private — only you and the Registrar can view them. The Registrar will mark each as Verified once checked.</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Documents;
