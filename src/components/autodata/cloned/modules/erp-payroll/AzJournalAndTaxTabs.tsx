import React, { useMemo, useState } from 'react';
import { Copy, Download, FileCode2, FileSpreadsheet, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Card, EmptyState, PillTabs } from '../../components/ui/AutoDataLoadingModal';
import { formatVnd } from '../../../autodataApi';
import {
  AZ_KK_INDICATOR_ROWS,
  AZ_QTT_INDICATOR_ROWS,
  LABOR_BOOK_HEADERS,
  buildAzLaborBookRows,
  buildHtkk05KkXmlString,
  buildHtkk05QttXmlString,
  computeAzKk05,
  computeAzQtt05,
  exportAzJournalExcel,
  exportAzLaborBookExcel,
  exportAzQttAppendicesExcel,
  generateAzGeneralJournal,
  type AzAccountingRegime,
  type AzCalculatedRow,
  type AzPersistedWorkspaceState,
} from './accountingAzEngine';
import {
  PAYROLL_SHARED_INPUT_STYLE,
  triggerBrowserFileDownload,
  type LegalEntityInfoDto,
  type PayrollConfigDto,
} from './payrollTypes';

export interface AzJournalAndTaxTabsProps {
  activeSubTab: 'journal' | 'labor_book' | 'tax_xml';
  periodKey: string;
  signDateIso: string;
  legalEntity: LegalEntityInfoDto;
  payrollConfig: PayrollConfigDto;
  calculatedRows: AzCalculatedRow[];
  workspaceState: AzPersistedWorkspaceState;
  onPatchWorkspace: (patch: Partial<AzPersistedWorkspaceState>) => void;
}

