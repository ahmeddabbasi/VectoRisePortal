/**
 * Sales dashboard sheet normalizer
 *
 * How to run:
 * 1. Open the Vectorise leads spreadsheet
 * 2. Extensions → Apps Script
 * 3. Delete any placeholder code, paste this entire file, Save
 * 4. Reload the spreadsheet
 * 5. Menu: Dashboard Setup → Backup + Normalize sheets
 * 6. Approve permissions when Google asks
 *
 * Safety:
 * - Creates a full backup copy in your Drive first
 * - Never deletes rows
 * - Never clears existing lead fields (name, email, company, etc.)
 * - Only renames header cells, appends missing columns, and tidies status labels
 * - Safe to run more than once
 */

var SPREADSHEET_ID = '1WyXufFOy6Q37oEoyf6a5C7Yk46SzYGjDqXOhj9OKzVI';

var LEAD_SHEETS = {
  992533385: { employee: 'Dawood', category: 'Automation', prefix: 'AUT' },
  826591238: { employee: 'Dawood', category: 'Logistics', prefix: 'LOG' },
  573785750: { employee: 'Hanya', category: 'Financial Automation', prefix: 'FIN' },
  535737061: { employee: 'Hanya', category: 'AI Governance', prefix: 'AIG' },
  1744199364: { employee: 'Hanya', category: 'Voice Agents', prefix: 'VOI' }
};

var LINKEDIN_SHEETS = {
  1177486258: { employee: 'Dawood', category: 'LinkedIn Outreach', prefix: 'LID' },
  351206880: { employee: 'Hanya', category: 'LinkedIn Outreach', prefix: 'LIH' }
};

var LEAD_HEADER_ALIASES = {
  'first name': 'First Name',
  'last name': 'Last Name',
  'company name': 'Company Name',
  'account': 'Account',
  'role': 'Title',
  'title': 'Title',
  'departments': 'Departments',
  'emails': 'Email',
  'email': 'Email',
  'corporate phone': 'Corporate Phone',
  'industry': 'Industry',
  'person linkedin url': 'Person Linkedin Url',
  'company linkedin url': 'Company Linkedin Url',
  'website': 'Website',
  'twitter url': 'Twitter Url',
  'facebook url': 'Facebook Url',
  'company address': 'Company Address',
  'annual revenue': 'Annual Revenue',
  'initial email': 'Initial Email',
  'follow-up email': 'Follow-up Email',
  'email follow-up': 'Follow-up Email',
  'linkedin follow-up': 'LinkedIn Follow-up',
  'notes': 'Notes',
  'custom_email_body': 'Custom Email Body',
  'custom email body': 'Custom Email Body',
  'follow-uemail content': 'Custom Email Body',
  'reached': 'Replied',
  'reached date': 'Reply Date'
};

var NEW_LEAD_COLUMNS = [
  'Lead ID',
  'Assigned Employee',
  'Category',
  'Current Stage',
  'Initial Email Date',
  'Follow-up Email Date',
  'LinkedIn Date',
  'Reply Status',
  'Reply Date',
  'Meeting Status',
  'Meeting Date',
  'Opportunity Status',
  'Next Follow-up Date'
];

var DATE_COLUMNS = [
  'Initial Email Date',
  'Follow-up Email Date',
  'LinkedIn Date',
  'Reply Date',
  'Meeting Date',
  'Next Follow-up Date'
];

var STATUS_MAP = {
  'respnded': 'Replied',
  'responded': 'Replied',
  'not sent': 'Not sent',
  'sent': 'Sent',
  'follow-up sent': 'Follow-up sent',
  'follow-up required': 'Follow-up required',
  'no response': 'No response'
};

var NEW_HEADER_BG = '#FFF2CC';
var RENAMED_HEADER_BG = '#D9EAD3';

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Dashboard Setup')
    .addItem('Backup + Normalize sheets', 'runNormalize')
    .addToUi();
}

