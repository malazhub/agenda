import React,{useState} from 'react';
import {claimDirectorSetup} from '../services/cloudflareApi';
import type {CloudflareAccount} from '../services/cloudflareApi';
import type {Language} from '../types';

export const DirectorSetupPage:React.FC<{token:string;currentLang:Language;onComplete:(account:CloudflareAccount,sessionToken:string)=>void}> = ({token,currentLang,onComplete})=>{
  const [username,setUsername]=useState('');
  const [password,setPassword]=useState('');
  const [confirm,setConfirm]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const arabic=currentLang==='ar';
  const submit=async(event:React.FormEvent<HTMLFormElement>)=>{
    event.preventDefault();setError('');
    if(password!==confirm){setError(arabic?'كلمتا المرور غير متطابقتين.':'Passwords do not match.');return;}
    setBusy(true);
    try{const result=await claimDirectorSetup(token,username,password);onComplete(result.account,result.token);}
    catch(e){setError(e instanceof Error?e.message:'Unable to activate this Director account.');}
    finally{setBusy(false);}
  };
  return <main className="min-h-[65vh] flex items-center justify-center px-4 py-10">
    <section className="w-full max-w-lg rounded-3xl border bg-white p-6 shadow-sm space-y-5" dir={arabic?'rtl':'ltr'}>
      <div><h1 className="text-2xl font-black text-slate-900">{arabic?'إعداد حساب المدير':'Set up your Director account'}</h1><p className="mt-2 text-sm text-slate-600">{arabic?'اختر اسم المستخدم وكلمة المرور الخاصين بك. هذا الرابط صالح لمرة واحدة.':'Choose your own username and password. This private setup link can only be used once.'}</p></div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-semibold">{arabic?'اسم المستخدم':'Choose a username'}<input required minLength={3} maxLength={32} pattern="[A-Za-z0-9._-]+" autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} className="mt-1 block w-full rounded-xl border p-3"/></label>
        <label className="block text-sm font-semibold">{arabic?'كلمة المرور':'Choose a password'}<input required type="password" maxLength={1024} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 block w-full rounded-xl border p-3"/><small className="text-slate-500">{arabic?'يمكنك استخدام كلمة مرور بأي طول، حتى حرف واحد.':'Use any password length you choose, including a single character.'}</small></label>
        <label className="block text-sm font-semibold">{arabic?'تأكيد كلمة المرور':'Confirm password'}<input required type="password" maxLength={1024} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} className="mt-1 block w-full rounded-xl border p-3"/></label>
        {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={busy} className="w-full rounded-xl bg-indigo-700 px-4 py-3 font-bold text-white disabled:opacity-50">{busy?(arabic?'جارٍ التفعيل…':'Setting up…'):(arabic?'تفعيل حسابي':'Activate my account')}</button>
      </form>
    </section>
  </main>;
};
