import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { BookOpen, Info, Leaf, Moon, ScanLine, ServerCrash, Sun, TriangleAlert } from 'lucide-react'
import { getInfo } from '../api.js'

const LINKS = [
  { to: '/', label: 'Detect', icon: ScanLine },
  { to: '/diseases', label: 'Diseases', icon: BookOpen },
  { to: '/about', label: 'About', icon: Info },
]

const BANNER_TONES = {
  amber: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-200',
  red: 'border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200',
}

function Banner({ tone, icon: Icon, children }) {
  return (
    <div className={`border-b ${BANNER_TONES[tone]}`}>
      <p className="mx-auto flex max-w-5xl gap-2 px-4 py-2.5 text-sm">
        <Icon size={18} className="mt-0.5 shrink-0" />
        <span>{children}</span>
      </p>
    </div>
  )
}

export default function Layout() {
  const [info, setInfo] = useState(null) // the loaded model, from the server
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const { pathname } = useLocation()

  useEffect(() => {
    getInfo().then(setInfo).catch((err) => setInfo({ error: err.message }))
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  function toggleTheme() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {
      // storage blocked: the choice lasts until the page is reloaded
    }
  }

  return (
    <div className="flex min-h-dvh flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:pb-0">
      <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-stone-50/85 backdrop-blur-md dark:border-stone-800/80 dark:bg-stone-950/85">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
          <NavLink to="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Leaf size={20} />
            </span>
            Tomato Leaf Check
          </NavLink>
          <nav className="ml-auto hidden items-center gap-1 sm:flex">
            {LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200'
                      : 'text-stone-600 hover:bg-stone-200/60 dark:text-stone-300 dark:hover:bg-stone-800'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="ml-auto grid size-10 place-items-center rounded-xl text-stone-600 transition hover:bg-stone-200/60 sm:ml-1 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            {dark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {info?.load_error && (
        <Banner tone="red" icon={ServerCrash}>
          <strong>The model file could not be loaded:</strong> {info.load_error} The app runs with an untrained
          placeholder until the file is fixed and the server restarted.
        </Banner>
      )}
      {info?.trained === false && !info.load_error && (
        <Banner tone="amber" icon={TriangleAlert}>
          <strong>Demo mode:</strong> no trained model is loaded yet, so the results are random. Put the trained
          model at <code className="font-mono break-all">{info.model_file ?? 'app/models/model.pt'}</code> and
          restart the server.
        </Banner>
      )}
      {info?.error && (
        <Banner tone="red" icon={ServerCrash}>
          {info.error}
        </Banner>
      )}

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-10">
        <Outlet context={info} />
      </main>

      <footer className="border-t border-stone-200 dark:border-stone-800">
        <p className="mx-auto max-w-5xl px-4 py-6 text-xs text-stone-500 dark:text-stone-400">
          Tomato Leaf Check · a university project. The results are computer estimates, not a replacement for an
          agricultural expert.
        </p>
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden dark:border-stone-800 dark:bg-stone-900/95">
        <div className="grid grid-cols-3">
          {LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-xs font-medium ${
                  isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-500 dark:text-stone-400'
                }`
              }
            >
              <Icon size={22} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