export const AzJournalAndTaxTabs: React.FC<AzJournalAndTaxTabsProps> = ({
  activeSubTab,
  periodKey,
  signDateIso,
  legalEntity,
  payrollConfig,
  calculatedRows,
  workspaceState,
  onPatchWorkspace,
}) => {
  const [journalAccountFilter, setJournalAccountFilter] = useState('all');
  const [journalSearch, setJournalSearch] = useState('');
  const [laborSearch, setLaborSearch] = useState('');
  const [qttAppendixTab, setQttAppendixTab] = useState<'bk1' | 'bk2' | 'bk3'>('bk1');

  const journalBundle = useMemo(
    () =>
      generateAzGeneralJournal(
        calculatedRows,
        periodKey,
        workspaceState.accounting_regime,
        workspaceState.payment_account
      ),
    [calculatedRows, periodKey, workspaceState.accounting_regime, workspaceState.payment_account]
  );

  const filteredJournalEntries = useMemo(() => {
    const q = journalSearch.trim().toLowerCase();
    return journalBundle.entries.filter((e) => {
      if (journalAccountFilter !== 'all') {
        const matchAcc =
          e.debit_account.startsWith(journalAccountFilter) ||
          e.credit_account.startsWith(journalAccountFilter);
        if (!matchAcc) return false;
      }
      if (!q) return true;
      return `${e.doc_no} ${e.description} ${e.debit_account} ${e.credit_account}`
        .toLowerCase()
        .includes(q);
    });
  }, [journalBundle.entries, journalAccountFilter, journalSearch]);

  const laborRows = useMemo(() => buildAzLaborBookRows(calculatedRows), [calculatedRows]);

  const filteredLaborRows = useMemo(() => {
    const q = laborSearch.trim().toLowerCase();
    if (!q) return laborRows;
    return laborRows.filter((row) => row.join(' ').toLowerCase().includes(q));
  }, [laborRows, laborSearch]);

  const kkSummary = useMemo(
    () =>
      computeAzKk05(
        calculatedRows,
        workspaceState.kk_period_type,
        workspaceState.kk_period_num,
        workspaceState.kk_year,
        workspaceState.manual_kk
      ),
    [
      calculatedRows,
      workspaceState.kk_period_type,
      workspaceState.kk_period_num,
      workspaceState.kk_year,
      workspaceState.manual_kk,
    ]
  );

  const qttSummary = useMemo(
    () =>
      computeAzQtt05(
        calculatedRows,
        workspaceState.qtt_year,
        workspaceState.pit_regime,
        payrollConfig,
        workspaceState.manual_qtt
      ),
    [
      calculatedRows,
      workspaceState.qtt_year,
      workspaceState.pit_regime,
      payrollConfig,
      workspaceState.manual_qtt,
    ]
  );

  const kkXmlOut = useMemo(
    () => buildHtkk05KkXmlString(legalEntity, kkSummary, signDateIso),
    [legalEntity, kkSummary, signDateIso]
  );

  const qttXmlOut = useMemo(
    () => buildHtkk05QttXmlString(legalEntity, qttSummary, signDateIso),
    [legalEntity, qttSummary, signDateIso]
  );

  /* ================= TAB 3: GENERAL JOURNAL TT200 / TT133 ================= */
  if (activeSubTab === 'journal') {
    const filteredSum = filteredJournalEntries.reduce((s, e) => s + e.amount_vnd, 0);
    return (
      <Card
        title={`Sổ Nhật Ký Chung Hạch Toán Lương & Thuế (${workspaceState.accounting_regime})`}
        subtitle={
          workspaceState.accounting_regime === 'TT200'
            ? 'Chuẩn Thông tư 200/2014/TT-BTC: TK 642/641/154 đối ứng TK 334, 3383, 3384, 3386, 3382, 3335, 1121/1111'
            : 'Chuẩn Thông tư 133/2016/TT-BTC (SME): TK 6422/6421/154 đối ứng TK 334, 3383, 3384, 3385, 3382, 3335, 1121/1111'
        }
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select
              value={workspaceState.accounting_regime}
              onChange={(e) =>
                onPatchWorkspace({ accounting_regime: e.target.value as AzAccountingRegime })
              }
              style={{ ...PAYROLL_SHARED_INPUT_STYLE, width: 165, height: 38, fontWeight: 700 }}
            >
              <option value="TT200">Chế độ TT200/2014</option>
              <option value="TT133">Chế độ TT133/2016</option>
            </select>

            <select
              value={workspaceState.payment_account}
              onChange={(e) =>
                onPatchWorkspace({ payment_account: e.target.value as '112' | '111' })
              }
              style={{ ...PAYROLL_SHARED_INPUT_STYLE, width: 175, height: 38, fontWeight: 700 }}
            >
              <option value="112">Chi qua NH (TK 1121)</option>
              <option value="111">Chi tiền mặt (TK 1111)</option>
            </select>

            <button
              type="button"
              onClick={() => {
                exportAzJournalExcel(
                  legalEntity,
                  periodKey,
                  workspaceState.accounting_regime,
                  filteredJournalEntries
                );
                toast.success(`Đã xuất Sổ Nhật Ký Chung ${workspaceState.accounting_regime}!`);
              }}
              style={{
                height: 38,
                padding: '0 1rem',
                borderRadius: 10,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <FileSpreadsheet size={15} /> Xuất Excel Nhật Ký
            </button>
          </div>
        }
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: '0.9rem',
          }}
        >
          <select
            value={journalAccountFilter}
            onChange={(e) => setJournalAccountFilter(e.target.value)}
            style={{ ...PAYROLL_SHARED_INPUT_STYLE, width: 220, height: 40 }}
          >
            <option value="all">Tất cả tài khoản định khoản</option>
            <option value="334">TK 334 — Phải trả người lao động</option>
            <option value="338">TK 338 — BHXH, BHYT, BHTN, KPCĐ</option>
            <option value="3335">TK 3335 — Thuế TNCN</option>
            <option value="64">TK 641 / 642 — Chi phí Bán hàng & QLDN</option>
            <option value="154">TK 154 — Chi phí SXKD</option>
            <option value="11">TK 112 / 111 — Tiền gửi & Tiền mặt</option>
          </select>

          <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 340 }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748B',
              }}
            />
            <input
              type="text"
              value={journalSearch}
              onChange={(e) => setJournalSearch(e.target.value)}
              placeholder="Tìm số chứng từ, diễn giải, tài khoản..."
              style={{ ...PAYROLL_SHARED_INPUT_STYLE, height: 40, paddingLeft: 34 }}
            />
          </div>
        </div>

        {filteredJournalEntries.length === 0 ? (
          <EmptyState
            title="Chưa có bút toán phát sinh trong kỳ này"
            description="Khi có dữ liệu nhân sự và bảng lương kỳ hiện tại, hệ thống sẽ tự động sinh đầy đủ bút toán kép Nợ/Có."
          />
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 14 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', color: '#64748B' }}>#</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', color: '#64748B' }}>Ngày CT</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', color: '#64748B' }}>Số chứng từ</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', color: '#64748B' }}>
                    Diễn giải nghiệp vụ hạch toán
                  </th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', color: '#64748B' }}>TK Nợ</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', color: '#64748B' }}>TK Có</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', color: '#64748B' }}>
                    Số tiền phát sinh
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredJournalEntries.map((entry) => (
                  <tr key={entry.seq} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '9px 12px', color: '#64748B' }}>{entry.seq}</td>
                    <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>{entry.doc_date}</td>
                    <td style={{ padding: '9px 12px', fontWeight: 700, color: '#0F172A' }}>
                      {entry.doc_no}
                    </td>
                    <td style={{ padding: '9px 12px', color: '#334155' }}>{entry.description}</td>
                    <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                      <Badge tone="primary">{entry.debit_account}</Badge>
                    </td>
                    <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                      <Badge tone="warning">{entry.credit_account}</Badge>
                    </td>
                    <td
                      style={{
                        padding: '9px 12px',
                        textAlign: 'right',
                        fontWeight: 800,
                        color: '#0F172A',
                      }}
                    >
                      {formatVnd(entry.amount_vnd)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#F8FAFF', fontWeight: 800 }}>
                  <td colSpan={4} style={{ padding: '10px 12px', textAlign: 'right' }}>
                    TỔNG CÂN ĐỐI PHÁT SINH ({filteredJournalEntries.length} BÚT TOÁN):
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#1E40FF' }}>
                    Nợ = Có
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#059669' }}>
                    100% Cân bằng
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#1E40FF' }}>
                    {formatVnd(filteredSum)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    );
  }

  /* ================= TAB 4: STATUTORY LABOR MANAGEMENT BOOK ================= */
  if (activeSubTab === 'labor_book') {
    const bookYear = Number(periodKey.split('-')[0] || workspaceState.qtt_year);
    return (
      <Card
        title={`Sổ Quản Lý Lao Động Năm ${bookYear} (Đủ 21 Cột Chuẩn Nghị Định 145/2020/NĐ-CP)`}
        subtitle="Tự động tổng hợp hồ sơ nhân sự, hợp đồng lao động, mức tham gia BHXH, ngày phép năm và giờ tăng ca"
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: 250 }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: 11,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748B',
                }}
              />
              <input
                type="text"
                value={laborSearch}
                onChange={(e) => setLaborSearch(e.target.value)}
                placeholder="Tìm tên, mã NV, CCCD, MST..."
                style={{ ...PAYROLL_SHARED_INPUT_STYLE, height: 38, paddingLeft: 32 }}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                exportAzLaborBookExcel(legalEntity, bookYear, calculatedRows);
                toast.success(`Đã xuất Sổ quản lý lao động năm ${bookYear} (.xlsx)!`);
              }}
              style={{
                height: 38,
                padding: '0 1rem',
                borderRadius: 10,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <Download size={15} /> Xuất Excel Sổ QLLĐ
            </button>
          </div>
        }
      >
        {filteredLaborRows.length === 0 ? (
          <EmptyState
            title="Chưa có dữ liệu người lao động để lập sổ"
            description="Thêm nhân sự tại phân hệ HRM để tự động kết xuất Sổ quản lý lao động 21 cột."
          />
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 14 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E2E8F0' }}>
                  {LABOR_BOOK_HEADERS.map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '9px 10px',
                        textAlign: 'left',
                        whiteSpace: 'nowrap',
                        color: '#475569',
                        fontWeight: 700,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLaborRows.map((row, rIdx) => (
                  <tr key={rIdx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        style={{
                          padding: '8px 10px',
                          whiteSpace: 'nowrap',
                          fontWeight: cIdx === 2 ? 700 : 400,
                          color: cIdx === 2 ? '#0F172A' : '#334155',
                        }}
                      >
                        {String(cell ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    );
  }

  /* ================= TAB 5: HTKK 05/KK-TNCN & 05/QTT-TNCN XML + EXCEL ================= */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Block 1: 05/KK-TNCN */}
      <Card
        title="Tờ Khai Khấu Trừ Thuế TNCN Mẫu 05/KK-TNCN (Thông Tư 80/2021/TT-BTC • maTKhai=864)"
        subtitle="Hỗ trợ kê khai theo Tháng hoặc Quý, kết xuất XML chuẩn HTKK 5.7.9 nộp trực tiếp lên Thuế điện tử"
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={workspaceState.kk_period_type}
              onChange={(e) =>
                onPatchWorkspace({
                  kk_period_type: e.target.value as 'M' | 'Q',
                  kk_period_num: 1,
                })
              }
              style={{ ...PAYROLL_SHARED_INPUT_STYLE, width: 130, height: 38, fontWeight: 700 }}
            >
              <option value="Q">Kê khai Quý</option>
              <option value="M">Kê khai Tháng</option>
            </select>

            <select
              value={workspaceState.kk_period_num}
              onChange={(e) => onPatchWorkspace({ kk_period_num: Number(e.target.value) })}
              style={{ ...PAYROLL_SHARED_INPUT_STYLE, width: 130, height: 38, fontWeight: 700 }}
            >
              {workspaceState.kk_period_type === 'Q'
                ? [1, 2, 3, 4].map((q) => (
                    <option key={q} value={q}>
                      Quý {q}
                    </option>
                  ))
                : Array.from({ length: 12 }, (_, idx) => idx + 1).map((m) => (
                    <option key={m} value={m}>
                      Tháng {String(m).padStart(2, '0')}
                    </option>
                  ))}
            </select>

            <input
              type="number"
              value={workspaceState.kk_year}
              onChange={(e) => onPatchWorkspace({ kk_year: Number(e.target.value || 2026) })}
              style={{ ...PAYROLL_SHARED_INPUT_STYLE, width: 92, height: 38, fontWeight: 700 }}
            />

            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(kkXmlOut.xml);
                toast.success('Đã sao chép nội dung XML 05/KK-TNCN!');
              }}
              className="btn secondary"
              style={{ height: 38, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <Copy size={14} /> Copy XML
            </button>

            <button
              type="button"
              onClick={() => {
                triggerBrowserFileDownload(
                  kkXmlOut.filename,
                  kkXmlOut.xml,
                  'application/xml;charset=utf-8'
                );
                toast.success(`Đã tải tệp ${kkXmlOut.filename}!`);
              }}
              style={{
                height: 38,
                padding: '0 1rem',
                borderRadius: 10,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <FileCode2 size={15} /> Tải XML 05/KK-TNCN
            </button>
          </div>
        }
      >
        <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.81rem' }}>
            <thead>
              <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', width: 90 }}>Chỉ tiêu</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>
                  Nội dung chỉ tiêu trên tờ khai 05/KK-TNCN
                </th>
                <th style={{ padding: '8px 12px', textAlign: 'right', width: 200 }}>
                  Số người / Số tiền (VNĐ)
                </th>
              </tr>
            </thead>
            <tbody>
              {AZ_KK_INDICATOR_ROWS.map((row) => {
                const key = `ct${row.code}`;
                const val = kkSummary.indicators[key] || 0;
                return (
                  <tr
                    key={row.code}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      background: row.isTotal ? '#F8FAFF' : '#FFFFFF',
                    }}
                  >
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#1E40FF' }}>
                      [{row.code}]
                    </td>
                    <td
                      style={{
                        padding: '8px 12px',
                        fontWeight: row.isTotal ? 700 : 500,
                        color: '#0F172A',
                      }}
                    >
                      {row.label}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                      {row.editable ? (
                        <input
                          type="number"
                          value={val}
                          onChange={(e) =>
                            onPatchWorkspace({
                              manual_kk: {
                                ...workspaceState.manual_kk,
                                [key]: Number(e.target.value || 0),
                              },
                            })
                          }
                          style={{
                            ...PAYROLL_SHARED_INPUT_STYLE,
                            height: 34,
                            width: 155,
                            textAlign: 'right',
                          }}
                        />
                      ) : (
                        <strong style={{ color: row.code === '29' ? '#1E40FF' : '#0F172A' }}>
                          {val.toLocaleString('vi-VN')}
                        </strong>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, color: '#1E40FF' }}>
            Xem trước mã nguồn XML HTKK ({kkXmlOut.filename})
          </summary>
          <pre
            style={{
              marginTop: 8,
              padding: 12,
              borderRadius: 10,
              background: '#0F172A',
              color: '#E2E8F0',
              fontSize: '0.74rem',
              maxHeight: 240,
              overflow: 'auto',
            }}
          >
            {kkXmlOut.xml}
          </pre>
        </details>
      </Card>

      {/* Block 2: 05/QTT-TNCN & Appendices 05-1/BK, 05-2/BK, 05-3/BK */}
      <Card
        title="Quyết Toán Thuế TNCN Năm Mẫu 05/QTT-TNCN (maTKhai=953) & Phụ Lục 05-1/BK, 05-2/BK, 05-3/BK"
        subtitle={`Chế độ tính quyết toán: ${qttSummary.regime_label}`}
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="number"
              value={workspaceState.qtt_year}
              onChange={(e) => onPatchWorkspace({ qtt_year: Number(e.target.value || 2026) })}
              style={{ ...PAYROLL_SHARED_INPUT_STYLE, width: 96, height: 38, fontWeight: 700 }}
            />
            <button
              type="button"
              onClick={() => {
                exportAzQttAppendicesExcel(qttSummary);
                toast.success('Đã xuất file Excel 3 Phụ lục 05-1/BK, 05-2/BK & 05-3/BK!');
              }}
              style={{
                height: 38,
                padding: '0 0.95rem',
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#059669',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <FileSpreadsheet size={15} /> Xuất Excel 05-1/2/3-BK
            </button>
            <button
              type="button"
              onClick={() => {
                triggerBrowserFileDownload(
                  qttXmlOut.filename,
                  qttXmlOut.xml,
                  'application/xml;charset=utf-8'
                );
                toast.success(`Đã tải tệp quyết toán ${qttXmlOut.filename}!`);
              }}
              style={{
                height: 38,
                padding: '0 1rem',
                borderRadius: 10,
                border: 'none',
                background: '#1E40FF',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <FileCode2 size={15} /> Tải XML 05/QTT-TNCN
            </button>
          </div>
        }
      >
        <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 12, marginBottom: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.81rem' }}>
            <thead>
              <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', width: 90 }}>Chỉ tiêu</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>
                  Nội dung chỉ tiêu trên tờ khai 05/QTT-TNCN
                </th>
                <th style={{ padding: '8px 12px', textAlign: 'right', width: 200 }}>
                  Giá trị quyết toán
                </th>
              </tr>
            </thead>
            <tbody>
              {AZ_QTT_INDICATOR_ROWS.map((row) => {
                const key = `ct${row.code}`;
                const val = qttSummary.indicators[key] || 0;
                return (
                  <tr
                    key={row.code}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      background: row.isTotal ? '#F8FAFF' : '#FFFFFF',
                    }}
                  >
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#1E40FF' }}>
                      [{row.code}]
                    </td>
                    <td
                      style={{
                        padding: '8px 12px',
                        fontWeight: row.isTotal ? 700 : 500,
                        color: '#0F172A',
                      }}
                    >
                      {row.label}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                      {row.editable ? (
                        <input
                          type="number"
                          value={val}
                          onChange={(e) =>
                            onPatchWorkspace({
                              manual_qtt: {
                                ...workspaceState.manual_qtt,
                                [key]: Number(e.target.value || 0),
                              },
                            })
                          }
                          style={{
                            ...PAYROLL_SHARED_INPUT_STYLE,
                            height: 34,
                            width: 155,
                            textAlign: 'right',
                          }}
                        />
                      ) : (
                        <strong style={{ color: row.isTotal ? '#1E40FF' : '#0F172A' }}>
                          {val.toLocaleString('vi-VN')}
                        </strong>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <PillTabs<'bk1' | 'bk2' | 'bk3'>
          activeKey={qttAppendixTab}
          onChange={setQttAppendixTab}
          tabs={[
            { key: 'bk1', label: 'Phụ lục 05-1/BK (Cư trú HĐLĐ)', count: qttSummary.bk1.length },
            { key: 'bk2', label: 'Phụ lục 05-2/BK (Vãng lai / KCT)', count: qttSummary.bk2.length },
            { key: 'bk3', label: 'Phụ lục 05-3/BK (Người phụ thuộc)', count: qttSummary.bk3.length },
          ]}
        />

        {qttAppendixTab === 'bk1' && (
          <div style={{ overflowX: 'auto', marginTop: 10, border: '1px solid #E2E8F0', borderRadius: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Họ tên / MST</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>[12] Tổng TNCT</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>[17] Giảm trừ GC</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>[19] BH bắt buộc</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>[22] Đã khấu trừ</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>[24] Phải nộp năm</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>[25] Nộp thừa</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>[26] Còn phải nộp</th>
                </tr>
              </thead>
              <tbody>
                {qttSummary.bk1.map((b) => (
                  <tr key={b.stt} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '8px 10px' }}>
                      <strong>{b.full_name}</strong> ({b.tax_code || 'Chưa có MST'})
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{formatVnd(b.taxable_income_vnd)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{formatVnd(b.family_deduction_vnd)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{formatVnd(b.insurance_deduction_vnd)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{formatVnd(b.pit_withheld_vnd)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>
                      {formatVnd(b.pit_payable_annual_vnd)}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: '#059669' }}>
                      {formatVnd(b.pit_overpaid_vnd)}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: '#D97706', fontWeight: 700 }}>
                      {formatVnd(b.pit_remaining_vnd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {qttAppendixTab === 'bk2' && (
          <div style={{ overflowX: 'auto', marginTop: 10, border: '1px solid #E2E8F0', borderRadius: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Họ và tên</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>MST / CCCD</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Tình trạng cư trú</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Tổng TNCT</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Thuế đã khấu trừ (10%/20%)</th>
                </tr>
              </thead>
              <tbody>
                {qttSummary.bk2.map((b) => (
                  <tr key={b.stt} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700 }}>{b.full_name}</td>
                    <td style={{ padding: '8px 10px' }}>{b.tax_code || b.id_number || '—'}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      {b.is_resident ? 'Cư trú (Vãng lai)' : 'Không cư trú'}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{formatVnd(b.taxable_income_vnd)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>
                      {formatVnd(b.pit_withheld_vnd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {qttAppendixTab === 'bk3' && (
          <div style={{ overflowX: 'auto', marginTop: 10, border: '1px solid #E2E8F0', borderRadius: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Người nộp thuế</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>MST NNT</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Hồ sơ Người phụ thuộc</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Số tháng tính GT</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Tổng giảm trừ NPT</th>
                </tr>
              </thead>
              <tbody>
                {qttSummary.bk3.map((b) => (
                  <tr key={b.stt} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700 }}>{b.taxpayer_name}</td>
                    <td style={{ padding: '8px 10px' }}>{b.taxpayer_mst}</td>
                    <td style={{ padding: '8px 10px' }}>{b.dependent_slot}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>{b.deduction_months} tháng</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#1E40FF' }}>
                      {formatVnd(b.deduction_amount_vnd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