function runNormalize() {
  var ui = SpreadsheetApp.getUi();
  var confirm = ui.alert(
    'Backup + Normalize',
    'This will:\n\n' +
      '1. Create a full backup copy in your Drive\n' +
      '2. Rename inconsistent headers\n' +
      '3. Add dashboard columns (dates, stage, employee, category)\n' +
      '4. Tidy status labels (e.g. Respnded → Replied)\n\n' +
      'Existing lead rows will not be deleted.',
    ui.ButtonSet.OK_CANCEL
  );
  if (confirm !== ui.Button.OK) {
    return;
  }

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var backup = ss.copy(
    'BACKUP - ' +
      ss.getName() +
      ' - ' +
      Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone() || 'GMT', 'yyyy-MM-dd HH-mm')
  );

  var report = [];
  report.push('Backup: ' + backup.getUrl());

  Object.keys(LEAD_SHEETS).forEach(function (gid) {
    var sheet = getSheetByGid_(ss, Number(gid));
    if (!sheet) {
      report.push('MISSING lead tab gid ' + gid);
      return;
    }
    report.push(normalizeLeadSheet_(sheet, LEAD_SHEETS[gid]));
  });

  Object.keys(LINKEDIN_SHEETS).forEach(function (gid) {
    var sheet = getSheetByGid_(ss, Number(gid));
    if (!sheet) {
      report.push('MISSING LinkedIn tab gid ' + gid);
      return;
    }
    report.push(normalizeLinkedInSheet_(sheet, LINKEDIN_SHEETS[gid]));
  });

  ui.alert('Normalization complete', report.join('\n\n'), ui.ButtonSet.OK);
}

function getSheetByGid_(ss, gid) {
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() === gid) {
      return sheets[i];
    }
  }
  return null;
}

function normalizeLeadSheet_(sheet, meta) {
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var renamed = [];

  for (var i = 0; i < headers.length; i++) {
    var raw = String(headers[i] || '').trim();
    if (!raw) continue;
    var canonical = LEAD_HEADER_ALIASES[raw.toLowerCase()];
    if (canonical && canonical !== raw) {
      sheet.getRange(1, i + 1).setValue(canonical).setBackground(RENAMED_HEADER_BG);
      headers[i] = canonical;
      renamed.push(raw + ' → ' + canonical);
    }
  }

  NEW_LEAD_COLUMNS.concat(['Custom Email Body']).forEach(function (name) {
    if (headerIndex_(headers, name) === -1) {
      lastCol += 1;
      sheet.getRange(1, lastCol).setValue(name).setBackground(NEW_HEADER_BG);
      headers[lastCol - 1] = name;
    }
  });

  headers = refreshHeaders_(sheet);
  var lastRow = Math.max(sheet.getLastRow(), 2);
  var dataRows = lastRow - 1;

  copyVoiceEmailBodies_(sheet, headers, lastRow);

  normalizeStatusColumn_(sheet, headers, 'Initial Email', dataRows, 'initial');
  normalizeStatusColumn_(sheet, headers, 'Follow-up Email', dataRows, 'followup');
  normalizeStatusColumn_(sheet, headers, 'LinkedIn Follow-up', dataRows, 'linkedin');
  seedReplyStatus_(sheet, headers, lastRow);

  writeArrayFormula_(sheet, headers, 'Lead ID', leadIdFormula_(headers, meta.prefix));
  writeArrayFormula_(sheet, headers, 'Assigned Employee', constantFormula_(headers, meta.employee));
  writeArrayFormula_(sheet, headers, 'Category', constantFormula_(headers, meta.category));
  writeArrayFormula_(sheet, headers, 'Current Stage', currentStageFormula_(headers));

  applyLeadValidations_(sheet, headers, lastRow);
  formatDateColumns_(sheet, headers, lastRow);
  sheet.setFrozenRows(1);

  return sheet.getName() +
    '\nRenamed: ' + (renamed.length ? renamed.join(', ') : 'none') +
    '\nRows kept: ' + dataRows;
}

