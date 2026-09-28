"""Retest LIR backend fixes (iteration 2): credit checkout, admin score PDF, CORS preflight, + regression spot-checks."""
import os, io, uuid, time, requests
from datetime import datetime, timezone, timedelta
from pymongo import MongoClient

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://lir-ready.preview.emergentagent.com").rstrip("/")
API = f"{BASE}/api"
ORIGIN = "https://lir-ready.preview.emergentagent.com"

mongo = MongoClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
db = mongo[os.environ.get("DB_NAME", "lir_database")]

ADMIN_EMAIL = "reallansfwmod@gmail.com"
ADMIN_PW = "LIRadmin2026!"


def _fresh_client():
    email = f"test_retest_{uuid.uuid4().hex[:8]}@example.com"
    s = requests.Session()
    r = s.post(f"{API}/auth/register", json={
        "email": email, "password": "TestPass123!", "name": "Retest User",
        "company_name": "Retest Co", "phone": "555-0100"
    }, timeout=30)
    assert r.status_code == 200, r.text
    return s, r.json(), email


def _admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PW}, timeout=30)
    assert r.status_code == 200, r.text
    return s


# ---------- Retest #1: credit checkout ----------
def test_credit_checkout_returns_200_with_credit():
    s, u, email = _fresh_client()
    # simulate paid audit within 14 days by direct mongo write
    audit_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    db.orders.insert_one({
        "id": audit_id, "user_id": u["id"], "company_id": u.get("company_id"),
        "product_code": "audit", "amount_cents": 24900, "credit_applied_cents": 0,
        "currency": "usd", "stripe_session_id": f"cs_test_seed_{audit_id[:8]}",
        "status": "paid_incomplete_intake",
        "created_at": now, "paid_at": now, "delivered_at": None,
    })
    r = s.post(f"{API}/payments/checkout", json={
        "product_code": "proof_standard", "origin_url": ORIGIN
    }, timeout=60)
    print("credit checkout:", r.status_code, r.text[:300])
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["credit_cents"] == 24900
    assert data.get("checkout_url", "").startswith("https://")
    order_id = data["order_id"]
    order = db.orders.find_one({"id": order_id})
    assert order is not None
    assert order["credit_applied_cents"] == 24900
    assert order["amount_cents"] == 99500 - 24900


# ---------- Retest #2: admin score PDF ----------
def test_admin_score_generates_pdf_and_file_record():
    # create an audit order for a fresh client so admin can score it
    s, u, _ = _fresh_client()
    audit_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    db.orders.insert_one({
        "id": audit_id, "user_id": u["id"], "company_id": u.get("company_id"),
        "product_code": "audit", "amount_cents": 24900, "credit_applied_cents": 0,
        "currency": "usd", "stripe_session_id": f"cs_test_score_{audit_id[:8]}",
        "status": "queued", "created_at": now, "paid_at": now, "delivered_at": None,
    })
    admin = _admin_session()
    cats = ["identity","scope","licensing","insurance","safety","projects","workforce","vendor_docs","website","response"]
    scores = {c: {"status": "ok", "comment": f"{c} looks ok"} for c in cats}
    r = admin.post(f"{API}/admin/orders/{audit_id}/score", json={
        "scores": scores, "summary": "All fine.", "next_product": "proof_standard"
    }, timeout=60)
    print("score:", r.status_code, r.text[:300])
    assert r.status_code == 200, r.text
    fid = r.json()["file_id"]
    file_rec = db.files.find_one({"id": fid})
    assert file_rec is not None
    assert file_rec.get("kind") == "audit_report"
    # download PDF
    dl = admin.get(f"{API}/files/{fid}", timeout=30)
    assert dl.status_code == 200
    assert dl.content[:4] == b"%PDF"
    assert len(dl.content) > 500


# ---------- Retest #3: CORS preflight ----------
def test_cors_preflight_ok():
    r = requests.options(f"{API}/auth/login", headers={
        "Origin": ORIGIN,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
    }, timeout=30)
    print("cors preflight:", r.status_code, dict(r.headers))
    assert r.status_code in (200, 204), f"{r.status_code} {r.text}"
    assert r.headers.get("access-control-allow-origin") == ORIGIN
    assert r.headers.get("access-control-allow-credentials", "").lower() == "true"


# ---------- Regression spot-checks ----------
def test_register_login_me_regression():
    email = f"test_reg_{uuid.uuid4().hex[:8]}@example.com"
    s = requests.Session()
    r = s.post(f"{API}/auth/register", json={
        "email": email, "password": "Pw123456!", "name": "Reg User", "company_name": "Reg Co"
    }, timeout=30)
    assert r.status_code == 200
    # logout via new session to test explicit login
    s2 = requests.Session()
    lr = s2.post(f"{API}/auth/login", json={"email": email, "password": "Pw123456!"}, timeout=30)
    assert lr.status_code == 200
    me = s2.get(f"{API}/auth/me", timeout=30)
    assert me.status_code == 200
    assert me.json()["email"] == email


def test_intake_upload_message_end_to_end_paid_order():
    s, u, _ = _fresh_client()
    # create paid_incomplete_intake audit order directly
    oid = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    db.orders.insert_one({
        "id": oid, "user_id": u["id"], "company_id": u.get("company_id"),
        "product_code": "audit", "amount_cents": 24900, "credit_applied_cents": 0,
        "currency": "usd", "stripe_session_id": f"cs_test_e2e_{oid[:8]}",
        "status": "paid_incomplete_intake",
        "created_at": now, "paid_at": now, "delivered_at": None,
    })
    # intake
    r1 = s.post(f"{API}/intakes", json={"order_id": oid, "answers": {"q1": "yes"}}, timeout=30)
    assert r1.status_code == 200, r1.text
    # order status advanced to queued
    assert db.orders.find_one({"id": oid})["status"] == "queued"
    # upload
    files = {"file": ("test.pdf", b"%PDF-1.4 tiny\n", "application/pdf")}
    r2 = s.post(f"{API}/files/upload", data={"order_id": oid, "category": "insurance"}, files=files, timeout=30)
    assert r2.status_code == 200, r2.text
    fid = r2.json()["id"]
    assert fid
    # message
    r3 = s.post(f"{API}/messages", json={"order_id": oid, "body": "Hello from retest"}, timeout=30)
    assert r3.status_code == 200, r3.text
    # verify get_order aggregates
    r4 = s.get(f"{API}/orders/{oid}", timeout=30)
    assert r4.status_code == 200
    o = r4.json()
    assert o["intake"] is not None
    assert any(f["id"] == fid for f in o["files"])
    assert any(m["body"] == "Hello from retest" for m in o["messages"])
