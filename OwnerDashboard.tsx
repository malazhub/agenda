import React, { useEffect, useState } from 'react';
import { ShieldCheck, RefreshCw, Building2, Users, Copy, ExternalLink, Trash2, KeyRound } from 'lucide-react';
import type { Language } from '../types';
import {
  createOwnerDirector, deleteOwnerDirector, getOwnerDirectors,
  issueDirectorSetupLink, updateOwnerDirector,
} from '../services/cloudflareApi';
import type { OwnerDirector } from '../services/cloudflareApi';

const labels = {
  en: { title:'Owner Control Center', subtitle:'Manage Directors and their school licences', directors:'Directors', school:'School', director:'Director', phone:'Phone', email:'Email', joined:'Joining date', account:'Account', paymentState:'Paid status', paidLabel:'Paid', unpaid:'Unpaid', accountActive:'Active', accountInactive:'Inactive', activateAccount:'Activate account', deactivateAccount:'Deactivate account', markPaid:'Mark paid', markUnpaid:'Mark unpaid', students:'Students', educators:'Educators', expiry:'Licence expiry', status:'Status', schoolLink:'School link', paymentLink:'Director payment / contact link', actions:'Owner controls', active:'Active', suspended:'Suspended', setupPending:'Password not set', setupDone:'Account set up', add:'Add Director', fullName:'Director full name', schoolName:'School name', phoneLabel:'Director phone', emailLabel:'Director email', paid:'I confirm receipt of the one-time USD 150 school licence payment.', notice:'The Director will choose their own username and password using a private setup link. The licence runs for one year.', create:'Create school and Director', cancel:'Cancel', creating:'Creating…', created:'Director and school created. Send the private setup link to the Director.', setupLink:'Private account setup link', copy:'Copy', renew:'Renew one year', suspend:'Suspend licence', activate:'Activate licence', resend:'Generate new setup link', delete:'Delete Director and school', confirmDelete:'Permanently delete this Director, the school, all accounts, sessions and stored school media?', deleted:'Director and school deleted.', saved:'Changes saved.', loading:'Loading Directors…', empty:'No Directors registered yet.', noPayment:'Not provided by Director', payment:'Payment / contact', open:'Open', error:'Could not complete the request.' },
  ar: { title:'مركز تحكم المالك', subtitle:'إدارة المديرين وتراخيص مدارسهم', directors:'المديرون', school:'المدرسة', director:'المدير', phone:'الهاتف', email:'البريد الإلكتروني', joined:'تاريخ الانضمام', account:'الحساب', paymentState:'حالة الدفع', paidLabel:'مدفوع', unpaid:'غير مدفوع', accountActive:'نشط', accountInactive:'غير نشط', activateAccount:'تفعيل الحساب', deactivateAccount:'إلغاء تفعيل الحساب', markPaid:'تحديد كمدفوع', markUnpaid:'تحديد كغير مدفوع', students:'الطلاب', educators:'المعلمون', expiry:'انتهاء الترخيص', status:'الحالة', schoolLink:'رابط المدرسة', paymentLink:'رابط الدفع أو التواصل الخاص بالمدير', actions:'تحكم المالك', active:'نشط', suspended:'معلق', setupPending:'لم تُنشأ كلمة المرور', setupDone:'تم إعداد الحساب', add:'إضافة مدير', fullName:'الاسم الكامل للمدير', schoolName:'اسم المدرسة', phoneLabel:'هاتف المدير', emailLabel:'بريد المدير', paid:'أؤكد استلام مبلغ 150 دولاراً لترخيص المدرسة لمرة واحدة.', notice:'يختار المدير اسم المستخدم وكلمة المرور بنفسه عبر رابط إعداد خاص. مدة الترخيص سنة واحدة.', create:'إنشاء المدرسة والمدير', cancel:'إلغاء', creating:'جارٍ الإنشاء…', created:'تم إنشاء المدير والمدرسة. أرسل رابط الإعداد الخاص للمدير.', setupLink:'رابط إعداد الحساب الخاص', copy:'نسخ', renew:'تجديد سنة', suspend:'تعليق الترخيص', activate:'تفعيل الترخيص', resend:'إنشاء رابط إعداد جديد', delete:'حذف المدير والمدرسة', confirmDelete:'هل تريد حذف المدير والمدرسة وجميع الحسابات والجلسات وملفات المدرسة نهائياً؟', deleted:'تم حذف المدير والمدرسة.', saved:'تم حفظ التغييرات.', loading:'جارٍ تحميل المديرين…', empty:'لا يوجد مديرون مسجلون بعد.', noPayment:'لم يحدده المدير بعد', payment:'الدفع / التواصل', open:'فتح', error:'تعذر إتمام العملية.' },
  fr: { title:'Centre de contrôle propriétaire', subtitle:'Gérer les directeurs et leurs licences scolaires', directors:'Directeurs', school:'École', director:'Directeur', phone:'Téléphone', email:'E-mail', joined:'Date d’inscription', account:'Compte', paymentState:'Paiement', paidLabel:'Payé', unpaid:'Impayé', accountActive:'Actif', accountInactive:'Inactif', activateAccount:'Activer le compte', deactivateAccount:'Désactiver le compte', markPaid:'Marquer payé', markUnpaid:'Marquer impayé', students:'Élèves', educators:'Éducateurs', expiry:'Expiration licence', status:'Statut', schoolLink:'Lien école', paymentLink:'Lien de paiement / contact du directeur', actions:'Contrôles propriétaire', active:'Actif', suspended:'Suspendu', setupPending:'Mot de passe non défini', setupDone:'Compte configuré', add:'Ajouter un directeur', fullName:'Nom complet du directeur', schoolName:'Nom de l’école', phoneLabel:'Téléphone du directeur', emailLabel:'E-mail du directeur', paid:'Je confirme avoir reçu les 150 USD pour la licence scolaire unique.', notice:'Le directeur choisit lui-même son identifiant et son mot de passe via un lien privé. Licence d’un an.', create:'Créer école et directeur', cancel:'Annuler', creating:'Création…', created:'Directeur et école créés. Envoyez le lien privé au directeur.', setupLink:'Lien privé de configuration', copy:'Copier', renew:'Renouveler un an', suspend:'Suspendre la licence', activate:'Activer la licence', resend:'Générer un nouveau lien', delete:'Supprimer directeur et école', confirmDelete:'Supprimer définitivement le directeur, l’école, tous les comptes, sessions et médias ?', deleted:'Directeur et école supprimés.', saved:'Modifications enregistrées.', loading:'Chargement des directeurs…', empty:'Aucun directeur enregistré.', noPayment:'Non fourni par le directeur', payment:'Paiement / contact', open:'Ouvrir', error:'Impossible de terminer la demande.' },
  es: { title:'Centro de control del propietario', subtitle:'Gestionar directores y licencias escolares', directors:'Directores', school:'Escuela', director:'Director', phone:'Teléfono', email:'Correo', joined:'Fecha de alta', account:'Cuenta', paymentState:'Estado de pago', paidLabel:'Pagado', unpaid:'No pagado', accountActive:'Activo', accountInactive:'Inactivo', activateAccount:'Activar cuenta', deactivateAccount:'Desactivar cuenta', markPaid:'Marcar pagado', markUnpaid:'Marcar no pagado', students:'Estudiantes', educators:'Educadores', expiry:'Vencimiento', status:'Estado', schoolLink:'Enlace de escuela', paymentLink:'Enlace de pago / contacto del director', actions:'Controles del propietario', active:'Activo', suspended:'Suspendido', setupPending:'Contraseña pendiente', setupDone:'Cuenta configurada', add:'Añadir director', fullName:'Nombre completo del director', schoolName:'Nombre de la escuela', phoneLabel:'Teléfono', emailLabel:'Correo del director', paid:'Confirmo que recibí los 150 USD de la licencia escolar única.', notice:'El director elegirá su usuario y contraseña mediante un enlace privado. Licencia de un año.', create:'Crear escuela y director', cancel:'Cancelar', creating:'Creando…', created:'Director y escuela creados. Envía el enlace privado al director.', setupLink:'Enlace privado de configuración', copy:'Copiar', renew:'Renovar un año', suspend:'Suspender licencia', activate:'Activar licencia', resend:'Generar nuevo enlace', delete:'Eliminar director y escuela', confirmDelete:'¿Eliminar permanentemente el director, la escuela, cuentas, sesiones y archivos?', deleted:'Director y escuela eliminados.', saved:'Cambios guardados.', loading:'Cargando directores…', empty:'Aún no hay directores.', noPayment:'El director aún no lo ha indicado', payment:'Pago / contacto', open:'Abrir', error:'No se pudo completar la solicitud.' },
  it: { title:'Centro di controllo proprietario', subtitle:'Gestisci direttori e licenze scolastiche', directors:'Direttori', school:'Scuola', director:'Direttore', phone:'Telefono', email:'E-mail', joined:'Data di iscrizione', account:'Account', paymentState:'Stato pagamento', paidLabel:'Pagato', unpaid:'Non pagato', accountActive:'Attivo', accountInactive:'Inattivo', activateAccount:'Attiva account', deactivateAccount:'Disattiva account', markPaid:'Segna pagato', markUnpaid:'Segna non pagato', students:'Studenti', educators:'Educatori', expiry:'Scadenza licenza', status:'Stato', schoolLink:'Link scuola', paymentLink:'Link pagamento / contatto del direttore', actions:'Controlli proprietario', active:'Attivo', suspended:'Sospeso', setupPending:'Password non impostata', setupDone:'Account configurato', add:'Aggiungi direttore', fullName:'Nome completo', schoolName:'Nome scuola', phoneLabel:'Telefono', emailLabel:'E-mail', paid:'Confermo di aver ricevuto i 150 USD per la licenza scolastica una tantum.', notice:'Il direttore sceglie nome utente e password tramite un link privato. Licenza di un anno.', create:'Crea scuola e direttore', cancel:'Annulla', creating:'Creazione…', created:'Direttore e scuola creati. Invia il link privato al direttore.', setupLink:'Link privato di configurazione', copy:'Copia', renew:'Rinnova un anno', suspend:'Sospendi licenza', activate:'Attiva licenza', resend:'Genera nuovo link', delete:'Elimina direttore e scuola', confirmDelete:'Eliminare definitivamente direttore, scuola, account, sessioni e file?', deleted:'Direttore e scuola eliminati.', saved:'Modifiche salvate.', loading:'Caricamento direttori…', empty:'Nessun direttore registrato.', noPayment:'Non fornito dal direttore', payment:'Pagamento / contatto', open:'Apri', error:'Impossibile completare la richiesta.' },
};

