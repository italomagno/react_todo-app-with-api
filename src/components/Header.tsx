/* eslint-disable @typescript-eslint/indent */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import { useEffect, useRef, useState } from 'react';
import { Todo } from '../types/Todo';
import { addTodo, updateTodo } from '../api/todos';

interface HeaderProps {
  todos: Todo[];
  setEditingTodosId: (ids: number[]) => void;
  setError: (error: string) => void;
  editingTodosId: number[];
  setTodos: (todos: Todo[]) => void;
  setFilteredTodos: (todos: Todo[]) => void;
  setIsActiveFilter: (isActive: boolean) => void;
  filteredTodos: Todo[];
}

export function Header({
  todos,
  setEditingTodosId,
  setTodos,
  setFilteredTodos,
  setError,
  editingTodosId,
}: HeaderProps) {
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [isAddingNewTodo, setIsAddingNewTodo] = useState(false);

  const inputNewTodo = useRef<HTMLInputElement>(null);

  function handleNewTodoTitle(e: React.ChangeEvent<HTMLInputElement>) {
    setNewTodoTitle(e.target.value);
  }

  async function handleAddNewTodo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!newTodoTitle.trim()) {
      setError('Title should not be empty');
      inputNewTodo.current?.focus();

      return;
    }

    const newTodoIdAvailable = todos.length
      ? todos[todos.length - 1].id + 1
      : 1;

    try {
      setIsAddingNewTodo(true);
      setEditingTodosId([...editingTodosId, newTodoIdAvailable]);

      const newTodo = {
        title: newTodoTitle.trim(),
        completed: false,
        id: newTodoIdAvailable,
      };

      setFilteredTodos([...todos, newTodo as Todo]);

      const responseFromAddedTodo = await addTodo(newTodoTitle.trim());

      setFilteredTodos([...todos].filter(t => t.id !== newTodoIdAvailable));
      setTodos([...todos, responseFromAddedTodo]);
      setFilteredTodos([...todos, responseFromAddedTodo]);
      setNewTodoTitle('');
    } catch (er) {
      setEditingTodosId(
        [...editingTodosId].filter(id => id !== newTodoIdAvailable),
      );
      setError('Unable to add a todo');
      setFilteredTodos([...todos].filter(t => t.id !== newTodoIdAvailable));
    } finally {
      setEditingTodosId(editingTodosId.filter(id => id !== newTodoIdAvailable));

      setIsAddingNewTodo(false);
    }
  }

  async function handleToggleAllTodos() {
    const sucessfulUpdatedTodo: number[] = [];
    const hasAllSameStatus = todos.every(t => t.completed);

    hasAllSameStatus
      ? setEditingTodosId([...editingTodosId, ...todos.map(t => t.id)])
      : setEditingTodosId([
          ...editingTodosId,
          ...todos.filter(t => !t.completed).map(t => t.id),
        ]);

    try {
      for (const todo of todos) {
        if (hasAllSameStatus) {
          await updateTodo({
            ...todo,
            completed: !todo.completed,
          });
          sucessfulUpdatedTodo.push(todo.id);
        } else {
          if (todo.completed) {
            continue;
          }

          await updateTodo({
            ...todo,
            completed: !todo.completed,
          });
          sucessfulUpdatedTodo.push(todo.id);
        }

        sucessfulUpdatedTodo.push(todo.id);
      }
    } catch (e) {
      setError('Unable to update todo');
    }

    const newTodosUpdated = todos.map(t => {
      if (sucessfulUpdatedTodo.includes(t.id)) {
        return { ...t, completed: !t.completed };
      }

      return t;
    });

    setTodos(newTodosUpdated);
    setFilteredTodos(newTodosUpdated);
    setEditingTodosId([]);
  }

  useEffect(() => {
    inputNewTodo.current?.focus();
  }, [todos.length, isAddingNewTodo]);

  return (
    <header className="todoapp__header">
      {/* this button should have `active` class only if all todos are completed */}
      {todos.length > 0 && (
        <button
          type="button"
          onClick={() => handleToggleAllTodos()}
          className={`todoapp__toggle-all ${todos.every(t => t.completed) ? 'active' : ''}`}
          data-cy="ToggleAllButton"
        />
      )}

      {/* Add a todo on form submit */}
      <form onSubmit={e => handleAddNewTodo(e)}>
        <input
          disabled={isAddingNewTodo}
          ref={inputNewTodo}
          data-cy="NewTodoField"
          type="text"
          onChange={e => handleNewTodoTitle(e)}
          className="todoapp__new-todo"
          value={newTodoTitle}
          placeholder="What needs to be done?"
        />
      </form>
    </header>
  );
}
