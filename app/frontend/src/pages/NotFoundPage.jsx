import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 text-stone-600 dark:text-stone-400">This page does not exist.</p>
      <Link to="/" className="btn btn-primary mt-6">
        Check a leaf
      </Link>
    </div>
  )
}
