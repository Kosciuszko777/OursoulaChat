import { Navigate } from 'react-router-dom';

/**
 * Legacy index route — redirects to the Landing page.
 * The actual landing page lives at Landing.tsx and is wired
 * directly in the router.
 */
const Index = () => <Navigate to="/" replace />;

export default Index;
