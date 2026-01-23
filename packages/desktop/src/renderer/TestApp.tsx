import React from 'react';

export function TestApp(): React.ReactElement {
    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            backgroundColor: '#0F0B1A',
            color: '#E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '20px'
        }}>
            <h1>Spayce Test</h1>
            <p>If you see this, React is rendering correctly</p>
            <button
                onClick={() => console.log('Button clicked!')}
                style={{
                    padding: '10px 20px',
                    backgroundColor: '#6D5AE6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                }}
            >
                Test Button
            </button>
        </div>
    );
}
