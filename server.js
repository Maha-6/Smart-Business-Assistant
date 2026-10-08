const express=require("express");
const path=require("path");
const Database=require("better-sqlite3");
const app=express(), PORT=process.env.PORT||3001;
const db=new Database("business.db");
db.pragma("journal_mode=WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS customers(
 id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,phone TEXT,email TEXT,source TEXT,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS leads(
 id INTEGER PRIMARY KEY AUTOINCREMENT,customer TEXT NOT NULL,service TEXT NOT NULL,value REAL DEFAULT 0,status TEXT NOT NULL,followup TEXT,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS products(
 id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,category TEXT,price REAL NOT NULL,stock INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS sales(
 id INTEGER PRIMARY KEY AUTOINCREMENT,customer TEXT,product TEXT,amount REAL NOT NULL,created_at TEXT NOT NULL);
`);
if(db.prepare("SELECT COUNT(*) n FROM customers").get().n===0){
 const d=new Date().toISOString();
 const c=db.prepare("INSERT INTO customers(name,phone,email,source,created_at) VALUES(?,?,?,?,?)");
 [["Priya Textiles","9876543210","priya@example.com","Instagram"],["Arun Jewellery","9876501234","arun@example.com","Google"],["Meena Boutique","9898989898","meena@example.com","Referral"]].forEach(x=>c.run(...x,d));
 const l=db.prepare("INSERT INTO leads(customer,service,value,status,followup,created_at) VALUES(?,?,?,?,?,?)");
 l.run("Priya Textiles","Website Development",18000,"New",new Date(Date.now()+86400000).toISOString(),d);
 l.run("Arun Jewellery","SEO",9000,"Follow-up",new Date(Date.now()+2*86400000).toISOString(),d);
 l.run("Meena Boutique","Social Media Marketing",12000,"Won","",d);
 const p=db.prepare("INSERT INTO products(name,category,price,stock) VALUES(?,?,?,?)");
 [["Website Package","Service",18000,8],["SEO Monthly","Service",9999,20],["Social Media Pack","Service",14999,12]].forEach(x=>p.run(...x));
 const s=db.prepare("INSERT INTO sales(customer,product,amount,created_at) VALUES(?,?,?,?)");
 s.run("Meena Boutique","Social Media Pack",14999,d);
 s.run("Arun Jewellery","SEO Monthly",9999,new Date(Date.now()-86400000).toISOString());
}
app.use(express.json());app.use(express.static(path.join(__dirname,"public")));
const stats=()=>({
 customers:db.prepare("SELECT COUNT(*) n FROM customers").get().n,
 leads:db.prepare("SELECT COUNT(*) n FROM leads").get().n,
 won:db.prepare("SELECT COUNT(*) n FROM leads WHERE status='Won'").get().n,
 revenue:db.prepare("SELECT COALESCE(SUM(amount),0) n FROM sales").get().n
});
app.get("/api/stats",(q,r)=>r.json(stats()));
app.get("/api/customers",(q,r)=>r.json(db.prepare("SELECT * FROM customers ORDER BY id DESC").all()));
app.post("/api/customers",(q,r)=>{
 const {name,phone,email,source}=q.body;if(!name?.trim())return r.status(400).json({error:"Name required"});
 const x=db.prepare("INSERT INTO customers(name,phone,email,source,created_at) VALUES(?,?,?,?,?)").run(name.trim(),phone||"",email||"",source||"Other",new Date().toISOString());
 r.status(201).json(db.prepare("SELECT * FROM customers WHERE id=?").get(x.lastInsertRowid));
});
app.get("/api/leads",(q,r)=>r.json(db.prepare("SELECT * FROM leads ORDER BY id DESC").all()));
app.post("/api/leads",(q,r)=>{
 const {customer,service,value,status,followup}=q.body;if(!customer||!service)return r.status(400).json({error:"Customer and service required"});
 const x=db.prepare("INSERT INTO leads(customer,service,value,status,followup,created_at) VALUES(?,?,?,?,?,?)").run(customer,service,Number(value)||0,status||"New",followup||"",new Date().toISOString());
 r.status(201).json(db.prepare("SELECT * FROM leads WHERE id=?").get(x.lastInsertRowid));
});
app.patch("/api/leads/:id",(q,r)=>{
 const {status}=q.body;if(!["New","Follow-up","Won","Lost"].includes(status))return r.status(400).json({error:"Invalid status"});
 db.prepare("UPDATE leads SET status=? WHERE id=?").run(status,Number(q.params.id));
 r.json(db.prepare("SELECT * FROM leads WHERE id=?").get(Number(q.params.id)));
});
app.get("/api/products",(q,r)=>r.json(db.prepare("SELECT * FROM products ORDER BY id DESC").all()));
app.post("/api/products",(q,r)=>{
 const {name,category,price,stock}=q.body;if(!name)return r.status(400).json({error:"Name required"});
 const x=db.prepare("INSERT INTO products(name,category,price,stock) VALUES(?,?,?,?)").run(name,category||"Other",Number(price)||0,Number(stock)||0);
 r.status(201).json(db.prepare("SELECT * FROM products WHERE id=?").get(x.lastInsertRowid));
});
app.get("/api/sales",(q,r)=>r.json(db.prepare("SELECT * FROM sales ORDER BY id DESC").all()));
app.post("/api/sales",(q,r)=>{
 const {customer,product,amount}=q.body;if(!product||!amount)return r.status(400).json({error:"Product and amount required"});
 const x=db.prepare("INSERT INTO sales(customer,product,amount,created_at) VALUES(?,?,?,?)").run(customer||"",product,Number(amount),new Date().toISOString());
 r.status(201).json(db.prepare("SELECT * FROM sales WHERE id=?").get(x.lastInsertRowid));
});
app.post("/api/content",(q,r)=>{
 const {business,offer,audience,tone}=q.body;
 const text=`${business||"Your business"} ✨\n\n${offer||"Discover something special"} — made for ${audience||"our customers"}.\n\n${tone||"Friendly"} service, clear value and a reason to take action today.\n\nDM us to know more!`;
 r.json({content:text});
});
app.get("*",(q,r)=>r.sendFile(path.join(__dirname,"public/index.html")));
app.listen(PORT,()=>console.log(`Smart Business Assistant: http://localhost:${PORT}`));
