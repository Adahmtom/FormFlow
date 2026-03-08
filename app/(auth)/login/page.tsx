// app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#060608", padding:16 }}>
      <div style={{ width:"100%", maxWidth:420, background:"#0d0d16", border:"1.5px solid #171726", borderRadius:16, padding:40 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, letterSpacing:".08em", background:"linear-gradient(135deg,#FF6B35,#FF9A5C)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>FORMFLOW</div>
          <div style={{ fontSize:14, color:"#555", marginTop:4 }}>Sign in to your account</div>
        </div>

        <form onSubmit={handleLogin} style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#555", letterSpacing:".07em", textTransform:"uppercase", marginBottom:6 }}>Email</div>
            <input className="dark-input" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#555", letterSpacing:".07em", textTransform:"uppercase", marginBottom:6 }}>Password</div>
            <input className="dark-input" type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>
          {error && <div style={{ fontSize:13, color:"#f87171", background:"rgba(248,113,113,.08)", border:"1px solid rgba(248,113,113,.2)", borderRadius:8, padding:"10px 14px" }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ background:"linear-gradient(135deg,#FF6B35,#FF9A5C)", color:"#fff", border:"none", borderRadius:9, padding:"12px", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"Outfit,sans-serif", opacity:loading?.7:1 }}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div style={{ textAlign:"center", marginTop:20, fontSize:13, color:"#555" }}>
          Don't have an account?{" "}
          <Link href="/signup" style={{ color:"#FF9A5C", fontWeight:600, textDecoration:"none" }}>Sign up</Link>
        </div>
      </div>
    </div>
  );
}
