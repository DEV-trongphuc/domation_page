import React from 'react';
import { Columns, Plus, Rows, Trash2 } from 'lucide-react';
import type { EmailBlockItem } from './templateTypes';

export interface TableBlockCanvasProps {
  block: EmailBlockItem;
  isSelected: boolean;
  onChange: (patch: Partial<EmailBlockItem>) => void;
}

export const TableBlockCanvas: React.FC<TableBlockCanvasProps> = ({
  block,
  isSelected,
  onChange,
}) => {
  const rows: string[][] =
    block.rows && block.rows.length > 0
      ? block.rows
      : [
          ['Hạng mục', 'Quyền lợi', 'Trạng thái'],
          ['Cổng gửi AWS SES', 'Xác thực DKIM/SPF', 'Đã kích hoạt'],
        ];
  const colCount = rows[0]?.length || 2;
  const headerBg = block.tableHeaderBg || '#EFF6FF';
  const headerColor = block.tableHeaderColor || '#1E40FF';
  const striped = block.tableStriped !== false;

  const updateCell = (rIdx: number, cIdx: number, val: string) => {
    const next = rows.map((row, ri) =>
      row.map((cell, ci) => (ri === rIdx && ci === cIdx ? val : cell))
    );
    onChange({ rows: next });
  };

  const addRow = () => {
    const emptyRow = Array.from({ length: colCount }, (_, idx) =>
      idx === 0 ? `Dòng #${rows.length}` : 'Giá trị'
    );
    onChange({ rows: [...rows, emptyRow] });
  };

  const removeRow = (rIdx: number) => {
    if (rows.length <= 1) return;
    onChange({ rows: rows.filter((_, idx) => idx !== rIdx) });
  };

  const addColumn = () => {
    if (colCount >= 6) return;
    const next = rows.map((row, rIdx) => [
      ...row,
      rIdx === 0 ? `Cột #${colCount + 1}` : '—',
    ]);
    onChange({ rows: next });
  };

  const removeColumn = (cIdx: number) => {
    if (colCount <= 1) return;
    const next = rows.map((row) => row.filter((_, ci) => ci !== cIdx));
    onChange({ rows: next });
  };

  const miniBtnStyle: React.CSSProperties = {
    height: 30,
    padding: '0 10px',
    borderRadius: 8,
    border: '1px solid #DBEAFE',
    background: '#FFFFFF',
    color: '#1E40FF',
    fontSize: '0.72rem',
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    cursor: 'pointer',
  };

  return (
    <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {isSelected && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 6,
            padding: '6px 10px',
            borderRadius: 10,
            background: '#F8FAFF',
            border: '1px solid #DBEAFE',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button type="button" onClick={addRow} style={miniBtnStyle}>
              <Rows size={13} /> <Plus size={12} /> Thêm dòng
            </button>
            <button type="button" onClick={addColumn} style={miniBtnStyle}>
              <Columns size={13} /> <Plus size={12} /> Thêm cột
            </button>
          </div>

          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.73rem',
              fontWeight: 600,
              color: '#475569',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={striped}
              onChange={(e) => onChange({ tableStriped: e.target.checked })}
            />
            Xen kẽ màu dòng
          </label>
        </div>
      )}

      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {rows.map((row, rIdx) => {
              const isHeader = rIdx === 0;
              const rowBg = isHeader
                ? headerBg
                : striped && rIdx % 2 === 0
                  ? '#F8FAFC'
                  : '#FFFFFF';
              return (
                <tr key={rIdx} style={{ background: rowBg, borderBottom: '1px solid #E2E8F0' }}>
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      style={{
                        padding: '8px 10px',
                        borderRight: cIdx < row.length - 1 ? '1px solid #F1F5F9' : 'none',
                      }}
                    >
                      {isSelected ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input
                            type="text"
                            value={cell}
                            onChange={(e) => updateCell(rIdx, cIdx, e.target.value)}
                            style={{
                              width: '100%',
                              minWidth: 72,
                              padding: '5px 7px',
                              borderRadius: 6,
                              border: '1px solid transparent',
                              background: 'rgba(255,255,255,0.75)',
                              fontSize: isHeader ? '0.76rem' : '0.8rem',
                              fontWeight: isHeader ? 700 : 500,
                              color: isHeader ? headerColor : '#0F172A',
                              outline: 'none',
                            }}
                          />
                          {isHeader && colCount > 1 && (
                            <button
                              type="button"
                              title="Xóa cột này"
                              onClick={() => removeColumn(cIdx)}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: '#94A3B8',
                                cursor: 'pointer',
                                padding: 2,
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span
                          style={{
                            fontSize: isHeader ? '0.76rem' : '0.82rem',
                            fontWeight: isHeader ? 700 : 500,
                            color: isHeader ? headerColor : '#0F172A',
                          }}
                        >
                          {cell}
                        </span>
                      )}
                    </td>
                  ))}
                  {isSelected && rows.length > 1 && (
                    <td style={{ width: 32, textAlign: 'center', padding: '0 4px' }}>
                      <button
                        type="button"
                        title="Xóa dòng này"
                        onClick={() => removeRow(rIdx)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#DC2626',
                          cursor: 'pointer',
                          padding: 4,
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableBlockCanvas;
