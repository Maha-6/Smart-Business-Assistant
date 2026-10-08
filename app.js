const $=id=>document.getElementById(id);const money=n=>"₹"+Number(n).toLocaleString("en-IN");
function toggle(id){$(id).classList.toggle("hidden")}
async function get(u){return (await fetch(u)).json()}
async function refresh(){
 const s=await get("/api/stats");$("customersStat").textContent=s.customers;$("leadsStat").textContent=s.leads;$("wonStat").textContent=s.won;$("revenueStat").textContent=money(s.revenue);$("focus").textContent=s.leads-s.won+" lead(s) need attention";
 const cs=await get("/api/customers");$("customerList").innerHTML=cs.map(c=>`<div class="row"><div><b>${esc(c.name)}</b><div class="muted">${esc(c.phone)} · ${esc(c.source)}</div></div><span class="tag">Customer</span></div>`).join("");
 const ls=await get("/api/leads");$("leadList").innerHTML=ls.map(l=>`<div class="row"><div><b>${esc(l.customer)}</b><div class="muted">${esc(l.service)} · ${money(l.value)}</div></div><select onchange="status(${l.id},this.value)"><option ${l.status=="New"?"selected":""}>New</option><option ${l.status=="Follow-up"?"selected":""}>Follow-up</option><option ${l.status=="Won"?"selected":""}>Won</option><option ${l.status=="Lost"?"selected":""}>Lost</option></select></div>`).join("");
}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
async function status(id,status){await fetch("/api/leads/"+id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});refresh()}
$("customerForm").onsubmit=async e=>{e.preventDefault();await fetch("/api/customers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});e.target.reset();refresh()}
$("leadForm").onsubmit=async e=>{e.preventDefault();await fetch("/api/leads",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});e.target.reset();refresh()}
$("contentForm").onsubmit=async e=>{e.preventDefault();const r=await fetch("/api/content",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});$("generated").textContent=(await r.json()).content}
refresh();