function normalizeLinkedInSheet_(sheet, meta) {
  var headers = refreshHeaders_(sheet);
  var sourceIdx = headerIndex_(headers, 'Source');
  if (headerIndex_(headers, 'Website') === -1 && sourceIdx !== -1) {
    sheet.insertColumnAfter(sourceIdx + 1);
    sheet.getRange(1, sourceIdx + 2).setValue('Website').setBackground(NEW_HEADER_BG);
  }

  headers = refreshHeaders_(sheet);
  var renamed = [];
  for (var i = 0; i < headers.length; i++) {
    var raw = String(headers[i] || '').trim();
    var canonical = LEAD_HEADER_ALIASES[raw.toLowerCase()] || raw;
    if (canonical && canonical !== raw && LEAD_HEADER_ALIASES[raw.toLowerCase()]) {
      sheet.getRange(1, i + 1).setValue(canonical).setBackground(RENAMED_HEADER_BG);
      renamed.push(raw + ' → ' + canonical);
    }
  }

  ['Lead ID', 'Assigned Employee', 'Category', 'Current Stage', 'Reply Date'].forEach(function (name) {
    if (headerIndex_(refreshHeaders_(sheet), name) === -1) {
      var col = sheet.getLastColumn() + 1;
      sheet.getRange(1, col).setValue(name).setBackground(NEW_HEADER_BG);
    }
  });

  headers = refreshHeaders_(sheet);
  var lastRow = Math.max(sheet.getLastRow(), 2);
  var dataRows = lastRow - 1;

  writeArrayFormula_(sheet, headers, 'Lead ID', leadIdFormula_(headers, meta.prefix));
  writeArrayFormula_(sheet, headers, 'Assigned Employee', constantFormula_(headers, meta.employee));
  writeArrayFormula_(sheet, headers, 'Category', constantFormula_(headers, meta.category));
  writeArrayFormula_(sheet, headers, 'Current Stage', linkedInStageFormula_(headers));

  var repliedCol = headerIndex_(headers, 'Replied') + 1;
  if (repliedCol > 0 && dataRows > 0) {
    sheet.getRange(2, repliedCol, dataRows, 1).setDataValidation(
      SpreadsheetApp.newDataValidation()
        .requireCheckbox()
        .build()
    );
  }

  formatDateColumns_(sheet, headers, lastRow);
  sheet.setFrozenRows(1);

  return sheet.getName() +
    '\nRenamed: ' + (renamed.length ? renamed.join(', ') : 'none') +
    '\nRows kept: ' + dataRows;
}

function copyVoiceEmailBodies_(sheet, headers, lastRow) {
  var notesIdx = headerIndex_(headers, 'Notes');
  var bodyIdx = headerIndex_(headers, 'Custom Email Body');
  if (notesIdx === -1 || bodyIdx === -1 || lastRow < 2) return;

  var notes = sheet.getRange(2, notesIdx + 1, lastRow - 1, 1).getValues();
  var bodies = sheet.getRange(2, bodyIdx + 1, lastRow - 1, 1).getValues();
  var changed = false;
  for (var i = 0; i < notes.length; i++) {
    var note = String(notes[i][0] || '');
    var body = String(bodies[i][0] || '');
    if (!body && /^Hi\s/i.test(note)) {
      bodies[i][0] = note;
      changed = true;
    }
  }
  if (changed) {
    sheet.getRange(2, bodyIdx + 1, bodies.length, 1).setValues(bodies);
  }
}

function normalizeStatusColumn_(sheet, headers, headerName, dataRows, kind) {
  var idx = headerIndex_(headers, headerName);
  if (idx === -1 || dataRows < 1) return;
  var range = sheet.getRange(2, idx + 1, dataRows, 1);
  var values = range.getValues();
  for (var i = 0; i < values.length; i++) {
    var raw = String(values[i][0] || '').trim();
    if (!raw) continue;
    var mapped = STATUS_MAP[raw.toLowerCase()] || raw;
    if (kind === 'followup' && mapped === 'Sent') mapped = 'Follow-up sent';
    values[i][0] = mapped;
  }
  range.setValues(values);
}

function seedReplyStatus_(sheet, headers, lastRow) {
  var replyIdx = headerIndex_(headers, 'Reply Status');
  if (replyIdx === -1 || lastRow < 2) return;
  var init = readCol_(sheet, headers, 'Initial Email', lastRow);
  var follow = readCol_(sheet, headers, 'Follow-up Email', lastRow);
  var li = readCol_(sheet, headers, 'LinkedIn Follow-up', lastRow);
  var current = sheet.getRange(2, replyIdx + 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < current.length; i++) {
    if (String(current[i][0] || '').trim()) continue;
    var blob = (init[i] + ' ' + follow[i] + ' ' + li[i]).toLowerCase();
    if (blob.indexOf('repl') !== -1) current[i][0] = 'Replied';
  }
  sheet.getRange(2, replyIdx + 1, current.length, 1).setValues(current);
}

function readCol_(sheet, headers, name, lastRow) {
  var idx = headerIndex_(headers, name);
  if (idx === -1) return Array(lastRow - 1).fill('');
  return sheet.getRange(2, idx + 1, lastRow - 1, 1).getValues().map(function (r) {
    return String(r[0] || '');
  });
}

