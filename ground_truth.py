import json
import os
from typing import Optional

# ============================================================
# ground_truth.py — VeriBias Annotation Corpus (14 articles)
# ============================================================
# Article texts live in corpus_texts.json (same folder).
# Scoring scale: 1–5
#   1=neutral  2=mild lean  3=moderate lean
#   4=strong lean  5=effectively partisan
# ============================================================

_texts_path = os.path.join(os.path.dirname(__file__), "corpus_texts.json")
try:
    with open(_texts_path, "r", encoding="utf-8") as f:
        _texts = {e["id"]: e["text"] for e in json.load(f)}
except FileNotFoundError:
    _texts = {}
    print("Warning: corpus_texts.json not found")


GROUND_TRUTH = [

    # ── TOPIC 1: Gaza Ceasefire ──────────────────────────────────────────────

    {
        "id": "gaza_fox_01",
        "title": "Trump launches phase 2 of Gaza peace plan; Hamas disarmament remains the real test",
        "source": "Fox News",
        "topic": "Gaza",
        "url": "https://www.foxnews.com/world/trump-launches-phase-2-gaza-peace-plan-hamas-disarmament-remains-real-test",
        "text": _texts.get("gaza_fox_01", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 3,    # Yosuf — moderate lean, expert sources from pro-Israel think tanks
                "annotator_2": 3,    # Odin  — agrees, fairly balanced reporting
                "consensus":   3,
                "notes":       ""
            }
        }
    },

    {
        "id": "gaza_fox_02",
        "title": "Israeli hostages freed, Iran hit, ceasefire held — 2025 shattered idea that US was exiting the Middle East",
        "source": "Fox News",
        "topic": "Gaza",
        "url": "https://www.foxnews.com/world/israeli-hostages-freed-iran-hit-ceasefire-held-2025-shattered-idea-us-was-exiting-middle-east",
        "text": _texts.get("gaza_fox_02", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 4,    # Yosuf — strong pro-Trump framing, peace through strength narrative
                "annotator_2": 5,    # Odin  — reads as effectively partisan, all sources pro-intervention
                "consensus":   4.5,
                "notes":       "Disagreement on whether framing crosses into partisan — consensus averaged"
            }
        }
    },

    {
        "id": "gaza_cnn_01",
        "title": "US-brokered ceasefire appears to survive first major test as Israel and Hamas affirm commitment",
        "source": "CNN",
        "topic": "Gaza",
        "url": "https://www.cnn.com/2025/10/19/world/israel-hamas-gaza-ceasefire-test-intl",
        "text": _texts.get("gaza_cnn_01", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 2,    # Yosuf — mild lean, mostly factual
                "annotator_2": 2,    # Odin  — agrees
                "consensus":   2,
                "notes":       ""
            }
        }
    },

    {
        "id": "gaza_cnn_02",
        "title": "Is the war in Gaza finally over? Key unanswered questions about what comes next",
        "source": "CNN",
        "topic": "Gaza",
        "url": "https://www.cnn.com/2025/10/14/middleeast/gaza-israel-war-over-unanswered-questions-intl",
        "text": _texts.get("gaza_cnn_02", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 2,    # Yosuf — balanced, raises questions from multiple sides
                "annotator_2": 2,    # Odin  — agrees
                "consensus":   2,
                "notes":       ""
            }
        }
    },

    # ── TOPIC 2: Climate Policy / Green Energy ───────────────────────────────

    {
        "id": "climate_fox_01",
        "title": "Conservative groups declare 2025 a tipping point for climate hysteria as Trump unleashes energy agenda",
        "source": "Fox News",
        "topic": "Climate",
        "url": "https://www.foxnews.com/politics/conservative-groups-declare-2025-tipping-point-climate-hysteria-trump-unleashes-energy-agenda",
        "text": _texts.get("climate_fox_01", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 5,    # Yosuf — effectively partisan, sources exclusively conservative groups
                "annotator_2": 5,    # Odin  — agrees, no countervoices present
                "consensus":   5,
                "notes":       ""
            }
        }
    },

    {
        "id": "climate_fox_02",
        "title": "Obama-era greenhouse gas rules gone as EPA signs single largest deregulatory action in history",
        "source": "Fox News",
        "topic": "Climate",
        "url": "https://www.foxnews.com/politics/obama-era-greenhouse-gas-rules-gone-epas-zeldin-signs-single-largest-deregulatory-action-history",
        "text": _texts.get("climate_fox_02", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 4,    # Yosuf — strong lean, celebratory framing of deregulation
                "annotator_2": 3,    # Odin  — moderate, does include some critical voices
                "consensus":   3.5,
                "notes":       "Disagreement on weight of critical voices — consensus averaged"
            }
        }
    },

    {
        "id": "climate_cnn_01",
        "title": "The surprising countries pulling off stunningly fast clean energy transitions",
        "source": "CNN",
        "topic": "Climate",
        "url": "https://www.cnn.com/2025/11/07/climate/solar-wind-renewables-transition-global-pakistan-hungary-chile",
        "text": _texts.get("climate_cnn_01", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 3,    # Yosuf — moderate lean, optimistic framing of clean energy
                "annotator_2": 2,    # Odin  — mild lean, factual basis is strong
                "consensus":   2.5,
                "notes":       "Disagreement on framing vs factual reporting — consensus averaged"
            }
        }
    },

    {
        "id": "climate_cnn_02",
        "title": "It's been a dangerous decade since the Paris Agreement, but there's still reason for hope",
        "source": "CNN",
        "topic": "Climate",
        "url": "https://www.cnn.com/2025/11/09/climate/paris-agreement-anniversary-cop30",
        "text": _texts.get("climate_cnn_02", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 3,    # Yosuf — moderate lean, first-person narrative with clear position
                "annotator_2": 3,    # Odin  — agrees
                "consensus":   3,
                "notes":       ""
            }
        }
    },

    # ── TOPIC 3: Gun Control — Annunciation Shooting ─────────────────────────

    {
        "id": "guns_fox_01",
        "title": "Minneapolis church shooting capped bloody 24 hours as liberal policies fueled crime explosion",
        "source": "Fox News",
        "topic": "Gun Control",
        "url": "https://www.foxnews.com/us/minneapolis-church-shooting-capped-bloody-24-hours-as-liberal-policies-fueled-crime-explosion-expert",
        "text": _texts.get("guns_fox_01", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 4,    # Yosuf — strong lean, headline directly blames liberal policies
                "annotator_2": 3,    # Odin  — moderate, expert quotes add some balance
                "consensus":   3.5,
                "notes":       "Disagreement on headline framing vs body balance — consensus averaged"
            }
        }
    },

    {
        "id": "guns_fox_02",
        "title": "Gun rights expert says Minnesota Dems tried to block her testimony to avoid policy debate",
        "source": "Fox News",
        "topic": "Gun Control",
        "url": "https://www.foxnews.com/politics/gun-rights-expert-says-minnesota-dems-tried-block-her-testimony-firearm-bills-avoid-policy-debate",
        "text": _texts.get("guns_fox_02", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 4,    # Yosuf — strong lean, single-source perspective
                "annotator_2": 4,    # Odin  — agrees
                "consensus":   4,
                "notes":       ""
            }
        }
    },

    {
        "id": "guns_fox_03",
        "title": "DOJ promises a lot more action on gun rights with new Second Amendment enforcement section",
        "source": "Fox News",
        "topic": "Gun Control",
        "url": "https://www.foxnews.com/politics/doj-promises-a-lot-more-action-gun-rights-new-second-amendment-enforcement-section",
        "text": _texts.get("guns_fox_03", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 3,    # Yosuf — moderate, factual reporting with pro-gun framing
                "annotator_2": 4,    # Odin  — strong lean, no countervoice to DOJ announcement
                "consensus":   3.5,
                "notes":       "Disagreement on absence of countervoice — consensus averaged"
            }
        }
    },

    {
        "id": "guns_fox_04",
        "title": "Virginia passes 15 anti-gun bills in 60 days — 2A rights on the chopping block",
        "source": "Fox News",
        "topic": "Gun Control",
        "url": "https://www.foxnews.com/opinion/your-2a-rights-chopping-block-virginia-dems-plot-insane-gun-bans",
        "text": _texts.get("guns_fox_04", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 5,    # Yosuf — opinion piece, explicitly partisan language
                "annotator_2": 5,    # Odin  — agrees, "tyranny", "insane" in framing
                "consensus":   5,
                "notes":       ""
            }
        }
    },

    {
        "id": "guns_cnn_01",
        "title": "Democrats renew calls for gun control after Minnesota school shooting",
        "source": "CNN",
        "topic": "Gun Control",
        "url": "https://www.cnn.com/2025/08/27/politics/democrats-gun-control-minneapolis",
        "text": _texts.get("guns_cnn_01", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 4,    # Yosuf — strong lean, Democratic voices dominate
                "annotator_2": 3,    # Odin  — moderate, Republican responses included
                "consensus":   3.5,
                "notes":       "Disagreement on balance of quoted voices — consensus averaged"
            }
        }
    },

    {
        "id": "guns_cnn_02",
        "title": "Pope Leo calls for end to pandemic of arms after Minneapolis school shooting",
        "source": "CNN",
        "topic": "Gun Control",
        "url": "https://www.cnn.com/2025/08/31/world/pope-minneapolis-school-shooting-intl",
        "text": _texts.get("guns_cnn_02", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 3,    # Yosuf — moderate lean, religious framing of political issue
                "annotator_2": 2,    # Odin  — mild lean, reporting on Pope's statement is factual
                "consensus":   2.5,
                "notes":       "Disagreement on whether religious framing counts as political — consensus averaged"
            }
        }
    },

]


# ============================================================
# Helper used by /api/evaluate
# ============================================================

def get_consensus_score(article: dict) -> Optional[float]:
    scores = article["human_scores"]["political_framing"]
    if scores.get("consensus") is not None:
        return float(scores["consensus"])
    a1 = scores.get("annotator_1")
    a2 = scores.get("annotator_2")
    if a1 is not None and a2 is not None:
        return (float(a1) + float(a2)) / 2
    if a1 is not None:
        return float(a1)
    return None