

import json
import time
import requests
import sys
import os
from datetime import datetime

BASE_URL = "http://localhost:5000"
CORPUS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "corpus_texts.json")
MODELS = ["gemini", "claude"]
DELAY_BETWEEN_REQUESTS = 3  # seconds between API calls to avoid rate limits

def load_corpus():
    with open(CORPUS_PATH, "r", encoding="utf-8") as f:
        return [e for e in json.load(f) if e.get("text")]

def get_already_analyzed():
    """Check DB via /api/db_check to see what titles+models are already saved."""
    try:
        resp = requests.get(f"{BASE_URL}/api/db_check_all", timeout=10)
        if resp.status_code == 200:
            rows = resp.json().get("rows", [])
            return {(r["title"].strip().lower()[:80], r["modelUsed"].strip().lower()) for r in rows}
    except Exception:
        pass
    return set()

def get_ground_truth_metadata():
    """Load title/source info from ground_truth.py entries."""
    gt_path = os.path.join(os.path.dirname(__file__), "ground_truth.py")
    metadata = {}
    try:
        # Simple parse — extract id/title/source from file
        import ast, re
        with open(gt_path, "r") as f:
            content = f.read()
        # Find all id/title/source pairs
        ids = re.findall(r'"id":\s*"([^"]+)"', content)
        titles = re.findall(r'"title":\s*"([^"]+)"', content)
        sources = re.findall(r'"source":\s*"([^"]+)"', content)
        for i, aid in enumerate(ids):
            metadata[aid] = {
                "title": titles[i] if i < len(titles) else aid,
                "source": sources[i] if i < len(sources) else "Unknown",
            }
    except Exception as e:
        print(f"  Warning: could not load ground truth metadata: {e}")
    return metadata

def analyze_article(article_id, text, title, source, model):
    """Call /api/analyze then /api/analysis to save the result."""
    payload = {
        "article_id": article_id,
        "title": title,
        "source": source,
        "text": text,
        "model": model,
    }
    resp = requests.post(
        f"{BASE_URL}/api/analyze",
        json=payload,
        timeout=300,
    )

    if resp.status_code == 200:
        import uuid, time as _time
        data = resp.json()
        save_payload = {
            "id":                   str(uuid.uuid4()),
            "timestamp":            int(_time.time() * 1000),
            "title":                title,
            "summary":              data.get("summary", ""),
            "biasScore":            data.get("biasScore", 0),
            "category":             data.get("category", ""),
            "sensationalismScore":  data.get("sensationalismScore", 0),
            "tonality":             data.get("tonality", ""),
            "biasedPhrases":        data.get("biasedPhrases", []),
            "originalTextSnippet":  text[:300],
            "detailedBiases":       data.get("detailedBiases", []),
            "highlightedText":      data.get("highlightedText", ""),
            "framingScore":         data.get("framingScore", 0),
            "confidence":           data.get("confidence", 0),
            "fullText":             text,
            "source":               source,
            "modelUsed":            "Claude" if model == "claude" else "Gemini",
        }
        requests.post(f"{BASE_URL}/api/analysis", json=save_payload, timeout=10)

    return resp

def clear_db():
    """Delete all rows from the DB via SQLite directly."""
    import glob
    candidates = [
        os.path.expanduser("~/Downloads/Veribas/veribias.db"),
        os.path.expanduser("~/Downloads/Veribas/analysis.db"),
    ]
    for pattern in [os.path.expanduser("~/Downloads/Veribas/*.db")]:
        candidates.extend(glob.glob(pattern))
    for p in candidates:
        if os.path.exists(p):
            import sqlite3
            conn = sqlite3.connect(p)
            c = conn.cursor()
            c.execute("DELETE FROM analysis")
            deleted = c.rowcount
            conn.commit()
            conn.close()
            print(f"  Cleared {deleted} rows from {p}")
            return
    print("  WARNING: DB not found — could not clear")

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--fresh", action="store_true",
                        help="Clear the database before running (re-analyzes all articles)")
    args = parser.parse_args()

    print("=" * 60)
    print("VeriBias Batch Analyzer")
    print(f"Started: {datetime.now().strftime('%H:%M:%S')}")
    print("=" * 60)

    # Check Flask is running
    try:
        requests.get(f"{BASE_URL}/api/history", timeout=5)
    except Exception:
        print(f"\n❌ Flask app not running at {BASE_URL}")
        print("   Start it with: python3 app.py")
        sys.exit(1)

    if args.fresh:
        print("\n⚠️  --fresh flag: clearing database before run...")
        clear_db()

    corpus = load_corpus()
    metadata = get_ground_truth_metadata()
    already_done = get_already_analyzed() if not args.fresh else set()

    print(f"\nCorpus path: {CORPUS_PATH}")
    print(f"Corpus: {len(corpus)} articles")
    empty = [e["id"] for e in corpus if not e.get("text")]
    if empty:
        print(f"WARNING: {len(empty)} articles have empty text: {empty}")
    print(f"Already analyzed: {len(already_done)} article-model pairs")
    print(f"Models: {', '.join(MODELS)}")

    total = len(corpus) * len(MODELS)
    done = 0
    skipped = 0
    failed = 0
    start_time = time.time()

    for i, entry in enumerate(corpus):
        aid = entry["id"]
        text = entry["text"]
        meta = metadata.get(aid, {})
        title = meta.get("title", aid)
        source = meta.get("source", "Unknown")

        for model in MODELS:
            # Skip if already done (match by title+model)
            title_key = title.strip().lower()[:80]
            model_key = model.lower()
            if (title_key, model_key) in already_done:
                skipped += 1
                done += 1
                continue

            elapsed = time.time() - start_time
            remaining_items = total - done - skipped
            avg_time = elapsed / max(done - skipped, 1)
            eta_seconds = avg_time * remaining_items
            eta_str = f"{int(eta_seconds // 60)}m {int(eta_seconds % 60)}s"

            print(f"\n[{done+1}/{total}] {aid} | {model.upper()}")
            print(f"  Title: {title[:60]}...")
            print(f"  Text length: {len(text)} chars")
            print(f"  ETA: ~{eta_str}")

            try:
                resp = analyze_article(aid, text, title, source, model)
                if resp.status_code == 200:
                    data = resp.json()
                    score_10 = data.get("framingScore", None)
                    score_5 = round(score_10 / 2, 1) if score_10 is not None else "?"
                    confidence = data.get("confidence", "?")
                    print(f"  ✓ Score: {score_5}/5 (raw: {score_10}/10) | Confidence: {confidence}%")
                    done += 1
                else:
                    print(f"  ✗ HTTP {resp.status_code}: {resp.text[:100]}")
                    failed += 1
                    done += 1
            except requests.exceptions.Timeout:
                print(f"  ✗ Timeout — skipping")
                failed += 1
                done += 1
            except Exception as e:
                print(f"  ✗ Error: {e}")
                failed += 1
                done += 1

            # Delay between calls
            if done < total:
                time.sleep(DELAY_BETWEEN_REQUESTS)

    total_time = time.time() - start_time
    print("\n" + "=" * 60)
    print("BATCH COMPLETE")
    print(f"  Total time:  {int(total_time // 60)}m {int(total_time % 60)}s")
    print(f"  Analyzed:    {done - skipped - failed}")
    print(f"  Skipped:     {skipped} (already in DB)")
    print(f"  Failed:      {failed}")
    print("=" * 60)
    print("\nNow run /api/evaluate to compare against ground truth.")

if __name__ == "__main__":
    main()