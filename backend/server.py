from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os, uuid, logging, re, ipaddress
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Any, Dict
from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, UploadFile, File, Form, Response
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse
import bcrypt, jwt, stripe, httpx
from fpdf import FPDF

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("lir")

mongo_client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = mongo_client[os.environ['DB_NAME']]

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY") or "sk_test_emergent"
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")

JWT_ALG = "HS256"
def jwt_secret(): return os.environ["JWT_SECRET"]
def hash_pw(p): return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()
def verify_pw(p, h):
    try: return bcrypt.checkpw(p.encode(), h.encode())
    except: return False

def create_token(uid, email, role):
    return jwt.encode({"sub": uid, "email": email, "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "access"}, jwt_secret(), algorithm=JWT_ALG)

async def get_current_user(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        h = request.headers.get("Authorization","")
        if h.startswith("Bearer "): token = h[7:]
    if not token: raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(token, jwt_secret(), algorithms=[JWT_ALG])
        user = await db.users.find_one({"id": payload["sub"]})
        if not user: raise HTTPException(401, "User not found")
        user.pop("_id", None); user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError: raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError: raise HTTPException(401, "Invalid token")

async def require_admin(user=Depends(get_current_user)):
    if user.get("role") != "admin": raise HTTPException(403, "Admin only")
    return user

def set_cookie(r: Response, t: str):
    r.set_cookie("access_token", t, httponly=True, secure=True, samesite="none", max_age=604800, path="/")

EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY","")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME","Louisiana Industrial Readiness")
EMAIL_REPLY_TO = os.environ.get("EMAIL_REPLY_TO")
OWNER_EMAIL = os.environ.get("OWNER_EMAIL","reallansfwmod@gmail.com")

_SHORTENERS = ("bit.ly","tinyurl.com","t.co","is.gd","cutt.ly","goo.gl","rebrand.ly")
_CRED_ASK = ("reply with your password","reply with the code","send your password","cvv","send us your password",
             "enter your password below","confirm your card number","your full card number","seed phrase",
             "recovery phrase","verify your card","social security number","confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)

def _host_ok(h):
    if not h or "xn--" in h: return False
    try: ipaddress.ip_address(h); return False
    except ValueError: pass
    return not any(h == s or h.endswith("." + s) for s in _SHORTENERS)
def _same(a,b): return a==b or b.endswith("."+a) or a.endswith("."+b)

class _Scan(HTMLParser):
    def __init__(self):
        super().__init__(); self.tags=set(); self.urls=[]; self.anchors=[]; self._href=None; self._text=[]
    def handle_starttag(self, t, a):
        self.tags.add(t.lower())
        self.urls += [v for k,v in a if k.lower() in ("href","src") and v]
        if t.lower()=="a":
            self._href = dict((k.lower(),v) for k,v in a).get("href"); self._text=[]
    def handle_data(self, d):
        if self._href is not None: self._text.append(d)
    def handle_endtag(self, t):
        if t.lower()=="a" and self._href is not None:
            self.anchors.append((self._href,"".join(self._text))); self._href=None; self._text=[]

def _assert_safe(subject, html):
    sc=_Scan(); sc.feed(html)
    if sc.tags & {"form","input","textarea","select"}: raise ValueError("No forms (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body: raise ValueError(f"Cred ask (G2): {p!r}")
    for url in sc.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:","tel:","cid:","#")): continue
        if not low.startswith("https://"): raise ValueError(f"Non-https (G3): {url!r}")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None: raise ValueError("Bad host")
    for href,text in sc.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real: continue
        for m in _HOSTISH.finditer(text):
            if not _same(m.group(1).lower(), real): raise ValueError("Anchor mismatch (G3)")

async def send_email(to, subject, html):
    if not EMAIL_KEY:
        logger.info(f"[EMAIL-STUB] to={to} subject={subject}"); return None
    try:
        _assert_safe(subject, html)
        payload = {"to":[to],"subject":subject,"html":html,"from_name":EMAIL_FROM_NAME}
        if EMAIL_REPLY_TO: payload["contact_email"]=EMAIL_REPLY_TO
        async with httpx.AsyncClient(timeout=30) as c:
            r = await c.post(f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": EMAIL_KEY}, json=payload)
        if r.status_code >= 400: logger.error(f"Email {r.status_code}: {r.text}"); return None
        return r.json().get("id")
    except Exception as e:
        logger.error(f"Email err: {e}"); return None

def wrap(body):
    return (f'<table role="presentation" width="100%" style="background:#F6F3EE;padding:24px;font-family:Arial,sans-serif">'
        f'<tr><td><table role="presentation" width="100%" style="max-width:600px;margin:0 auto;background:#FAF8F5;'
        f'border:2px solid #111618;padding:32px"><tr><td>'
        f'<h1 style="font-size:14px;letter-spacing:0.2em;text-transform:uppercase;color:#111618;margin:0 0 24px;'
        f'border-bottom:2px solid #111618;padding-bottom:12px">LOUISIANA INDUSTRIAL READINESS</h1>{body}'
        f'<p style="font-size:11px;color:#78828A;margin-top:32px;border-top:1px solid #D2CBBF;padding-top:12px">'
        f'Sent by Louisiana Industrial Readiness. Not affiliated with SpaceX, Tesla, xAI, NASA, LED, or the State of Louisiana. '
        f'We never ask for passwords or card details by email.</p></td></tr></table></td></tr></table>')

PRODUCTS = {
    "audit":          {"name":"48-Hour Qualification Audit","price":24900,"lookup_key":"lir_audit"},
    "proof_standard": {"name":"Industrial Proof Pack (Standard)","price":99500,"lookup_key":"lir_proof_std"},
    "proof_rush":     {"name":"Industrial Proof Pack (Rush)","price":149500,"lookup_key":"lir_proof_rush"},
    "triage":         {"name":"Bid Desk — Triage","price":14900,"lookup_key":"lir_bid_triage"},
    "map":            {"name":"Bid Desk — Response Map","price":49500,"lookup_key":"lir_bid_map"},
    "assembly":       {"name":"Bid Desk — Full Assembly","price":125000,"lookup_key":"lir_bid_assembly"},
    "assembly_rush":  {"name":"Bid Desk — Full Assembly (Rush)","price":175000,"lookup_key":"lir_bid_assembly_rush"},
}

async def ensure_catalog():
    for code, p in PRODUCTS.items():
        existing = stripe.Price.list(lookup_keys=[p["lookup_key"]], active=True, limit=1).data
        if existing and existing[0].unit_amount == p["price"]: continue
        prod = None
        for sp in stripe.Product.list(active=True, limit=100).auto_paging_iter():
            if sp.metadata.get("emergent_product_id") == code: prod = sp; break
        if prod is None:
            prod = stripe.Product.create(name=p["name"], tax_code="txcd_10103001",
                metadata={"managed_by":"emergent","emergent_product_id":code})
        if existing: stripe.Price.modify(existing[0].id, active=False)
        stripe.Price.create(product=prod.id, unit_amount=p["price"], currency="usd",
            lookup_key=p["lookup_key"], transfer_lookup_key=True)

app = FastAPI(title="LIR")
api = APIRouter(prefix="/api")
_cors = [o.strip() for o in os.environ.get('CORS_ORIGINS','*').split(',') if o.strip()]
app.add_middleware(CORSMiddleware,
    allow_origins=_cors, allow_origin_regex=r"https://.*\.preview\.emergentagent\.com",
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def now(): return datetime.now(timezone.utc)
def nid(): return str(uuid.uuid4())

class RegIn(BaseModel):
    email: EmailStr; password: str; name: str; company_name: str; phone: Optional[str]=None
class LogIn(BaseModel):
    email: EmailStr; password: str
class LeadIn(BaseModel):
    email: EmailStr; name: Optional[str]=""; company: Optional[str]=""; source: str="checklist"
class ContactIn(BaseModel):
    name: str; email: EmailStr; company: Optional[str]=""; message: str
class CheckoutIn(BaseModel):
    product_code: str; origin_url: str
class IntakeIn(BaseModel):
    order_id: str; answers: Dict[str, Any]
class ScoreIn(BaseModel):
    scores: Dict[str, Dict[str, str]]; summary: str; next_product: str
class ProofPageIn(BaseModel):
    company_id: str; slug: str; content: Dict[str, Any]; published: bool=False
class QuoteIn(BaseModel):
    slug: str; name: str; email: EmailStr; company: str; phone: str
    needed_by: Optional[str]=""; scope: str
class MessageIn(BaseModel):
    order_id: str; body: str
class StatusUpdate(BaseModel):
    status: str

@api.post("/auth/register")
async def register(p: RegIn, response: Response):
    email = p.email.lower()
    if await db.users.find_one({"email": email}): raise HTTPException(400, "Email already registered")
    cid = nid()
    await db.companies.insert_one({"id": cid, "legal_name": p.company_name, "created_at": now().isoformat()})
    uid = nid()
    await db.users.insert_one({"id": uid, "email": email, "password_hash": hash_pw(p.password),
        "name": p.name, "phone": p.phone, "role": "client", "company_id": cid, "created_at": now().isoformat()})
    set_cookie(response, create_token(uid, email, "client"))
    return {"id": uid, "email": email, "name": p.name, "role": "client", "company_id": cid}

@api.post("/auth/login")
async def login(p: LogIn, response: Response):
    email = p.email.lower()
    u = await db.users.find_one({"email": email})
    if not u or not verify_pw(p.password, u["password_hash"]): raise HTTPException(401, "Invalid email or password")
    set_cookie(response, create_token(u["id"], email, u.get("role","client")))
    return {"id": u["id"], "email": email, "name": u["name"], "role": u.get("role","client"), "company_id": u.get("company_id")}

@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/"); return {"ok": True}

@api.get("/auth/me")
async def me(user=Depends(get_current_user)): return user

@api.post("/leads")
async def create_lead(p: LeadIn):
    doc = {"id": nid(), "email": p.email.lower(), "name": p.name, "company": p.company,
        "source": p.source, "created_at": now().isoformat()}
    await db.leads.insert_one(doc)
    await send_email(p.email, "Your prequalification checklist — LIR", wrap(
        f'<p>Hi {escape(p.name or "there")},</p>'
        f'<p>Your 2-page checklist "Can a Prime Qualify You From What You Have Today?" — ten quick line items:</p>'
        f'<ol><li>Legal name matches insurance / W-9 / license</li><li>Certificate of Insurance current and legible</li>'
        f'<li>W-9 signed within the last 12 months</li><li>Written safety program (any length)</li>'
        f'<li>EMR letter or "not yet rated" note</li><li>Three named projects with year and scope</li>'
        f'<li>One-page capability sheet (industrial, not marketing)</li><li>Vendor references with phone numbers</li>'
        f'<li>Response workflow (who answers, in how many hours)</li><li>Louisiana contractor license number if applicable</li></ol>'
        f'<p>If any of these are missing or dated, the $249 audit is where most operators start.</p>'))
    await send_email(OWNER_EMAIL, "New checklist lead", wrap(
        f'<p>New lead: {escape(p.email)} — {escape(p.name or "")} — {escape(p.company or "")}</p>'))
    return {"ok": True}

@api.post("/contact")
async def contact(p: ContactIn):
    await db.contacts.insert_one({"id": nid(), **p.dict(), "created_at": now().isoformat()})
    await send_email(OWNER_EMAIL, f"Contact form: {p.name}", wrap(
        f'<p><strong>From:</strong> {escape(p.name)} ({escape(p.email)})</p>'
        f'<p><strong>Company:</strong> {escape(p.company or "")}</p>'
        f'<p><strong>Message:</strong></p><p>{escape(p.message)}</p>'))
    return {"ok": True}

@api.get("/products")
async def list_products():
    return [{"code": k, **v} for k, v in PRODUCTS.items()]

@api.post("/payments/checkout")
async def checkout(payload: CheckoutIn, request: Request):
    if payload.product_code not in PRODUCTS: raise HTTPException(400, "Unknown product")
    p = PRODUCTS[payload.product_code]
    prices = stripe.Price.list(lookup_keys=[p["lookup_key"]], active=True, limit=1).data
    if not prices:
        await ensure_catalog()
        prices = stripe.Price.list(lookup_keys=[p["lookup_key"]], active=True, limit=1).data
    if not prices: raise HTTPException(500, "Price not configured")
    price = prices[0]
    user_id = None; company_id = None; credit = 0
    try:
        u = await get_current_user(request); user_id = u["id"]; company_id = u.get("company_id")
    except HTTPException: pass
    if user_id and payload.product_code in ("proof_standard","proof_rush"):
        cutoff = (now() - timedelta(days=14)).isoformat()
        prior = await db.orders.find_one({"user_id": user_id, "product_code": "audit",
            "status": {"$in":["delivered","paid_incomplete_intake","queued","in_progress","needs_client","revision"]},
            "paid_at": {"$gte": cutoff}, "credit_used": {"$ne": True}})
        if prior: credit = 24900
    amount = max(50, p["price"] - credit)
    order_id = nid()
    if credit:
        line_items = [{"price_data":{"currency":"usd","product_data":{"name": f'{p["name"]} (audit credit applied)',
            "tax_code":"txcd_10103001"}, "unit_amount": amount},"quantity":1}]
    else:
        line_items = [{"price": price.id, "quantity": 1}]
    kwargs = dict(
        line_items=line_items, mode="payment",
        success_url=f"{payload.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{payload.origin_url}/payment/cancel",
        metadata={"order_id": order_id, "user_id": user_id or "", "product_code": payload.product_code, "credit": str(credit)},
    )
    try:
        session = stripe.checkout.Session.create(**kwargs, managed_payments={"enabled": True})
    except stripe.error.InvalidRequestError:
        session = stripe.checkout.Session.create(**kwargs, automatic_tax={"enabled": True}, billing_address_collection="required")
    await db.orders.insert_one({"id": order_id, "user_id": user_id, "company_id": company_id,
        "product_code": payload.product_code, "amount_cents": amount, "credit_applied_cents": credit,
        "currency":"usd", "stripe_session_id": session.id, "status":"pending_payment",
        "created_at": now().isoformat(), "paid_at": None, "delivered_at": None})
    return {"checkout_url": session.url, "session_id": session.id, "order_id": order_id, "credit_cents": credit}

async def _mark_paid(order_id, session):
    o = await db.orders.find_one({"id": order_id})
    if not o or o["status"] != "pending_payment": return
    await db.orders.update_one({"id": order_id},
        {"$set":{"status":"paid_incomplete_intake","paid_at": now().isoformat(),
            "stripe_payment_intent": getattr(session,"payment_intent", None)}})
    if o.get("credit_applied_cents",0) > 0 and o.get("user_id"):
        await db.orders.update_one({"user_id": o["user_id"], "product_code":"audit", "credit_used": {"$ne": True}},
            {"$set":{"credit_used": True}}, sort=[("paid_at",-1)])
    u = await db.users.find_one({"id": o.get("user_id")}) if o.get("user_id") else None
    if u:
        await send_email(u["email"], f"Payment received — order {order_id[:8]}", wrap(
            f'<p>Payment received for {escape(PRODUCTS[o["product_code"]]["name"])}.</p>'
            f'<p>Next step: complete the intake in your client portal so we can start the clock.</p>'
            f'<p><a href="{escape(os.environ.get("FRONTEND_URL",""))}/app" style="color:#0E3A5D">Open portal</a></p>'))
    await send_email(OWNER_EMAIL, f"NEW PAID ORDER — {PRODUCTS[o['product_code']]['name']}", wrap(
        f'<p>Order <strong>{order_id[:8]}</strong> — {escape(PRODUCTS[o["product_code"]]["name"])}</p>'
        f'<p>Amount: ${o["amount_cents"]/100:.2f}</p>'))

@api.get("/payments/status/{session_id}")
async def payment_status(session_id: str):
    o = await db.orders.find_one({"stripe_session_id": session_id}, {"_id": 0})
    if not o: raise HTTPException(404, "Order not found")
    if o["status"] == "pending_payment":
        try:
            s = stripe.checkout.Session.retrieve(session_id)
            if s.payment_status == "paid" or s.status == "complete":
                await _mark_paid(o["id"], s)
                o = await db.orders.find_one({"stripe_session_id": session_id}, {"_id":0})
        except Exception: pass
    return {"session_id": session_id, "status": o["status"], "order_id": o["id"], "product_code": o["product_code"]}

@api.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature","")
    try:
        event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
    except Exception as e:
        logger.error(f"Webhook: {e}"); raise HTTPException(400, "Invalid sig")
    obj, t = event["data"]["object"], event["type"]
    if t == "checkout.session.completed":
        o = await db.orders.find_one({"stripe_session_id": obj["id"]})
        if o: await _mark_paid(o["id"], stripe.checkout.Session.retrieve(obj["id"]))
    elif t == "charge.refunded":
        await db.orders.update_one({"stripe_payment_intent": obj.get("payment_intent")}, {"$set":{"status":"refunded"}})
    return {"ok": True}

@api.get("/orders")
async def list_orders(user=Depends(get_current_user)):
    q = {} if user["role"] == "admin" else {"user_id": user["id"]}
    orders = await db.orders.find(q, {"_id": 0}).sort("created_at", -1).to_list(200)
    for o in orders: o["product_name"] = PRODUCTS.get(o["product_code"],{}).get("name","")
    return orders

@api.get("/orders/{order_id}")
async def get_order(order_id: str, user=Depends(get_current_user)):
    o = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not o: raise HTTPException(404, "Not found")
    if user["role"] != "admin" and o.get("user_id") != user["id"]: raise HTTPException(403, "Forbidden")
    o["product_name"] = PRODUCTS.get(o["product_code"],{}).get("name","")
    o["intake"] = await db.intakes.find_one({"order_id": order_id}, {"_id": 0})
    o["files"] = await db.files.find({"order_id": order_id}, {"_id": 0}).to_list(100)
    o["deliverables"] = await db.deliverables.find({"order_id": order_id}, {"_id": 0}).to_list(100)
    o["messages"] = await db.messages.find({"order_id": order_id}, {"_id": 0}).sort("created_at", 1).to_list(200)
    o["score"] = await db.audit_scores.find_one({"order_id": order_id}, {"_id": 0})
    return o

@api.post("/intakes")
async def save_intake(p: IntakeIn, user=Depends(get_current_user)):
    o = await db.orders.find_one({"id": p.order_id})
    if not o or (user["role"] != "admin" and o.get("user_id") != user["id"]): raise HTTPException(404, "Order not found")
    await db.intakes.update_one({"order_id": p.order_id},
        {"$set":{"order_id": p.order_id, "answers": p.answers, "completed_at": now().isoformat()}}, upsert=True)
    if o["status"] == "paid_incomplete_intake":
        await db.orders.update_one({"id": p.order_id}, {"$set":{"status":"queued"}})
    return {"ok": True}

UPLOAD_DIR = Path(__file__).parent / "uploads"; UPLOAD_DIR.mkdir(exist_ok=True)
ALLOWED = {".pdf",".doc",".docx",".jpg",".jpeg",".png",".xls",".xlsx"}

@api.post("/files/upload")
async def upload_file(order_id: str = Form(...), category: str = Form("other"),
                      file: UploadFile = File(...), user=Depends(get_current_user)):
    o = await db.orders.find_one({"id": order_id})
    if not o: raise HTTPException(404, "Order not found")
    if user["role"] != "admin" and o.get("user_id") != user["id"]: raise HTTPException(403, "Forbidden")
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED: raise HTTPException(400, f"File type {ext} not allowed")
    contents = await file.read()
    if len(contents) > 25*1024*1024: raise HTTPException(400, "File too large (25MB max)")
    fid = nid()
    (UPLOAD_DIR / f"{fid}{ext}").write_bytes(contents)
    doc = {"id": fid, "order_id": order_id, "company_id": o.get("company_id"),
        "category": category, "original_filename": file.filename, "storage_key": f"{fid}{ext}",
        "mime": file.content_type or "application/octet-stream", "size_bytes": len(contents),
        "uploaded_by": user["id"], "created_at": now().isoformat()}
    await db.files.insert_one(doc)
    return {"id": fid, "original_filename": file.filename, "size_bytes": len(contents), "category": category}

@api.get("/files/{file_id}")
async def download_file(file_id: str, user=Depends(get_current_user)):
    f = await db.files.find_one({"id": file_id})
    if not f: raise HTTPException(404, "Not found")
    o = await db.orders.find_one({"id": f["order_id"]}) if f.get("order_id") else None
    if user["role"] != "admin" and o and o.get("user_id") != user["id"]: raise HTTPException(403, "Forbidden")
    path = UPLOAD_DIR / f["storage_key"]
    if not path.exists(): raise HTTPException(404, "File missing")
    def it():
        with open(path,"rb") as fh:
            while True:
                b = fh.read(8192)
                if not b: break
                yield b
    return StreamingResponse(it(), media_type=f.get("mime","application/octet-stream"),
        headers={"Content-Disposition": f'attachment; filename="{f["original_filename"]}"'})

CATEGORIES = ["identity","scope","licensing","insurance","safety","projects","workforce","vendor_docs","website","response"]
CAT_LABELS = {"identity":"Company identity clarity","scope":"Scope clarity","licensing":"Licensing signals",
    "insurance":"Insurance document quality","safety":"Safety documentation","projects":"Project proof",
    "workforce":"Workforce / capacity","vendor_docs":"Vendor documents","website":"Website / findability",
    "response":"Response workflow"}

@api.post("/admin/orders/{order_id}/score")
async def score_order(order_id: str, p: ScoreIn, user=Depends(require_admin)):
    await db.audit_scores.update_one({"order_id": order_id},
        {"$set":{"order_id": order_id, "scores": p.scores, "summary": p.summary,
            "next_product": p.next_product, "updated_at": now().isoformat()}}, upsert=True)
    pdf = FPDF(); pdf.add_page(); pdf.set_font("Helvetica","B",16)
    pdf.cell(0, 10, "LOUISIANA INDUSTRIAL READINESS", ln=1)
    pdf.set_font("Helvetica","",10); pdf.cell(0, 6, "48-Hour Qualification Audit Memo", ln=1)
    pdf.cell(0, 6, f"Order: {order_id[:8]}  Date: {now().date().isoformat()}", ln=1)
    o = await db.orders.find_one({"id": order_id})
    company = await db.companies.find_one({"id": o.get("company_id")}) if o else None
    if company: pdf.cell(0, 6, f"Company: {company.get('legal_name','')}", ln=1)
    pdf.ln(4); pdf.set_font("Helvetica","B",12); pdf.cell(0, 8, "Scorecard", ln=1)
    for c in CATEGORIES:
        s = p.scores.get(c, {})
        pdf.set_font("Helvetica","B",10); pdf.cell(0, 6, f"{CAT_LABELS[c]} — {s.get('status','-').upper()}", ln=1)
        pdf.set_font("Helvetica","",10); pdf.multi_cell(0, 5, s.get("comment","") or "-")
        pdf.ln(1)
    pdf.ln(2); pdf.set_font("Helvetica","B",12); pdf.cell(0, 8, "Summary", ln=1)
    pdf.set_font("Helvetica","",10); pdf.multi_cell(0, 6, p.summary)
    pdf.ln(2); pdf.set_font("Helvetica","B",10); pdf.cell(0, 6, "Recommended next step:", ln=1)
    pdf.set_font("Helvetica","",10); pdf.multi_cell(0, 6, p.next_product)
    pdf.ln(4); pdf.set_font("Helvetica","I",8)
    pdf.multi_cell(0, 4, "Purchase a Proof Pack within 14 days and $249 is credited. Not legal, insurance, engineering, or estimating advice. Not affiliated with SpaceX, Tesla, xAI, NASA, LED, or the State of Louisiana.")
    pdf_bytes = bytes(pdf.output())
    fid = nid()
    (UPLOAD_DIR / f"{fid}.pdf").write_bytes(pdf_bytes)
    await db.files.delete_many({"order_id": order_id, "kind":"audit_report"})
    await db.files.insert_one({"id": fid, "order_id": order_id, "company_id": o.get("company_id") if o else None,
        "category":"deliverable","kind":"audit_report","original_filename":f"audit-{order_id[:8]}.pdf",
        "storage_key": f"{fid}.pdf","mime":"application/pdf","size_bytes":len(pdf_bytes),
        "uploaded_by": user["id"], "created_at": now().isoformat()})
    return {"ok": True, "file_id": fid}

@api.post("/admin/orders/{order_id}/status")
async def admin_status(order_id: str, p: StatusUpdate, user=Depends(require_admin)):
    upd = {"status": p.status}
    if p.status == "delivered": upd["delivered_at"] = now().isoformat()
    await db.orders.update_one({"id": order_id}, {"$set": upd})
    if p.status == "delivered":
        o = await db.orders.find_one({"id": order_id})
        u = await db.users.find_one({"id": o.get("user_id")}) if o and o.get("user_id") else None
        if u:
            await send_email(u["email"], "Your deliverable is ready — LIR", wrap(
                f'<p>Your order <strong>{order_id[:8]}</strong> has been delivered.</p>'
                f'<p><a href="{escape(os.environ.get("FRONTEND_URL",""))}/app" style="color:#0E3A5D">Open portal</a> to download.</p>'))
    return {"ok": True}

@api.get("/admin/leads.csv")
async def leads_csv(user=Depends(require_admin)):
    rows = ["email,name,company,source,created_at"]
    async for l in db.leads.find({},{"_id":0}):
        rows.append(f'{l.get("email","")},{l.get("name","")},{l.get("company","")},{l.get("source","")},{l.get("created_at","")}')
    return Response("\n".join(rows), media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="leads.csv"'})

@api.get("/admin/dashboard")
async def admin_dashboard(user=Depends(require_admin)):
    by_status = {}
    async for row in db.orders.aggregate([{"$group":{"_id":"$status","count":{"$sum":1}}}]):
        by_status[row["_id"]] = row["count"]
    leads_count = await db.leads.count_documents({})
    total = 0
    async for o in db.orders.find({"status":{"$nin":["pending_payment","refunded"]}}, {"amount_cents":1}):
        total += o.get("amount_cents",0)
    return {"by_status": by_status, "leads": leads_count, "revenue_cents": total}

@api.get("/proof-pages/{slug}")
async def get_proof_page(slug: str):
    p = await db.proof_pages.find_one({"slug": slug, "published": True}, {"_id": 0})
    if not p: raise HTTPException(404, "Not found")
    return p

@api.post("/admin/proof-pages")
async def upsert_proof(p: ProofPageIn, user=Depends(require_admin)):
    await db.proof_pages.update_one({"slug": p.slug},
        {"$set":{"company_id": p.company_id, "slug": p.slug, "content": p.content,
            "published": p.published, "updated_at": now().isoformat()}}, upsert=True)
    return {"ok": True}

@api.get("/admin/proof-pages")
async def list_proof(user=Depends(require_admin)):
    return await db.proof_pages.find({}, {"_id": 0}).to_list(200)

@api.post("/proof-quotes")
async def quote_request(p: QuoteIn):
    await db.quote_requests.insert_one({"id": nid(), **p.dict(), "created_at": now().isoformat()})
    await send_email(OWNER_EMAIL, f"Quote request via /p/{p.slug}", wrap(
        f'<p><strong>{escape(p.company)}</strong> — {escape(p.name)} ({escape(p.email)}, {escape(p.phone)})</p>'
        f'<p>Needed by: {escape(p.needed_by or "not specified")}</p>'
        f'<p>Scope:</p><p>{escape(p.scope)}</p>'))
    return {"ok": True}

@api.post("/messages")
async def post_message(p: MessageIn, user=Depends(get_current_user)):
    o = await db.orders.find_one({"id": p.order_id})
    if not o: raise HTTPException(404, "Order not found")
    if user["role"] != "admin" and o.get("user_id") != user["id"]: raise HTTPException(403, "Forbidden")
    doc = {"id": nid(), "order_id": p.order_id, "from_role": user["role"],
        "from_name": user.get("name",""), "body": p.body, "created_at": now().isoformat()}
    await db.messages.insert_one(doc)
    doc.pop("_id", None)
    return doc

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.orders.create_index("id", unique=True)
    await db.leads.create_index("email")
    await db.proof_pages.create_index("slug", unique=True)
    admin_email = os.environ["ADMIN_EMAIL"].lower()
    admin_pw = os.environ["ADMIN_PASSWORD"]
    ex = await db.users.find_one({"email": admin_email})
    if not ex:
        await db.users.insert_one({"id": nid(), "email": admin_email,
            "password_hash": hash_pw(admin_pw), "name": "Owner", "role": "admin",
            "created_at": now().isoformat()})
        logger.info(f"Seeded admin {admin_email}")
    else:
        upd = {"role":"admin"}
        if not verify_pw(admin_pw, ex["password_hash"]): upd["password_hash"] = hash_pw(admin_pw)
        await db.users.update_one({"email": admin_email}, {"$set": upd})
    if not await db.proof_pages.find_one({"slug":"demo"}):
        scid = nid()
        await db.companies.insert_one({"id": scid, "legal_name":"Acadiana Site Services LLC", "created_at": now().isoformat()})
        await db.proof_pages.insert_one({"slug":"demo","company_id": scid,
            "published": True, "updated_at": now().isoformat(),
            "content":{"company_name":"Acadiana Site Services LLC","parish":"Vermilion Parish, LA",
                "intro":"Louisiana civil-sitework contractor supporting industrial construction along the Gulf Coast. Crews based in Abbeville with equipment yard access from Kaplan and Lafayette.",
                "services":["Site clearing & grubbing","Grading & compaction","Culvert & drainage","Concrete work (limited)","Erosion control","Temporary access roads"],
                "service_area":"75-mile radius of Abbeville, LA. Deploys to Vermilion, Iberia, Lafayette, Calcasieu, and Cameron parishes.",
                "projects":[{"name":"State highway culvert replacement","year":"2024","scope":"12 culverts, 3 weeks, Vermilion Parish"},
                    {"name":"LNG staging yard grading","year":"2023","scope":"18-acre subgrade, aggregate base, Cameron Parish"},
                    {"name":"Municipal sitework – Kaplan","year":"2023","scope":"Public works subcontract"}],
                "notes":"Full COI, W-9, safety program, and OSHA-10 crew documentation available on request."}})
    try:
        await ensure_catalog(); logger.info("Stripe catalog OK")
    except Exception as e:
        logger.error(f"Catalog: {e}")

app.include_router(api)

@app.on_event("shutdown")
async def shutdown():
    mongo_client.close()
