"use client";
/* Arc Loyalty — reward-ledger dApp. Layout: NHẬP LIỆU bên TRÁI, TAB (Ledger/Award) dọc bên PHẢI. Self-contained.
   ABI preserved: add(to,memo,amount)/settle(id)/get/getFrom/getTo/total. */
import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther, isAddress } from "viem";
const C = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x0") as `0x${string}`;
const CHAIN = 5042002, HEX = "0x4CEF52";
const ABI = [
  { name: "add", type: "function", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "memo", type: "string" }, { name: "amount", type: "uint256" }], outputs: [{ type: "uint256" }] },
  { name: "settle", type: "function", stateMutability: "payable", inputs: [{ name: "id", type: "uint256" }], outputs: [] },
  { name: "get", type: "function", stateMutability: "view", inputs: [{ name: "id", type: "uint256" }], outputs: [{ type: "tuple", components: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "memo", type: "string" }, { name: "amount", type: "uint256" }, { name: "settled", type: "bool" }, { name: "at", type: "uint256" }] }] },
  { name: "getFrom", type: "function", stateMutability: "view", inputs: [{ name: "u", type: "address" }], outputs: [{ type: "uint256[]" }] },
  { name: "getTo", type: "function", stateMutability: "view", inputs: [{ name: "u", type: "address" }], outputs: [{ type: "uint256[]" }] },
  { name: "total", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
] as const;
const cut = (a?: string) => a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
const usd = (w?: bigint) => w === undefined ? "0.00" : Number(formatEther(w)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
async function toArc() { const e = (window as any).ethereum; if (!e) return; try { await e.request({ method: "wallet_addEthereumChain", params: [{ chainId: HEX, chainName: "Arc Testnet", nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 }, rpcUrls: ["https://rpc.testnet.arc.network"], blockExplorerUrls: ["https://testnet.arcscan.app"] }] }); } catch { try { await e.request({ method: "wallet_switchEthereumChain", params: [{ chainId: HEX }] }); } catch {} } }
const CSS = `
.ly{--bg:#0e0c07;--card:#1c1810;--card2:#241f12;--bd:#2a2414;--bd2:#3a3018;--mut:#b89a5e;--txt:#f4ecd8;--acc:#f59e0b;--gold:#fcd34d;min-height:100vh;background:var(--bg);color:var(--txt);font-family:'Sora','Segoe UI',system-ui,sans-serif}
.ly *{box-sizing:border-box}.ly a{color:var(--gold);text-decoration:none}
.ly header{display:flex;align-items:center;gap:10px;padding:15px 24px;border-bottom:1px solid var(--bd)}
.ly .brand{display:flex;align-items:center;gap:9px;font-weight:800;font-size:17px;color:#fff}
.ly .mark{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#f59e0b,#fcd34d);display:grid;place-items:center;font-size:16px}
.ly .chip{font-size:11px;color:var(--mut);border:1px solid var(--bd2);border-radius:99px;padding:3px 10px}
.ly .btn{border:0;border-radius:10px;font:inherit;font-weight:700;cursor:pointer;padding:10px 16px;transition:.15s}.ly .btn:disabled{opacity:.5;cursor:not-allowed}
.ly .pri{background:var(--acc);color:#2a1a02}.ly .pri:hover:not(:disabled){background:var(--gold)}.ly .red{background:#dc2626;color:#fff}
.ly .wrap{max-width:1000px;margin:0 auto;padding:22px 24px 50px;display:grid;grid-template-columns:1fr 240px;gap:20px;align-items:start}
.ly .left{display:flex;flex-direction:column;gap:16px}
.ly .panel{background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:18px}
.ly .panel h3{margin:0 0 12px;font-size:15px;font-weight:800;color:#fff}
.ly label{display:block;font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:.04em;margin:8px 0 5px}
.ly input{width:100%;background:var(--bg);border:1px solid var(--bd2);border-radius:10px;padding:11px 13px;font:inherit;font-size:14px;color:var(--txt);outline:none}.ly input:focus{border-color:var(--acc)}
.ly .table{background:var(--card);border:1px solid var(--bd);border-radius:16px;overflow:hidden}
.ly .th,.ly .tr{display:grid;grid-template-columns:34px 1fr 1.1fr 100px 86px;gap:10px;align-items:center;padding:12px 16px}
.ly .th{font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid var(--bd)}
.ly .tr{border-bottom:1px solid #1d190e;font-size:13px}
.ly .ic{width:34px;height:34px;border-radius:9px;background:rgba(245,158,11,.14);display:grid;place-items:center;font-size:16px}
.ly .rail{position:sticky;top:18px;display:flex;flex-direction:column;gap:8px}
.ly .tab{display:flex;align-items:center;gap:9px;width:100%;text-align:left;border:1px solid var(--bd);background:var(--card);color:var(--mut);font:inherit;font-weight:700;font-size:14px;padding:12px 14px;border-radius:12px;cursor:pointer;transition:.15s}
.ly .tab:hover{color:var(--txt)}
.ly .tab.on{background:linear-gradient(135deg,#f59e0b,#fcd34d);color:#2a1a02;border-color:transparent}
.ly .ring{margin:10px auto 0;width:150px;height:150px;border-radius:50%;background:conic-gradient(#f59e0b 0% 70%,#2a2414 70% 100%);display:grid;place-items:center}
.ly .ringIn{width:114px;height:114px;border-radius:50%;background:var(--bg);display:grid;place-items:center;text-align:center}
.ly .menu{position:absolute;right:0;top:118%;background:var(--card2);border:1px solid var(--bd2);border-radius:11px;padding:6px;min-width:190px;z-index:30;box-shadow:0 14px 34px rgba(0,0,0,.5)}
.ly .menu button{display:block;width:100%;text-align:left;background:none;border:0;color:var(--txt);font:inherit;font-weight:600;font-size:13.5px;padding:9px 12px;border-radius:8px;cursor:pointer}.ly .menu button:hover{background:rgba(255,255,255,.05)}
@media(max-width:820px){.ly .wrap{grid-template-columns:1fr}.ly .rail{position:static;flex-direction:row;flex-wrap:wrap}.ly .tab{flex:1}}
`;
function Tr({ id, me, busy, settle }: { id: bigint; me?: string; busy: boolean; settle: (id: bigint, v: bigint) => void }) {
  const { data: e } = useReadContract({ address: C, abi: ABI, functionName: "get", args: [id] });
  if (!e) return null; const x = e as any; const owe = me?.toLowerCase() === x.from.toLowerCase();
  return (
    <div className="tr">
      <div className="ic">⭐</div>
      <div style={{ minWidth: 0 }}><div style={{ fontWeight: 600 }}>{x.memo || `Reward #${id}`}</div><div style={{ fontSize: 11, color: "var(--mut)" }}>#{id.toString()}</div></div>
      <div style={{ fontSize: 12, color: "var(--mut)" }}>{owe ? `you → ${cut(x.to)}` : `${cut(x.from)} → you`}</div>
      <div style={{ fontWeight: 800, color: "var(--gold)" }}>${usd(x.amount)}</div>
      <div style={{ textAlign: "right" }}>{x.settled ? <span style={{ fontSize: 11, color: "var(--mut)" }}>Settled ✓</span> : owe && x.amount > 0n ? <button className="btn pri" style={{ padding: "5px 11px", fontSize: 12 }} disabled={busy} onClick={() => settle(id, x.amount)}>{busy ? "…" : "Settle"}</button> : <span style={{ fontSize: 11, color: "var(--mut)" }}>open</span>}</div>
    </div>
  );
}
export default function App() {
  const { address, isConnected } = useAccount(); const net = useChainId();
  const { connectors, connect } = useConnect(); const { disconnect } = useDisconnect();
  const [pop, setPop] = useState(false); const [tab, setTab] = useState<"ledger" | "award">("ledger");
  const [form, setForm] = useState({ to: "", memo: "", amount: "" });
  const tx = useWriteContract(); const rcpt = useWaitForTransactionReceipt({ hash: tx.data, query: { enabled: !!tx.data } });
  const busy = tx.isPending || rcpt.isLoading;
  const total = useReadContract({ address: C, abi: ABI, functionName: "total" });
  const froms = useReadContract({ address: C, abi: ABI, functionName: "getFrom", args: address ? [address] : undefined, query: { enabled: !!address } });
  const tos = useReadContract({ address: C, abi: ABI, functionName: "getTo", args: address ? [address] : undefined, query: { enabled: !!address } });
  useEffect(() => { if (rcpt.isSuccess) { froms.refetch(); tos.refetch(); total.refetch(); tx.reset(); setForm({ to: "", memo: "", amount: "" }); } }, [rcpt.isSuccess]); // eslint-disable-line
  const wrong = isConnected && net !== CHAIN; const n = total.data !== undefined ? Number(total.data) : 0;
  const myPts = ((tos.data as readonly bigint[]) || []).length;
  const ids = [...((froms.data as readonly bigint[]) || []), ...((tos.data as readonly bigint[]) || [])].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => Number(b - a));
  const settle = (id: bigint, v: bigint) => tx.writeContract({ address: C, abi: ABI, functionName: "settle", args: [id], value: v });
  return (
    <div className="ly">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <header>
        <div className="brand"><span className="mark">⭐</span>Arc Loyalty</div>
        <span className="chip">Reward ledger · {n}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          {wrong && <button className="btn red" onClick={toArc}>Switch to Arc</button>}
          <div style={{ position: "relative" }}><button className="btn pri" onClick={() => setPop(p => !p)}>{isConnected ? cut(address) : "Connect"}</button>
            {pop && <div className="menu">{isConnected ? <button onClick={() => { disconnect(); setPop(false); }} style={{ color: "#f87171" }}>Disconnect</button> : connectors.map(c => <button key={c.uid} onClick={() => { connect({ connector: c }); setPop(false); }}>{c.name}</button>)}</div>}</div>
        </div>
      </header>
      <div className="wrap">
        <div className="left">
          {tab === "award" ? <div className="panel">
            <h3>Award a reward</h3>
            <label>Member address</label><input value={form.to} onChange={e => setForm(f => ({ ...f, to: e.target.value }))} placeholder="0x…" style={{ fontFamily: "ui-monospace" }} />
            <label>Reason</label><input value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} placeholder="e.g. 10th purchase bonus" />
            <label>Reward (USDC)</label><input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} type="number" placeholder="0.00" style={{ fontSize: 18, fontWeight: 800 }} />
            <button className="btn pri" style={{ width: "100%", marginTop: 14 }} disabled={!isConnected || busy || !isAddress(form.to) || !(Number(form.amount) > 0)} onClick={() => tx.writeContract({ address: C, abi: ABI, functionName: "add", args: [form.to as `0x${string}`, form.memo, parseEther(form.amount || "0")] })}>{busy ? "…" : "Award reward ⭐"}</button>
          </div> : <div className="table">
            <div className="th"><span></span><span>Reward</span><span>Parties</span><span>Amount</span><span></span></div>
            {ids.length === 0 ? <div style={{ color: "var(--mut)", textAlign: "center", padding: "40px 0" }}>No rewards yet ⭐ — switch to Award on the right.</div> : ids.map(id => <Tr key={id.toString()} id={id} me={address} busy={busy} settle={settle} />)}
          </div>}
        </div>
        <div className="rail">
          <button className={"tab" + (tab === "ledger" ? " on" : "")} onClick={() => setTab("ledger")}>📒 Ledger</button>
          <button className={"tab" + (tab === "award" ? " on" : "")} onClick={() => setTab("award")}>⭐ Award</button>
          <div className="ring"><div className="ringIn"><div><div style={{ fontSize: 28, fontWeight: 800, color: "var(--gold)" }}>{myPts}</div><div style={{ fontSize: 11, color: "var(--mut)" }}>your rewards</div></div></div></div>
          <div style={{ textAlign: "center", color: "#7a6a44", fontSize: 11.5, marginTop: 6 }}>Built on <a href="https://arc.network" target="_blank" rel="noopener noreferrer">Arc Network</a></div>
        </div>
      </div>
    </div>
  );
}
