export default function PageHeader({ title, children }) {
  return (
    <div className="mb-6 sm:mb-8">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {children && <p className="mt-2 max-w-2xl text-stone-600 dark:text-stone-400">{children}</p>}
    </div>
  )
}
