import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, RefreshCw, Building2, Users, Copy, ExternalLink, Trash2, KeyRound, MessageCircle, Send, X } from 'lucide-react';
import type { Language } from '../types';
import {
  createOwnerDirector, deleteOwnerDirector, getOwnerDirectors, saveOwnerDirectorStatuses,
  issueDirectorSetupLink, updateOwnerDirector, resetOwnerDirectorPhonePassword,
  getOwnerFounderThreads, getOwnerFounderMessages, replyToFounderThread, deleteFounderThread, deleteOwnerAccount, updateOwnerAccount,
} from '../services/cloudflareApi';
import type { OwnerDirector, FounderThread, FounderMessage } from '../services/cloudflareApi';

const labels = {
  en: { title:'Owner Control Center', subtitle:'Manage Directors and their school licences', directors:'Directors', school:'School', director:'Director', phone:'Phone', email:'Email', joined:'Joining date', account:'Account', paymentState:'Paid status', paidLabel:'Paid', unpaid:'Unpaid', accountActive:'Active', accountInactive:'Inactive', activateAccount:'Activate account', deactivateAccount:'Deactivate account', markPaid:'Mark paid', markUnpaid:'Mark unpaid', students:'Students', educators:'Educators', expiry:'Licence expiry', status:'Status', schoolLink:'School link', paymentLink:'Director payment / contact link', actions:'Owner controls', active:'Active', suspended:'Suspended', setupPending:'Password not set', setupDone:'Account set up', phoneEnabled:'Phone initial password enabled', phoneDisabled:'Personal password is active', add:'Add Director', fullName:'Director full name', schoolName:'School name', phoneLabel:'Director phone', emailLabel:'Director email', paid:'I confirm receipt of the one-time USD 150 school licence payment.', notice:'The Director chooses a username using a private setup link. Their initial password is the phone number entered by the Owner; they can change it after signing in. The licence runs for one year.', create:'Create school and Director', cancel:'Cancel', creating:'Creating…', created:'Director and school created. Send the private setup link to the Director.', setupLink:'Private account setup link', smsMessage:'SMS message to send to the Director', copySms:'Copy SMS message', initialPasswordNotice:'The phone number entered above will be the Director’s initial password. The Director can change it after signing in.', copy:'Copy', renew:'Renew one year', suspend:'Suspend licence', activate:'Activate licence', resend:'Generate new setup link', resetPhonePassword:'Reset initial password to phone', copyLoginSms:'Copy login SMS', smsCopied:'Login SMS copied. Send it to the Director.', delete:'Delete Director and school', confirmDelete:'Permanently delete this Director, the school, all accounts, sessions and stored school media?', deleted:'Director and school deleted.', saved:'Changes saved.',saveChanges:'Save all changes',saving:'Saving…',unsaved:'Unsaved changes', loading:'Loading Directors…', empty:'No Directors registered yet.', noPayment:'Not provided by Director', payment:'Payment / contact', open:'Open', error:'Could not complete the request.' },
  ar: { title:'مركز تحكم المالك', subtitle:'إدارة المديرين وتراخيص مدارسهم', directors:'المديرون', school:'المدرسة', director:'المدير', phone:'الهاتف', email:'البريد الإلكتروني', joined:'تاريخ الانضمام', account:'الحساب', paymentState:'حالة الدفع', paidLabel:'مدفوع', unpaid:'غير مدفوع', accountActive:'نشط', accountInactive:'غير نشط', activateAccount:'تفعيل الحساب', deactivateAccount:'إلغاء تفعيل الحساب', markPaid:'تحديد كمدفوع', markUnpaid:'تحديد كغير مدفوع', students:'الطلاب', educators:'المعلمون', expiry:'انتهاء الترخيص', status:'الحالة', schoolLink:'رابط المدرسة', paymentLink:'رابط الدفع أو التواصل الخاص بالمدير', actions:'تحكم المالك', active:'نشط', suspended:'معلق', setupPending:'لم تُنشأ كلمة المرور', setupDone:'تم إعداد الحساب', phoneEnabled:'كلمة مرور الهاتف الأولية مفعّلة', phoneDisabled:'كلمة المرور الشخصية مفعّلة', add:'إضافة مدير', fullName:'الاسم الكامل للمدير', schoolName:'اسم المدرسة', phoneLabel:'هاتف المدير', emailLabel:'بريد المدير', paid:'أؤكد استلام مبلغ 150 دولاراً لترخيص المدرسة لمرة واحدة.', notice:'يختار المدير اسم المستخدم عبر رابط خاص. كلمة المرور الأولية هي رقم الهاتف الذي أدخله المالك، ويمكن للمدير تغييرها بعد الدخول. مدة الترخيص سنة واحدة.', create:'إنشاء المدرسة والمدير', cancel:'إلغاء', creating:'جارٍ الإنشاء…', created:'تم إنشاء المدير والمدرسة. أرسل رابط الإعداد الخاص للمدير.', setupLink:'رابط إعداد الحساب الخاص', smsMessage:'رسالة نصية لإرسالها إلى المدير', copySms:'نسخ الرسالة', initialPasswordNotice:'سيكون رقم الهاتف المدخل أعلاه كلمة المرور الأولية للمدير، ويمكنه تغييرها بعد تسجيل الدخول.', copy:'نسخ', renew:'تجديد سنة', suspend:'تعليق الترخيص', activate:'تفعيل الترخيص', resend:'إنشاء رابط إعداد جديد', resetPhonePassword:'إعادة تعيين كلمة المرور إلى رقم الهاتف', copyLoginSms:'نسخ رسالة تسجيل الدخول', smsCopied:'تم نسخ رسالة تسجيل الدخول. أرسلها إلى المدير.', delete:'حذف المدير والمدرسة', confirmDelete:'هل تريد حذف المدير والمدرسة وجميع الحسابات والجلسات وملفات المدرسة نهائياً؟', deleted:'تم حذف المدير والمدرسة.', saved:'تم حفظ التغييرات.',saveChanges:'حفظ جميع التغييرات',saving:'جارٍ الحفظ…',unsaved:'تغييرات غير محفوظة', loading:'جارٍ تحميل المديرين…', empty:'لا يوجد مديرون مسجلون بعد.', noPayment:'لم يحدده المدير بعد', payment:'الدفع / التواصل', open:'فتح', error:'تعذر إتمام العملية.' },
  fr: { title:'Centre de contrôle propriétaire', subtitle:'Gérer les directeurs et leurs licences scolaires', directors:'Directeurs', school:'École', director:'Directeur', phone:'Téléphone', email:'E-mail', joined:'Date d’inscription', account:'Compte', paymentState:'Paiement', paidLabel:'Payé', unpaid:'Impayé', accountActive:'Actif', accountInactive:'Inactif', activateAccount:'Activer le compte', deactivateAccount:'Désactiver le compte', markPaid:'Marquer payé', markUnpaid:'Marquer impayé', students:'Élèves', educators:'Éducateurs', expiry:'Expiration licence', status:'Statut', schoolLink:'Lien école', paymentLink:'Lien de paiement / contact du directeur', actions:'Contrôles propriétaire', active:'Actif', suspended:'Suspendu', setupPending:'Mot de passe non défini', setupDone:'Compte configuré', phoneEnabled:'Mot de passe téléphone initial activé', phoneDisabled:'Mot de passe personnel actif', add:'Ajouter un directeur', fullName:'Nom complet du directeur', schoolName:'Nom de l’école', phoneLabel:'Téléphone du directeur', emailLabel:'E-mail du directeur', paid:'Je confirme avoir reçu les 150 USD pour la licence scolaire unique.', notice:'Le directeur choisit lui-même son identifiant et son mot de passe via un lien privé. Licence d’un an.', create:'Créer école et directeur', cancel:'Annuler', creating:'Création…', created:'Directeur et école créés. Envoyez le lien privé au directeur.', setupLink:'Lien privé de configuration', smsMessage:'SMS à envoyer au directeur', copySms:'Copier le SMS', initialPasswordNotice:'Le numéro de téléphone indiqué sera le mot de passe initial du directeur. Il pourra le modifier après connexion.', copy:'Copier', renew:'Renouveler un an', suspend:'Suspendre la licence', activate:'Activer la licence', resend:'Générer un nouveau lien', resetPhonePassword:'Réinitialiser avec le téléphone', copyLoginSms:'Copier le SMS de connexion', smsCopied:'SMS copié. Envoyez-le au directeur.', delete:'Supprimer directeur et école', confirmDelete:'Supprimer définitivement le directeur, l’école, tous les comptes, sessions et médias ?', deleted:'Directeur et école supprimés.', saved:'Modifications enregistrées.',saveChanges:'Enregistrer toutes les modifications',saving:'Enregistrement…',unsaved:'Modifications non enregistrées', loading:'Chargement des directeurs…', empty:'Aucun directeur enregistré.', noPayment:'Non fourni par le directeur', payment:'Paiement / contact', open:'Ouvrir', error:'Impossible de terminer la demande.' },
  es: { title:'Centro de control del propietario', subtitle:'Gestionar directores y licencias escolares', directors:'Directores', school:'Escuela', director:'Director', phone:'Teléfono', email:'Correo', joined:'Fecha de alta', account:'Cuenta', paymentState:'Estado de pago', paidLabel:'Pagado', unpaid:'No pagado', accountActive:'Activo', accountInactive:'Inactivo', activateAccount:'Activar cuenta', deactivateAccount:'Desactivar cuenta', markPaid:'Marcar pagado', markUnpaid:'Marcar no pagado', students:'Estudiantes', educators:'Educadores', expiry:'Vencimiento', status:'Estado', schoolLink:'Enlace de escuela', paymentLink:'Enlace de pago / contacto del director', actions:'Controles del propietario', active:'Activo', suspended:'Suspendido', setupPending:'Contraseña pendiente', setupDone:'Cuenta configurada', phoneEnabled:'Contraseña inicial telefónica activada', phoneDisabled:'Contraseña personal activa', add:'Añadir director', fullName:'Nombre completo del director', schoolName:'Nombre de la escuela', phoneLabel:'Teléfono', emailLabel:'Correo del director', paid:'Confirmo que recibí los 150 USD de la licencia escolar única.', notice:'El director elegirá su usuario y contraseña mediante un enlace privado. Licencia de un año.', create:'Crear escuela y director', cancel:'Cancelar', creating:'Creando…', created:'Director y escuela creados. Envía el enlace privado al director.', setupLink:'Enlace privado de configuración', smsMessage:'Mensaje SMS para el director', copySms:'Copiar SMS', initialPasswordNotice:'El teléfono indicado será la contraseña inicial del director. Podrá cambiarla al iniciar sesión.', copy:'Copiar', renew:'Renovar un año', suspend:'Suspender licencia', activate:'Activar licencia', resend:'Generar nuevo enlace', resetPhonePassword:'Restablecer contraseña al teléfono', copyLoginSms:'Copiar SMS de acceso', smsCopied:'SMS copiado. Envíelo al Director.', delete:'Eliminar director y escuela', confirmDelete:'¿Eliminar permanentemente el director, la escuela, cuentas, sesiones y archivos?', deleted:'Director y escuela eliminados.', saved:'Cambios guardados.',saveChanges:'Guardar todos los cambios',saving:'Guardando…',unsaved:'Cambios sin guardar', loading:'Cargando directores…', empty:'Aún no hay directores.', noPayment:'El director aún no lo ha indicado', payment:'Pago / contacto', open:'Abrir', error:'No se pudo completar la solicitud.' },
  it: { title:'Centro di controllo proprietario', subtitle:'Gestisci direttori e licenze scolastiche', directors:'Direttori', school:'Scuola', director:'Direttore', phone:'Telefono', email:'E-mail', joined:'Data di iscrizione', account:'Account', paymentState:'Stato pagamento', paidLabel:'Pagato', unpaid:'Non pagato', accountActive:'Attivo', accountInactive:'Inattivo', activateAccount:'Attiva account', deactivateAccount:'Disattiva account', markPaid:'Segna pagato', markUnpaid:'Segna non pagato', students:'Studenti', educators:'Educatori', expiry:'Scadenza licenza', status:'Stato', schoolLink:'Link scuola', paymentLink:'Link pagamento / contatto del direttore', actions:'Controlli proprietario', active:'Attivo', suspended:'Sospeso', setupPending:'Password non impostata', setupDone:'Account configurato', phoneEnabled:'Password iniziale telefonica attiva', phoneDisabled:'Password personale attiva', add:'Aggiungi direttore', fullName:'Nome completo', schoolName:'Nome scuola', phoneLabel:'Telefono', emailLabel:'E-mail', paid:'Confermo di aver ricevuto i 150 USD per la licenza scolastica una tantum.', notice:'Il direttore sceglie nome utente e password tramite un link privato. Licenza di un anno.', create:'Crea scuola e direttore', cancel:'Annulla', creating:'Creazione…', created:'Direttore e scuola creati. Invia il link privato al direttore.', setupLink:'Link privato di configurazione', smsMessage:'Messaggio SMS per il direttore', copySms:'Copia SMS', initialPasswordNotice:'Il numero di telefono inserito sarà la password iniziale del direttore. Potrà cambiarla dopo l’accesso.', copy:'Copia', renew:'Rinnova un anno', suspend:'Sospendi licenza', activate:'Attiva licenza', resend:'Genera nuovo link', resetPhonePassword:'Reimposta password al telefono', copyLoginSms:'Copia SMS di accesso', smsCopied:'SMS copiato. Invialo al Direttore.', delete:'Elimina direttore e scuola', confirmDelete:'Eliminare definitivamente direttore, scuola, account, sessioni e file?', deleted:'Direttore e scuola eliminati.', saved:'Modifiche salvate.',saveChanges:'Salva tutte le modifiche',saving:'Salvataggio…',unsaved:'Modifiche non salvate', loading:'Caricamento direttori…', empty:'Nessun direttore registrato.', noPayment:'Non fornito dal direttore', payment:'Pagamento / contatto', open:'Apri', error:'Impossibile completare la richiesta.' },
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

export const OwnerDashboard: React.FC<{ currentLang:Language; token:string; onSignOut:()=>void; onManageMySchool:()=>void; onDirectorSignIn:()=>void; onEnterGuestClassroom:()=>void }> = ({ currentLang, token, onSignOut, onManageMySchool, onDirectorSignIn, onEnterGuestClassroom }) => {
  const t: Labels = labels[currentLang] || labels.en;
  const [rows,setRows] = useState<OwnerDirector[]>([]);
  const [founderThreads,setFounderThreads] = useState<FounderThread[]>([]);
  const [selectedFounderThread,setSelectedFounderThread] = useState<FounderThread | null>(null);
  const [founderConversation,setFounderConversation] = useState<FounderMessage[]>([]);
  const [founderReply,setFounderReply] = useState('');
  const [founderConversationLoading,setFounderConversationLoading] = useState(false);
  const [founderActionBusy,setFounderActionBusy] = useState(false);
  const founderConversationRefreshSequence = useRef(0);
  const founderConversationEndRef = useRef<HTMLDivElement>(null);
  const [pendingStatuses,setPendingStatuses] = useState<Record<string,{activated:boolean;paid:boolean}>>({});
  const [pendingSchoolAccountUpdates,setPendingSchoolAccountUpdates] = useState<Record<string,{activated:boolean;paid:boolean;password?:string}>>({});
  const [ownerPasswordDrafts,setOwnerPasswordDrafts] = useState<Record<string,string>>({});
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState('');
  const [error,setError] = useState('');
  const [message,setMessage] = useState('');
  const [showCreate,setShowCreate] = useState(false);
  const [createdSetupLink,setCreatedSetupLink] = useState('');
  const [createdSms,setCreatedSms] = useState('');
  const [form,setForm] = useState({fullName:'',schoolName:'',email:'',phone:'',paymentReceived:false});

  const refresh = async () => {
    setLoading(true);
    try {
      const [result, inbox] = await Promise.all([getOwnerDirectors(token), getOwnerFounderThreads(token)]);
      setRows(result.directors);
      setFounderThreads(inbox.threads || []);
      setError('');
    } catch (e) { setError(e instanceof Error ? e.message : t.error); }
    finally { setLoading(false); }
  };
  useEffect(() => { void refresh(); }, [token]);
  const openFounderConversation = async (thread: FounderThread) => {
    setSelectedFounderThread(thread);
    setFounderConversationLoading(true);
    setFounderReply('');
    try {
      const result = await getOwnerFounderMessages(token, thread.accountId);
      setFounderConversation(result.messages || []);
      const inbox = await getOwnerFounderThreads(token);
      setFounderThreads(inbox.threads || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
    } finally {
      setFounderConversationLoading(false);
    }
  };

  useEffect(() => {
    const thread = selectedFounderThread;
    if (!thread) return;
    let active = true;
    const refreshConversation = async () => {
      const sequence = ++founderConversationRefreshSequence.current;
      try {
        const result = await getOwnerFounderMessages(token, thread.accountId);
        if (active && sequence === founderConversationRefreshSequence.current) {
          setFounderConversation(result.messages || []);
        }
      } catch (e) {
        if (active && sequence === founderConversationRefreshSequence.current) {
          setError(e instanceof Error ? e.message : t.error);
        }
      }
    };
    void refreshConversation();
    const intervalId = window.setInterval(() => void refreshConversation(), 3000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      ++founderConversationRefreshSequence.current;
    };
  }, [token, selectedFounderThread?.accountId]);

  useEffect(() => {
    if (!selectedFounderThread) return;
    founderConversationEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [founderConversation, selectedFounderThread?.accountId]);
  const sendFounderReply = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const thread = selectedFounderThread;
    const reply = founderReply.trim();
    if (!thread || !reply || founderActionBusy) return;
    const optimisticId = 'pending-owner-' + crypto.randomUUID();
    const optimisticReply: FounderMessage = {
      id: optimisticId,
      senderId: 'owner',
      senderRole: 'owner',
      message: reply,
      createdAt: new Date().toISOString(),
      readAt: null,
    };
    setFounderConversation((items) => [...items, optimisticReply]);
    setFounderActionBusy(true);
    setError('');
    setFounderReply('');
    ++founderConversationRefreshSequence.current;
    let saved = false;
    try {
      await replyToFounderThread(token, thread.accountId, reply);
      saved = true;
      const sequence = ++founderConversationRefreshSequence.current;
      const result = await getOwnerFounderMessages(token, thread.accountId);
      if (sequence === founderConversationRefreshSequence.current) setFounderConversation(result.messages || []);
      const inbox = await getOwnerFounderThreads(token);
      setFounderThreads(inbox.threads || []);
    } catch (e) {
      if (!saved) {
        setFounderConversation((items) => items.filter((item) => item.id !== optimisticId));
        setFounderReply(reply);
      }
      setError(e instanceof Error ? e.message : t.error);
    } finally {
      setFounderActionBusy(false);
    }
  };

  const clearFounderConversation = async (thread: FounderThread) => {
    const prompt = currentLang === 'ar' ? 'هل تريد حذف جميع رسائل هذه المحادثة؟'
      : currentLang === 'fr' ? 'Supprimer tous les messages de cette conversation ?'
      : currentLang === 'es' ? '¿Eliminar todos los mensajes de esta conversación?'
      : currentLang === 'it' ? 'Eliminare tutti i messaggi di questa conversazione?'
      : 'Clear all messages in this conversation?';
    if (!window.confirm(prompt) || founderActionBusy) return;
    setFounderActionBusy(true);
    setError('');
    try {
      await deleteFounderThread(token, thread.accountId);
      const inbox = await getOwnerFounderThreads(token);
      setFounderThreads(inbox.threads || []);
      if (selectedFounderThread?.accountId === thread.accountId) {
        setSelectedFounderThread(null);
        setFounderConversation([]);
        setFounderReply('');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
    } finally {
      setFounderActionBusy(false);
    }
  };

  const deleteSchoolAccount = async (thread: FounderThread) => {
    const prompt = currentLang === 'ar' ? 'هل تريد حذف هذا الحساب نهائياً؟'
      : currentLang === 'fr' ? 'Supprimer définitivement ce compte ?'
      : currentLang === 'es' ? '¿Eliminar esta cuenta permanentemente?'
      : currentLang === 'it' ? 'Eliminare definitivamente questo account?'
      : 'Permanently delete this account?';
    if (!window.confirm(prompt) || founderActionBusy) return;
    setFounderActionBusy(true);
    setError('');
    try {
      await deleteOwnerAccount(token, thread.accountId);
      const inbox = await getOwnerFounderThreads(token);
      setFounderThreads(inbox.threads || []);
      if (selectedFounderThread?.accountId === thread.accountId) {
        setSelectedFounderThread(null);
        setFounderConversation([]);
        setFounderReply('');
      }
      setMessage(currentLang === 'ar' ? 'تم حذف الحساب.' : currentLang === 'fr' ? 'Compte supprimé.' : currentLang === 'es' ? 'Cuenta eliminada.' : currentLang === 'it' ? 'Account eliminato.' : 'Account deleted.');
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
    } finally {
      setFounderActionBusy(false);
    }
  };

  useEffect(() => {
    let active = true;
    const refreshFounderCounts = async () => {
      try {
        const inbox = await getOwnerFounderThreads(token);
        if (active) setFounderThreads(inbox.threads || []);
      } catch {
        // Keep the Director table usable if the optional founder inbox is unavailable.
      }
    };
    void refreshFounderCounts();
    const intervalId = window.setInterval(() => { void refreshFounderCounts(); }, 15000);
    return () => { active = false; window.clearInterval(intervalId); };
  }, [token]);

  const stageSchoolAccountStatus = (
    thread: FounderThread,
    field: 'activated' | 'paid',
    value: boolean
  ) => {
    setPendingSchoolAccountUpdates((current) => {
      const base = current[thread.accountId] || {
        activated: Boolean(thread.activated),
        paid: Boolean(thread.paid),
      };
      const next = { ...base, [field]: value };
      if (next.activated === Boolean(thread.activated) &&
          next.paid === Boolean(thread.paid) &&
          !next.password) {
        const remaining = { ...current };
        delete remaining[thread.accountId];
        return remaining;
      }
      return { ...current, [thread.accountId]: next };
    });
    setError('');
    setMessage('');
  };

  const stageSchoolAccountPassword = (thread: FounderThread, password: string) => {
    setOwnerPasswordDrafts((current) => ({ ...current, [thread.accountId]: password }));
    setPendingSchoolAccountUpdates((current) => {
      const base = current[thread.accountId] || {
        activated: Boolean(thread.activated),
        paid: Boolean(thread.paid),
      };
      const next = { ...base };
      if (password.length > 0) next.password = password;
      else delete next.password;
      if (next.activated === Boolean(thread.activated) &&
          next.paid === Boolean(thread.paid) &&
          !next.password) {
        const remaining = { ...current };
        delete remaining[thread.accountId];
        return remaining;
      }
      return { ...current, [thread.accountId]: next };
    });
    setError('');
    setMessage('');
  };

  const create = async (event:React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy('create'); setError(''); setMessage(''); setCreatedSetupLink(''); setCreatedSms('');
    try {
      const result = await createOwnerDirector(token,{...form,paymentReceived:true});
      setCreatedSetupLink(result.setupLink);
      setCreatedSms(currentLang === 'ar'
        ? `مرحباً ${result.director.fullName}، تم إنشاء حسابك كمدير في Agenda.\nرابط اختيار اسم المستخدم: ${result.setupLink}\nكلمة المرور الأولية (رقم الهاتف الذي سجله المالك): ${result.director.phone}\nاستخدم رقم الهاتف هذا كما هو تماماً لتسجيل الدخول أول مرة. بعد الدخول، غيّر كلمة المرور من لوحة المدير.`
        : `Hello ${result.director.fullName}, your Agenda Director account is ready.\nChoose your username: ${result.setupLink}\nINITIAL PASSWORD (the phone number entered by the Owner): ${result.director.phone}\nUse that exact phone number as your password for your first sign-in. After signing in, change it from your Director dashboard.`);
      setMessage(t.created);
      setForm({fullName:'',schoolName:'',email:'',phone:'',paymentReceived:false});
      setShowCreate(false);
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : t.error); }
    finally { setBusy(''); }
  };
  const stageStatus = (row:OwnerDirector, field:'activated'|'paid', value:boolean) => {
    setPendingStatuses(current => {
      const base = current[row.id] || { activated:row.activated, paid:row.paid };
      const next = { ...base, [field]:value };
      if (next.activated === row.activated && next.paid === row.paid) {
        const remaining = { ...current }; delete remaining[row.id]; return remaining;
      }
      return { ...current, [row.id]:next };
    });
    setError(''); setMessage('');
  };
  const saveAllChanges = async () => {
    const directorUpdates = Object.entries(pendingStatuses).map(([id, status]) => ({ id, ...status }));
    const schoolAccountUpdates = Object.entries(pendingSchoolAccountUpdates).map(([id, update]) => ({ id, ...update }));
    if (!directorUpdates.length && !schoolAccountUpdates.length) return;

    setBusy('save-all');
    setError('');
    setMessage('');
    try {
      if (directorUpdates.length) {
        await saveOwnerDirectorStatuses(token, directorUpdates);
      }
      if (schoolAccountUpdates.length) {
        await Promise.all(schoolAccountUpdates.map(({ id, ...update }) => updateOwnerAccount(token, id, update)));
      }

      setRows((current) => current.map((row) => {
        const update = directorUpdates.find((item) => item.id === row.id);
        return update ? { ...row, activated: update.activated, paid: update.paid } : row;
      }));
      setFounderThreads((current) => current.map((thread) => {
        const update = schoolAccountUpdates.find((item) => item.id === thread.accountId);
        return update ? { ...thread, activated: update.activated, paid: update.paid } : thread;
      }));
      setPendingStatuses({});
      setPendingSchoolAccountUpdates({});
      // Keep the entered password visible in this open Owner Control Center after it is saved.
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
    } finally {
      setBusy('');
    }
  };
  const update = async (id:string, change:{renewLicense?:boolean;licenseActive?:boolean;activated?:boolean;paid?:boolean}) => {
    setBusy(id); setError(''); setMessage('');
    try { await updateOwnerDirector(token,id,change); setMessage(''); await refresh(); }
    catch(e) { setError(e instanceof Error ? e.message : t.error); }
    finally { setBusy(''); }
  };
  const resend = async (id:string) => {
    setBusy(id); setError(''); setMessage('');
    try { const result = await issueDirectorSetupLink(token,id); setCreatedSetupLink(result.setupLink); setMessage(t.setupLink); }
    catch(e) { setError(e instanceof Error ? e.message : t.error); }
    finally { setBusy(''); }
  };
  const copyLoginSms = async (row:OwnerDirector) => {
    const message = currentLang === 'ar'
      ? `مرحباً ${row.fullName}،\nاسم المستخدم: ${row.username}\nكلمة المرور الأولية: ${row.phone}\nلتسجيل الدخول أول مرة، أدخل رقم الهاتف هذا في خانة كلمة المرور: ${row.phone}\nيمكنك تغيير كلمة المرور بعد الدخول.\nرابط المدرسة: ${row.directorLink}`
      : `Hello ${row.fullName},\nDirector username: ${row.username}\nInitial password: ${row.phone}\nFor your first sign-in, enter this phone number in the Password field: ${row.phone}\nYou can change your password after signing in.\nSchool link: ${row.directorLink}`;
    try { await navigator.clipboard.writeText(message); setMessage(t.smsCopied); setError(''); }
    catch { setError(currentLang === 'ar' ? 'تعذر نسخ الرسالة.' : 'Could not copy the SMS.'); }
  };
  const resetPhonePassword = async (row:OwnerDirector) => {
    const confirmed = window.confirm(currentLang === 'ar' ? 'إعادة تعيين كلمة المرور الأولية لهذا المدير إلى رقم الهاتف المسجل؟' : 'Reset this Director’s initial password to the phone number recorded by the Owner?');
    if (!confirmed) return;
    setBusy(row.id); setError(''); setMessage('');
    try { const result = await resetOwnerDirectorPhonePassword(token,row.id); if (!result.verified) throw new Error('The saved phone password could not be verified.'); setMessage(`${result.message} Username: ${result.username}; phone ending ${result.phoneLastTwo}; Account ${result.activated?'active':'inactive'}; Paid ${result.paid?'yes':'no'}; licence ${result.licenceActive?'active':'inactive'}; sign-in ready ${result.accessReady?'YES':'NO'}.`); await refresh(); }
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
      <div className="flex flex-wrap items-center gap-2"><button onClick={onEnterGuestClassroom} className="rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950">{currentLang==='ar'?'فتح الصف المباشر كضيف':currentLang==='fr'?'Ouvrir la classe en direct comme invité':currentLang==='es'?'Abrir aula en directo como invitado':currentLang==='it'?'Apri aula dal vivo come ospite':'Open Live Classroom as Guest'}</button><button onClick={onDirectorSignIn} className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-bold">{currentLang==='ar'?'دخول المدير':currentLang==='fr'?'Connexion Directeur':currentLang==='es'?'Acceso Director':currentLang==='it'?'Accesso Direttore':'Director sign in'}</button><button onClick={onManageMySchool} className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-bold">{currentLang==='ar'?'إدارة مدرستي':'Manage My School'}</button><button onClick={onSignOut} className="rounded-xl bg-white/10 px-4 py-2 text-sm">{currentLang==='ar'?'تسجيل الخروج':'Sign out'}</button></div>
    </div>
    <div className="grid sm:grid-cols-3 gap-3">
      <div className="rounded-2xl border bg-white p-4"><Building2/><b className="block text-2xl">{rows.length}</b>{t.directors}</div>
      <div className="rounded-2xl border bg-white p-4"><Users/><b className="block text-2xl">{founderThreads.filter((thread) => thread.role === 'student').length}</b>{t.students}</div>
      <div className="rounded-2xl border bg-white p-4"><Users/><b className="block text-2xl">{founderThreads.filter((thread) => thread.role === 'educator').length}</b>{t.educators}</div>
    </div>

    <section className="rounded-2xl border bg-white overflow-hidden">
      <div className="p-4 flex flex-wrap justify-between items-center gap-3"><h2 className="font-black">{t.directors}</h2><div className="flex gap-2"><button onClick={()=>setShowCreate(v=>!v)} className="rounded-lg bg-indigo-700 px-3 py-2 text-xs font-bold text-white">{t.add}</button><button onClick={()=>void refresh()} aria-label="Refresh"><RefreshCw size={17}/></button></div></div>
      {loading ? <p className="p-4">{t.loading}</p> : <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1450px]">
          <thead className="bg-slate-50"><tr>{[t.school,t.director,t.phone,t.email,currentLang==='ar'?'الوارد':currentLang==='fr'?'Messages reçus':currentLang==='es'?'Chat entrante':currentLang==='it'?'Chat in':'Chat in',currentLang==='ar'?'الصادر':currentLang==='fr'?'Messages envoyés':currentLang==='es'?'Chat saliente':currentLang==='it'?'Chat out':'Chat out',t.students,t.educators,t.joined,t.expiry,t.account,t.paymentState,t.schoolLink,t.paymentLink,t.actions].map(x=><th key={x} className="p-3 text-start whitespace-nowrap">{x}</th>)}</tr></thead>
          <tbody>{rows.length===0 ? <tr><td colSpan={15} className="p-4 text-center text-slate-500">{t.empty}</td></tr> : rows.map(row=>{
            const schoolThreads = founderThreads.filter(thread => thread.accountId === row.id);
            const chatIn = schoolThreads.reduce((total, thread) => total + (thread.incomingCount || 0), 0);
            const chatOut = schoolThreads.reduce((total, thread) => total + (thread.outgoingCount || 0), 0);
            const link=destination(row);
            const contactLabel=row.paymentMethod==='whatsapp'?'WhatsApp':row.paymentMethod==='phone'?t.phone:row.paymentMethod==='email'?t.email:row.paymentMethod==='bank'?'Bank':row.paymentMethod==='suyool'?'Suyool':'—';
            return <tr key={row.id} className="border-t align-top">
              <td className="p-3"><b>{row.schoolName}</b><small className="block text-slate-500">{row.schoolId}</small></td>
              <td className="p-3"><b>{row.fullName}</b><small className="block text-slate-500">@{row.username}</small><small className="block text-slate-500">{row.setupPending?t.setupPending:t.setupDone}</small><small className={row.phonePasswordEnabled?'block text-emerald-700':'block text-slate-500'}>{row.phonePasswordEnabled?t.phoneEnabled:t.phoneDisabled}</small></td>
              <td className="p-3 whitespace-nowrap">{row.phone||'—'}</td>
              <td className="p-3">{row.email||'—'}</td>
              <td className="p-3">
                <span className={schoolThreads.some(thread=>thread.unreadIncoming>0)?'inline-flex min-w-8 justify-center rounded-full bg-rose-100 px-2 py-1 font-black text-rose-700':'inline-flex min-w-8 justify-center rounded-full bg-slate-100 px-2 py-1 font-black text-slate-700'} title={schoolThreads.reduce((n,thread)=>n+(thread.unreadIncoming||0),0)+' unread'}>{chatIn}</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  <button type="button" disabled={!schoolThreads.find(thread=>thread.accountId===row.id)} onClick={()=>{const thread=schoolThreads.find(item=>item.accountId===row.id);if(thread)void openFounderConversation(thread);}} className="text-[10px] font-bold text-indigo-700 underline disabled:opacity-40">{currentLang==='ar'?'فتح':currentLang==='fr'?'Ouvrir':currentLang==='es'?'Abrir':currentLang==='it'?'Apri':'Open chat'}</button>
                  <button type="button" disabled={!schoolThreads.find(thread=>thread.accountId===row.id)||founderActionBusy} onClick={()=>{const thread=schoolThreads.find(item=>item.accountId===row.id);if(thread)void clearFounderConversation(thread);}} className="text-[10px] font-bold text-rose-700 underline disabled:opacity-40">{currentLang==='ar'?'مسح':currentLang==='fr'?'Effacer':currentLang==='es'?'Borrar':currentLang==='it'?'Pulisci':'Clear'}</button>
                </div>
              </td>
              <td className="p-3">
                <span className="font-semibold text-indigo-700">{chatOut}</span>
                <button type="button" disabled={!schoolThreads[0]||founderActionBusy} onClick={()=>{if(schoolThreads[0])void clearFounderConversation(schoolThreads[0]);}} className="mt-1 block text-[10px] font-bold text-rose-700 underline disabled:opacity-40">{currentLang==='ar'?'مسح المحادثة':currentLang==='fr'?'Effacer':currentLang==='es'?'Borrar chat':currentLang==='it'?'Pulisci chat':'Clear chat'}</button>
              </td>
              <td className="p-3">{row.studentCount}</td><td className="p-3">{row.educatorCount}</td>
              <td className="p-3 whitespace-nowrap">{dateLabel(row.createdAt,currentLang)}</td>
              <td className="p-3 whitespace-nowrap">{dateLabel(row.expiresAt,currentLang)}</td>
              <td className="p-3"><label className="inline-flex items-center gap-2 whitespace-nowrap"><input type="checkbox" checked={(pendingStatuses[row.id] ?? row).activated} disabled={busy==='save-all'} onChange={e=>stageStatus(row,'activated',e.target.checked)} aria-label={row.activated?t.deactivateAccount:t.activateAccount} className="h-4 w-4 accent-emerald-600"/><span className={(pendingStatuses[row.id] ?? row).activated?'text-emerald-700':'text-red-600'}>{(pendingStatuses[row.id] ?? row).activated?t.accountActive:t.accountInactive}</span></label></td>
              <td className="p-3"><label className="inline-flex items-center gap-2 whitespace-nowrap"><input type="checkbox" checked={(pendingStatuses[row.id] ?? row).paid} disabled={busy==='save-all'} onChange={e=>stageStatus(row,'paid',e.target.checked)} aria-label={row.paid?t.markUnpaid:t.markPaid} className="h-4 w-4 accent-emerald-600"/><span className={(pendingStatuses[row.id] ?? row).paid?'text-emerald-700':'text-amber-700'}>{(pendingStatuses[row.id] ?? row).paid?t.paidLabel:t.unpaid}</span></label></td>
              
              <td className="p-3"><a href={row.directorLink} target="_blank" rel="noreferrer" className="text-indigo-700 underline whitespace-nowrap">{t.open} <ExternalLink size={12} className="inline"/></a><button onClick={()=>void navigator.clipboard.writeText(row.directorLink)} className="block text-xs underline mt-1">{t.copy}</button></td>
              <td className="p-3 min-w-48">{link?<><span className="block text-xs text-slate-500">{contactLabel}</span><a href={link} target="_blank" rel="noreferrer" className="block max-w-52 break-all text-indigo-700 underline">{row.paymentValue}</a></>:<span className="text-slate-400">{t.noPayment}</span>}</td>
              <td className="p-3"><div className="flex flex-col items-start gap-2"><button disabled={busy===row.id||!row.setupPending} onClick={()=>void resend(row.id)} className="text-xs underline disabled:opacity-40"><KeyRound size={13} className="inline"/> {t.resend}</button><button disabled={busy===row.id||!row.phone} onClick={()=>void copyLoginSms(row)} className="text-xs underline disabled:opacity-40">{t.copyLoginSms}</button><button disabled={busy===row.id||!row.phone} onClick={()=>void resetPhonePassword(row)} className="text-xs underline disabled:opacity-40">{t.resetPhonePassword}</button><button disabled={busy===row.id} onClick={()=>void update(row.id,{renewLicense:true})} className="text-xs underline disabled:opacity-40">{t.renew}</button><button disabled={busy===row.id} onClick={()=>void remove(row)} className="text-xs text-red-700 underline disabled:opacity-40"><Trash2 size={13} className="inline"/> {t.delete}</button></div></td>
            </tr>;
          })}</tbody>
        </table>
      </div>}
    </section>

    {(['educator','student'] as const).map((role) => {
      const group = founderThreads.filter((thread) => thread.role === role);
      const roleTitle = role === 'educator'
        ? (currentLang==='ar'?'المعلمون':currentLang==='fr'?'Éducateurs':currentLang==='es'?'Educadores':currentLang==='it'?'Educatori':'Educators')
        : (currentLang==='ar'?'الطلاب':currentLang==='fr'?'Élèves':currentLang==='es'?'Estudiantes':currentLang==='it'?'Studenti':'Students');
      const headers = currentLang === 'ar'
        ? ['المعلم','اسم المستخدم أو البريد الإلكتروني','كلمة المرور','البريد الإلكتروني','رقم الهاتف','المدرسة / المادة','الحصة المسجلة','تاريخ الانضمام','تاريخ الانتهاء','مفعّل','مدفوع','حذف']
        : currentLang === 'fr'
          ? ['Éducateur','Nom d’utilisateur ou e-mail','Mot de passe','Adresse e-mail','Téléphone','École / matière','Séance inscrite','Date d’inscription','Date d’expiration','Activé','Payé','Supprimer']
          : currentLang === 'es'
            ? ['Educador','Usuario o correo electrónico','Contraseña','Correo electrónico','Teléfono','Escuela / materia','Sesión registrada','Fecha de alta','Fecha de vencimiento','Activado','Pagado','Eliminar']
            : currentLang === 'it'
              ? ['Educatore','Nome utente o e-mail','Password','Indirizzo e-mail','Numero di telefono','Scuola / materia','Sessione registrata','Data di iscrizione','Data di scadenza','Attivato','Pagato','Elimina']
              : ['Educator','Username or email address','Password','Email address','Phone number','School / subject','Registered session','Joining date','Expiry date','Activated','Paid','Delete'];
      const emptyLabel = currentLang==='ar'?'لا توجد تسجيلات بعد.':currentLang==='fr'?'Aucune inscription pour le moment.':currentLang==='es'?'Todavía no hay registros.':currentLang==='it'?'Nessuna registrazione al momento.':'No registrations yet.';
      const yes = currentLang==='ar'?'نعم':currentLang==='fr'?'Oui':currentLang==='es'?'Sí':currentLang==='it'?'Sì':'Yes';
      const no = currentLang==='ar'?'لا':currentLang==='fr'?'Non':currentLang==='es'?'No':currentLang==='it'?'No':'No';
      return <section key={role} className="overflow-hidden rounded-2xl border bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50 p-4">
          <h2 className="font-black">{roleTitle} <span className="ms-1 text-xs font-semibold text-slate-500">({group.length})</span></h2>
          <span className="text-[11px] text-slate-500">{currentLang==='ar'?'إدارة حسابات المدرسة':currentLang==='fr'?'Gestion des comptes scolaires':currentLang==='es'?'Gestión de cuentas escolares':currentLang==='it'?'Gestione degli account scolastici':'School account management'}</span>
        </div>
        {group.length===0
          ? <p className="p-4 text-center text-slate-400">{emptyLabel}</p>
          : <div className="divide-y divide-slate-100">
              {group.map((thread) => {
                  const stagedAccount = pendingSchoolAccountUpdates[thread.accountId] || thread;
                  const activated = stagedAccount.activated === true || Number(stagedAccount.activated || 0) === 1;
                  const paid = stagedAccount.paid === true || Number(stagedAccount.paid || 0) === 1;
                  return <div key={thread.accountId} className="bg-white px-3 py-3">
                    <div className="mb-2 flex min-w-0 items-center gap-2">
                      <button type="button" onClick={()=>void openFounderConversation(thread)} className="min-w-0 truncate text-start text-sm font-bold text-indigo-800 underline decoration-indigo-300 underline-offset-2">{thread.fullName || thread.username || '—'}</button>
                      <span className={thread.unreadIncoming>0?'shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-700':'shrink-0 text-[10px] text-slate-500'}>
                        {thread.unreadIncoming>0
                          ? String(thread.unreadIncoming) + (currentLang==='ar'?' رسائل جديدة':currentLang==='fr'?' nouveaux messages':currentLang==='es'?' mensajes nuevos':currentLang==='it'?' nuovi messaggi':' unread message(s)')
                          : String(thread.incomingCount||0) + ' in · ' + String(thread.outgoingCount||0) + ' out'}
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1550px] text-xs">
                        <thead className="bg-slate-50"><tr>{headers.map((header) => <th key={header} className="whitespace-nowrap p-3 text-start">{header}</th>)}</tr></thead>
                        <tbody>
                          <tr className={thread.unreadIncoming>0?'bg-rose-50':'bg-white'}>
                    <td className="p-3">{role==='student' ? (thread.educatorName || '—') : '—'}</td>
                    <td className="p-3">{thread.username || thread.email || '—'}</td>
                    <td className="p-3">
                      <div className="flex min-w-52 items-center gap-2">
                        <input type="text" autoComplete="off" spellCheck={false} maxLength={128} disabled={busy==='save-all'}
                          value={ownerPasswordDrafts[thread.accountId] || ''}
                          onChange={(event) => stageSchoolAccountPassword(thread, event.target.value)}
                          placeholder={currentLang==='ar'?'أدخل كلمة المرور':currentLang==='fr'?'Saisir le mot de passe':currentLang==='es'?'Introduce la contraseña':currentLang==='it'?'Inserisci la password':'Enter password'}
                          aria-label={(thread.fullName || thread.username) + ' password'}
                          className="min-w-0 w-36 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 disabled:bg-slate-100"
                        />
                      </div>
                    </td>
                    <td className="p-3">{thread.email || '—'}</td>
                    <td className="p-3">{thread.phone || '—'}</td>
                    <td className="p-3">{thread.schoolOrSubject || thread.schoolName || '—'}</td>
                    <td className="p-3">{thread.registeredSession || '—'}</td>
                    <td className="whitespace-nowrap p-3">{dateLabel(thread.createdAt || null,currentLang)}</td>
                    <td className="whitespace-nowrap p-3">{dateLabel(thread.expiresAt || null,currentLang)}</td>
                    <td className="p-3">
                      <label className="inline-flex items-center gap-2 whitespace-nowrap">
                        <input type="checkbox" checked={activated} disabled={busy==='save-all'} onChange={(event) => stageSchoolAccountStatus(thread, 'activated', event.target.checked)} aria-label={thread.fullName + ' activate account'} className="h-4 w-4 accent-emerald-600"/>
                        <span className={activated?'font-bold text-emerald-700':'font-bold text-rose-700'}>{activated?yes:no}</span>
                      </label>
                    </td>
                    <td className="p-3">
                      <label className="inline-flex items-center gap-2 whitespace-nowrap">
                        <input type="checkbox" checked={paid} disabled={busy==='save-all'} onChange={(event) => stageSchoolAccountStatus(thread, 'paid', event.target.checked)} aria-label={thread.fullName + ' mark paid'} className="h-4 w-4 accent-emerald-600"/>
                        <span className={paid?'font-bold text-emerald-700':'font-bold text-amber-700'}>{paid?yes:no}</span>
                      </label>
                    </td>
                    <td className="p-3">
                      <button type="button" disabled={founderActionBusy} onClick={()=>void deleteSchoolAccount(thread)} className="rounded-lg p-2 text-rose-700 hover:bg-rose-50 disabled:opacity-40" aria-label={headers[12]} title={headers[12]}><Trash2 size={16}/></button>
                    </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>;
              })}
            </div>}
      </section>;
    })}

    {selectedFounderThread && (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-3 sm:p-5" onClick={()=>setSelectedFounderThread(null)}>
        <section role="dialog" aria-modal="true" aria-label="Conversation with user" onClick={(event)=>event.stopPropagation()} className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <header className="flex items-center justify-between gap-3 bg-slate-950 p-4 text-white">
            <div className="min-w-0"><h3 className="truncate font-black">{selectedFounderThread.fullName}</h3><p className="text-[11px] text-slate-300">@{selectedFounderThread.username} · {selectedFounderThread.schoolName||'Agenda'} · {selectedFounderThread.role}</p></div>
            <button type="button" onClick={()=>setSelectedFounderThread(null)} className="rounded-lg bg-white/10 p-2" aria-label={currentLang==='ar'?'إغلاق':'Close'}><X size={17}/></button>
          </header>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
            {founderConversationLoading ? <p className="py-8 text-center text-sm text-slate-500">Loading…</p>
              : founderConversation.length===0 ? <p className="py-8 text-center text-sm text-slate-400">{currentLang==='ar'?'لا توجد رسائل بعد. أرسل أول رسالة.':'No messages yet. Send the first message.'}</p>
              : founderConversation.map((item)=> <div key={item.id} className={item.senderRole==='owner'?'flex justify-end':'flex justify-start'}>
                  <div className={item.senderRole==='owner'?'max-w-[86%] rounded-2xl rounded-br-sm bg-indigo-700 p-3 text-sm text-white':'max-w-[86%] rounded-2xl rounded-bl-sm border border-slate-200 bg-white p-3 text-sm text-slate-800'}>
                    <p className="mb-1 text-[10px] font-black opacity-70">{item.senderRole==='owner'?'Us':selectedFounderThread.fullName}</p>
                    <p className="whitespace-pre-wrap break-words">{item.message}</p>
                    <time className="mt-1 block text-end text-[9px] opacity-60">{new Date(item.createdAt).toLocaleString(currentLang,{dateStyle:'short',timeStyle:'short'})}</time>
                  </div>
                </div>)}
            <div ref={founderConversationEndRef} />
          </div>
          <form onSubmit={sendFounderReply} className="flex items-end gap-2 border-t border-slate-200 bg-white p-3">
            <textarea value={founderReply} onChange={(event)=>setFounderReply(event.target.value)} rows={2} maxLength={4000} placeholder={currentLang==='ar'?'اكتب ردك للعميل...':currentLang==='fr'?'Écrire une réponse...':currentLang==='es'?'Escribe una respuesta...':currentLang==='it'?'Scrivi una risposta...':'Write a reply to this user...'} className="min-h-14 min-w-0 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-indigo-600"/>
            <button type="submit" disabled={!founderReply.trim()||founderActionBusy} className="rounded-xl bg-indigo-700 p-3 text-white disabled:opacity-40" aria-label="Send reply"><Send size={16}/></button>
            <button type="button" disabled={founderActionBusy} onClick={()=>void clearFounderConversation(selectedFounderThread)} className="rounded-xl border border-rose-200 bg-white p-3 text-rose-700 disabled:opacity-40" aria-label="Clear chat"><Trash2 size={16}/></button>
          </form>
          {error&&<p role="alert" className="px-3 pb-3 text-xs text-rose-700">{error}</p>}
        </section>
      </div>
    )}

    {showCreate&&<section className="rounded-2xl border bg-white p-5 space-y-4">
      <div><h3 className="font-black">{t.add}</h3><p className="mt-1 text-xs text-slate-500">{t.notice}</p><p className="mt-2 text-xs font-semibold text-amber-700">{t.initialPasswordNotice}</p></div>
      <form onSubmit={create} className="grid sm:grid-cols-2 gap-3">
        <label className="block text-sm">{t.fullName}<input required minLength={2} maxLength={120} className="block w-full border rounded-lg p-2 mt-1" value={form.fullName} onChange={e=>setForm(v=>({...v,fullName:e.target.value}))}/></label>
        <label className="block text-sm">{t.schoolName}<input required minLength={2} maxLength={160} className="block w-full border rounded-lg p-2 mt-1" value={form.schoolName} onChange={e=>setForm(v=>({...v,schoolName:e.target.value}))}/></label>
        <label className="block text-sm">{t.emailLabel}<input required type="email" maxLength={254} className="block w-full border rounded-lg p-2 mt-1" value={form.email} onChange={e=>setForm(v=>({...v,email:e.target.value}))}/></label>
        <label className="block text-sm">{t.phoneLabel}<input required minLength={6} maxLength={40} className="block w-full border rounded-lg p-2 mt-1" value={form.phone} onChange={e=>setForm(v=>({...v,phone:e.target.value}))}/></label>
        <label className="sm:col-span-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm"><input required type="checkbox" checked={form.paymentReceived} onChange={e=>setForm(v=>({...v,paymentReceived:e.target.checked}))} className="mt-1"/><span>{t.paid}</span></label>
        <div className="sm:col-span-2 flex gap-2"><button type="submit" disabled={busy==='create'||!form.paymentReceived} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy==='create'?t.creating:t.create}</button><button type="button" onClick={()=>setShowCreate(false)} className="rounded-lg border px-4 py-2 text-sm">{t.cancel}</button></div>
      </form>
    </section>}

    {createdSetupLink&&<section className="rounded-2xl border border-emerald-200 bg-white p-4 space-y-3"><div className="text-sm font-bold">{t.setupLink}</div><a href={createdSetupLink} target="_blank" rel="noreferrer" className="block break-all text-sm text-indigo-700 underline">{createdSetupLink}</a><button type="button" onClick={()=>void navigator.clipboard.writeText(createdSetupLink)} className="text-xs underline"><Copy size={13} className="inline"/> {t.copy}</button>{createdSms&&<div className="border-t pt-3 space-y-2"><div className="text-sm font-bold">{t.smsMessage}</div><p className="rounded-lg bg-slate-50 p-3 text-sm whitespace-pre-wrap">{createdSms}</p><button type="button" onClick={()=>void navigator.clipboard.writeText(createdSms)} className="text-xs font-bold text-indigo-700 underline"><Copy size={13} className="inline"/> {t.copySms}</button></div>}</section>}
    <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-white/95 p-4 shadow-lg backdrop-blur">
      <span className="text-xs font-semibold text-slate-700">
        {(Object.keys(pendingStatuses).length + Object.keys(pendingSchoolAccountUpdates).length) > 0
          ? `${Object.keys(pendingStatuses).length + Object.keys(pendingSchoolAccountUpdates).length} ${t.unsaved}`
          : ''}
      </span>
      <button
        type="button"
        onClick={() => void saveAllChanges()}
        disabled={(Object.keys(pendingStatuses).length + Object.keys(pendingSchoolAccountUpdates).length) === 0 || busy === 'save-all'}
        className="rounded-xl bg-indigo-700 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy === 'save-all' ? t.saving : t.saveChanges}
      </button>
    </div>
    {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
    {message&&<p role="status" className="text-sm text-emerald-700">{message}</p>}
  </div>;
};
