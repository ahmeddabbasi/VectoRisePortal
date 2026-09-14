#!/usr/bin/env python3
"""Backfill August 2026 mock activity dates for dashboard development.

Only fills empty date cells. Existing dates are preserved.
Adds/updates a Dashboard Notes tab explaining backfill vs real dates going forward.

Usage:
  python scripts/backfill_mock_dates.py --dry-run
  python scripts/backfill_mock_dates.py --apply
"""

from __future__ import annotations

import argparse
import sys
from datetime import date, timedelta
from pathlib import Path

from google.oauth2 import service_account
from googleapiclient.discovery import build

SPREADSHEET_ID = "1WyXufFOy6Q37oEoyf6a5C7Yk46SzYGjDqXOhj9OKzVI"
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

ROOT = Path(__file__).resolve().parents[1]
SA_CANDIDATES = [
    ROOT / "credentials" / "google-service-account.json",
    ROOT / "credentials" / "google service account.json",
]

LEAD_GIDS = {
    992533385: "Automation",
    826591238: "Logistics",
    573785750: "Financial Automation",
    535737061: "AI Governance",
    1744199364: "Voice Agents",
}

LINKEDIN_GIDS = {
    1177486258: "Dawood's Leads",
    351206880: "Hanya's Leads",
}

BACKFILL_MONTH = (2026, 8)  # August 2026 — month before Sep 2026
REAL_DATES_FROM = date(2026, 9, 1)

SENT_INITIAL = {"sent", "replied"}
SENT_FOLLOW = {"sent", "follow-up sent", "follow-up required", "replied", "no response"}
SENT_LINKEDIN = {"sent", "replied", "no response"}
REPLY_MARKERS = {"replied"}


def get_credentials():
    key = next(p for p in SA_CANDIDATES if p.exists())
    return service_account.Credentials.from_service_account_file(str(key), scopes=SCOPES)


def col_letter(n: int) -> str:
    s = ""
    while n > 0:
        n, rem = divmod(n - 1, 26)
        s = chr(65 + rem) + s
    return s


def a1_range(title: str, cell: str) -> str:
    return f"'{title.replace(chr(39), chr(39) + chr(39))}'!{cell}"


def header_index(headers: list[str], name: str) -> int:
    target = name.lower()
    for i, h in enumerate(headers):
        if str(h).strip().lower() == target:
            return i
    return -1


def get(headers: list[str], row: list, name: str) -> str:
    idx = header_index(headers, name)
    if idx == -1 or idx >= len(row):
        return ""
    return str(row[idx]).strip()


def is_empty_date(val: str) -> bool:
    if not val or not str(val).strip():
        return True
    return False


def parse_date(val: str) -> date | None:
    val = str(val).strip()
    if not val:
        return None
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%m/%d/%Y"):
        try:
            from datetime import datetime

            return datetime.strptime(val, fmt).date()
        except ValueError:
            continue
    return None


def fmt_sheet(d: date) -> str:
    return d.strftime("%d/%m/%Y")


def weekday_slots(year: int, month: int) -> list[date]:
    slots: list[date] = []
    d = date(year, month, 1)
    while d.month == month:
        if d.weekday() < 5:
            slots.append(d)
        d += timedelta(days=1)
    return slots


class SlotPicker:
    def __init__(self, slots: list[date]):
        self.slots = slots
        self.i = 0

    def next(self) -> date:
        d = self.slots[self.i % len(self.slots)]
        self.i += 1
        return d


def load_sheet(sheets_service, title: str) -> tuple[list[str], list[list[str]]]:
    result = (
        sheets_service.spreadsheets()
        .values()
        .get(spreadsheetId=SPREADSHEET_ID, range=a1_range(title, "A:ZZ"), majorDimension="ROWS")
        .execute()
    )
    rows = result.get("values", [])
    if not rows:
        return [], []
    headers = [str(h).strip() for h in rows[0]]
    return headers, rows[1:]


