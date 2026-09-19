import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '../components/ui';

export default function NotFound() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-4">
      <div className="text-center">
        <p className="text-7xl font-bold text-slate-800">404</p>
        <h1 className="mt-4 flex items-center justify-center gap-2 text-xl font-semibold">
          <Compass size={20} /> This page took a wrong turn
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/dashboard">
            <Button>Go to dashboard</Button>
          </Link>
          <Link to="/feed">
            <Button variant="outline">Open the feed</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
