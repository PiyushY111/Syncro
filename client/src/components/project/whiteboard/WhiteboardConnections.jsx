export default function WhiteboardConnections({ edges, nodes }) {
    const getNodeBox = (node) => {
        const width = node.type === 'task' ? 220 : (node.width || 150);
        const height = node.type === 'task' ? 120 : (node.height || 100);
        return {
            x: node.x,
            y: node.y,
            width,
            height,
            centerX: node.x + width / 2,
            centerY: node.y + height / 2
        };
    };

    return (
        <g>
            {edges.map((edge) => {
                const fromNode = nodes.find((n) => n.id === edge.fromId);
                const toNode = nodes.find((n) => n.id === edge.toId);
                if (!fromNode || !toNode) return null;

                const from = getNodeBox(fromNode);
                const to = getNodeBox(toNode);

                const dx = to.centerX - from.centerX;
                const dy = to.centerY - from.centerY;

                let startX, startY, endX, endY, cp1X, cp1Y, cp2X, cp2Y;
                const dist = Math.min(80, Math.hypot(dx, dy) * 0.35);

                if (Math.abs(dx) > Math.abs(dy)) {
                    // Horizontal connection
                    startX = dx > 0 ? from.x + from.width : from.x;
                    startY = from.centerY;
                    endX = dx > 0 ? to.x : to.x + to.width;
                    endY = to.centerY;
                    cp1X = startX + (dx > 0 ? dist : -dist);
                    cp1Y = startY;
                    cp2X = endX + (dx > 0 ? -dist : dist);
                    cp2Y = endY;
                } else {
                    // Vertical connection
                    startX = from.centerX;
                    startY = dy > 0 ? from.y + from.height : from.y;
                    endX = to.centerX;
                    endY = dy > 0 ? to.y : to.y + to.height;
                    cp1X = startX;
                    cp1Y = startY + (dy > 0 ? dist : -dist);
                    cp2X = endX;
                    cp2Y = endY + (dy > 0 ? -dist : dist);
                }

                return (
                    <path key={edge.id} d={`M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`} fill="none" stroke="#3b82f6" strokeWidth="2.5" markerEnd="url(#arrowhead)" className="transition-all opacity-80 hover:opacity-100" />
                );
            })}
        </g>
    );
}
