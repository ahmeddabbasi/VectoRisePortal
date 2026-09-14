#!/usr/bin/env python3
"""Apply conditional formatting for Current Stage and reply rows."""

from __future__ import annotations

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

LIVE_GIDS = {
    992533385,
    826591238,
    573785750,
    535737061,
    1744199364,
    1177486258,
    351206880,
}

STAGE_RULES = [
    ("Replied", {"red": 0.85, "green": 0.95, "blue": 0.85}),
    ("Awaiting Reply", {"red": 1.0, "green": 0.93, "blue": 0.8}),
    ("Follow-up", {"red": 1.0, "green": 0.95, "blue": 0.8}),
    ("Initial Email", {"red": 0.89, "green": 0.93, "blue": 1.0}),
    ("Not Contacted", {"red": 0.95, "green": 0.95, "blue": 0.95}),
]


def col_letter(n: int) -> str:
    s = ""
    while n > 0:
        n, rem = divmod(n - 1, 26)
        s = chr(65 + rem) + s
    return s


def get_credentials():
    key = next(p for p in SA_CANDIDATES if p.exists())
    return service_account.Credentials.from_service_account_file(str(key), scopes=SCOPES)


def header_index(headers: list[str], name: str) -> int:
    target = name.lower()
    for i, h in enumerate(headers):
        if str(h).strip().lower() == target:
            return i
    return -1


def get_headers(sheets_service, title: str) -> list[str]:
    escaped = title.replace("'", "''")
    result = (
        sheets_service.spreadsheets()
        .values()
        .get(spreadsheetId=SPREADSHEET_ID, range=f"'{escaped}'!1:1")
        .execute()
    )
    return [str(h).strip() for h in result.get("values", [[]])[0]]


def main():
    creds = get_credentials()
    sheets_service = build("sheets", "v4", credentials=creds)
    meta = sheets_service.spreadsheets().get(
        spreadsheetId=SPREADSHEET_ID, fields="sheets(properties(sheetId,title,hidden))"
    ).execute()

    for sheet in meta["sheets"]:
        props = sheet["properties"]
        if props.get("hidden") or props["sheetId"] not in LIVE_GIDS:
            continue
        title = props["title"]
        escaped = title.replace("'", "''")
        headers = get_headers(sheets_service, title)
        stage_idx = header_index(headers, "Current Stage")
        reply_idx = header_index(headers, "Reply Date")
        if stage_idx == -1:
            continue

        row_count = max(
            len(
                sheets_service.spreadsheets()
                .values()
                .get(spreadsheetId=SPREADSHEET_ID, range=f"'{escaped}'!A:A")
                .execute()
                .get("values", [])
            ),
            2,
        )

        requests = []
        for label, color in STAGE_RULES:
            requests.append(
                {
                    "addConditionalFormatRule": {
                        "rule": {
                            "ranges": [
                                {
                                    "sheetId": props["sheetId"],
                                    "startRowIndex": 1,
                                    "endRowIndex": row_count,
                                    "startColumnIndex": stage_idx,
                                    "endColumnIndex": stage_idx + 1,
                                }
                            ],
                            "booleanRule": {
                                "condition": {
                                    "type": "TEXT_CONTAINS",
                                    "values": [{"userEnteredValue": label}],
                                },
                                "format": {"backgroundColor": color},
                            },
                        },
                        "index": 0,
                    }
                }
            )

        if reply_idx != -1:
            col = col_letter(reply_idx + 1)
            requests.append(
                {
                    "addConditionalFormatRule": {
                        "rule": {
                            "ranges": [
                                {
                                    "sheetId": props["sheetId"],
                                    "startRowIndex": 1,
                                    "endRowIndex": row_count,
                                    "startColumnIndex": reply_idx,
                                    "endColumnIndex": reply_idx + 1,
                                }
                            ],
                            "booleanRule": {
                                "condition": {
                                    "type": "NOT_BLANK",
                                },
                                "format": {
                                    "backgroundColor": {"red": 0.72, "green": 0.88, "blue": 0.72},
                                    "textFormat": {"bold": True},
                                },
                            },
                        },
                        "index": 0,
                    }
                }
            )

        sheets_service.spreadsheets().batchUpdate(
            spreadsheetId=SPREADSHEET_ID, body={"requests": requests}
        ).execute()
        print(f"Styled: {title}")


if __name__ == "__main__":
    main()
