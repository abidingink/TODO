import React, { useState } from 'react';
import './App.css';

function App() {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');

  const addTodo = () => {
    if (inputValue.trim() !== '') {
      setTodos([
        ...todos,
        {
          id: Date.now(),
          text: inputValue,
          completed: false,
        },
      ]);
      setInputValue('');
    }
  };

  const toggleTodo = (id) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Simple Todo App</h1>
        <div className="input-container">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add a new todo..."
          />
          <button onClick={addTodo}>Add</button>
        </div>
        <div className="todo-list">
          {todos.map((todo) => (
            <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
              <span 
                className="todo-text" 
                onClick={() => toggleTodo(todo.id)}
              >
                {todo.text}
              </span>
              <button 
                className="delete-btn" 
                onClick={() => deleteTodo(todo.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
        {todos.length === 0 && (
          <p className="empty-state">No todos yet. Add one above!</p>
        )}
      </header>
    </div>
  );
}

export default App;