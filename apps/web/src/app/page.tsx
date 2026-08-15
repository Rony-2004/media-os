import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">AI Social OS</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Your AI-powered social media operating system. Create, schedule, and
          grow your online presence — all from one platform.
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/register"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 border rounded-md font-medium hover:bg-muted"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
