"""Automated API tests for EcoSort backend."""

from io import BytesIO
import os
import tempfile
from PIL import Image, ImageDraw
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Configure isolated test SQLite DB before importing app
_tmp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_tmp_db.close()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp_db.name}"
os.environ["SEED_DEMO_DATA"] = "true"

from app.database.seed import seed_database  # noqa: E402
from app.database.session import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402

engine = create_engine(os.environ["DATABASE_URL"], connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_database(db, include_demo_users=True)
    db.close()
    yield
    engine.dispose()
    if os.path.exists(_tmp_db.name):
        os.unlink(_tmp_db.name)


client = TestClient(app)


def _login(email: str, password: str) -> str:
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


def _make_sample_png(color_rgb, draw_edges=False) -> bytes:
    img = Image.new("RGB", (160, 160), (245, 245, 245))
    draw = ImageDraw.Draw(img)
    draw.rectangle([30, 30, 130, 130], fill=color_rgb)
    if draw_edges:
        for i in range(36, 126, 12):
            draw.line([36, i, 124, i], fill=(200, 200, 200), width=2)
    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_health_check():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_register_login_and_invalid_login():
    reg = client.post(
        "/api/auth/register",
        json={
            "name": "Test Student",
            "email": "newstudent@ecosort.org",
            "password": "StrongPassword123",
            "location": "Hostel A",
        },
    )
    assert reg.status_code == 201
    data = reg.json()
    assert data["access_token"]
    assert data["user"]["email"] == "newstudent@ecosort.org"

    bad = client.post(
        "/api/auth/login",
        json={"email": "newstudent@ecosort.org", "password": "wrong-password"},
    )
    assert bad.status_code == 401


def test_waste_search_and_item_detail():
    res = client.get("/api/waste", params={"q": "Plastic Bottle"})
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 1
    bottle = items[0]
    assert bottle["name"] == "Plastic Bottle"
    assert bottle["category"]["slug"] == "dry-recyclable"

    detail = client.get(f"/api/waste/{bottle['id']}")
    assert detail.status_code == 200
    assert "Empty the bottle" in detail.json()["instructions"]


def test_ai_classify_valid_and_invalid():
    # Blue/cyan image -> should classify cleanly and return DB disposal info
    png_bytes = _make_sample_png((30, 144, 220))
    res = client.post(
        "/api/waste/classify",
        files={"file": ("bottle.png", png_bytes, "image/png")},
    )
    assert res.status_code == 200
    body = res.json()
    assert 0.0 <= body["confidence"] <= 1.0
    assert body["predicted_category"]["slug"] in {
        "wet-organic",
        "dry-recyclable",
        "e-waste",
        "hazardous-special",
    }
    assert len(body["top_candidates"]) == 4

    # Invalid file type rejected cleanly
    bad = client.post(
        "/api/waste/classify",
        files={"file": ("notes.txt", b"not an image", "text/plain")},
    )
    assert bad.status_code == 400


def test_record_disposal_updates_dashboard_and_score():
    token = _login("student@ecosort.demo", "EcoSort@123")
    headers = {"Authorization": f"Bearer {token}"}

    before = client.get("/api/dashboard", headers=headers).json()
    cats = client.get("/api/waste/categories").json()
    ewaste_cat = next(c for c in cats if c["slug"] == "e-waste")

    rec = client.post(
        "/api/waste-records",
        headers=headers,
        json={
            "item_name": "Old Mobile Phone",
            "category_id": ewaste_cat["id"],
            "action_type": "E-Waste Disposal",
            "quantity": 1,
            "notes": "Dropped at authorized hub",
        },
    )
    assert rec.status_code == 201
    after = client.get("/api/dashboard", headers=headers).json()
    assert after["eco_score"] > before["eco_score"]
    assert after["ewaste_items"] >= before["ewaste_items"] + 1


def test_collection_centres_filter():
    res = client.get("/api/collection-centres", params={"waste_type": "E-waste"})
    assert res.status_code == 200
    centres = res.json()
    assert len(centres) >= 1
    assert all("e-waste" in c["waste_types"].lower() for c in centres)


def test_challenges_join_and_progress():
    token = _login("newstudent@ecosort.org", "StrongPassword123")
    headers = {"Authorization": f"Bearer {token}"}

    challenges = client.get("/api/challenges", headers=headers).json()
    assert len(challenges) >= 1
    ch_id = challenges[0]["id"]

    joined = client.post(f"/api/challenges/{ch_id}/join", headers=headers)
    assert joined.status_code == 200
    assert joined.json()["joined"] is True

    prog = client.post(
        f"/api/challenges/{ch_id}/progress",
        headers=headers,
        json={"step_number": 1},
    )
    assert prog.status_code == 200
    assert prog.json()["current_count"] == 1


def test_admin_rbac_and_analytics():
    student_token = _login("student@ecosort.demo", "EcoSort@123")
    forbidden = client.get(
        "/api/admin/analytics",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert forbidden.status_code == 403

    admin_token = _login("admin@ecosort.demo", "AdminEco@123")
    ok = client.get(
        "/api/admin/analytics",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert ok.status_code == 200
    analytics = ok.json()
    assert analytics["total_users"] >= 3
    assert len(analytics["most_searched_items"]) >= 1
