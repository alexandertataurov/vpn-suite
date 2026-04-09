#!/usr/bin/env python3
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SCRIPT = os.path.join(ROOT, "monitoring", "inventory", "generate_inventory.py")

if __name__ == "__main__":
    os.execv(sys.executable, [sys.executable, SCRIPT] + sys.argv[1:])