def plan_lead_sheet(headers: list[str], data: list[list[str]]) -> dict[str, list[list[str]]]:
    slots = weekday_slots(*BACKFILL_MONTH)
    picker = SlotPicker(slots)
    updates: dict[str, list] = {
        "Initial Email Date": [],
        "Follow-up Email Date": [],
        "LinkedIn Date": [],
        "Reply Date": [],
    }

    for row in data:
        if not get(headers, row, "First Name"):
            for col in updates:
                updates[col].append([""])
            continue

        init_status = get(headers, row, "Initial Email").lower()
        follow_status = get(headers, row, "Follow-up Email").lower()
        li_status = get(headers, row, "LinkedIn Follow-up").lower()
        reply_status = get(headers, row, "Reply Status").lower()

        init_existing = get(headers, row, "Initial Email Date")
        follow_existing = get(headers, row, "Follow-up Email Date")
        li_existing = get(headers, row, "LinkedIn Date")
        reply_existing = get(headers, row, "Reply Date")

        init_date = parse_date(init_existing)
        follow_date = parse_date(follow_existing)
        li_date = parse_date(li_existing)
        reply_date = parse_date(reply_existing)

        if is_empty_date(init_existing) and init_status in SENT_INITIAL:
            init_date = picker.next()
        if is_empty_date(follow_existing) and follow_status in SENT_FOLLOW:
            if not init_date:
                init_date = picker.next()
            follow_date = init_date + timedelta(days=3 + (picker.i % 4))
            if follow_date.month != BACKFILL_MONTH[1]:
                follow_date = date(BACKFILL_MONTH[0], BACKFILL_MONTH[1], 28) - timedelta(
                    days=picker.i % 5
                )
            if is_empty_date(init_existing) and init_status not in SENT_INITIAL:
                init_date = follow_date - timedelta(days=3)
        if is_empty_date(li_existing) and li_status in SENT_LINKEDIN:
            base = follow_date or init_date or picker.next()
            li_date = base + timedelta(days=2 + (picker.i % 3))
            if li_date.month != BACKFILL_MONTH[1]:
                li_date = date(BACKFILL_MONTH[0], BACKFILL_MONTH[1], 29)

        has_reply = (
            reply_status in REPLY_MARKERS
            or "repl" in init_status
            or "repl" in follow_status
            or "repl" in li_status
        )
        if is_empty_date(reply_existing) and has_reply:
            base = li_date or follow_date or init_date or picker.next()
            reply_date = base + timedelta(days=1 + (picker.i % 5))
            if reply_date.month != BACKFILL_MONTH[1]:
                reply_date = date(BACKFILL_MONTH[0], BACKFILL_MONTH[1], 31)

        updates["Initial Email Date"].append([
            fmt_sheet(init_date)
            if init_date and is_empty_date(init_existing) and (init_status in SENT_INITIAL or follow_status in SENT_FOLLOW)
            else ""
        ])
        updates["Follow-up Email Date"].append([fmt_sheet(follow_date) if follow_date and is_empty_date(follow_existing) else ""])
        updates["LinkedIn Date"].append([fmt_sheet(li_date) if li_date and is_empty_date(li_existing) else ""])
        updates["Reply Date"].append([fmt_sheet(reply_date) if reply_date and is_empty_date(reply_existing) else ""])

    return updates


def plan_linkedin_sheet(headers: list[str], data: list[list[str]]) -> dict[str, list[list[str]]]:
    slots = weekday_slots(*BACKFILL_MONTH)
    picker = SlotPicker(slots)
    updates: dict[str, list] = {"Date": [], "Reply Date": []}

    for row in data:
        if not get(headers, row, "First Name"):
            updates["Date"].append([""])
            updates["Reply Date"].append([""])
            continue

        outreach_existing = get(headers, row, "Date")
        reply_existing = get(headers, row, "Reply Date")
        replied_raw = get(headers, row, "Replied") or get(headers, row, "Reached")
        replied = str(replied_raw).strip().upper() in {"TRUE", "1", "YES"}

        outreach_date = parse_date(outreach_existing)
        reply_date = parse_date(reply_existing)

        if is_empty_date(outreach_existing):
            outreach_date = picker.next()

        if is_empty_date(reply_existing) and replied and outreach_date:
            reply_date = outreach_date + timedelta(days=2 + (picker.i % 4))
            if reply_date.month != BACKFILL_MONTH[1]:
                reply_date = date(BACKFILL_MONTH[0], BACKFILL_MONTH[1], 31)

        updates["Date"].append([fmt_sheet(outreach_date) if outreach_date and is_empty_date(outreach_existing) else ""])
        updates["Reply Date"].append([fmt_sheet(reply_date) if reply_date and is_empty_date(reply_existing) else ""])

    return updates


def count_fills(updates: dict[str, list]) -> int:
    return sum(1 for col in updates.values() for cell in col if cell and cell[0])


def apply_updates(sheets_service, title: str, headers: list[str], updates: dict[str, list], last_row: int):
    batch = []
    for col_name, values in updates.items():
        if not any(v and v[0] for v in values):
            continue
        idx = header_index(headers, col_name)
        if idx == -1:
            continue
        letter = col_letter(idx + 1)
        batch.append({"range": a1_range(title, f"{letter}2:{letter}{last_row}"), "values": values})
    if batch:
        sheets_service.spreadsheets().values().batchUpdate(
            spreadsheetId=SPREADSHEET_ID,
            body={"valueInputOption": "USER_ENTERED", "data": batch},
        ).execute()


