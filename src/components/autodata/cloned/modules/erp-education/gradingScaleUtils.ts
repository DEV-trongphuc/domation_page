import * as XLSX from 'xlsx';
import type {
  CurriculumSubject,
  EditableGradeCell,
  GradingScaleKey,
  MatrixStudentItem,
  ParsedGradeImportRow,
} from './educationTypes';

export interface GradeConversionPreview {
  hasScore: boolean;
  primaryScore: number | null;
  scale10: number | null;
  ects6: number | null;
  gpa4: number | null;
  letter: string;
  letterLabel: string;
  passStatus: 'passed' | 'failed' | 'pending';
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function parseScoreInput(raw: unknown): number | null {
  if (raw === undefined || raw === null || raw === '') return null;
  const cleaned = typeof raw === 'string' ? raw.trim().replace(',', '.') : String(raw);
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) && num >= 0 ? round2(num) : null;
}

export function convertGradeByScale(params: {
  scale: GradingScaleKey;
  attendanceScore?: unknown;
  assignmentScore?: unknown;
  midtermScore?: unknown;
  finalScore?: unknown;
}): GradeConversionPreview {
  const att = parseScoreInput(params.attendanceScore);
  const asg = parseScoreInput(params.assignmentScore);
  const mid = parseScoreInput(params.midtermScore);
  const fin = parseScoreInput(params.finalScore);

  let rawComposite: number | null = null;
  if (att !== null || asg !== null || mid !== null || fin !== null) {
    if (mid !== null && fin !== null && att === null && asg === null) {
      rawComposite = mid * 0.4 + fin * 0.6;
    } else if (mid !== null && fin !== null && (att !== null || asg !== null)) {
      let wSum = 0;
      let vSum = 0;
      if (att !== null) { wSum += 0.1; vSum += att * 0.1; }
      if (asg !== null) { wSum += 0.2; vSum += asg * 0.2; }
      wSum += 0.2; vSum += mid * 0.2;
      wSum += 0.5; vSum += fin * 0.5;
      rawComposite = wSum > 0 ? vSum / wSum : fin;
    } else if (fin !== null) {
      rawComposite = fin;
    } else if (att !== null && asg !== null) {
      rawComposite = att * 0.5 + asg * 0.5;
    } else {
      rawComposite = mid ?? asg ?? att;
    }
  }

  if (rawComposite === null) {
    return {
      hasScore: false,
      primaryScore: null,
      scale10: null,
      ects6: null,
      gpa4: null,
      letter: '—',
      letterLabel: 'Chưa chấm',
      passStatus: 'pending',
    };
  }

  if (params.scale === 'ects_6') {
    const ects6 = round2(
      rawComposite > 10
        ? Math.min(6, (rawComposite / 100) * 6)
        : rawComposite > 6
        ? Math.min(6, (rawComposite / 10) * 6)
        : Math.min(6, rawComposite)
    );
    const scale10 = round2((ects6 / 6) * 10);
    const gpa4 = round2((ects6 / 6) * 4);
    if (ects6 >= 5.25) return { hasScore: true, primaryScore: ects6, scale10, ects6, gpa4, letter: 'A', letterLabel: 'A (Xuất sắc)', passStatus: 'passed' };
    if (ects6 >= 4.75) return { hasScore: true, primaryScore: ects6, scale10, ects6, gpa4, letter: 'B', letterLabel: 'B (Giỏi)', passStatus: 'passed' };
    if (ects6 >= 4.5) return { hasScore: true, primaryScore: ects6, scale10, ects6, gpa4, letter: 'C', letterLabel: 'C (Khá)', passStatus: 'passed' };
    if (ects6 >= 4.25) return { hasScore: true, primaryScore: ects6, scale10, ects6, gpa4, letter: 'D', letterLabel: 'D (TB Khá)', passStatus: 'passed' };
    if (ects6 >= 4.0) return { hasScore: true, primaryScore: ects6, scale10, ects6, gpa4, letter: 'E', letterLabel: 'E (Đạt ECTS)', passStatus: 'passed' };
    return { hasScore: true, primaryScore: ects6, scale10, ects6, gpa4, letter: 'F', letterLabel: 'F (Chưa đạt)', passStatus: 'failed' };
  }

  if (params.scale === 'gpa_4') {
    const gpa4 = round2(
      rawComposite > 10
        ? Math.min(4, (rawComposite / 100) * 4)
        : rawComposite > 4
        ? Math.min(4, (rawComposite / 10) * 4)
        : Math.min(4, rawComposite)
    );
    const scale10 = round2((gpa4 / 4) * 10);
    const ects6 = round2((gpa4 / 4) * 6);
    if (gpa4 >= 3.6) return { hasScore: true, primaryScore: gpa4, scale10, ects6, gpa4, letter: 'A', letterLabel: 'A (Xuất sắc)', passStatus: 'passed' };
    if (gpa4 >= 3.2) return { hasScore: true, primaryScore: gpa4, scale10, ects6, gpa4, letter: 'B', letterLabel: 'B (Giỏi)', passStatus: 'passed' };
    if (gpa4 >= 2.5) return { hasScore: true, primaryScore: gpa4, scale10, ects6, gpa4, letter: 'C', letterLabel: 'C (Khá)', passStatus: 'passed' };
    if (gpa4 >= 2.0) return { hasScore: true, primaryScore: gpa4, scale10, ects6, gpa4, letter: 'D', letterLabel: 'D (Đạt)', passStatus: 'passed' };
    return { hasScore: true, primaryScore: gpa4, scale10, ects6, gpa4, letter: 'F', letterLabel: 'F (Chưa đạt)', passStatus: 'failed' };
  }

  const scale10 = round2(rawComposite > 10 ? Math.min(10, rawComposite / 10) : Math.min(10, rawComposite));
  const ects6 = round2((scale10 / 10) * 6);
  const gpa4 = round2((scale10 / 10) * 4);
  if (scale10 >= 8.5) return { hasScore: true, primaryScore: scale10, scale10, ects6, gpa4, letter: 'A', letterLabel: 'A (Xuất sắc)', passStatus: 'passed' };
  if (scale10 >= 7.0) return { hasScore: true, primaryScore: scale10, scale10, ects6, gpa4, letter: 'B', letterLabel: 'B (Giỏi)', passStatus: 'passed' };
  if (scale10 >= 5.5) return { hasScore: true, primaryScore: scale10, scale10, ects6, gpa4, letter: 'C', letterLabel: 'C (Khá)', passStatus: 'passed' };
  if (scale10 >= 4.0) return { hasScore: true, primaryScore: scale10, scale10, ects6, gpa4, letter: 'D', letterLabel: 'D (Đạt)', passStatus: 'passed' };
  return { hasScore: true, primaryScore: scale10, scale10, ects6, gpa4, letter: 'F', letterLabel: 'F (Chưa đạt)', passStatus: 'failed' };
}

