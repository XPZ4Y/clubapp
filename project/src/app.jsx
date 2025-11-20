import { render } from 'preact';
import { useState } from 'preact/hooks';

function App() {
    const [count, setCount] = useState(0);
    
    return (
        <div style={{ padding: '20px' }}>
            <h1>Preact App ({count})</h1>
            <button onClick={() => setCount(count + 1)}>
                Click me
            </button>
        </div>
    );
}

render(<App />, document.getElementById('root'));