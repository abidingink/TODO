import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState(['Work', 'Personal', 'Shopping']);
  const [newCategory, setNewCategory] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [expandedTodos, setExpandedTodos] = useState(new Set());

  // Load todos from localStorage on initial render
  useEffect(() => {
    const savedTodos = localStorage.getItem('todos');
    const savedExpanded = localStorage.getItem('expandedTodos');
    if (savedTodos) {
      try {
        setTodos(JSON.parse(savedTodos));
      } catch (e) {
        console.error('Failed to parse todos from localStorage');
      }
    }
    if (savedExpanded) {
      try {
        setExpandedTodos(new Set(JSON.parse(savedExpanded)));
      } catch (e) {
        console.error('Failed to parse expanded todos from localStorage');
      }
    }
  }, []);

  // Save todos and expanded state to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('expandedTodos', JSON.stringify(Array.from(expandedTodos)));
  }, [expandedTodos]);

  const addTodo = () => {
    if (inputValue.trim() !== '') {
      const newTodo = {
        id: Date.now(),
        text: inputValue.trim(),
        completed: false,
        priority: priority,
        dueDate: dueDate || null,
        category: category || 'General',
        createdAt: new Date().toISOString(),
        subtasks: []
      };
      setTodos([...todos, newTodo]);
      setInputValue('');
      setDueDate('');
      setCategory('');
    }
  };

  const toggleTodo = (id) => {
    setTodos(
      todos.map((todo) => {
        if (todo.id === id) {
          // If the todo has subtasks, mark all subtasks as completed when the main task is completed
          const updatedSubtasks = todo.subtasks.map(subtask => ({
            ...subtask,
            completed: !todo.completed
          }));
          return { ...todo, completed: !todo.completed, subtasks: updatedSubtasks };
        }
        return todo;
      })
    );
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id));
    // Remove from expanded state if deleted
    if (expandedTodos.has(id)) {
      const newExpanded = new Set(expandedTodos);
      newExpanded.delete(id);
      setExpandedTodos(newExpanded);
    }
  };

  const startEdit = (todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const saveEdit = (id) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, text: editText.trim() } : todo
      )
    );
    setEditingId(null);
    setEditText('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setCategory(newCategory.trim());
      setNewCategory('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      if (editingId) {
        saveEdit(editingId);
      } else {
        addTodo();
      }
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  const toggleExpand = (id) => {
    const newExpanded = new Set(expandedTodos);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedTodos(newExpanded);
  };

  // Subtask functions
  const addSubtask = (parentId, subtaskText, subtaskPriority = 'medium', subtaskDueDate = null, subtaskCategory = '') => {
    if (subtaskText.trim() === '') return;
    
    const newSubtask = {
      id: Date.now(),
      text: subtaskText.trim(),
      completed: false,
      priority: subtaskPriority,
      dueDate: subtaskDueDate || null,
      category: subtaskCategory || 'General',
      createdAt: new Date().toISOString()
    };
    
    setTodos(todos.map(todo => {
      if (todo.id === parentId) {
        return { ...todo, subtasks: [...todo.subtasks, newSubtask] };
      }
      return todo;
    }));
    
    // Expand the parent task when adding a subtask
    if (!expandedTodos.has(parentId)) {
      const newExpanded = new Set(expandedTodos);
      newExpanded.add(parentId);
      setExpandedTodos(newExpanded);
    }
  };

  const toggleSubtask = (parentId, subtaskId) => {
    setTodos(todos.map(todo => {
      if (todo.id === parentId) {
        const updatedSubtasks = todo.subtasks.map(subtask => {
          if (subtask.id === subtaskId) {
            return { ...subtask, completed: !subtask.completed };
          }
          return subtask;
        });
        
        // Check if all subtasks are completed
        const allSubtasksCompleted = updatedSubtasks.length > 0 && 
          updatedSubtasks.every(subtask => subtask.completed);
        
        return { 
          ...todo, 
          subtasks: updatedSubtasks,
          completed: allSubtasksCompleted ? true : todo.completed
        };
      }
      return todo;
    }));
  };

  const deleteSubtask = (parentId, subtaskId) => {
    setTodos(todos.map(todo => {
      if (todo.id === parentId) {
        const updatedSubtasks = todo.subtasks.filter(subtask => subtask.id !== subtaskId);
        return { ...todo, subtasks: updatedSubtasks };
      }
      return todo;
    }));
  };

  const editSubtask = (parentId, subtaskId, newText) => {
    setTodos(todos.map(todo => {
      if (todo.id === parentId) {
        const updatedSubtasks = todo.subtasks.map(subtask => {
          if (subtask.id === subtaskId) {
            return { ...subtask, text: newText.trim() };
          }
          return subtask;
        });
        return { ...todo, subtasks: updatedSubtasks };
      }
      return todo;
    }));
  };

  const filteredTodos = todos
    .filter(todo => {
      if (filter === 'active') return !todo.completed;
      if (filter === 'completed') return todo.completed;
      return true;
    })
    .filter(todo => 
      todo.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      todo.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      todo.subtasks.some(subtask => 
        subtask.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subtask.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

  const stats = {
    total: todos.length,
    completed: todos.filter(t => t.completed).length,
    active: todos.filter(t => !t.completed).length,
    totalSubtasks: todos.reduce((acc, todo) => acc + todo.subtasks.length, 0),
    completedSubtasks: todos.reduce((acc, todo) => 
      acc + todo.subtasks.filter(subtask => subtask.completed).length, 0)
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>✨ Elegant Todo</h1>
        
        {/* Stats */}
        <div className="stats">
          <span>Total: {stats.total}</span>
          <span>Active: {stats.active}</span>
          <span>Completed: {stats.completed}</span>
          {stats.totalSubtasks > 0 && (
            <span>Subtasks: {stats.completedSubtasks}/{stats.totalSubtasks}</span>
          )}
        </div>

        {/* Search and Filter */}
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search todos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Add Todo Form */}
        <div className="input-container">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="What needs to be done?"
            className="todo-input"
          />
          
          <div className="form-row">
            <select 
              value={priority} 
              onChange={(e) => setPriority(e.target.value)}
              className="priority-select"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="date-input"
            />
          </div>

          <div className="form-row">
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="category-select"
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            
            <div className="add-category">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="New category"
                className="new-category-input"
              />
              <button onClick={addCategory} className="add-category-btn">
                +
              </button>
            </div>
          </div>

          <button onClick={addTodo} className="add-btn">
            Add Todo
          </button>
        </div>

        {/* Todo List */}
        <div className="todo-list">
          {filteredTodos.length === 0 ? (
            <p className="empty-state">
              {searchTerm || filter !== 'all' 
                ? 'No matching todos found.' 
                : 'No todos yet. Add one above!'}
            </p>
          ) : (
            filteredTodos.map((todo) => (
              <div 
                key={todo.id} 
                className={`todo-item ${todo.completed ? 'completed' : ''} ${isOverdue(todo.dueDate) ? 'overdue' : ''}`}
              >
                <div className="todo-content">
                  {editingId === todo.id ? (
                    <div className="edit-form">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') saveEdit(todo.id);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="edit-input"
                        autoFocus
                      />
                      <div className="edit-actions">
                        <button onClick={() => saveEdit(todo.id)} className="save-btn">
                          Save
                        </button>
                        <button onClick={cancelEdit} className="cancel-btn">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="todo-main">
                        <div className="todo-header">
                          <span 
                            className="todo-text" 
                            onClick={() => toggleTodo(todo.id)}
                          >
                            {todo.text}
                          </span>
                          {todo.subtasks.length > 0 && (
                            <button 
                              className="expand-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(todo.id);
                              }}
                              title={expandedTodos.has(todo.id) ? "Collapse subtasks" : "Expand subtasks"}
                            >
                              {expandedTodos.has(todo.id) ? '▼' : '▶'}
                            </button>
                          )}
                        </div>
                        <div className="todo-meta">
                          {todo.category && (
                            <span className="todo-category">
                              {todo.category}
                            </span>
                          )}
                          {todo.dueDate && (
                            <span className={`todo-due ${isOverdue(todo.dueDate) ? 'overdue-date' : ''}`}>
                              {new Date(todo.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          {todo.subtasks.length > 0 && (
                            <span className="subtask-count">
                              {todo.subtasks.filter(st => st.completed).length}/{todo.subtasks.length} subtasks
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="todo-actions">
                        <span 
                          className="priority-indicator"
                          style={{ backgroundColor: getPriorityColor(todo.priority) }}
                          title={`Priority: ${todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}`}
                        />
                        <button 
                          className="edit-btn" 
                          onClick={() => startEdit(todo)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button 
                          className="delete-btn" 
                          onClick={() => deleteTodo(todo.id)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Subtasks Section */}
                {todo.subtasks.length > 0 && expandedTodos.has(todo.id) && (
                  <div className="subtasks-container">
                    {todo.subtasks.map(subtask => (
                      <div 
                        key={subtask.id} 
                        className={`subtask-item ${subtask.completed ? 'completed' : ''} ${isOverdue(subtask.dueDate) ? 'overdue' : ''}`}
                      >
                        <div className="subtask-content">
                          <span 
                            className="subtask-text" 
                            onClick={() => toggleSubtask(todo.id, subtask.id)}
                          >
                            {subtask.text}
                          </span>
                          <div className="subtask-meta">
                            {subtask.category && (
                              <span className="subtask-category">
                                {subtask.category}
                              </span>
                            )}
                            {subtask.dueDate && (
                              <span className={`subtask-due ${isOverdue(subtask.dueDate) ? 'overdue-date' : ''}`}>
                                {new Date(subtask.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <div className="subtask-actions">
                            <span 
                              className="priority-indicator"
                              style={{ backgroundColor: getPriorityColor(subtask.priority) }}
                              title={`Priority: ${subtask.priority.charAt(0).toUpperCase() + subtask.priority.slice(1)}`}
                            />
                            <button 
                              className="edit-btn" 
                              onClick={() => {
                                const newText = prompt('Edit subtask:', subtask.text);
                                if (newText !== null) {
                                  editSubtask(todo.id, subtask.id, newText);
                                }
                              }}
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button 
                              className="delete-btn" 
                              onClick={() => deleteSubtask(todo.id, subtask.id)}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Add Subtask Form */}
                    <div className="add-subtask-form">
                      <input
                        type="text"
                        placeholder="Add a subtask..."
                        className="subtask-input"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.target;
                            if (input.value.trim() !== '') {
                              addSubtask(todo.id, input.value);
                              input.value = '';
                            }
                          }
                        }}
                      />
                      <button 
                        className="add-subtask-btn"
                        onClick={() => {
                          const input = document.querySelector(`#subtask-input-${todo.id}`);
                          if (input && input.value.trim() !== '') {
                            addSubtask(todo.id, input.value);
                            input.value = '';
                          }
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </header>
    </div>
  );
}

export default App;