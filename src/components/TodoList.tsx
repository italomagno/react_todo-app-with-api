/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useEffect, useState } from 'react';
import { Todo } from '../types/Todo';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { deleteTodo, updateTodo } from '../api/todos';

interface TodoListProps {
  filteredTodos: Todo[];
  editingTodosId: number[];
  setEditingTodosId: (ids: number[]) => void;
  setError: (error: string) => void;
  todos: Todo[];
  setTodos: (todos: Todo[]) => void;
  setFilteredTodos: (todos: Todo[]) => void;
  filter: string;
}
export function TodoList({
  todos,
  filteredTodos,
  editingTodosId,
  setEditingTodosId,
  setError,
  setTodos,
  setFilteredTodos,
}: TodoListProps) {
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);

  const TodoTitleFieldRef = React.useRef<HTMLInputElement>(null);

  function handleSelectedTodoChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!selectedTodo) {
      return;
    }

    setSelectedTodo({
      ...selectedTodo,
      title: e.target.value,
    });
  }

  async function handleEditTitleOfTodo(todo: Todo) {
    try {
      if (!selectedTodo) {
        throw new Error('Unable to update todo');
      }

      setEditingTodosId([...editingTodosId, todo.id]);
      const updatedTodoFromServer = await updateTodo({
        ...todo,
        title: selectedTodo.title.trim(),
      });
      const newTodos = todos.map(t =>
        t.id === todo.id ? updatedTodoFromServer : t,
      );

      setTodos(newTodos);
      setFilteredTodos(newTodos);
      setEditingTodosId(editingTodosId.filter(id => id !== todo.id));
      setSelectedTodo(null);
    } catch (e) {
      setError('Unable to update a todo');
      setEditingTodosId(editingTodosId.filter(id => id !== todo.id));
      setSelectedTodo(todo);
    }
  }

  async function handleUpdateTodoStatus(todoId: number) {
    try {
      const todo = todos.find(t => t.id === todoId);

      setEditingTodosId([...editingTodosId, todoId]);
      if (!todo) {
        throw new Error('Todo not found');
      }

      const updatedTodo: Todo = { ...todo, completed: !todo.completed };
      const updatedTodoFromServer = await updateTodo(updatedTodo);
      const newTodos = todos.map(t =>
        t.id === todoId ? updatedTodoFromServer : t,
      );

      setEditingTodosId(editingTodosId.filter(id => id !== todoId));
      setTodos(newTodos);
      setFilteredTodos(newTodos);
    } catch (e) {
      setError('Unable to update a todo');
      setEditingTodosId(editingTodosId.filter(id => id !== todoId));
    }
  }

  async function handleRemoveTodo(todoId: number) {
    setEditingTodosId([...editingTodosId, todoId]);
    try {
      await deleteTodo(todoId);
      setTimeout(() => {
        setEditingTodosId(editingTodosId.filter(id => id !== todoId));
        setTodos(todos.filter(t => t.id !== todoId));
        setFilteredTodos(filteredTodos.filter(t => t.id !== todoId));
        setSelectedTodo(null);
      }, 1000);
    } catch (e) {
      setError('Unable to delete a todo');
      setSelectedTodo(todos.find(t => t.id === todoId) || null);
      TodoTitleFieldRef.current?.focus();
    } finally {
      setEditingTodosId(editingTodosId.filter(id => id !== todoId));
    }
  }

  async function handleEditTodoTitle(
    e: React.FormEvent<HTMLFormElement>,
    todo: Todo,
  ) {
    e.preventDefault();
    if (!selectedTodo) {
      return;
    }

    if (selectedTodo && !selectedTodo.title) {
      await handleRemoveTodo(todo.id);

      return;
    } else if (selectedTodo.title === todo.title) {
      setSelectedTodo(null);

      return;
    } else if (selectedTodo.title !== todo.title) {
      await handleEditTitleOfTodo(selectedTodo);

      return;
    }
  }

  useEffect(() => {
    if (selectedTodo) {
      TodoTitleFieldRef.current?.focus();
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          setTimeout(() => setSelectedTodo(null), 500);
        }
      });
    }

    return () => {
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          setTimeout(() => setSelectedTodo(null), 500);
        }
      });
    };
  }, [selectedTodo]);

  return (
    <TransitionGroup component={null}>
      {filteredTodos.map(todo => (
        <CSSTransition
          key={todo.id}
          timeout={300}
          classNames="item"
          unmountOnExit
          appear
          enter
          exit
        >
          <div
            data-cy="Todo"
            className={`todo ${todo.completed ? 'completed' : ''}`}
          >
            <label className="todo__status-label">
              <input
                data-cy="TodoStatus"
                type="checkbox"
                className="todo__status"
                checked={todo.completed}
                onClick={() => handleUpdateTodoStatus(todo.id)}
              />
            </label>
            {!selectedTodo || selectedTodo.id !== todo.id ? (
              <span
                onDoubleClick={() => setSelectedTodo(todo)}
                data-cy="TodoTitle"
                className="todo__title"
              >
                {todo.title}
              </span>
            ) : (
              <form onSubmit={e => handleEditTodoTitle(e, todo)}>
                <input
                  data-cy="TodoTitleField"
                  type="text"
                  ref={TodoTitleFieldRef}
                  className="todo__title-field"
                  onChange={handleSelectedTodoChange}
                  placeholder="Empty todo will be deleted"
                  onBlur={e =>
                    handleEditTodoTitle(
                      e as unknown as React.FormEvent<HTMLFormElement>,
                      todo,
                    )
                  }
                  value={selectedTodo?.title}
                />
              </form>
            )}

            {/* Remove button appears only on hover */}
            {!selectedTodo || selectedTodo.id !== todo.id ? (
              <button
                onClick={() => handleRemoveTodo(todo.id)}
                type="button"
                className="todo__remove"
                data-cy="TodoDelete"
              >
                ×
              </button>
            ) : null}

            {/* overlay will cover the todo while it is being deleted or updated */}
            <div
              data-cy="TodoLoader"
              className={`modal overlay ${editingTodosId.includes(todo.id) ? 'is-active' : ''}`}
            >
              <div className="modal-background has-background-white-ter" />
              <div className="loader" />
            </div>
          </div>
        </CSSTransition>
      ))}
    </TransitionGroup>
  );
}