function mapRowsMatrixToParsedImport(
  rawGrid: ReadonlyArray<ReadonlyArray<unknown>>,
  students: ReadonlyArray<MatrixStudentItem>
): ParsedGradeImportRow[] {
  const nonEmpty = rawGrid
    .map((r) => r.map((c) => String(c ?? '').trim()))
    .filter((r) => r.some((cell) => cell.length > 0));
  if (nonEmpty.length < 2) return [];

  const headers = nonEmpty[0].map((h) => h.toLowerCase());
  const findCol = (patterns: string[], fallbackIdx: number): number => {
    const idx = headers.findIndex((h) => patterns.some((p) => h.includes(p)));
    return idx >= 0 ? idx : fallbackIdx;
  };

  const idIdx = findCol(['enrollment_id', 'ma_ghi_danh', 'mã ghi danh', 'id'], -1);
  const nameIdx = findCol(['ho_ten', 'họ tên', 'họ và tên', 'student_name', 'tên học viên', 'name'], 0);
  const emailIdx = findCol(['email', 'thư điện tử'], 1);
  const phoneIdx = findCol(['phone', 'so_dien_thoai', 'số điện thoại', 'sđt', 'sdt'], 2);
  const attIdx = findCol(['attendance', 'chuyen_can', 'chuyên cần', 'quiz'], -1);
  const asgIdx = findCol(['assignment', 'bai_tap', 'bài tập'], -1);
  const midIdx = findCol(['midterm', 'giua_ky', 'giữa kỳ'], -1);
  const finIdx = findCol(['final', 'cuoi_ky', 'cuối kỳ', 'diem_tk', 'điểm tk', 'tổng kết', 'score', 'điểm'], 3);
  const fbIdx = findCol(['feedback', 'ghi_chu', 'ghi chú', 'nhận xét', 'note'], -1);

  const digits = (v: string) => v.replace(/\D+/g, '');
  const out: ParsedGradeImportRow[] = [];

  for (let i = 1; i < nonEmpty.length; i += 1) {
    const cols = nonEmpty[i];
    const enrIdCandidate = idIdx >= 0 ? cols[idIdx] || '' : '';
    const nameCandidate = nameIdx >= 0 ? cols[nameIdx] || '' : '';
    const emailCandidate = emailIdx >= 0 ? cols[emailIdx] || '' : '';
    const phoneCandidate = phoneIdx >= 0 ? cols[phoneIdx] || '' : '';

    if (
      enrIdCandidate.toUpperCase() === 'DEMO-ID' ||
      emailCandidate.toLowerCase().startsWith('demo.student@')
    ) {
      continue;
    }

    let matchedStu = students.find((s) => enrIdCandidate && s.id === enrIdCandidate);
    if (!matchedStu && emailCandidate) {
      matchedStu = students.find(
        (s) => (s.student_email || '').toLowerCase() === emailCandidate.toLowerCase()
      );
    }
    if (!matchedStu && phoneCandidate && digits(phoneCandidate).length >= 7) {
      matchedStu = students.find((s) => digits(s.student_phone || '') === digits(phoneCandidate));
    }
    if (!matchedStu && nameCandidate) {
      matchedStu = students.find(
        (s) => s.student_name.trim().toLowerCase() === nameCandidate.trim().toLowerCase()
      );
    }
    if (!matchedStu && !nameCandidate && !emailCandidate) continue;

    out.push({
      row_index: i,
      enrollment_id: matchedStu?.id || (enrIdCandidate || undefined),
      student_name: matchedStu?.student_name || nameCandidate || emailCandidate,
      student_email: matchedStu?.student_email || emailCandidate,
      student_phone: matchedStu?.student_phone || phoneCandidate,
      matched: Boolean(matchedStu),
      attendance_score: attIdx >= 0 ? cols[attIdx] || '' : '',
      assignment_score: asgIdx >= 0 ? cols[asgIdx] || '' : '',
      midterm_score: midIdx >= 0 ? cols[midIdx] || '' : '',
      final_score: finIdx >= 0 && finIdx < cols.length ? cols[finIdx] || '' : '',
      feedback: fbIdx >= 0 ? cols[fbIdx] || '' : '',
    });
  }
  return out;
}

