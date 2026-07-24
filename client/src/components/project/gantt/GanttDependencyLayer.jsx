export default function GanttDependencyLayer({ dependencyLines }) {
    return (
        <svg className="absolute top-12 left-0 right-0 bottom-0 pointer-events-none z-10 w-full h-full">
            <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
                </marker>
                <marker id="arrow-critical" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                </marker>
                <marker id="arrow-conflict" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                </marker>
            </defs>

            {dependencyLines.map((line) => {
                let strokeColor = '#3b82f6';
                let markerId = 'url(#arrow)';
                let strokeWidth = '2';

                if (line.isConflict) {
                    strokeColor = '#ef4444';
                    markerId = 'url(#arrow-conflict)';
                    strokeWidth = '2.5';
                } else if (line.isCritical) {
                    strokeColor = '#f59e0b';
                    markerId = 'url(#arrow-critical)';
                    strokeWidth = '2.5';
                }

                return (
                    <path
                        key={line.id}
                        d={line.d}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={line.isConflict ? '4 3' : 'none'}
                        markerEnd={markerId}
                        className="transition-all duration-300 opacity-80 hover:opacity-100"
                    />
                );
            })}
        </svg>
    );
}
