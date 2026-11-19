import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  ChevronRight,
  CircleCheck,
  Flame,
  Image as ImageIcon,
  Microscope,
  RotateCcw,
  ScanEye,
  TriangleAlert,
} from 'lucide-react'
import { getDisease } from '../data/diseases.js'
import DiseaseInfo, { CareTips } from './DiseaseInfo.jsx'
import PhotoTips from './PhotoTips.jsx'

const percent = (p) => `${(p * 100).toFixed(1)}%`

// The same colours as the heatmap layer made by the server (_STOPS and _COLORS in app/backend/heatmap.py).
const HEAT_GRADIENT = 'linear-gradient(to right, rgb(253 224 71 / 0.25), #fde047 12%, #fb923c 40%, #ef4444 70%, #be123c)'

const VERDICTS = {
  disease: {
    icon: Microscope,
    label: 'Disease found',
    box: 'border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40',
    badge: 'bg-red-600',
    bar: 'bg-red-500',
  },
  healthy: {
    icon: CircleCheck,
    label: 'No disease found',
    box: 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/40',
    badge: 'bg-emerald-600',
    bar: 'bg-emerald-500',
  },
  uncertain: {
    icon: TriangleAlert,
    label: 'Not sure',
    box: 'border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40',
    badge: 'bg-amber-500',
    bar: 'bg-amber-500',
  },
}

function Meter({ value, color }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(value * 100, 1)}%` }} />
    </div>
  )
}

const VIEWS = [
  { id: 'focus', label: 'Focus', icon: ScanEye },
  { id: 'heatmap', label: 'Heatmap', icon: Flame },
  { id: 'photo', label: 'Photo', icon: ImageIcon },
]

// The server sends `focus` as a see-through PNG; used as a CSS mask it keeps only the looked-at parts.
const maskStyle = (url) => ({
  WebkitMaskImage: `url("${url}")`,
  maskImage: `url("${url}")`,
  WebkitMaskSize: '100% 100%',
  maskSize: '100% 100%',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
})

function ViewSwitch({ view, onChange }) {
  const index = VIEWS.findIndex((v) => v.id === view)
  return (
    <div className="relative mt-3 grid grid-cols-3 rounded-2xl bg-stone-100 p-1 text-sm font-medium dark:bg-stone-800">
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-xl bg-white shadow-sm transition-transform duration-300 ease-out motion-reduce:transition-none dark:bg-stone-950"
        style={{ transform: `translateX(${index * 100}%)` }}
      />
      {VIEWS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          aria-pressed={view === id}
          onClick={() => onChange(id)}
          className={`relative flex items-center justify-center gap-1.5 rounded-xl py-2 transition-colors ${
            view === id
              ? 'text-stone-900 dark:text-stone-100'
              : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
          }`}
        >
          <Icon size={15} /> {label}
        </button>
      ))}
    </div>
  )
}

function PhotoPanel({ image, focus, heatmap }) {
  const hasMap = Boolean(focus && heatmap)
  const [view, setView] = useState('focus')
  // Start as a plain photo and switch to the focus view right after the first paint, so it fades in.
  const [revealed, setRevealed] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setRevealed(true)))
    return () => cancelAnimationFrame(id)
  }, [])

  const shown = hasMap && revealed ? view : 'photo'
  const fade = 'transition duration-700 ease-out motion-reduce:transition-none'

  return (
    <div className="card p-3 md:sticky md:top-24">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-stone-900">
        <img
          src={image}
          alt="Your leaf photo"
          className={`absolute inset-0 size-full object-cover ${fade} ${
            shown === 'focus' ? 'brightness-[.42] saturate-[.35]' : ''
          }`}
        />
        {hasMap && (
          <>
            {/* Focus view: the parts the model looked at, in full colour with a soft glow. */}
            <div
              className={`absolute inset-0 ${fade} ${shown === 'focus' ? 'opacity-100' : 'opacity-0'}`}
              style={{ filter: 'drop-shadow(0 0 16px rgb(255 255 255 / 0.3))' }}
            >
              <img src={image} alt="" className="size-full object-cover brightness-110 saturate-125" style={maskStyle(focus)} />
            </div>

            {/* Heatmap view: the classic Grad-CAM colours. */}
            <img
              src={heatmap}
              alt=""
              className={`absolute inset-0 size-full ${fade} ${shown === 'heatmap' ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* One scan sweep while the focus view appears. */}
            {revealed && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 h-1/4 bg-linear-to-b from-transparent via-emerald-300/25 to-emerald-300/0 motion-safe:animate-sweep motion-reduce:hidden"
              >
                <span className="absolute inset-x-0 top-1/2 h-0.5 bg-emerald-300/80 shadow-[0_0_16px_4px] shadow-emerald-400/50" />
              </span>
            )}

            {shown !== 'photo' && (
              <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/15 backdrop-blur-md">
                <span className="size-1.5 rounded-full bg-emerald-400 motion-safe:animate-pulse" />
                {shown === 'focus' ? 'Where the model looked' : 'Grad-CAM heatmap'}
              </span>
            )}
          </>
        )}
      </div>

      {hasMap && (
        <>
          <ViewSwitch view={view} onChange={setView} />
          <div className="mt-3 px-1 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
            {view === 'heatmap' && (
              <div className="mb-2 flex items-center gap-2">
                <span>Less</span>
                <span className="h-2 flex-1 rounded-full" style={{ background: HEAT_GRADIENT }} />
                <span>More</span>
              </div>
            )}
            <p>
              {view === 'heatmap'
                ? 'The colour shows how much each part of the photo counted for the answer.'
                : 'The bright parts are where the model looked to make its decision; the rest is dimmed.'}{' '}
              It is a guide, not an exact outline of the disease.
            </p>
          </div>
        </>
      )}
    </div>
  )
}

