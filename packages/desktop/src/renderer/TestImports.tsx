import React from 'react';

// Test imports one by one to find the issue
export function TestImports(): React.ReactElement {
    const [stage, setStage] = React.useState(0);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        async function testImports() {
            try {
                // Stage 0: Basic React works (we're already here)
                if (stage === 0) {
                    console.log('Stage 0: Basic React rendering works ✓');
                    setStage(1);
                }

                // Stage 1: Try importing theme
                if (stage === 1) {
                    const { SpayceColors } = await import('@spayce/react-ui');
                    console.log('Stage 1: Theme import works ✓', SpayceColors);
                    setStage(2);
                }

                // Stage 2: Try importing types
                if (stage === 2) {
                    const { SpaceItemType } = await import('@spayce/react-ui');
                    console.log('Stage 2: Types import works ✓', SpaceItemType);
                    setStage(3);
                }

                // Stage 3: Try importing ContextMenu component
                if (stage === 3) {
                    const { ContextMenu } = await import('@spayce/react-ui');
                    console.log('Stage 3: ContextMenu import works ✓', ContextMenu);
                    setStage(4);
                }

                // Stage 4: Try importing Sidebar component
                if (stage === 4) {
                    const { Sidebar } = await import('@spayce/react-ui');
                    console.log('Stage 4: Sidebar import works ✓', Sidebar);
                    setStage(5);
                }

                // Stage 5: Try importing SpacesScreen component
                if (stage === 5) {
                    const { SpacesScreen } = await import('@spayce/react-ui');
                    console.log('Stage 5: SpacesScreen import works ✓', SpacesScreen);
                    setStage(6);
                }

            } catch (err: any) {
                console.error(`Stage ${stage} failed:`, err);
                setError(`Stage ${stage} failed: ${err.message}`);
            }
        }

        if (stage < 6) {
            testImports();
        }
    }, [stage]);

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            backgroundColor: '#0F0B1A',
            color: '#E5E7EB',
            padding: '40px',
            fontFamily: 'monospace'
        }}>
            <h1>Import Test Progress</h1>
            <div style={{ marginTop: '20px' }}>
                <p>✓ Stage 0: Basic React rendering</p>
                {stage >= 1 && <p>✓ Stage 1: Theme imports</p>}
                {stage >= 2 && <p>✓ Stage 2: Type imports</p>}
                {stage >= 3 && <p>✓ Stage 3: ContextMenu component</p>}
                {stage >= 4 && <p>✓ Stage 4: Sidebar component</p>}
                {stage >= 5 && <p>✓ Stage 5: SpacesScreen component</p>}
                {stage >= 6 && <p style={{ color: '#10B981', fontSize: '20px', marginTop: '20px' }}>✓ ALL IMPORTS SUCCESSFUL!</p>}
            </div>
            {error && (
                <div style={{
                    marginTop: '20px',
                    padding: '20px',
                    backgroundColor: '#EF4444',
                    borderRadius: '8px'
                }}>
                    <h2>Error Found:</h2>
                    <pre>{error}</pre>
                    <p style={{ marginTop: '10px' }}>Check browser console for details</p>
                </div>
            )}
        </div>
    );
}