export function parseGradebookPastedText(
  rawText: string,
  students: ReadonlyArray<MatrixStudentItem>
): ParsedGradeImportRow[] {
  if (!rawText.trim()) return [];
  const wb = XLSX.read(rawText, { type: 'string' });
  const firstSheet = wb.SheetNames[0];
  if (!firstSheet) return [];
  const rows = XLSX.utils.sheet_to_json<Array<string | number | null>>(wb.Sheets[firstSheet], {
    header: 1,
    defval: '',
  });
  return mapRowsMatrixToParsedImport(rows, students);
}

export async function parseGradebookSpreadsheetFile(
  file: File,
  students: ReadonlyArray<MatrixStudentItem>
): Promise<ParsedGradeImportRow[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const firstSheet = wb.SheetNames[0];
  if (!firstSheet) return [];
  const rows = XLSX.utils.sheet_to_json<Array<string | number | null>>(wb.Sheets[firstSheet], {
    header: 1,
    defval: '',
  });
  return mapRowsMatrixToParsedImport(rows, students);
}

export function downloadGradebookCsvTemplate(params: {
  classCode: string;
  subject: CurriculumSubject;
  scale: GradingScaleKey;
  students: ReadonlyArray<MatrixStudentItem>;
  cellsByStudent: Record<string, EditableGradeCell | undefined>;
}): void {
  const scaleTag =
    params.scale === 'ects_6' ? 'ECTS_6.0' : params.scale === 'gpa_4' ? 'GPA_4.0' : 'He_10.0';
  const demoScore = params.scale === 'ects_6' ? '5.50' : params.scale === 'gpa_4' ? '3.70' : '8.80';
  const headers = [
    'Enrollment_ID',
    'Ho_Ten',
    'Email',
    'So_Dien_Thoai',
    'Chuyen_Can',
    'Bai_Tap',
    'Giua_Ky',
    `Cuoi_Ky_${scaleTag}`,
    'Ghi_Chu',
  ];
  const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`;
  const lines: string[] = [headers.map(escapeCsv).join(',')];

  lines.push(
    ['DEMO-ID', 'Học viên Mẫu (Tự động bỏ qua)', 'demo.student@academy.vn', '0901234567', demoScore, demoScore, demoScore, demoScore, 'Đạt xuất sắc']
      .map(escapeCsv)
      .join(',')
  );

  for (const st of params.students) {
    const c = params.cellsByStudent[st.id];
    lines.push(
      [
        st.id,
        st.student_name,
        st.student_email || '',
        st.student_phone || '',
        c?.attendance_score || '',
        c?.assignment_score || '',
        c?.midterm_score || '',
        c?.final_score || '',
        c?.feedback || '',
      ]
        .map((v) => escapeCsv(String(v)))
        .join(',')
    );
  }

  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Bang_Diem_${params.classCode}_${params.subject.code}_${scaleTag}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
