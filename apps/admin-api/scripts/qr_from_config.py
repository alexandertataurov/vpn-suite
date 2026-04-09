#!/usr/bin/env python3
"""Generate a QR code PNG from WireGuard/AWG config text.
Usage: cat your.conf | python qr_from_config.py [out.png]
  Or:  python qr_from_config.py config.conf [out.png]
No default config (avoids committing secrets). Config from stdin or file only.
"""

import sys

import qrcode


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    if not sys.stdin.isatty():
        payload = sys.stdin.read()
        out_path = args[0] if args else "config-qr.png"
    elif len(args) >= 1:
        with open(args[0]) as f:
            payload = f.read()
        out_path = args[1] if len(args) >= 2 else "config-qr.png"
    else:
        print("Usage: cat config.conf | python qr_from_config.py [out.png]", file=sys.stderr)
        print("   or: python qr_from_config.py config.conf [out.png]", file=sys.stderr)
        sys.exit(1)
    img = qrcode.make(payload)
    img.save(out_path)
    print(f"Saved QR to {out_path}", file=sys.stderr)


if __name__ == "__main__":
    main()
