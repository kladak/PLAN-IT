import os
from pathlib import Path

import pytest

FIXTURE_CSV = Path(__file__).resolve().parent.parent / "fixtures" / "plants_sample.csv"


@pytest.fixture()
def app(monkeypatch):
    """App wired to the tiny fixture CSV so CI stays light."""
    monkeypatch.setenv("PLANT_DATA_PATH", str(FIXTURE_CSV))
    monkeypatch.setenv("AUTO_INIT", "true")
    monkeypatch.setenv("RATE_LIMIT", "1000 per minute")

    # Fresh module state per test — avoid leaking indexes across cases.
    import importlib
    import plant_recommend
    import app as app_module

    plant_recommend.df = None
    importlib.reload(plant_recommend)
    monkeypatch.setenv("PLANT_DATA_PATH", str(FIXTURE_CSV))
    plant_recommend.df = None

    importlib.reload(app_module)
    application = app_module.create_app()
    # Force init against fixture (reload may race AUTO_INIT path).
    app_module.dict_list_per_region, app_module.df_list_per_region = (
        plant_recommend.init(plant_recommend.load_plants(FIXTURE_CSV))
    )
    application.config.update(TESTING=True)
    yield application


@pytest.fixture()
def client(app):
    return app.test_client()
