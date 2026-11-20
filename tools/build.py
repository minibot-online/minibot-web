#!/usr/bin/env python3
"""ساخت پنل: از src/ → public/
- src/shell.html  → public/shell.js   (مارک‌آپ به‌صورت رشته، خارج از سورس صفحه)
- src/*.js        → public/*.js       (مینت با terser)
اجرا: python3 tools/build.py
"""
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src")
PUB = os.path.join(ROOT, "public")


def terser(src_path, out_path, mangle_toplevel=False):
    cmd = ["npx", "--yes", "terser@5.36.0", src_path, "-c", "passes=2", "--comments", "false", "-o", out_path]
    if mangle_toplevel:
        cmd[4:4] = ["-m", "toplevel=true,reserved=['toast']"]
    else:
        cmd[4:4] = ["-m"]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr[-800:])
        sys.exit(1)


def build_shell():
    tpl = open(os.path.join(SRC, "shell.html"), encoding="utf-8").read()
    body = (
        "/* Mini Bot — پوسته‌ی برنامه (خارج از سورس صفحه) */\n"
        "(function(){var t=%s;var h=document.getElementById('appShell');"
        "if(h){h.insertAdjacentHTML('beforebegin',t);h.parentNode.removeChild(h);}})();\n"
        % json.dumps(tpl, ensure_ascii=False)
    )
    tmp = os.path.join(SRC, "_shell.build.js")
    open(tmp, "w", encoding="utf-8").write(body)
    terser(tmp, os.path.join(PUB, "shell.js"))
    os.remove(tmp)
    print("shell.js  ←  src/shell.html  (%d chars markup)" % len(tpl))


def build_js():
    for name in ("receipts-search",):
        src = os.path.join(SRC, name + ".js")
        if not os.path.exists(src):
            continue
        terser(src, os.path.join(PUB, name + ".js"))
        print("%s.js  ←  src/%s.js" % (name, name))


if __name__ == "__main__":
    build_shell()
    build_js()
    for f in ("shell.js", "receipts-search.js"):
        p = os.path.join(PUB, f)
        if os.path.exists(p):
            print("  %s = %d bytes" % (f, os.path.getsize(p)))