def ensure_notes_tab(sheets_service, dry_run: bool):
    meta = sheets_service.spreadsheets().get(
        spreadsheetId=SPREADSHEET_ID, fields="sheets(properties(sheetId,title))"
    ).execute()
    titles = {s["properties"]["title"] for s in meta.get("sheets", [])}
    note_title = "Dashboard Notes"
    body_rows = [
        ["Sales Dashboard — Data Notes"],
        [""],
        [
            f"Historical backfill: Activity dates before {REAL_DATES_FROM.strftime('%d %b %Y')} "
            f"were auto-distributed across {BACKFILL_MONTH[1]:02d}/{BACKFILL_MONTH[0]} for dashboard testing."
        ],
        [
            f"From {REAL_DATES_FROM.strftime('%d %b %Y')} onward: enter real dates in the date columns "
            "when each activity happens (Initial Email Date, Follow-up Email Date, LinkedIn Date, Reply Date)."
        ],
        [""],
        ["Do not edit formula columns: Lead ID, Assigned Employee, Category, Current Stage."],
        ["LinkedIn tabs: Date = outreach sent | Replied checkbox = person replied | Reply Date = when they replied."],
    ]
    if dry_run:
        print(f"Would write {note_title} tab ({len(body_rows)} rows)")
        return

    if note_title not in titles:
        sheets_service.spreadsheets().batchUpdate(
            spreadsheetId=SPREADSHEET_ID,
            body={"requests": [{"addSheet": {"properties": {"title": note_title, "index": 0}}}]},
        ).execute()

    sheets_service.spreadsheets().values().update(
        spreadsheetId=SPREADSHEET_ID,
        range=f"'{note_title}'!A1:A{len(body_rows)}",
        valueInputOption="RAW",
        body={"values": [[r[0]] if r else [""] for r in body_rows]},
    ).execute()

    sheet_id = next(
        s["properties"]["sheetId"]
        for s in sheets_service.spreadsheets()
        .get(spreadsheetId=SPREADSHEET_ID, fields="sheets(properties(sheetId,title))")
        .execute()["sheets"]
        if s["properties"]["title"] == note_title
    )
    sheets_service.spreadsheets().batchUpdate(
        spreadsheetId=SPREADSHEET_ID,
        body={
            "requests": [
                {
                    "repeatCell": {
                        "range": {"sheetId": sheet_id, "startRowIndex": 0, "endRowIndex": 1},
                        "cell": {
                            "userEnteredFormat": {
                                "textFormat": {"bold": True, "fontSize": 12},
                                "backgroundColor": {"red": 0.95, "green": 0.95, "blue": 0.95},
                            }
                        },
                        "fields": "userEnteredFormat(textFormat,backgroundColor)",
                    }
                },
                {
                    "updateDimensionProperties": {
                        "range": {"sheetId": sheet_id, "dimension": "COLUMNS", "startIndex": 0, "endIndex": 1},
                        "properties": {"pixelSize": 720},
                        "fields": "pixelSize",
                    }
                },
            ]
        },
    ).execute()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    dry_run = not args.apply

    creds = get_credentials()
    sheets_service = build("sheets", "v4", credentials=creds)

    meta = sheets_service.spreadsheets().get(
        spreadsheetId=SPREADSHEET_ID, fields="sheets(properties(sheetId,title,hidden))"
    ).execute()
    gid_map = {s["properties"]["sheetId"]: s["properties"]["title"] for s in meta["sheets"]}

    print(f"Mode: {'DRY RUN' if dry_run else 'APPLY'}")
    print(f"Backfill month: {BACKFILL_MONTH[0]}-{BACKFILL_MONTH[1]:02d} ({len(weekday_slots(*BACKFILL_MONTH))} weekdays)")

    total = 0
    for gid in list(LEAD_GIDS) + list(LINKEDIN_GIDS):
        title = gid_map.get(gid)
        if not title:
            continue
        headers, data = load_sheet(sheets_service, title)
        if gid in LEAD_GIDS:
            updates = plan_lead_sheet(headers, data)
        else:
            updates = plan_linkedin_sheet(headers, data)
        fills = count_fills(updates)
        total += fills
        print(f"  {title}: {fills} date cells to fill")
        if not dry_run and fills:
            apply_updates(sheets_service, title, headers, updates, len(data) + 1)

    ensure_notes_tab(sheets_service, dry_run)
    if not dry_run:
        print("Dashboard Notes tab updated.")
    print(f"Total date cells: {total}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