type Labels = typeof labels.en;
function destination(row: OwnerDirector): string {
  const value = row.paymentValue.trim();
  if (!value) return '';
  if (row.paymentMethod === 'whatsapp') return 'https://wa.me/' + value.replace(/\\D/g, '');
  if (row.paymentMethod === 'phone') return 'tel:' + value;
  if (row.paymentMethod === 'email') return 'mailto:' + value;
  return value;
}
function dateLabel(value: string | null, lang: Language): string {
  if (!value) return '—';
  const date = new Date(value.includes('T') ? value : value.replace(' ', 'T') + 'Z');
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(lang, { dateStyle:'medium' }).format(date);
}

export const OwnerDashboard: React.FC<{ currentLang:Language; token:string; onSignOut:()=>void; onManageMySchool:()=>void }> = ({ currentLang, token, onSignOut, onManageMySchool }) => {
  const t: Labels = labels[currentLang] || labels.en;
  const [rows,setRows] = useState<OwnerDirector[]>([]);
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState('');
  const [error,setError] = useState('');
  const [message,setMessage] = useState('');
  const [showCreate,setShowCreate] = useState(false);
  const [createdSetupLink,setCreatedSetupLink] = useState('');
  const [form,setForm] = useState({fullName:'',schoolName:'',email:'',phone:'',paymentReceived:false});

  const refresh = async () => {
    setLoading(true);
    try { const result = await getOwnerDirectors(token); setRows(result.directors); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : t.error); }
    finally { setLoading(false); }
  };
  useEffect(() => { void refresh(); }, [token]);

  const create = async (event:React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy('create'); setError(''); setMessage(''); setCreatedSetupLink('');
    try {
      const result = await createOwnerDirector(token,{...form,paymentReceived:true});
      setCreatedSetupLink(result.setupLink);
      setMessage(t.created);
      setForm({fullName:'',schoolName:'',email:'',phone:'',paymentReceived:false});
      setShowCreate(false);
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : t.error); }
    finally { setBusy(''); }
  };
  const update = async (id:string, change:{renewLicense?:boolean;licenseActive?:boolean;activated?:boolean;paid?:boolean}) => {
    setBusy(id); setError(''); setMessage('');
    try { await updateOwnerDirector(token,id,change); setMessage(t.saved); await refresh(); }
    catch(e) { setError(e instanceof Error ? e.message : t.error); }
    finally { setBusy(''); }
  };
  const resend = async (id:string) => {
    setBusy(id); setError(''); setMessage('');
    try { const result = await issueDirectorSetupLink(token,id); setCreatedSetupLink(result.setupLink); setMessage(t.setupLink); }
    catch(e) { setError(e instanceof Error ? e.message : t.error); }
    finally { setBusy(''); }
  };
  const remove = async (row:OwnerDirector) => {
    if (!window.confirm(t.confirmDelete)) return;
    setBusy(row.id); setError(''); setMessage('');
    try { await deleteOwnerDirector(token,row.id); setMessage(t.deleted); await refresh(); }
    catch(e) { setError(e instanceof Error ? e.message : t.error); }
    finally { setBusy(''); }
  };

  return <div className="space-y-5" dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
    <div className="rounded-3xl bg-slate-950 text-white p-6 flex flex-wrap justify-between items-center gap-4">
      <div className="flex items-center gap-3"><ShieldCheck className="w-9 h-9 text-amber-300"/><div><h1 className="text-2xl font-black">{t.title}</h1><p className="text-sm text-slate-300">{t.subtitle}</p></div></div>
      <div className="flex items-center gap-2"><button onClick={onManageMySchool} className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-bold">{currentLang==='ar'?'إدارة مدرستي':'Manage My School'}</button><button onClick={onSignOut} className="rounded-xl bg-white/10 px-4 py-2 text-sm">{currentLang==='ar'?'تسجيل الخروج':'Sign out'}</button></div>
    </div>
    <div className="grid sm:grid-cols-3 gap-3">
      <div className="rounded-2xl border bg-white p-4"><Building2/><b className="block text-2xl">{rows.length}</b>{t.directors}</div>
      <div className="rounded-2xl border bg-white p-4"><Users/><b className="block text-2xl">{rows.reduce((n,r)=>n+r.studentCount,0)}</b>{t.students}</div>
      <div className="rounded-2xl border bg-white p-4"><Users/><b className="block text-2xl">{rows.reduce((n,r)=>n+r.educatorCount,0)}</b>{t.educators}</div>
    </div>

    <section className="rounded-2xl border bg-white overflow-hidden">
      <div className="p-4 flex flex-wrap justify-between items-center gap-3"><h2 className="font-black">{t.directors}</h2><div className="flex gap-2"><button onClick={()=>setShowCreate(v=>!v)} className="rounded-lg bg-indigo-700 px-3 py-2 text-xs font-bold text-white">{t.add}</button><button onClick={()=>void refresh()} aria-label="Refresh"><RefreshCw size={17}/></button></div></div>
      {loading ? <p className="p-4">{t.loading}</p> : rows.length===0 ? <p className="p-4">{t.empty}</p> : <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1450px]">
          <thead className="bg-slate-50"><tr>{[t.school,t.director,t.phone,t.email,t.students,t.educators,t.joined,t.expiry,t.account,t.paymentState,t.status,t.schoolLink,t.paymentLink,t.actions].map(x=><th key={x} className="p-3 text-start whitespace-nowrap">{x}</th>)}</tr></thead>
          <tbody>{rows.map(row=>{
            const link=destination(row);
            const contactLabel=row.paymentMethod==='whatsapp'?'WhatsApp':row.paymentMethod==='phone'?t.phone:row.paymentMethod==='email'?t.email:row.paymentMethod==='bank'?'Bank':row.paymentMethod==='suyool'?'Suyool':'—';
            return <tr key={row.id} className="border-t align-top">
              <td className="p-3"><b>{row.schoolName}</b><small className="block text-slate-500">{row.schoolId}</small></td>
              <td className="p-3"><b>{row.fullName}</b><small className="block text-slate-500">@{row.username}</small><small className="block text-slate-500">{row.setupPending?t.setupPending:t.setupDone}</small></td>
              <td className="p-3 whitespace-nowrap">{row.phone||'—'}</td>
              <td className="p-3">{row.email||'—'}</td>
              <td className="p-3">{row.studentCount}</td><td className="p-3">{row.educatorCount}</td>
              <td className="p-3 whitespace-nowrap">{dateLabel(row.createdAt,currentLang)}</td>
              <td className="p-3 whitespace-nowrap">{dateLabel(row.expiresAt,currentLang)}</td>
              <td className="p-3"><b className={row.activated?'text-emerald-700':'text-red-600'}>{row.activated?t.accountActive:t.accountInactive}</b><button disabled={busy===row.id} className="block text-xs underline mt-2 disabled:opacity-50" onClick={()=>void update(row.id,{activated:!row.activated})}>{row.activated?t.deactivateAccount:t.activateAccount}</button></td>
              <td className="p-3"><b className={row.paid?'text-emerald-700':'text-amber-700'}>{row.paid?t.paidLabel:t.unpaid}</b><button disabled={busy===row.id} className="block text-xs underline mt-2 disabled:opacity-50" onClick={()=>void update(row.id,{paid:!row.paid})}>{row.paid?t.markUnpaid:t.markPaid}</button></td>
              <td className="p-3"><b className={row.licenseActive?'text-emerald-700':'text-red-600'}>{row.licenseActive?t.active:t.suspended}</b><button disabled={busy===row.id} className="block text-xs underline mt-2 disabled:opacity-50" onClick={()=>void update(row.id,{renewLicense:true})}>{t.renew}</button><button disabled={busy===row.id} className="block text-xs underline mt-1 disabled:opacity-50" onClick={()=>void update(row.id,{licenseActive:!row.licenseActive})}>{row.licenseActive?t.suspend:t.activate}</button></td>
              <td className="p-3"><a href={row.directorLink} target="_blank" rel="noreferrer" className="text-indigo-700 underline whitespace-nowrap">{t.open} <ExternalLink size={12} className="inline"/></a><button onClick={()=>void navigator.clipboard.writeText(row.directorLink)} className="block text-xs underline mt-1">{t.copy}</button></td>
              <td className="p-3 min-w-48">{link?<><span className="block text-xs text-slate-500">{contactLabel}</span><a href={link} target="_blank" rel="noreferrer" className="block max-w-52 break-all text-indigo-700 underline">{row.paymentValue}</a></>:<span className="text-slate-400">{t.noPayment}</span>}</td>
              <td className="p-3"><div className="flex flex-col items-start gap-2"><button disabled={busy===row.id||!row.setupPending} onClick={()=>void resend(row.id)} className="text-xs underline disabled:opacity-40"><KeyRound size={13} className="inline"/> {t.resend}</button><button disabled={busy===row.id} onClick={()=>void remove(row)} className="text-xs text-red-700 underline disabled:opacity-40"><Trash2 size={13} className="inline"/> {t.delete}</button></div></td>
            </tr>;
          })}</tbody>
        </table>
      </div>}
    </section>

    {showCreate&&<section className="rounded-2xl border bg-white p-5 space-y-4">
      <div><h3 className="font-black">{t.add}</h3><p className="mt-1 text-xs text-slate-500">{t.notice}</p></div>
      <form onSubmit={create} className="grid sm:grid-cols-2 gap-3">
        <label className="block text-sm">{t.fullName}<input required minLength={2} maxLength={120} className="block w-full border rounded-lg p-2 mt-1" value={form.fullName} onChange={e=>setForm(v=>({...v,fullName:e.target.value}))}/></label>
        <label className="block text-sm">{t.schoolName}<input required minLength={2} maxLength={160} className="block w-full border rounded-lg p-2 mt-1" value={form.schoolName} onChange={e=>setForm(v=>({...v,schoolName:e.target.value}))}/></label>
        <label className="block text-sm">{t.emailLabel}<input required type="email" maxLength={254} className="block w-full border rounded-lg p-2 mt-1" value={form.email} onChange={e=>setForm(v=>({...v,email:e.target.value}))}/></label>
        <label className="block text-sm">{t.phoneLabel}<input required maxLength={40} className="block w-full border rounded-lg p-2 mt-1" value={form.phone} onChange={e=>setForm(v=>({...v,phone:e.target.value}))}/></label>
        <label className="sm:col-span-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm"><input required type="checkbox" checked={form.paymentReceived} onChange={e=>setForm(v=>({...v,paymentReceived:e.target.checked}))} className="mt-1"/><span>{t.paid}</span></label>
        <div className="sm:col-span-2 flex gap-2"><button type="submit" disabled={busy==='create'||!form.paymentReceived} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy==='create'?t.creating:t.create}</button><button type="button" onClick={()=>setShowCreate(false)} className="rounded-lg border px-4 py-2 text-sm">{t.cancel}</button></div>
      </form>
    </section>}

    {createdSetupLink&&<section className="rounded-2xl border border-emerald-200 bg-white p-4 space-y-2"><div className="text-sm font-bold">{t.setupLink}</div><a href={createdSetupLink} target="_blank" rel="noreferrer" className="block break-all text-sm text-indigo-700 underline">{createdSetupLink}</a><button type="button" onClick={()=>void navigator.clipboard.writeText(createdSetupLink)} className="text-xs underline"><Copy size={13} className="inline"/> {t.copy}</button></section>}
    {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
    {message&&<p role="status" className="text-sm text-emerald-700">{message}</p>}
  </div>;
};