function Verdict({ status, disease, confidence }) {
  const v = VERDICTS[status]
  const Icon = v.icon
  return (
    <section className={`rounded-3xl border p-5 ${v.box}`}>
      <div className="flex items-start gap-3">
        <span className={`grid size-11 shrink-0 place-items-center rounded-2xl text-white ${v.badge}`}>
          <Icon size={22} />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide uppercase opacity-70">{v.label}</p>
          <h2 className="text-2xl font-bold tracking-tight">
            {status === 'uncertain' ? 'Please retake the photo' : disease.name}
          </h2>
          {status === 'disease' && disease.cause && (
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">{disease.cause}</p>
          )}
        </div>
      </div>

      {status === 'uncertain' ? (
        <p className="mt-4 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          The model is only {percent(confidence)} sure of its best answer, which is too low to trust. Take a new photo
          following the tips below.
        </p>
      ) : (
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-sm">
            <span className="font-medium">Confidence</span>
            <span className="font-semibold tabular-nums">{percent(confidence)}</span>
          </div>
          <Meter value={confidence} color={v.bar} />
        </div>
      )}

      {status === 'disease' && disease.slug && (
        <Link
          to={`/diseases/${disease.slug}`}
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-red-700 hover:underline dark:text-red-300"
        >
          More about {disease.name} <ChevronRight size={16} />
        </Link>
      )}
    </section>
  )
}

function TopGuesses({ top, uncertain }) {
  return (
    <section className="card p-5">
      <h3 className="font-semibold">{uncertain ? 'Best guesses (not reliable)' : `Top ${top.length} answers`}</h3>
      <ul className="mt-3 space-y-3">
        {top.map((t) => (
          <li key={t.class_id}>
            <div className="mb-1 flex justify-between gap-3 text-sm">
              <span>{getDisease(t.class_id).name}</span>
              <span className="text-stone-500 tabular-nums dark:text-stone-400">{percent(t.probability)}</span>
            </div>
            <Meter value={t.probability} color="bg-stone-400 dark:bg-stone-500" />
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function ResultView({ result, onReset }) {
  const { status, prediction, top } = result
  const disease = getDisease(prediction.class_id)

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Result</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Checked in {(result.time_ms / 1000).toFixed(1)} s
          </p>
        </div>
        <button type="button" className="btn btn-secondary py-2.5" onClick={onReset}>
          <RotateCcw size={16} /> New photo
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 md:items-start">
        <PhotoPanel image={result.image} focus={result.focus} heatmap={result.heatmap} />

        <div className="space-y-4">
          <Verdict status={status} disease={disease} confidence={prediction.probability} />
          {status === 'disease' && <DiseaseInfo disease={disease} />}
          {status === 'healthy' && <CareTips items={disease.care ?? []} />}
          {status === 'uncertain' && <PhotoTips />}
          <TopGuesses top={top} uncertain={status === 'uncertain'} />
          <p className="px-1 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
            This result is a computer estimate from one photo, not a replacement for an agricultural expert. If many
            plants are affected, ask a local agricultural officer.
          </p>
          <button type="button" className="btn btn-primary w-full" onClick={onReset}>
            <RotateCcw size={18} /> Check another leaf
          </button>
        </div>
      </div>
    </div>
  )
}
