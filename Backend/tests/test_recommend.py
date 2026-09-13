from pathlib import Path

from plant_recommend import filter_region, get_scores, init, load_plants, make_dicts

FIXTURE = Path(__file__).resolve().parent.parent / "fixtures" / "plants_sample.csv"


def test_filter_region_resets_index():
    df = load_plants(FIXTURE)
    region0 = filter_region(0, df)
    assert list(region0.index) == list(range(len(region0)))
    assert (region0["Region"] == 0).all()


def test_get_scores_advances_filters_when_miss():
    """Regression: missing early preference used to shift later weights."""
    df = load_plants(FIXTURE)
    region0 = filter_region(0, df)
    dicts = make_dicts(region0)

    # Nonsense sun_expo should not poison type/size matching.
    scored = get_scores(
        ["not-a-real-sun", None, None, None, "annual", None],
        region0,
        dicts,
    )
    assert "Score" in scored.columns
    # At least one annual plant in the fixture should pick up the type weight.
    assert scored["Score"].max() > 0


def test_init_covers_all_eight_regions():
    df = load_plants(FIXTURE)
    dicts, frames = init(df)
    assert len(dicts) == 8
    assert len(frames) == 8
    assert all(len(f) > 0 for f in frames)
