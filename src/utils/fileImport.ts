/**
 * CSV / Excel file import utility.
 * Parses uploaded files into panelist data structures.
 */

import * as XLSX from 'xlsx';
import type { CSVPanelistRow } from '../types';

// ——————————————————————————————————————
// Column name normalization
// ——————————————————————————————————————

const COLUMN_ALIASES: Record<string, string[]> = {
  'First Name': ['first_name', 'firstname', 'first name', 'fname'],
  'Full Name': ['full_name', 'fullname', 'full name', 'name'],
  'Email': ['email', 'email address', 'e-mail'],
  'Zoom Join Link': ['zoom_join_link', 'zoom link', 'zoom join', 'join link'],
  'Registration Tracking Link': ['registration_tracking_link', 'reg link', 'tracking link', 'registration link'],
  'Promotional Materials Link': ['promotional_materials_link', 'promo link', 'promotional link', 'promo materials'],
  'Questions Link': ['questions_link', 'questions', 'question link'],
  'Final Banner Link': ['final_banner_link', 'banner link', 'final banner'],
  'Question 1': ['question_1', 'q1', 'question 1'],
  'Question 2': ['question_2', 'q2', 'question 2'],
  'Question 3': ['question_3', 'q3', 'question 3'],
  'Question 4': ['question_4', 'q4', 'question 4'],
  'Question 5': ['question_5', 'q5', 'question 5'],
  'Contact Number': ['contact_number', 'phone', 'phone number', 'mobile', 'cell'],
  'Current Position and Organization': ['position', 'title', 'role', 'job title', 'position and organization', 'title and org'],
  'Short Bio': ['bio', 'short bio', 'biography', 'about'],
};

function normalizeColumnName(raw: string): string {
  const lower = raw.trim().toLowerCase().replace(/[_\-]/g, ' ');

  for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (lower === canonical.toLowerCase() || aliases.some(a => a === lower)) {
      return canonical;
    }
  }
  return raw.trim();
}

// ——————————————————————————————————————
// Parse CSV/Excel file
// ——————————————————————————————————————

export async function parseSpreadsheet(file: File): Promise<{
  rows: CSVPanelistRow[];
  warnings: string[];
  rawHeaders: string[];
}> {
  const warnings: string[] = [];

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  // Use first sheet
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('No sheets found in file');

  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });

  if (rawData.length === 0) {
    throw new Error('File is empty or has no data rows');
  }

  const rawHeaders = Object.keys(rawData[0]);

  // Map columns
  const rows: CSVPanelistRow[] = rawData.map((raw, idx) => {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(raw)) {
      const mappedKey = normalizeColumnName(key);
      normalized[mappedKey] = String(value || '').trim();
    }

    // Validate minimum data
    if (!normalized['Full Name'] && !normalized['First Name']) {
      warnings.push(`Row ${idx + 2}: No name found`);
    }

    // Auto-derive first name from full name if missing
    if (!normalized['First Name'] && normalized['Full Name']) {
      normalized['First Name'] = normalized['Full Name'].split(/\s+/)[0];
    }

    return {
      'First Name': normalized['First Name'] || '',
      'Full Name': normalized['Full Name'] || normalized['First Name'] || '',
      'Email': normalized['Email'] || '',
      'Zoom Join Link': normalized['Zoom Join Link'] || '',
      'Registration Tracking Link': normalized['Registration Tracking Link'] || '',
      'Promotional Materials Link': normalized['Promotional Materials Link'] || '',
      'Questions Link': normalized['Questions Link'] || '',
      'Final Banner Link': normalized['Final Banner Link'] || '',
      'Question 1': normalized['Question 1'] || '',
      'Question 2': normalized['Question 2'] || '',
      'Question 3': normalized['Question 3'] || '',
      'Question 4': normalized['Question 4'] || '',
      'Question 5': normalized['Question 5'] || '',
      'Contact Number': normalized['Contact Number'] || undefined,
      'Current Position and Organization': normalized['Current Position and Organization'] || undefined,
      'Short Bio': normalized['Short Bio'] || undefined,
    };
  });

  // Filter out completely empty rows
  const validRows = rows.filter(r => r['Full Name'] || r['First Name'] || r['Email']);

  if (validRows.length === 0) {
    throw new Error('No valid rows found. Make sure your file has columns like "Full Name", "Email", etc.');
  }

  if (validRows.length < rows.length) {
    warnings.push(`${rows.length - validRows.length} empty rows skipped`);
  }

  return { rows: validRows, warnings, rawHeaders };
}

/**
 * Convert CSV rows to panelist import format (matches the Omit<Panelist, 'id'> shape).
 */
export function csvRowsToPanelists(rows: CSVPanelistRow[]) {
  return rows.map(row => ({
    firstName: row['First Name'],
    fullName: row['Full Name'],
    email: row['Email'],
    zoomJoinLink: row['Zoom Join Link'],
    registrationTrackingLink: row['Registration Tracking Link'],
    promotionalMaterialsLink: row['Promotional Materials Link'],
    questionsLink: row['Questions Link'],
    finalBannerLink: row['Final Banner Link'],
    questions: [
      row['Question 1'],
      row['Question 2'],
      row['Question 3'],
      row['Question 4'],
      row['Question 5'],
    ],
    phone: row['Contact Number'],
    title: row['Current Position and Organization']?.split(/\s*(?:at|@|,)\s*/)[0] || '',
    bio: row['Short Bio'],
  }));
}
