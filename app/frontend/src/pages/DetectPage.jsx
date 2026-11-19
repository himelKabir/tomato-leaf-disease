import { useEffect, useState } from 'react'
import { CircleAlert, LoaderCircle } from 'lucide-react'
import { predict, shrinkImage } from '../api.js'
import ImagePicker from '../components/ImagePicker.jsx'
import PhotoTips from '../components/PhotoTips.jsx'
import ResultView from '../components/ResultView.jsx'

function Checking({ preview }) {
  return (
    <div className="card p-3">
      <div className="relative overflow-hidden rounded-2xl">
        <img src={preview} alt="Your leaf photo" className="aspect-square w-full object-cover" />
        <div className="absolute inset-0 bg-emerald-950/25" />
        <div className="absolute inset-x-0 h-1 bg-emerald-300 shadow-[0_0_24px_6px] shadow-emerald-400/70 motion-safe:animate-scan" />
      </div>
      <p className="flex items-center justify-center gap-2 py-4 font-medium" role="status">
        <LoaderCircle size={18} className="animate-spin" /> Checking the leaf…
      </p>
    </div>
  )
}

export default function DetectPage() {
  // phase: idle -> checking -> done, or error (the user can then pick another photo)
  const [state, setState] = useState({ phase: 'idle' })
  const preview = state.preview

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  async function check(file) {
    if (file.type && !file.type.startsWith('image/')) {
      setState({ phase: 'error', message: 'Please choose a photo (JPG or PNG).' })
      return
    }
    const url = URL.createObjectURL(file)
    setState({ phase: 'checking', preview: url })
    try {
      const result = await predict(await shrinkImage(file))
      setState({ phase: 'done', preview: url, result })
    } catch (err) {
      setState({ phase: 'error', message: err.message })
    }
  }

  if (state.phase === 'done') {
    return <ResultView result={state.result} onReset={() => setState({ phase: 'idle' })} />
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 text-center sm:mb-8">
        <p className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
          9 diseases and pests · results in seconds
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl">Is your tomato leaf healthy?</h1>
        <p className="mt-3 text-stone-600 text-pretty dark:text-stone-400">
          Take or upload a photo of one leaf. The app names the disease, shows which part of the leaf it is about, and
          tells you what to do.
        </p>
      </div>

      {state.phase === 'error' && (
        <p className="mb-4 flex gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200" role="alert">
          <CircleAlert size={18} className="mt-0.5 shrink-0" />
          {state.message}
        </p>
      )}

      {state.phase === 'checking' ? <Checking preview={preview} /> : <ImagePicker onFile={check} />}

      <h2 className="mt-8 mb-3 text-sm font-semibold text-stone-500 dark:text-stone-400">For the best result</h2>
      <PhotoTips />
    </div>
  )
}
