#!/usr/bin/env python3
"""Normalize the Vectorise operational Google Sheets without deleting lead data.

Creates a Drive backup copy first, then:
  - aligns inconsistent headers
  - appends dashboard columns
  - tidies status labels
  - writes ARRAYFORMULA values for Lead ID / Employee / Category / Current Stage

Auth (either):
  credentials/google-service-account.json  (share the spreadsheet with the SA as Editor)
  credentials/client_secret.json           (OAuth desktop client; opens a browser)

Usage:
  python scripts/normalize_google_sheets.py --dry-run
  python scripts/normalize_google_sheets.py --apply
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

from google.oauth2 import service_account
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SPREADSHEET_ID = "1WyXufFOy6Q37oEoyf6a5C7Yk46SzYGjDqXOhj9OKzVI"
SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]

ROOT = Path(__file__).resolve().parents[1]
CRED_DIR = ROOT / "credentials"
SA_CANDIDATES = [
    CRED_DIR / "google-service-account.json",
    CRED_DIR / "google service account.json",
]
OAUTH_CLIENT_PATH = CRED_DIR / "client_secret.json"
TOKEN_PATH = CRED_DIR / "token.json"

LEAD_SHEETS = {
    992533385: {"employee": "Dawood", "category": "Automation", "prefix": "AUT"},
    826591238: {"employee": "Dawood", "category": "Logistics", "prefix": "LOG"},
    573785750: {"employee": "Hanya", "category": "Financial Automation", "prefix": "FIN"},
    535737061: {"employee": "Hanya", "category": "AI Governance", "prefix": "AIG"},
    1744199364: {"employee": "Hanya", "category": "Voice Agents", "prefix": "VOI"},
}

LINKEDIN_SHEETS = {
    1177486258: {"employee": "Dawood", "category": "LinkedIn Outreach", "prefix": "LID"},
    351206880: {"employee": "Hanya", "category": "LinkedIn Outreach", "prefix": "LIH"},
}

LEAD_HEADER_ALIASES = {
    "first name": "First Name",
    "last name": "Last Name",
    "company name": "Company Name",
    "account": "Account",
    "role": "Title",
    "title": "Title",
    "departments": "Departments",
    "emails": "Email",
    "email": "Email",
    "corporate phone": "Corporate Phone",
    "industry": "Industry",
    "person linkedin url": "Person Linkedin Url",
    "company linkedin url": "Company Linkedin Url",
    "website": "Website",
    "twitter url": "Twitter Url",
    "facebook url": "Facebook Url",
    "company address": "Company Address",
    "annual revenue": "Annual Revenue",
    "initial email": "Initial Email",
    "follow-up email": "Follow-up Email",
    "email follow-up": "Follow-up Email",
    "linkedin follow-up": "LinkedIn Follow-up",
    "notes": "Notes",
    "custom_email_body": "Custom Email Body",
    "custom email body": "Custom Email Body",
    "follow-uemail content": "Custom Email Body",
}

NEW_LEAD_COLUMNS = [
    "Lead ID",
    "Assigned Employee",
    "Category",
    "Current Stage",
    "Initial Email Date",
    "Follow-up Email Date",
    "LinkedIn Date",
    "Reply Status",
    "Reply Date",
    "Meeting Status",
    "Meeting Date",
    "Opportunity Status",
    "Next Follow-up Date",
    "Custom Email Body",
]

STATUS_MAP = {
    "respnded": "Replied",
    "responded": "Replied",
    "not sent": "Not sent",
    "sent": "Sent",
    "follow-up sent": "Follow-up sent",
    "follow-up required": "Follow-up required",
    "no response": "No response",
}


def col_letter(n: int) -> str:
    s = ""
    while n > 0:
        n, rem = divmod(n - 1, 26)
        s = chr(65 + rem) + s
    return s


def a1_range(title: str, cell: str) -> str:
    escaped = title.replace("'", "''")
    return f"'{escaped}'!{cell}"


def sa_path() -> Path | None:
    for path in SA_CANDIDATES:
        if path.exists():
            return path
    return None


def get_credentials():
    key_path = sa_path()
    if key_path:
        return service_account.Credentials.from_service_account_file(str(key_path), scopes=SCOPES)
    if TOKEN_PATH.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_PATH), SCOPES)
        if creds and creds.valid:
            return creds
    if OAUTH_CLIENT_PATH.exists():
        flow = InstalledAppFlow.from_client_secrets_file(str(OAUTH_CLIENT_PATH), SCOPES)
        creds = flow.run_local_server(port=0)
        CRED_DIR.mkdir(exist_ok=True)
        TOKEN_PATH.write_text(creds.to_json(), encoding="utf-8")
        return creds
    raise FileNotFoundError(
        "No Google credentials found.\n"
        f"Put a service account JSON at:\n  {SA_CANDIDATES[0]}\n"
        "and share the spreadsheet with that service account as Editor.\n"
        "Or put an OAuth desktop client JSON at:\n"
        f"  {OAUTH_CLIENT_PATH}"
    )


def sheets_by_gid(sheets_service):
    meta = (
        sheets_service.spreadsheets()
        .get(spreadsheetId=SPREADSHEET_ID, fields="sheets(properties(sheetId,title))")
        .execute()
    )
    return {s["properties"]["sheetId"]: s["properties"]["title"] for s in meta.get("sheets", [])}


def get_grid(sheets_service, title: str) -> list[list[str]]:
    result = (
        sheets_service.spreadsheets()
        .values()
        .get(spreadsheetId=SPREADSHEET_ID, range=a1_range(title, "A:ZZ"), majorDimension="ROWS")
        .execute()
    )
    return result.get("values", [])


def fingerprint(rows: list[list[str]]) -> dict:
    nonempty = [r for r in rows[1:] if any(str(c).strip() for c in r)] if rows else []
    payload = json.dumps([r[:3] for r in nonempty], ensure_ascii=False).encode("utf-8")
    return {
        "data_rows": len(nonempty),
        "header_count": len(rows[0]) if rows else 0,
        "row_hash": hashlib.sha256(payload).hexdigest()[:12],
    }


def header_index(headers: list[str], name: str) -> int:
    target = name.lower()
    for i, h in enumerate(headers):
        if str(h).strip().lower() == target:
            return i
    return -1


def planned_header_changes(headers: list[str], extra_required: list[str]) -> dict:
    renamed = []
    new_headers = list(headers)
    for i, raw in enumerate(headers):
        key = str(raw).strip().lower()
        canonical = LEAD_HEADER_ALIASES.get(key)
        if canonical and canonical != str(raw).strip():
            renamed.append({"from": raw, "to": canonical, "col": i + 1})
            new_headers[i] = canonical
    appended = []
    existing = {str(h).strip().lower() for h in new_headers}
    for name in extra_required:
        if name.lower() not in existing:
            appended.append(name)
            new_headers.append(name)
            existing.add(name.lower())
    return {"renamed": renamed, "appended": appended, "headers_after": new_headers}


def backup_tabs_in_place(sheets_service, gid_map: dict[int, str]) -> list[str]:
    from datetime import datetime

    stamp = datetime.now().strftime("%Y-%m-%d %H-%M")
    requests = []
    for gid in list(LEAD_SHEETS) + list(LINKEDIN_SHEETS):
        title = gid_map.get(gid)
        if not title:
            continue
        new_name = f"BACKUP {title} {stamp}"[:99]
        requests.append({
            "duplicateSheet": {
                "sourceSheetId": gid,
                "newSheetName": new_name,
            }
        })
    resp = (
        sheets_service.spreadsheets()
        .batchUpdate(spreadsheetId=SPREADSHEET_ID, body={"requests": requests})
        .execute()
    )
    hide = []
    names = []
    for reply in resp.get("replies", []):
        props = reply.get("duplicateSheet", {}).get("properties", {})
        names.append(props.get("title"))
        if props.get("sheetId") is not None:
            hide.append({
                "updateSheetProperties": {
                    "properties": {"sheetId": props["sheetId"], "hidden": True},
                    "fields": "hidden",
                }
            })
    if hide:
        sheets_service.spreadsheets().batchUpdate(
            spreadsheetId=SPREADSHEET_ID, body={"requests": hide}
        ).execute()
    return names


def values_update(sheets_service, data: list[dict]):
    if not data:
        return
    sheets_service.spreadsheets().values().batchUpdate(
        spreadsheetId=SPREADSHEET_ID,
        body={"valueInputOption": "USER_ENTERED", "data": data},
    ).execute()


def apply_lead_sheet(sheets_service, title: str, meta: dict, dry_run: bool) -> dict:
    rows = get_grid(sheets_service, title)
    headers = [str(h).strip() for h in (rows[0] if rows else [])]
    before = fingerprint(rows)
    plan = planned_header_changes(headers, NEW_LEAD_COLUMNS)
    if dry_run:
        return {"sheet": title, "before": before, "plan": plan, "applied": False}

    updates = []
    for item in plan["renamed"]:
        updates.append({"range": a1_range(title, f"{col_letter(item['col'])}1"), "values": [[item["to"]]]})

    start_col = len(plan["headers_after"]) - len(plan["appended"]) + 1
    for offset, name in enumerate(plan["appended"]):
        updates.append({
            "range": a1_range(title, f"{col_letter(start_col + offset)}1"),
            "values": [[name]],
        })
    values_update(sheets_service, updates)

    rows = get_grid(sheets_service, title)
    headers = [str(h).strip() for h in rows[0]]
    data_rows = rows[1:]
    last_row = max(len(rows), 2)

    def col_values(name: str) -> list[str]:
        idx = header_index(headers, name)
        if idx == -1:
            return [""] * len(data_rows)
        out = []
        for r in data_rows:
            out.append(str(r[idx]).strip() if idx < len(r) else "")
        return out

    def write_column(name: str, values: list):
        idx = header_index(headers, name)
        if idx == -1:
            return
        letter = col_letter(idx + 1)
        values_update(
            sheets_service,
            [{"range": a1_range(title, f"{letter}2:{letter}{last_row}"), "values": [[v] for v in values]}],
        )

    init_vals = []
    for raw in col_values("Initial Email"):
        mapped = STATUS_MAP.get(raw.lower(), raw) if raw else ""
        init_vals.append(mapped)
    follow_vals = []
    for raw in col_values("Follow-up Email"):
        if not raw:
            follow_vals.append("")
            continue
        mapped = STATUS_MAP.get(raw.lower(), raw)
        if mapped == "Sent":
            mapped = "Follow-up sent"
        follow_vals.append(mapped)
    li_vals = []
    for raw in col_values("LinkedIn Follow-up"):
        li_vals.append(STATUS_MAP.get(raw.lower(), raw) if raw else "")

    write_column("Initial Email", init_vals)
    write_column("Follow-up Email", follow_vals)
    write_column("LinkedIn Follow-up", li_vals)

    notes = col_values("Notes")
    bodies = col_values("Custom Email Body")
    new_bodies = []
    for note, body in zip(notes, bodies):
        if not body and note.lower().startswith("hi "):
            new_bodies.append(note)
        else:
            new_bodies.append(body)
    write_column("Custom Email Body", new_bodies)

    reply_vals = col_values("Reply Status")
    seeded = []
    for i, existing in enumerate(reply_vals):
        if existing:
            seeded.append(existing)
            continue
        blob = f"{init_vals[i]} {follow_vals[i]} {li_vals[i]}".lower()
        seeded.append("Replied" if "repl" in blob else "")
    write_column("Reply Status", seeded)

    first = col_letter(header_index(headers, "First Name") + 1)
    init = col_letter(header_index(headers, "Initial Email") + 1)
    follow = col_letter(header_index(headers, "Follow-up Email") + 1)
    li = col_letter(header_index(headers, "LinkedIn Follow-up") + 1)
    reply = col_letter(header_index(headers, "Reply Status") + 1)

    formula_updates = [
        {
            "range": a1_range(title, f"{col_letter(header_index(headers, 'Lead ID') + 1)}2"),
            "values": [[
                f'=ARRAYFORMULA(IF({first}2:{first}="","","{meta["prefix"]}-"&TEXT(ROW({first}2:{first})-1,"0000")))'
            ]],
        },
        {
            "range": a1_range(title, f"{col_letter(header_index(headers, 'Assigned Employee') + 1)}2"),
            "values": [[f'=ARRAYFORMULA(IF({first}2:{first}="","","{meta["employee"]}"))']],
        },
        {
            "range": a1_range(title, f"{col_letter(header_index(headers, 'Category') + 1)}2"),
            "values": [[f'=ARRAYFORMULA(IF({first}2:{first}="","","{meta["category"]}"))']],
        },
        {
            "range": a1_range(title, f"{col_letter(header_index(headers, 'Current Stage') + 1)}2"),
            "values": [[
                f'=ARRAYFORMULA(IF({first}2:{first}="","",'
                f'IF(REGEXMATCH(LOWER({reply}2:{reply}&{init}2:{init}&{follow}2:{follow}&{li}2:{li}),"repl"),"Replied",'
                f'IF(LEN(TRIM({li}2:{li}))>0,"LinkedIn Follow-up",'
                f'IF(REGEXMATCH(LOWER({follow}2:{follow}),"sent|required"),"Follow-up",'
                f'IF(REGEXMATCH(LOWER({init}2:{init}),"sent"),"Initial Email","Not Contacted"))))))'
            ]],
        },
    ]
    values_update(sheets_service, formula_updates)

    after_rows = get_grid(sheets_service, title)
    after = fingerprint(after_rows)
    return {"sheet": title, "before": before, "after": after, "plan": plan, "applied": True}


def apply_linkedin_sheet(sheets_service, title: str, meta: dict, dry_run: bool) -> dict:
    rows = get_grid(sheets_service, title)
    headers = [str(h).strip() for h in (rows[0] if rows else [])]
    before = fingerprint(rows)
    required = ["Website", "Lead ID", "Assigned Employee", "Category", "Current Stage", "Reply Date"]
    plan = planned_header_changes(headers, required)
    if dry_run:
        return {"sheet": title, "before": before, "plan": plan, "applied": False}

    updates = []
    start_col = len(plan["headers_after"]) - len(plan["appended"]) + 1
    for offset, name in enumerate(plan["appended"]):
        updates.append({
            "range": a1_range(title, f"{col_letter(start_col + offset)}1"),
            "values": [[name]],
        })
    values_update(sheets_service, updates)

    rows = get_grid(sheets_service, title)
    headers = [str(h).strip() for h in rows[0]]
    first = col_letter(header_index(headers, "First Name") + 1)
    date_col = header_index(headers, "Date")
    replied_col = header_index(headers, "Replied")
    if replied_col == -1:
        replied_col = header_index(headers, "Reached")
    date = col_letter(date_col + 1)
    replied = col_letter(replied_col + 1)
    values_update(
        sheets_service,
        [
            {
                "range": a1_range(title, f"{col_letter(header_index(headers, 'Lead ID') + 1)}2"),
                "values": [[
                    f'=ARRAYFORMULA(IF({first}2:{first}="","","{meta["prefix"]}-"&TEXT(ROW({first}2:{first})-1,"0000")))'
                ]],
            },
            {
                "range": a1_range(title, f"{col_letter(header_index(headers, 'Assigned Employee') + 1)}2"),
                "values": [[f'=ARRAYFORMULA(IF({first}2:{first}="","","{meta["employee"]}"))']],
            },
            {
                "range": a1_range(title, f"{col_letter(header_index(headers, 'Category') + 1)}2"),
                "values": [[f'=ARRAYFORMULA(IF({first}2:{first}="","","{meta["category"]}"))']],
            },
            {
                "range": a1_range(title, f"{col_letter(header_index(headers, 'Current Stage') + 1)}2"),
                "values": [[
                    f'=ARRAYFORMULA(IF({first}2:{first}="","",'
                    f'IF({replied}2:{replied}=TRUE,"Replied",'
                    f'IF(LEN(TRIM({date}2:{date}))>0,"Awaiting Reply","Not Contacted"))))'
                ]],
            },
        ],
    )
    after = fingerprint(get_grid(sheets_service, title))
    return {"sheet": title, "before": before, "after": after, "plan": plan, "applied": True}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Write changes (default is dry-run)")
    parser.add_argument("--dry-run", action="store_true", help="Preview only")
    args = parser.parse_args()
    dry_run = not args.apply

    try:
        creds = get_credentials()
    except FileNotFoundError as exc:
        print(str(exc))
        return 2

    sheets_service = build("sheets", "v4", credentials=creds)
    gid_map = sheets_by_gid(sheets_service)
    title_meta = (
        sheets_service.spreadsheets()
        .get(spreadsheetId=SPREADSHEET_ID, fields="properties.title")
        .execute()
    )
    ss_title = title_meta["properties"]["title"]

    print(f"Spreadsheet: {ss_title}")
    print(f"Mode: {'DRY RUN' if dry_run else 'APPLY'}")

    if not dry_run:
        backup_names = backup_tabs_in_place(sheets_service, gid_map)
        print("Hidden backup tabs:")
        for name in backup_names:
            print(f"  - {name}")

    reports = []
    for gid, meta in LEAD_SHEETS.items():
        title = gid_map.get(gid)
        if not title:
            reports.append({"sheet": f"MISSING gid {gid}", "applied": False})
            continue
        reports.append(apply_lead_sheet(sheets_service, title, meta, dry_run))
    for gid, meta in LINKEDIN_SHEETS.items():
        title = gid_map.get(gid)
        if not title:
            reports.append({"sheet": f"MISSING gid {gid}", "applied": False})
            continue
        reports.append(apply_linkedin_sheet(sheets_service, title, meta, dry_run))

    for report in reports:
        print("=" * 72)
        print(report["sheet"])
        print("before:", report.get("before"))
        if report.get("after"):
            print("after:", report["after"])
            if report["before"]["data_rows"] != report["after"]["data_rows"]:
                print("WARNING: row count changed")
            if report["before"]["row_hash"] != report["after"]["row_hash"]:
                print("WARNING: first-three-column hash changed")
        plan = report.get("plan", {})
        print("renamed:", plan.get("renamed"))
        print("appended:", plan.get("appended"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
