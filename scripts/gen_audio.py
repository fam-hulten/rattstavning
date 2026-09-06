#!/usr/bin/env python3
"""
gen_audio.py — Genererar SV audio-filer för rättstavning-appen (Zacharias)

Användning:
    # Förutsätter att mmx auth är konfigurerat (se rattstavning/AUDIO-PIPELINE.md)
    python3 gen_audio.py [--out-dir DIR] [--data-json FILE]
    python3 gen_audio.py --dry-run

Läser saol-data.json, genererar 1 MP3-fil per ord (audio/<id>.mp3) via MiniMax T2A.

Voice:   Swedish_male_1_v1
Model:   speech-2.8-hd
Speed:   0.85 (långsammare för 10-åring med språkstörning)
Prompt:  'Skriv ordet #"<ord>"' — # funkar som paus-separator i SV-rösten
         citationstecken runtom ordet för tydlig avgränsning

VIKTIGT — --language Swedish KRÄVS (2026-09-06):
MiniMax auto-detectar språk från text, men missar ofta för svenska ord (särskilt
korta eller låneordsliknande som "kant", "avund"). Utan --language Swedish →
audio på fel språk (verifierat: v.36-generering utan flagga lät på engelska).

Flaggan sätts automatiskt när voice-namnet innehåller "swedish" (V3.2-fixen från
glosor/scripts/gen_audio.py).

Auth (rattstavning/AUDIO-PIPELINE.md):
    mmx auth login --api-key "$(cat /tmp/.mmx-key)"   # UTAN --region!
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path


# Voice + model-konstanter
VOICE_SV = "Swedish_male_1_v1"
MODEL = "speech-2.8-hd"
SPEED = "0.85"


def check_mmx_auth() -> bool:
    """Verifiera att mmx är authad. Returnerar True om auth.status visar method."""
    try:
        r = subprocess.run(
            ["mmx", "auth", "status"],
            capture_output=True, text=True, timeout=10
        )
        if r.returncode != 0:
            return False
        return '"method":' in r.stdout or "method:" in r.stdout
    except Exception as e:
        print(f"  ✗ auth check misslyckades: {e}", file=sys.stderr)
        return False


def synth(text: str, voice: str, out_path: Path) -> bool:
    """Kör mmx speech synthesize. Returnerar True om fil skapades."""
    # V3.2 (verifierat 2026-09-06): --language Swedish KRÄVS för MiniMax
    # SV-röster. Auto-detect: om voice-namnet innehåller "swedish", sätt Swedish.
    language = "Swedish" if "swedish" in voice.lower() else None
    cmd = [
        "mmx", "speech", "synthesize",
        "--text", text,
        "--voice", voice,
        "--model", MODEL,
        "--speed", SPEED,
        "--out", str(out_path),
        "--quiet",
    ]
    if language:
        cmd.extend(["--language", language])
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        return out_path.exists()
    except Exception as e:
        print(f"  ✗ synth error: {e}", file=sys.stderr)
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Genererar SV audio-filer för rättstavning-appen",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--out-dir",
        default="audio",
        help="Output-katalog för MP3-filer (default: audio/)"
    )
    parser.add_argument(
        "--data-json",
        default="saol-data.json",
        help="JSON med ord (default: saol-data.json)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Visa vad som skulle genereras utan att köra"
    )
    args = parser.parse_args()

    # Läs data
    data_path = Path(args.data_json)
    if not data_path.exists():
        print(f"✗ Hittar inte {data_path}", file=sys.stderr)
        sys.exit(1)

    with open(data_path) as f:
        data = json.load(f)
    words = [w for w in data.get("words", []) if w.get("active") is not False]
    if not words:
        print(f"✗ Inga ord i {data_path}", file=sys.stderr)
        sys.exit(1)

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    n_total = len(words)
    print(f"Genererar {n_total} SV-filer")
    print(f"Output: {out_dir.resolve()}")
    print(f"Voice:  {VOICE_SV}, model={MODEL}, speed={SPEED}, language=Swedish (auto)")
    print()

    # Auth check
    if not args.dry_run:
        if not check_mmx_auth():
            print("✗ mmx auth inte konfigurerad!", file=sys.stderr)
            print('  Kör: mmx auth login --api-key "$(cat /tmp/.mmx-key)"', file=sys.stderr)
            sys.exit(1)
        print("✓ mmx auth OK")
        print()

    # Generera
    ok = fail = 0
    for w in words:
        wid = w["id"]
        text = w["text"]
        out_path = out_dir / f"{wid}.mp3"
        # SV-prompt: 'Skriv ordet #"<ord>"' — # = paus-separator
        prompt = f'Skriv ordet #"{text}"'
        if args.dry_run:
            print(f"  [dry-run] {out_path.name}: '{prompt}'")
            ok += 1
        elif synth(prompt, VOICE_SV, out_path):
            print(f"  ✓ {out_path.name}")
            ok += 1
        else:
            print(f"  ✗ {out_path.name}")
            fail += 1

    print()
    print(f"Resultat: {ok}/{n_total} ok, {fail}/{n_total} fail")
    sys.exit(0 if fail == 0 else 1)


if __name__ == "__main__":
    main()
