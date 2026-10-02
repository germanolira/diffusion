import { memo, useMemo, useState } from 'react';

interface Row {
  id: number;
  text: string;
}

interface VirtualListProps {
  rows: Row[];
  rowHeight: number;
  viewportHeight: number;
}

interface RowViewProps {
  row: Row;
  top: number;
  height: number;
}

// Absolute rows keep scroll math simple.
const RowView = memo(function RowView({ row, top, height }: RowViewProps) {
  return (
    <div style={{ position: 'absolute', top, height, left: 0, right: 0 }}>
      {row.text}
    </div>
  );
});

export function VirtualList({ rows, rowHeight, viewportHeight }: VirtualListProps) {
  const [scrollTop, setScrollTop] = useState<number>(0);

  const visible = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - 2);
    const count = Math.ceil(viewportHeight / rowHeight) + 4;
    return rows.slice(start, start + count).map((row, i) => ({
      row,
      index: start + i,
    }));
  }, [rows, rowHeight, viewportHeight, scrollTop]);

  const totalHeight = rows.length * rowHeight;

  return (
    <div
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      style={{ overflowY: 'auto', height: viewportHeight }}
    >
      <div style={{ position: 'relative', height: totalHeight }}>
        {visible.map(({ row, index }) => (
          <RowView key={row.id} row={row} top={index * rowHeight} height={rowHeight} />
        ))}
      </div>
    </div>
  );
}
