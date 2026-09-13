def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.get_json()["status"] == "ok"
    assert "X-Request-ID" in res.headers


def test_ready(client):
    res = client.get("/ready")
    assert res.status_code == 200
    body = res.get_json()
    assert body["status"] == "ready"
    assert body["regions_loaded"] == 8


def test_search_validation_error(client):
    res = client.post("/search", json={"region": 99})
    assert res.status_code == 400
    body = res.get_json()
    assert body["error"]["code"] == "validation_error"
    assert body["error"]["request_id"]


def test_search_text_query(client):
    res = client.post(
        "/search",
        json={"region": 0, "isOnlyText": True, "query": "bluebonnet"},
    )
    assert res.status_code == 200
    results = res.get_json()["results"]
    assert isinstance(results, list)
    # Fixture includes Texas Bluebonnet in region 0
    names = [r["Name"].lower() for r in results]
    assert any("bluebonnet" in n for n in names)


def test_search_with_filters(client):
    res = client.post(
        "/search",
        json={
            "region": 0,
            "isOnlyText": False,
            "sun_expo": "sun",
            "type": "annual",
            "query": "",
        },
    )
    assert res.status_code == 200
    assert "results" in res.get_json()


def test_get_plant(client):
    res = client.get("/get-plant?id=0&region=0")
    assert res.status_code == 200
    body = res.get_json()
    assert "Name" in body


def test_get_plant_not_found(client):
    res = client.get("/get-plant?id=9999&region=0")
    assert res.status_code == 404
    assert res.get_json()["error"]["code"] == "plant_not_found"


def test_init_endpoint(client):
    res = client.get("/init")
    assert res.status_code == 200
    assert res.get_json()["status"] == "done"
