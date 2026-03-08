// app/(auth)/signup/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true); setError("");
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/dashboard` } });
    if (error) { setError(error.message); setLoading(false); return; }
    setDone(true);
  };

  if (done) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#060608", padding:16 }}>
      <div style={{ maxWidth:420, width:"100%", textAlign:"center", background:"#0d0d16", border:"1.5px solid #171726", borderRadius:16, padding:40 }}>
        <div style={{ fontSize:40, marginBottom:16 }}>📬</div>
        <h2 style={{ fontSize:20, fontWeight:800, marginBottom:8 }}>Check your email</h2>
        <p style={{ color:"#666", fontSize:14, lineHeight:1.6 }}>We sent a confirmation link to <b style={{color:"#F0EFF8"}}>{email}</b>. Click it to activate your account.</p>
        <Link href="/login" style={{ display:"inline-block", marginTop:24, color:"#FF9A5C", fontWeight:600, fontSize:14 }}>← Back to login</Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#060608", padding:16 }}>
      <div style={{ width:"100%", maxWidth:420, background:"#0d0d16", border:"1.5px solid #171726", borderRadius:16, padding:40 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, letterSpacing:".08em", background:"linear-gradient(135deg,#FF6B35,#FF9A5C)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>FORMFLOW</div>
          <div style={{ fontSize:14, color:"#555", marginTop:4 }}>Create your account</div>
        </div>

        <form onSubmit={handleSignup} style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#555", letterSpacing:".07em", textTransform:"uppercase", marginBottom:6 }}>Email</div>
            <input className="dark-input" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#555", letterSpacing:".07em", textTransform:"uppercase", marginBottom:6 }}>Password</div>
            <input className="dark-input" type="password" placeholder="Min. 8 characters" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} />
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#555", letterSpacing:".07em", textTransform:"uppercase", marginBottom:6 }}>Confirm Password</div>
            <input className="dark-input" type="password" placeholder="Repeat password" value={confirm} onChange={e=>setConfirm(e.target.value)} required />
          </div>
          {error && <div style={{ fontSize:13, color:"#f87171", background:"rgba(248,113,113,.08)", border:"1px solid rgba(248,113,113,.2)", borderRadius:8, padding:"10px 14px" }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ background:"linear-gradient(135deg,#FF6B35,#FF9A5C)", color:"#fff", border:"none", borderRadius:9, padding:"12px", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"Outfit,sans-serif", opacity:loading?.7:1 }}>
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <div style={{ textAlign:"center", marginTop:20, fontSize:13, color:"#555" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color:"#FF9A5C", fontWeight:600, textDecoration:"none" }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