function applyLeadValidations_(sheet, headers, lastRow) {
  var dataRows = Math.max(lastRow - 1, 200);
  setList_(sheet, headers, 'Initial Email', dataRows, ['Sent', 'Not sent', 'Replied']);
  setList_(sheet, headers, 'Follow-up Email', dataRows, [
    'Follow-up sent', 'Not sent', 'Follow-up required', 'Replied', 'No response'
  ]);
  setList_(sheet, headers, 'LinkedIn Follow-up', dataRows, ['Sent', 'Not sent', 'Replied', 'No response']);
  setList_(sheet, headers, 'Reply Status', dataRows, ['Replied', 'No response', 'Not interested', 'Auto-reply']);
  setList_(sheet, headers, 'Meeting Status', dataRows, ['Booked', 'Completed', 'No-show']);
  setList_(sheet, headers, 'Opportunity Status', dataRows, ['Open', 'Closed Won', 'Closed Lost']);
}

function setList_(sheet, headers, name, dataRows, values) {
  var idx = headerIndex_(headers, name);
  if (idx === -1) return;
  sheet.getRange(2, idx + 1, dataRows, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(values, true).setAllowInvalid(true).build()
  );
}

function formatDateColumns_(sheet, headers, lastRow) {
  var rows = Math.max(lastRow - 1, 200);
  DATE_COLUMNS.concat(['Date', 'Reply Date']).forEach(function (name) {
    var idx = headerIndex_(headers, name);
    if (idx === -1) return;
    sheet.getRange(2, idx + 1, rows, 1).setNumberFormat('yyyy-mm-dd');
  });
}

function writeArrayFormula_(sheet, headers, name, formula) {
  var idx = headerIndex_(headers, name);
  if (idx === -1) return;
  var cell = sheet.getRange(2, idx + 1);
  var existing = String(cell.getFormula() || '');
  if (existing.indexOf('ARRAYFORMULA') === -1) {
    cell.setFormula(formula);
  }
}

function leadIdFormula_(headers, prefix) {
  var first = colLetter_(headerIndex_(headers, 'First Name') + 1);
  return '=ARRAYFORMULA(IF(' + first + '2:' + first + '="","", "' + prefix + '-" & TEXT(ROW(' + first + '2:' + first + ')-1,"0000")))';
}

function constantFormula_(headers, value) {
  var first = colLetter_(headerIndex_(headers, 'First Name') + 1);
  return '=ARRAYFORMULA(IF(' + first + '2:' + first + '="","", "' + value + '"))';
}

function currentStageFormula_(headers) {
  var first = colLetter_(headerIndex_(headers, 'First Name') + 1);
  var init = colLetter_(headerIndex_(headers, 'Initial Email') + 1);
  var follow = colLetter_(headerIndex_(headers, 'Follow-up Email') + 1);
  var li = colLetter_(headerIndex_(headers, 'LinkedIn Follow-up') + 1);
  var reply = colLetter_(headerIndex_(headers, 'Reply Status') + 1);
  return (
    '=ARRAYFORMULA(IF(' + first + '2:' + first + '="","",' +
    'IF(REGEXMATCH(LOWER(' + reply + '2:' + reply + '&' + init + '2:' + init + '&' + follow + '2:' + follow + '&' + li + '2:' + li + '),"repl"),"Replied",' +
    'IF(LEN(TRIM(' + li + '2:' + li + '))>0,"LinkedIn Follow-up",' +
    'IF(REGEXMATCH(LOWER(' + follow + '2:' + follow + '),"sent|required"),"Follow-up",' +
    'IF(REGEXMATCH(LOWER(' + init + '2:' + init + '),"sent"),"Initial Email",' +
    '"Not Contacted"))))))'
  );
}

function linkedInStageFormula_(headers) {
  var first = colLetter_(headerIndex_(headers, 'First Name') + 1);
  var date = colLetter_(headerIndex_(headers, 'Date') + 1);
  var replied = colLetter_(headerIndex_(headers, 'Replied') + 1);
  return (
    '=ARRAYFORMULA(IF(' + first + '2:' + first + '="","",' +
    'IF(' + replied + '2:' + replied + '=TRUE,"Replied",' +
    'IF(LEN(TRIM(' + date + '2:' + date + '))>0,"Awaiting Reply","Not Contacted"))))'
  );
}

function refreshHeaders_(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function (h) {
    return String(h || '').trim();
  });
}

function headerIndex_(headers, name) {
  var target = name.toLowerCase();
  for (var i = 0; i < headers.length; i++) {
    if (String(headers[i] || '').trim().toLowerCase() === target) return i;
  }
  return -1;
}

function colLetter_(n) {
  var s = '';
  while (n > 0) {
    n--;
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26);
  }
  return s;
}
