import { useSeoMeta } from "@unhead/react";
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useSeoMeta({
    title: "404 — Page Not Found | OursulaChat",
    description: "The page you are looking for could not be found.",
  });

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-6">
      <div className="size-16 rounded-2xl bg-brand-indigo/10 flex items-center justify-center mb-6">
        <Lock className="size-8 text-brand-indigo" />
      </div>
      <h1 className="text-5xl font-display font-bold mb-2">404</h1>
      <p className="text-lg text-muted-foreground mb-8">This page doesn't exist.</p>
      <div className="flex gap-3">
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/">Home</Link>
        </Button>
        <Button asChild className="rounded-full">
          <Link to="/app">Open app</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
