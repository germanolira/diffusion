import { memo, useMemo, useState } from 'react';

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

interface TodoListProps {
  title: string;
  initialTodos: Todo[];
}

interface ItemProps {
  todo: Todo;
  onToggle: (id: number) => void;
}

// Small memoized row avoids full list rerender.
const TodoItem = memo(function TodoItem({ todo, onToggle }: ItemProps) {
  return (
    <li>
      <label>
        <input
          type="checkbox"
          checked={todo.done}
          onChange={() => onToggle(todo.id)}
        />
        <span>{todo.text}</span>
      </label>
    </li>
  );
});

export function TodoList({ title, initialTodos }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [draft, setDraft] = useState<string>('');

  // Derived state, no extra useState needed.
  const remaining = useMemo(() => todos.filter((t) => !t.done).length, [todos]);

  function toggle(id: number): void {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function add(): void {
    const text = draft.trim();
    if (!text) return;
    setTodos((prev) => [...prev, { id: Date.now(), text, done: false }]);
    setDraft('');
  }

  return (
    <section>
      <h2>{title}</h2>
      <p>{remaining} left</p>
      <div>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="New todo"
        />
        <button type="button" onClick={add}>
          Add
        </button>
      </div>
      <ul>
        {todos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} onToggle={toggle} />
        ))}
      </ul>
    </section>
  );
}
