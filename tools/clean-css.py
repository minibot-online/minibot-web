#!/usr/bin/env python3
"""پاک‌سازی کد مرده‌ی CSS پنل وب (بدون دست زدن به سرور)
- حذف @keyframes بی‌استفاده
- حذف متغیرهای CSS بی‌استفاده
- حذف سلکتورهایی که فقط از کلاس‌های بی‌استفاده ساخته شده‌اند
اجرا: python3 tools/clean-css.py [--write]
"""
import re
import sys
import glob
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSS = os.path.join(ROOT, "public", "style.css")

DEAD_CLASSES = set("""aa-btn aa-info aa-name aa-row aa-sub about-contact about-contact-actions
about-contact-btn about-contact-title about-panel about-panel-mark about-panel-text about-panel-title
about-panel-version account-box acct-avatar acct-edit acct-edit-avatar acct-edit-row acct-mail acct-name
acct-qr acct-text active-group-card admin-inp admin-key-row card-sep card-subhead contact-logo filled
footnote header-titles key-name key-status ldr-rays ldr-text ldr-tick lock-badge nav-badge num-add
num-chip num-dot num-x pin-dot pin-dots pin-field pin-inputs pin-key pin-pad pl-hero-sm pl-light
plan-banner pr-count row2 settings-group settings-group-title settings-hint settings-profile
settings-subsection settings-subtitle spacer telegram tg-hint ws-row-action""".split())

DEAD_KEYFRAMES = {"mbspin"}
DEAD_VARS = {"--header-h"}


def classes_of(selector):
    return set(re.findall(r"\.([A-Za-z][\w-]*)", selector))


def selector_is_dead(selector):
    """اگر سلکتور حتی یک کلاس مرده داشته باشد هیچ‌وقت به عنصری نمی‌خورد"""
    cl = classes_of(selector)
    if not cl:
        return False
    return cl <= DEAD_CLASSES


def split_selectors(sel):
    out, depth, cur = [], 0, ""
    for ch in sel:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        if ch == "," and depth == 0:
            out.append(cur)
            cur = ""
        else:
            cur += ch
    if cur:
        out.append(cur)
    return out


def clean_block(css):
    """پیمایش بلوک‌های CSS و حذف قواعد مرده؛ @media/@supports بازگشتی"""
    out = []
    i = 0
    n = len(css)
    while i < n:
        brace = css.find("{", i)
        if brace < 0:
            out.append(css[i:])
            break
        head = css[i:brace]
        # پیدا کردن بسته‌ی متناظر
        depth = 0
        j = brace
        while j < n:
            if css[j] == "{":
                depth += 1
            elif css[j] == "}":
                depth -= 1
                if depth == 0:
                    break
            j += 1
        body = css[brace + 1:j]
        head_stripped = head.strip()

        if head_stripped.startswith("@keyframes") or head_stripped.startswith("@-webkit-keyframes"):
            name = head_stripped.split()[1].strip()
            if name in DEAD_KEYFRAMES:
                i = j + 1
                continue
            out.append(css[i:j + 1])
            i = j + 1
            continue

        if head_stripped.startswith("@media") or head_stripped.startswith("@supports"):
            inner = clean_block(body)
            if inner.strip():
                out.append(head + "{" + inner + "}")
            i = j + 1
            continue

        if head_stripped.startswith("@"):
            out.append(css[i:j + 1])
            i = j + 1
            continue

        sels = split_selectors(head)
        kept = [s for s in sels if not selector_is_dead(s)]
        if kept:
            out.append(",".join(kept) + "{" + body + "}")
        i = j + 1
    return "".join(out)


def strip_dead_vars(css):
    for v in DEAD_VARS:
        css = re.sub(re.escape(v) + r"\s*:\s*[^;}]+;?", "", css)
    return css


def main():
    css = open(CSS, encoding="utf-8").read()
    before = len(css)
    new = strip_dead_vars(clean_block(css))
    new = re.sub(r"\n{2,}", "\n", new)
    print("style.css: %d → %d bytes (%.1f%% کمتر)" % (before, len(new), 100 * (before - len(new)) / before))
    print("mbspin: %d | --header-h: %d | کلاس مرده در فایل: %d" % (
        new.count("mbspin"), new.count("--header-h"),
        sum(1 for c in DEAD_CLASSES if "." + c in new)))
    if "--write" in sys.argv:
        open(CSS, "w", encoding="utf-8").write(new)
        print("نوشته شد")
    else:
        print("(dry-run — برای نوشتن --write)")


if __name__ == "__main__":
    main()
