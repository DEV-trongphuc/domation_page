import React, { useRef } from 'react';
import { CheckCircle2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge } from '../../components/ui/AutoDataLoadingModal';
import { getErrorMessage } from '../../../autodataApi';
import type {
  CurriculumSubject,
  GradingScaleKey,
  MatrixStudentItem,
  ParsedGradeImportRow,
} from './educationTypes';
import {
  convertGradeByScale,
  parseGradebookPastedText,
  parseGradebookSpreadsheetFile,
} from './gradingScaleUtils';

export interface GradebookImportTabProps {
  activeSubject: CurriculumSubject;
  gradingScale: GradingScaleKey;
  scaleShortLabel: string;
  students: ReadonlyArray<MatrixStudentItem>;
  importText: string;
  importRows: ReadonlyArray<ParsedGradeImportRow>;
  saving: boolean;
  onChangeText: (text: string, rows: ParsedGradeImportRow[]) => void;
  onLoadedRows: (rows: ParsedGradeImportRow[]) => void;
  onConfirmImport: () => void;
}

export const GradebookImportTab: React.FC<GradebookImportTabProps> = ({
  activeSubject,
  gradingScale,
  scaleShortLabel,
  students,
  importText,
  importRows,
  saving,
  onChangeText,
  onLoadedRows,
  onConfirmImport,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSpreadsheetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const parsed = await parseGradebookSpreadsheetFile(file, students);
      onLoadedRows(parsed);
      toast.success(`Đã phân tích ${parsed.length} dòng điểm từ "${file.name}"`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể đọc file Excel / CSV'));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 14,
          borderRadius: 14,
          border: '1.5px dashed #93C5FD',
          background: '#F8FAFF',
        }}
      >
        <div style={{ fontSize: '0.82rem', color: '#1E293B' }}>
          <strong>Tải lên file Excel (.xlsx, .xls) / CSV</strong> hoặc dán trực tiếp vùng dữ liệu từ bảng tính cho môn{' '}
          <strong>
            {activeSubject.code} — {activeSubject.name}
          </strong>
          .
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.tsv"
            style={{ display: 'none' }}
            onChange={handleSpreadsheetUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn secondary"
            style={{ height: 38, color: '#1E40FF', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Upload size={14} /> Chọn File Excel / CSV
          </button>
        </div>
      </div>

      <textarea
        rows={4}
        value={importText}
        onChange={(e) => {
          const txt = e.target.value;
          onChangeText(txt, parseGradebookPastedText(txt, students));
        }}
        placeholder={
          'Hoặc dán TSV / CSV từ Excel tại đây:\nHo_Ten\tEmail\tGiua_Ky\tCuoi_Ky\tGhi_Chu\nNguyễn Văn A\ta@client.vn\t8.5\t9.0\tXuất sắc'
        }
        style={{
          width: '100%',
          borderRadius: 12,
          border: '1px solid #CBD5E1',
          padding: 10,
          fontSize: '0.8rem',
          fontFamily: 'monospace',
        }}
      />

      {importRows.length > 0 && (
        <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                <th style={{ padding: '8px 10px' }}>Học viên</th>
                <th style={{ padding: '8px 10px' }}>Đối chiếu</th>
                <th style={{ padding: '8px 10px' }}>Điểm nhập</th>
                <th style={{ padding: '8px 10px' }}>Quy đổi ({scaleShortLabel})</th>
              </tr>
            </thead>
            <tbody>
              {importRows.map((r) => {
                const c = convertGradeByScale({
                  scale: gradingScale,
                  attendanceScore: r.attendance_score,
                  assignmentScore: r.assignment_score,
                  midtermScore: r.midterm_score,
                  finalScore: r.final_score,
                });
                return (
                  <tr key={r.row_index} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '8px 10px' }}>
                      <strong>{r.student_name}</strong> ({r.student_email || r.student_phone || '—'})
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <Badge tone={r.matched ? 'success' : 'info'}>
                        {r.matched ? 'Khớp hồ sơ lớp' : 'Tự động ghi danh'}
                      </Badge>
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      CK: {r.final_score || '—'} (GK: {r.midterm_score || '—'})
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <Badge tone={c.passStatus === 'passed' ? 'primary' : 'danger'}>
                        {c.letterLabel} • ECTS {c.ects6 ?? '—'} • GPA {c.gpa4 ?? '—'}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          disabled={importRows.length === 0 || saving}
          onClick={onConfirmImport}
          className="btn-inkica-primary"
          style={{
            height: 42,
            padding: '0 1.25rem',
            borderRadius: 12,
            border: 'none',
            color: '#FFFFFF',
            fontWeight: 700,
            cursor: importRows.length === 0 ? 'not-allowed' : 'pointer',
            opacity: importRows.length === 0 ? 0.6 : 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <CheckCircle2 size={15} /> {saving ? 'Đang Import...' : `Xác Nhận Import (${importRows.length} học viên)`}
        </button>
      </div>
    </div>
  );
};
