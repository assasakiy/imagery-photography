import { Component } from 'react';

function isChunkLoadError(error) {
    return /Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(error?.message || '');
}

export default class RouteErrorBoundary extends Component {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error) {
        if (isChunkLoadError(error) && typeof window !== 'undefined') {
            window.location.reload();
        }
    }

    render() {
        if (this.state.hasError) return null;
        return this.props.children;
    }
}