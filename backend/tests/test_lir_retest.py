"""Local API smoke tests. Requires a running backend + MongoDB."""
import os
import uuid
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8000").rstrip("/")
API = f"{BASE}/api"
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@laindustrialready.local")
ADMIN_PW = os.environ.get("ADMIN_PASSWORD", "ChangeMeAdmin2026!")


def test_health():
    r = requests.get(f"{API}/health", timeout=10)
    assert r.status_code == 200
    assert r.json().get("ok") is True


def test_products_catalog():
    r = requests.get(f"{API}/products", timeout=10)
    assert r.status_code == 200
    codes = {p["code"] for p in r.json()}
    assert {"audit", "proof_standard", "triage"} <= codes


def test_register_login_me():
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    s = requests.Session()
    r = s.post(f"{API}/auth/register", json={
        "email": email, "password": "TestPass123!", "name": "Test User",
        "company_name": "Test Co", "phone": "555-0100"
    }, timeout=20)
    assert r.status_code == 200, r.text
    me = s.get(f"{API}/auth/me", timeout=10)
    assert me.status_code == 200
    assert me.json()["email"] == email


def test_admin_login():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PW}, timeout=20)
    assert r.status_code == 200, r.text
    dash = s.get(f"{API}/admin/dashboard", timeout=10)
    assert dash.status_code == 200
    body = dash.json()
    assert "by_status" in body and "leads" in body
