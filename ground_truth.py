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



    # ── TOPIC 2: Immigration / Border ───────────────────────────────────────

    {
        "id": "imm_fox_01",
        "title": "Trump has sealed the border. Now, Democrats are hell-bent on ending immigration enforcement",
        "source": "Fox News",
        "topic": "Immigration",
        "url": "https://www.foxnews.com/opinion/trump-has-sealed-border",
        "text": _texts.get("imm_fox_01", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 5,
                "annotator_2": 5,
                "consensus":   5,
                "notes": "Heritage Foundation opinion piece; open partisan framing throughout"
            }
        }
    },

    {
        "id": "imm_fox_02",
        "title": "US city population growth slows as immigration fell under Trump",
        "source": "Fox News",
        "topic": "Immigration",
        "url": "https://www.foxnews.com/politics/number-immigrants-border-communities-plunges",
        "text": _texts.get("imm_fox_02", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 3,
                "annotator_2": 3,
                "consensus":   3,
                "notes": "Mostly census data; framing via 'Biden open border policies' label"
            }
        }
    },

    {
        "id": "imm_fox_03",
        "title": "Migrants turning back due to tighter border security, CBP memo shows",
        "source": "Fox News",
        "topic": "Immigration",
        "url": "https://www.foxnews.com/us/migrants-turning-back-due-tighter-border-security",
        "text": _texts.get("imm_fox_03", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 3,
                "annotator_2": 4,
                "consensus":   3.5,
                "notes": "News report framed as Trump success; Gitmo details add partisan angle"
            }
        }
    },

    {
        "id": "imm_fox_04",
        "title": "'Shameful': Legal immigrants face uphill battle amid ongoing border crisis",
        "source": "Fox News",
        "topic": "Immigration",
        "url": "https://www.foxnews.com/media/shameful-legal-immigrants-face-uphill-battle",
        "text": _texts.get("imm_fox_04", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 3,
                "annotator_2": 3,
                "consensus":   3,
                "notes": "Human interest; quotes both sides including Cato libertarian"
            }
        }
    },

    {
        "id": "imm_cnn_01",
        "title": "How federal agencies' roles have shifted in Trump's immigration battle",
        "source": "CNN",
        "topic": "Immigration",
        "url": "https://www.cnn.com/2025/11/09/us/ice-immigration-federal-agencies-trump",
        "text": _texts.get("imm_cnn_01", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 3,
                "annotator_2": 4,
                "consensus":   3.5,
                "notes": "Investigative; sources mostly critical of administration tactics"
            }
        }
    },

    {
        "id": "imm_cnn_02",
        "title": "Inside ICE's messy effort to hire 10,000 more deportation officers",
        "source": "CNN",
        "topic": "Immigration",
        "url": "https://www.cnn.com/2025/10/23/politics/ice-recruiting-problems-deportation-agents",
        "text": _texts.get("imm_cnn_02", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 3,
                "annotator_2": 3,
                "consensus":   3,
                "notes": "Critical investigative piece; DHS response included for balance"
            }
        }
    },

    {
        "id": "imm_cnn_03",
        "title": "Trump wants Americans to make more babies. Critics say his policies won't help raise them",
        "source": "CNN",
        "topic": "Immigration",
        "url": "https://edition.cnn.com/2025/11/26/health/pronatalist-movement-families-kff-health-news",
        "text": _texts.get("imm_cnn_03", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 4,
                "annotator_2": 3,
                "consensus":   3.5,
                "notes": "Critical framing; sources predominantly oppose administration"
            }
        }
    },

    {
        "id": "imm_cnn_04",
        "title": "ICE deported 442k people in fiscal year 2025",
        "source": "Axios",
        "topic": "Immigration",
        "url": "https://www.axios.com/2026/04/15/ice-deportations-us-immigration-trump-biden-2025",
        "text": _texts.get("imm_cnn_04", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 2,
                "annotator_2": 2,
                "consensus":   2,
                "notes": "Largely factual data report; notes gap between promise and reality neutrally"
            }
        }
    },


    # ── TOPIC 3: Abortion / Reproductive Rights ─────────────────────────────

    {
        "id": "abo_fox_01",
        "title": "Roe v. Wade is gone, but abortion still the number 1 killer worldwide",
        "source": "Fox News",
        "topic": "Abortion",
        "url": "https://www.foxnews.com/opinion/roe-v-wade-gone-abortion-still-number-1-killer-worldwide",
        "text": _texts.get("abo_fox_01", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 5,
                "annotator_2": 5,
                "consensus":   5,
                "notes": "Focus on the Family opinion piece; explicitly pro-life framing throughout"
            }
        }
    },

    {
        "id": "abo_fox_02",
        "title": "Defund 'Big Abortion' industry that thrived under Biden, 150 pro-life groups urge Congress",
        "source": "Fox News",
        "topic": "Abortion",
        "url": "https://www.foxnews.com/politics/defund-big-abortion-industry-thrived-under-biden",
        "text": _texts.get("abo_fox_02", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 5,
                "annotator_2": 4,
                "consensus":   4.5,
                "notes": "Strong conservative framing; 'Big Abortion' language, no pro-choice voices"
            }
        }
    },

    {
        "id": "abo_fox_03",
        "title": "OB-GYNs decry the 'fearmongering' about Georgia's abortion laws",
        "source": "Fox News",
        "topic": "Abortion",
        "url": "https://www.foxnews.com/media/ob-gyns-decry-fearmongering-about-georgias-abortion-laws",
        "text": _texts.get("abo_fox_03", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 4,
                "annotator_2": 4,
                "consensus":   4,
                "notes": "Framed as media/Democrat misinformation; all sources pro-life affiliated"
            }
        }
    },

    {
        "id": "abo_cnn_01",
        "title": "Federal agencies are studying safety of abortion drug mifepristone",
        "source": "CNN",
        "topic": "Abortion",
        "url": "https://www.cnn.com/2025/09/25/health/mifepristone-review-fda-hhs-abortion",
        "text": _texts.get("abo_cnn_01", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 3,
                "annotator_2": 3,
                "consensus":   3,
                "notes": "Mostly factual; sources skew pro-access but includes administration position"
            }
        }
    },

    {
        "id": "abo_cnn_02",
        "title": "Judge refuses to block sending abortion pill by mail for now",
        "source": "CNN",
        "topic": "Abortion",
        "url": "https://www.cnn.com/2026/04/08/health/abortion-pill-mifepristone-by-mail",
        "text": _texts.get("abo_cnn_02", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 2,
                "annotator_2": 3,
                "consensus":   2.5,
                "notes": "Largely neutral court report; both sides represented"
            }
        }
    },

    {
        "id": "abo_cnn_03",
        "title": "Trump DOJ has cut thousands of law-enforcement jobs while vowing to get tough on crime",
        "source": "Reuters",
        "topic": "Crime",
        "url": "https://www.reuters.com/legal/trump-doj-cut-law-enforcement-jobs-2026-04-23",
        "text": _texts.get("abo_cnn_03", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 3,
                "annotator_2": 3,
                "consensus":   3,
                "notes": "Data-driven investigative; DOJ response included; critical but evidence-based"
            }
        }
    },


    # ── TOPIC 4: Economy / Tariffs ──────────────────────────────────────────

    {
        "id": "eco_fox_01",
        "title": "Left's tariff doomsday predictions fall flat as Trump's America thrives",
        "source": "Fox News",
        "topic": "Economy",
        "url": "https://www.foxnews.com/opinion/lefts-tariff-doomsday-predictions-fall-flat",
        "text": _texts.get("eco_fox_01", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 5,
                "annotator_2": 5,
                "consensus":   5,
                "notes": "Opinion piece explicitly framing Democrats as wrong and Trump as successful"
            }
        }
    },

    {
        "id": "eco_fox_02",
        "title": "New Council of Economic Advisers report finds tariffs not causing inflation",
        "source": "Fox Business",
        "topic": "Economy",
        "url": "https://www.foxbusiness.com/economy/new-council-economic-advisers-report-finds-tariffs-not-causing-inflation",
        "text": _texts.get("eco_fox_02", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 3,
                "annotator_2": 3,
                "consensus":   3,
                "notes": "Reports White House CEA findings; single source without outside economists"
            }
        }
    },

    {
        "id": "eco_fox_03",
        "title": "Flashback: Trump's Liberation Day tariffs hit one-year mark as economists split",
        "source": "Fox News",
        "topic": "Economy",
        "url": "https://www.foxnews.com/politics/flashback-trumps-liberation-day-tariffs-one-year-mark",
        "text": _texts.get("eco_fox_03", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 3,
                "annotator_2": 2,
                "consensus":   2.5,
                "notes": "Balanced — multiple critical economists quoted alongside pro-Trump voices"
            }
        }
    },

    {
        "id": "eco_cnn_01",
        "title": "Strait of Hormuz closed again, Iran says, as ships attacked",
        "source": "BBC",
        "topic": "Economy",
        "url": "https://www.bbc.com/news/articles/strait-hormuz-iran",
        "text": _texts.get("eco_cnn_01", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 2,
                "annotator_2": 2,
                "consensus":   2,
                "notes": "Neutral factual BBC report on economic impact of Hormuz closure"
            }
        }
    },


    # ── TOPIC 5: Trump Administration ───────────────────────────────────────

    {
        "id": "tru_fox_01",
        "title": "Trump signs One Big Beautiful Bill into law",
        "source": "BBC",
        "topic": "Trump Admin",
        "url": "https://www.bbc.com/news/articles/trump-signs-one-big-beautiful-bill",
        "text": _texts.get("tru_fox_01", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 2,
                "annotator_2": 2,
                "consensus":   2,
                "notes": "BBC balanced report; includes both celebration and CBO criticism"
            }
        }
    },

    {
        "id": "tru_cnn_01",
        "title": "In Tehran, money is short and a return to war looms over daily life",
        "source": "BBC",
        "topic": "Trump Admin",
        "url": "https://www.bbc.com/news/articles/tehran-daily-life-iran-war",
        "text": _texts.get("tru_cnn_01", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 2,
                "annotator_2": 2,
                "consensus":   2,
                "notes": "Human interest BBC piece; Iranian civilian perspective, no strong political lean"
            }
        }
    },


    # ── TOPIC 6: Crime / Justice ────────────────────────────────────────────

    {
        "id": "cri_cnn_01",
        "title": "Lebanon accuses Israel of targeting journalist killed in air strike",
        "source": "BBC",
        "topic": "Crime",
        "url": "https://www.bbc.com/news/articles/lebanon-journalist-killed-israeli-airstrike",
        "text": _texts.get("cri_cnn_01", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 3,
                "annotator_2": 3,
                "consensus":   3,
                "notes": "BBC includes both Lebanese accusations and IDF denial"
            }
        }
    },

    {
        "id": "cri_cnn_02",
        "title": "Philippine ex-president Duterte to stand trial as ICC confirms charges",
        "source": "BBC",
        "topic": "Crime",
        "url": "https://www.bbc.com/news/articles/duterte-icc-crimes-against-humanity-trial",
        "text": _texts.get("cri_cnn_02", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 2,
                "annotator_2": 2,
                "consensus":   2,
                "notes": "Factual court report; includes Duterte defence and victim perspectives"
            }
        }
    },


    # ── NEUTRAL CONTROLS ────────────────────────────────────────────────────

    {
        "id": "neu_03",
        "title": "More than 500 people killed in Tanzania election violence, inquiry finds",
        "source": "BBC",
        "topic": "Neutral",
        "url": "https://www.bbc.com/news/articles/tanzania-election-violence-518-killed",
        "text": _texts.get("neu_03", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 1,
                "annotator_2": 1,
                "consensus":   1,
                "notes": "International news; no US political framing"
            }
        }
    },

    {
        "id": "neu_04",
        "title": "Coventry owner not worried by Lampard links with Chelsea",
        "source": "BBC Sport",
        "topic": "Neutral",
        "url": "https://www.bbc.com/sport/football/coventry-lampard-chelsea",
        "text": _texts.get("neu_04", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 1,
                "annotator_2": 1,
                "consensus":   1,
                "notes": "Sports news; zero political content"
            }
        }
    },


    # ── AL JAZEERA ARTICLES ─────────────────────────────────────────────────

    {
        "id": "alj_01",
        "title": "India to Iran: How two wars shaped the rise of Pakistan's Asim Munir",
        "source": "Al Jazeera",
        "topic": "Trump Admin",
        "url": "https://www.aljazeera.com/features/2026/4/23/asim-munir-pakistan",
        "text": _texts.get("alj_01", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 2,
                "annotator_2": 2,
                "consensus":   2,
                "notes": "Analytical; presents both supportive and critical views of Munir's rise"
            }
        }
    },

    {
        "id": "alj_02",
        "title": "As barbed wire blocks kids from class, Palestinians stage 'Freedom School'",
        "source": "Al Jazeera",
        "topic": "Crime",
        "url": "https://www.aljazeera.com/news/2026/4/20/barbed-wire-blocks-kids-palestinians",
        "text": _texts.get("alj_02", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 4,
                "annotator_2": 3,
                "consensus":   3.5,
                "notes": "Strong Palestinian perspective; IDF response not prominently included"
            }
        }
    },

    {
        "id": "alj_03",
        "title": "Israeli strike kills five in Gaza, including three children",
        "source": "Al Jazeera",
        "topic": "Crime",
        "url": "https://www.aljazeera.com/news/2026/4/23/israeli-strike-kills-five-gaza",
        "text": _texts.get("alj_03", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 4,
                "annotator_2": 4,
                "consensus":   4,
                "notes": "Strong pro-Palestinian framing; uses 'genocidal war'; sources critical of Israel"
            }
        }
    },

    {
        "id": "alj_04",
        "title": "Five major issues affecting the FIFA World Cup with 50 days to go",
        "source": "Al Jazeera",
        "topic": "Neutral",
        "url": "https://www.aljazeera.com/sports/2026/4/22/world-cup-2026-major-issues",
        "text": _texts.get("alj_04", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 2,
                "annotator_2": 2,
                "consensus":   2,
                "notes": "Sports/news hybrid; mild critical framing of Trump immigration policy"
            }
        }
    },

    {
        "id": "alj_05",
        "title": "Iran's leaders debate war and peace after Trump ceasefire extension",
        "source": "Al Jazeera",
        "topic": "Trump Admin",
        "url": "https://www.aljazeera.com/news/2026/4/22/iran-leaders-debate-war-peace",
        "text": _texts.get("alj_05", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 2,
                "annotator_2": 3,
                "consensus":   2.5,
                "notes": "Balanced; presents both hardline and moderate Iranian voices"
            }
        }
    },

    {
        "id": "alj_06",
        "title": "US Treasury Secretary Bessent says Gulf, Asian allies request swap lines",
        "source": "Al Jazeera",
        "topic": "Economy",
        "url": "https://www.aljazeera.com/economy/2026/4/22/bessent-gulf-asian-swap-lines",
        "text": _texts.get("alj_06", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 3,
                "annotator_2": 2,
                "consensus":   2.5,
                "notes": "Includes Democratic criticism of Trump-UAE ties; relatively balanced"
            }
        }
    },


    # ── NBC NEWS ARTICLES ───────────────────────────────────────────────────

    {
        "id": "nbc_01",
        "title": "NFL Draft: Biggest questions of the first round",
        "source": "NBC News",
        "topic": "Neutral",
        "url": "https://www.nbcnews.com/sports/nfl/nfl-draft-2026-first-round-questions",
        "text": _texts.get("nbc_01", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 1,
                "annotator_2": 1,
                "consensus":   1,
                "notes": "Sports analysis; no political content"
            }
        }
    },

    {
        "id": "nbc_02",
        "title": "Biological parents of baby in IVF embryo mix-up have been identified",
        "source": "NBC News",
        "topic": "Neutral",
        "url": "https://www.nbcnews.com/health/ivf-embryo-mix-up-biological-parents",
        "text": _texts.get("nbc_02", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 1,
                "annotator_2": 1,
                "consensus":   1,
                "notes": "Human interest/health story; no political framing"
            }
        }
    },

    {
        "id": "nbc_03",
        "title": "Missing USF doctoral students were romantically linked, would never vanish willingly",
        "source": "NBC News",
        "topic": "Neutral",
        "url": "https://www.nbcnews.com/news/usf-doctoral-students-missing",
        "text": _texts.get("nbc_03", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 1,
                "annotator_2": 1,
                "consensus":   1,
                "notes": "Breaking news missing persons; no political framing"
            }
        }
    },

    {
        "id": "nbc_04",
        "title": "Wildfires across Georgia and Florida destroy more than 50 homes",
        "source": "NBC News",
        "topic": "Neutral",
        "url": "https://www.nbcnews.com/news/georgia-florida-wildfires-2026",
        "text": _texts.get("nbc_04", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 1,
                "annotator_2": 1,
                "consensus":   1,
                "notes": "Natural disaster report; factual AP wire story"
            }
        }
    },

    {
        "id": "nbc_05",
        "title": "Kansas City Royals announce new stadium plans with help from Hallmark Cards",
        "source": "NBC News",
        "topic": "Neutral",
        "url": "https://www.nbcnews.com/sports/mlb/kansas-city-royals-new-stadium-hallmark",
        "text": _texts.get("nbc_05", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 1,
                "annotator_2": 1,
                "consensus":   1,
                "notes": "Sports business story; no political framing"
            }
        }
    },

    {
        "id": "nbc_06",
        "title": "Italy underwhelmed by Trump envoy's suggestion it should replace Iran at World Cup",
        "source": "NBC News",
        "topic": "Neutral",
        "url": "https://www.nbcnews.com/sports/world-cup/italy-trump-iran-world-cup",
        "text": _texts.get("nbc_06", ""),
        "human_scores": {
            "political_framing": {
                "annotator_1": 2,
                "annotator_2": 2,
                "consensus":   2,
                "notes": "Light political touch; Italian officials dismissive of Trump envoy suggestion"
            }
        }
    },

]


def get_consensus_score(article: dict) -> Optional[float]:
    try:
        return article["human_scores"]["political_framing"]["consensus"]
    except (KeyError, TypeError):
        return None