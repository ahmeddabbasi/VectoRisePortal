#!/usr/bin/env python3
"""Fix sheet visuals and LinkedIn Reached semantics on Vectorise Leads."""

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

LEAD_HEADER_BG = {"red": 0.73333335, "green": 0.27450982, "blue": 0.23529412}
LINKEDIN_HEADER_BG = {"red": 0.20784314, "green": 0.40784314, "blue": 0.32941177}
WHITE = {"red": 1, "green": 1, "blue": 1}
BODY_TEXT = {"red": 0.2627451, "green": 0.2627451, "blue": 0.2627451}

LEAD_WRAP_HEADERS = {
    "Account",
    "Initial Email",
    "Follow-up Email",
    "LinkedIn Follow-up",
    "Notes",
    "Reply Status",
    "Meeting Status",
    "Opportunity Status",
    "Current Stage",
    "Next Follow-up Date",
}

LEAD_DATE_HEADERS = {
    "Initial Email Date",
    "Follow-up Email Date",
    "LinkedIn Date",
    "Reply Date",
    "Meeting Date",
    "Next Follow-up Date",
}

LEAD_COLUMN_WIDTHS = {
    "Lead ID": 95,
    "Assigned Employee": 135,
    "Category": 165,
    "Current Stage": 135,
    "Initial Email Date": 125,
    "Follow-up Email Date": 125,
    "LinkedIn Date": 115,
    "Reply Status": 115,
    "Reply Date": 115,
    "Meeting Status": 125,
    "Meeting Date": 115,
    "Opportunity Status": 135,
    "Next Follow-up Date": 135,
    "Custom Email Body": 541,
}

LINKEDIN_COLUMN_WIDTHS = {
    "Website": 180,
    "Lead ID": 95,
    "Assigned Employee": 120,
    "Category": 150,
    "Current Stage": 130,
    "Reply Date": 115,
}


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
    escaped = title.replace("'", "''")
    return f"'{escaped}'!{cell}"


def header_index(headers: list[str], name: str) -> int:
    target = name.lower()
    for i, h in enumerate(headers):
        if str(h).strip().lower() == target:
            return i
    return -1


def get_sheet_meta(sheets_service):
    return sheets_service.spreadsheets().get(
        spreadsheetId=SPREADSHEET_ID,
        fields="sheets(properties(sheetId,title,hidden,gridProperties(frozenRowCount)),data(columnMetadata(pixelSize)))",
        includeGridData=True,
    ).execute()


def get_headers(sheets_service, title: str) -> list[str]:
    result = (
        sheets_service.spreadsheets()
        .values()
        .get(spreadsheetId=SPREADSHEET_ID, range=a1_range(title, "1:1"))
        .execute()
    )
    return [str(h).strip() for h in result.get("values", [[]])[0]]


def linkedin_stage_formula(headers: list[str]) -> str:
    first = col_letter(header_index(headers, "First Name") + 1)
    date_col = header_index(headers, "Date")
    replied_col = header_index(headers, "Replied")
    if replied_col == -1:
        replied_col = header_index(headers, "Reached")
    date = col_letter(date_col + 1)
    replied = col_letter(replied_col + 1)
    return (
        f'=ARRAYFORMULA(IF({first}2:{first}="","",'
        f'IF({replied}2:{replied}=TRUE,"Replied",'
        f'IF(LEN(TRIM({date}2:{date}))>0,"Awaiting Reply","Not Contacted"))))'
    )


def header_format(is_linkedin: bool, header_name: str) -> dict:
    wrap = "WRAP" if header_name in LEAD_WRAP_HEADERS else "CLIP"
    align = "CENTER" if is_linkedin else "LEFT"
    return {
        "backgroundColor": LINKEDIN_HEADER_BG if is_linkedin else LEAD_HEADER_BG,
        "horizontalAlignment": align,
        "verticalAlignment": "MIDDLE",
        "wrapStrategy": wrap,
        "textFormat": {
            "foregroundColor": WHITE,
            "fontFamily": "Roboto",
            "fontSize": 10,
            "bold": False,
        },
    }


def body_format(is_linkedin: bool) -> dict:
    return {
        "backgroundColor": WHITE,
        "horizontalAlignment": "CENTER" if is_linkedin else "LEFT",
        "verticalAlignment": "MIDDLE",
        "wrapStrategy": "CLIP",
        "textFormat": {
            "foregroundColor": BODY_TEXT,
            "fontFamily": "Roboto",
            "fontSize": 10,
            "bold": False,
        },
    }


def rename_headers(sheets_service, title: str, mapping: dict[str, str]):
    headers = get_headers(sheets_service, title)
    updates = []
    for old, new in mapping.items():
        idx = header_index(headers, old)
        if idx == -1:
            continue
        updates.append({"range": a1_range(title, f"{col_letter(idx + 1)}1"), "values": [[new]]})
    if updates:
        sheets_service.spreadsheets().values().batchUpdate(
            spreadsheetId=SPREADSHEET_ID,
            body={"valueInputOption": "RAW", "data": updates},
        ).execute()


