import { useCallback, useState } from 'react';

interface Tab {
  id: string;
  label: string;
  content: string;
}

interface TabsProps {
  tabs: Tab[];
  initialId: string;
}

interface TabButtonProps {
  active: boolean;
  label: string;
  onSelect: () => void;
}

function TabButton({ active, label, onSelect }: TabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onSelect}
    >
      {label}
    </button>
  );
}

export function Tabs({ tabs, initialId }: TabsProps) {
  const [activeId, setActiveId] = useState<string>(initialId);

  const select = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  // Derived active tab, no mirror state.
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];

  return (
    <section>
      <div role="tablist">
        {tabs.map((t) => (
          <TabButton
            key={t.id}
            label={t.label}
            active={t.id === active.id}
            onSelect={() => select(t.id)}
          />
        ))}
      </div>
      <div role="tabpanel">
        <p>{active.content}</p>
      </div>
    </section>
  );
}