def apply_linkedin_semantics(sheets_service, title: str):
    rename_headers(
        sheets_service,
        title,
        {"Reached": "Replied", "Reached Date": "Reply Date"},
    )
    headers = get_headers(sheets_service, title)
    first = col_letter(header_index(headers, "First Name") + 1)
    sheets_service.spreadsheets().values().batchUpdate(
        spreadsheetId=SPREADSHEET_ID,
        body={
            "valueInputOption": "USER_ENTERED",
            "data": [
                {
                    "range": a1_range(title, f"{col_letter(header_index(headers, 'Current Stage') + 1)}2"),
                    "values": [[linkedin_stage_formula(headers)]],
                }
            ],
        },
    ).execute()


def style_sheet(sheets_service, sheet_id: int, title: str, is_linkedin: bool, last_row: int):
    headers = get_headers(sheets_service, title)
    last_col = len(headers)
    requests = []

    requests.append(
        {
            "updateSheetProperties": {
                "properties": {"sheetId": sheet_id, "gridProperties": {"frozenRowCount": 1}},
                "fields": "gridProperties.frozenRowCount",
            }
        }
    )

    for idx, header in enumerate(headers):
        if not header:
            continue
        width_map = LINKEDIN_COLUMN_WIDTHS if is_linkedin else LEAD_COLUMN_WIDTHS
        if header in width_map:
            requests.append(
                {
                    "updateDimensionProperties": {
                        "range": {
                            "sheetId": sheet_id,
                            "dimension": "COLUMNS",
                            "startIndex": idx,
                            "endIndex": idx + 1,
                        },
                        "properties": {"pixelSize": width_map[header]},
                        "fields": "pixelSize",
                    }
                }
            )

    requests.append(
        {
            "repeatCell": {
                "range": {
                    "sheetId": sheet_id,
                    "startRowIndex": 0,
                    "endRowIndex": 1,
                    "startColumnIndex": 0,
                    "endColumnIndex": last_col,
                },
                "cell": {"userEnteredFormat": header_format(is_linkedin, "")},
                "fields": "userEnteredFormat(backgroundColor,horizontalAlignment,verticalAlignment,wrapStrategy,textFormat)",
            }
        }
    )

    for idx, header in enumerate(headers):
        if not header:
            continue
        requests.append(
            {
                "repeatCell": {
                    "range": {
                        "sheetId": sheet_id,
                        "startRowIndex": 0,
                        "endRowIndex": 1,
                        "startColumnIndex": idx,
                        "endColumnIndex": idx + 1,
                    },
                    "cell": {"userEnteredFormat": header_format(is_linkedin, header)},
                    "fields": "userEnteredFormat(backgroundColor,horizontalAlignment,verticalAlignment,wrapStrategy,textFormat)",
                }
            }
        )

    if last_row > 1:
        requests.append(
            {
                "repeatCell": {
                    "range": {
                        "sheetId": sheet_id,
                        "startRowIndex": 1,
                        "endRowIndex": last_row,
                        "startColumnIndex": 0,
                        "endColumnIndex": last_col,
                    },
                    "cell": {"userEnteredFormat": body_format(is_linkedin)},
                    "fields": "userEnteredFormat(backgroundColor,horizontalAlignment,verticalAlignment,wrapStrategy,textFormat)",
                }
            }
        )

    replied_idx = header_index(headers, "Replied")
    if replied_idx == -1:
        replied_idx = header_index(headers, "Reached")
    # Checkbox columns are already typed in the sheet; skip re-applying validation.

    for date_header in (["Date", "Reply Date"] if is_linkedin else list(LEAD_DATE_HEADERS)):
        idx = header_index(headers, date_header)
        if idx == -1 or last_row <= 1:
            continue
        requests.append(
            {
                "repeatCell": {
                    "range": {
                        "sheetId": sheet_id,
                        "startRowIndex": 1,
                        "endRowIndex": last_row,
                        "startColumnIndex": idx,
                        "endColumnIndex": idx + 1,
                    },
                    "cell": {"userEnteredFormat": {"numberFormat": {"type": "DATE", "pattern": "dd/mm/yyyy"}}},
                    "fields": "userEnteredFormat.numberFormat",
                }
            }
        )

    sheets_service.spreadsheets().batchUpdate(
        spreadsheetId=SPREADSHEET_ID, body={"requests": requests}
    ).execute()


def main():
    creds = get_credentials()
    sheets_service = build("sheets", "v4", credentials=creds)
    meta = get_sheet_meta(sheets_service)

    for sheet in meta["sheets"]:
        props = sheet["properties"]
        if props.get("hidden"):
            continue
        sheet_id = props["sheetId"]
        title = props["title"]
        grid = (
            sheets_service.spreadsheets()
            .values()
            .get(spreadsheetId=SPREADSHEET_ID, range=a1_range(title, "A:A"))
            .execute()
        )
        last_row = max(len(grid.get("values", [])), 1)

        if sheet_id in LINKEDIN_GIDS:
            print(f"Fixing LinkedIn semantics + styling: {title}")
            apply_linkedin_semantics(sheets_service, title)
            style_sheet(sheets_service, sheet_id, title, True, last_row)
        elif sheet_id in LEAD_GIDS:
            print(f"Styling lead sheet: {title}")
            style_sheet(sheets_service, sheet_id, title, False, last_row)

    print("Done.")


if __name__ == "__main__":
    main()
