import { useState } from 'react'
import { useOutletContext } from 'react-router'
import { results, trainingSets } from '../data/results.js'
import { gan } from '../data/gan.js'
import { getDisease } from '../data/diseases.js'
import LeafPhoto from '../components/LeafPhoto.jsx'
import PageHeader from '../components/PageHeader.jsx'

const MODELS = [
  ['Custom CNN', 'A small network built for this project, trained from scratch. Shows what a simple model reaches.'],
  ['VGG16', 'The classic deep convolutional network, pretrained on ImageNet.'],
  ['ResNet50', 'The standard strong model, pretrained on ImageNet.'],
  ['MobileNetV2', 'Small and fast, pretrained on ImageNet. The model this app uses.'],
]

const LIMITATIONS = [
  'The model learned from PlantVillage photos: single leaves on a plain background. On photos taken in a field, with many leaves, soil or strong shadows, it is much less accurate.',
  'It knows only these 10 classes. A leaf from another plant, or a problem not in the list, still gets one of the 10 answers, though often with low confidence.',
  'The highlighted area shows where the model looked. It is not an exact outline of the disease.',
  'It is a university project, not a replacement for an agricultural expert.',
]

function Section({ title, children }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-stone-700 dark:text-stone-300">{children}</div>
    </section>
  )
}

function Pending({ children }) {
  return (
    <p className="rounded-xl border border-dashed border-stone-300 px-4 py-3 text-stone-500 dark:border-stone-700 dark:text-stone-400">
      {children}
    </p>
  )
}

const asPercent = (value, digits = 1) =>
  typeof value === 'number' && value <= 1 ? `${(value * 100).toFixed(digits)}%` : String(value)

const THRESHOLD_SOURCES = {
  'model file': 'chosen on the validation split',
  'environment variable': 'set by CONFIDENCE_THRESHOLD',
  default: 'default value',
  placeholder: 'demo mode',
}

function ModelInUse({ info }) {
  if (!info) return <p>Loading…</p>
  if (info.error) return <p>{info.error}</p>
  const details = info.details ?? {}
  const rows = [
    ['Model', info.name],
    ...(details.training_images ? [['Trained on', details.training_images]] : []),
    ['Status', info.trained ? 'Trained' : 'Untrained placeholder (demo mode)'],
    ['Classes', info.classes.length],
    ['Input size', `${info.img_size} × ${info.img_size} px`],
    [
      '"Not sure" below',
      `${asPercent(info.confidence_threshold, 0)}${THRESHOLD_SOURCES[info.threshold_source] ? ` (${THRESHOLD_SOURCES[info.threshold_source]})` : ''}`,
    ],
    ...Object.entries(info.metrics ?? {}).map(([key, value]) => [key.replaceAll('_', ' '), asPercent(value, 2)]),
  ]
  return (
    <dl className="divide-y divide-stone-200 dark:divide-stone-800">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4 py-2">
          <dt className="text-stone-500 first-letter:uppercase dark:text-stone-400">{label}</dt>
          <dd className="text-right font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

const METRICS = [
  { id: 'macroF1', label: 'Macro-F1' },
  { id: 'accuracy', label: 'Accuracy' },
]

function ResultsTable() {
  const [metric, setMetric] = useState('macroF1')
  const models = MODELS.map(([name]) => name).filter((m) => results.some((r) => r.model === m))
  const sets = [...trainingSets, ...results.map((r) => r.images)].filter(
    (s, i, all) => all.indexOf(s) === i && results.some((r) => r.images === s),
  )
  const cell = (set, model) => results.find((r) => r.images === set && r.model === model)
  const best = Object.fromEntries(
    models.map((m) => [m, Math.max(...results.filter((r) => r.model === m).map((r) => r[metric]))]),
  )
  const multipleSets = sets.length > 1

  return (
    <div>
      <div className="mb-3 inline-flex rounded-xl bg-stone-100 p-1 text-xs font-medium dark:bg-stone-800" role="group">
        {METRICS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={metric === id}
            onClick={() => setMetric(id)}
            className={`rounded-lg px-3 py-1.5 transition ${
              metric === id
                ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-950 dark:text-stone-100'
                : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="-mx-1 overflow-x-auto">
        <table className="w-full min-w-[30rem] text-left">
          <thead className="text-stone-500 dark:text-stone-400">
            <tr>
              <th className="px-1 py-2 font-medium">Training images</th>
              {models.map((m) => (
                <th key={m} className="px-1 py-2 text-right font-medium">
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
            {sets.map((set, i) => (
              <tr key={set}>
                <td className="px-1 py-2">
                  <span className="mr-2 inline-grid size-5 place-items-center rounded-md bg-stone-100 text-xs font-semibold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                    {trainingSets.includes(set) ? 'ABCDEFGH'[trainingSets.indexOf(set)] : i + 1}
                  </span>
                  {set}
                </td>
                {models.map((m) => {
                  const r = cell(set, m)
                  const top = multipleSets && r && r[metric] === best[m]
                  const sd = r?.[`${metric}Sd`]
                  return (
                    <td
                      key={m}
                      className={`px-1 py-2 text-right tabular-nums ${top ? 'font-semibold text-emerald-700 dark:text-emerald-400' : ''}`}
                      title={typeof sd === 'number' ? `± ${(sd * 100).toFixed(2)} (sd of 3 seeds)` : undefined}
                    >
                      {r ? asPercent(r[metric], 2) : '–'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 px-1 text-xs text-stone-500 dark:text-stone-400">
        Measured on the test split (2,734 photos the models never saw in training), mean of 3 training runs
        {multipleSets ? '; the best value of each model is marked' : ''}. With so few mistakes, differences of about
        0.2 points are within the spread of the runs.
      </p>
    </div>
  )
}

function GanSamples() {
  if (!gan?.classes?.length) {
    return <Pending>Sample GAN images are added here after the GAN is trained (notebooks 03 and 05).</Pending>
  }
  return (
    <>
      <p>
        {gan.model}
        {gan.kimg ? `, trained on ${gan.kimg.toLocaleString()} thousand image views` : ''}. Every class with fewer
        than {gan.fillTarget.toLocaleString()} training photos was filled up to {gan.fillTarget.toLocaleString()} with
        generated images. A generated image was kept only if {gan.labelCheck ?? 'a trained model'} recognised it as its
        class. Below: a real training photo (left), then generated ones. KID compares generated and real images (lower
        is better).
      </p>
      <ul className="space-y-4">
        {gan.classes.map((c) => (
          <li key={c.id}>
            <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <span className="font-semibold text-stone-900 dark:text-stone-100">{c.name}</span>
              <span className="text-xs text-stone-500 tabular-nums dark:text-stone-400">
                {c.real.toLocaleString()} real + {c.generated.toLocaleString()} generated
                {typeof c.kid === 'number' ? ` · KID ${c.kid.toFixed(1)}` : ''}
                {typeof c.passRate === 'number' ? ` · ${Math.round(c.passRate * 100)}% passed the check` : ''}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              <div className="relative">
                <LeafPhoto disease={getDisease(c.id)} className="aspect-square w-full rounded-lg" />
                <span className="absolute bottom-1 left-1 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Real
                </span>
              </div>
              {c.samples.slice(0, 4).map((src) => (
                <img
                  key={src}
                  src={src}
                  alt={`${c.name}: generated by the GAN`}
                  loading="lazy"
                  className="aspect-square w-full rounded-lg object-cover"
                />
              ))}
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}

export default function AboutPage() {
  const info = useOutletContext()
  const threshold = info?.confidence_threshold

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title="About this app">
        A 10th-semester university project: deep learning models that detect tomato leaf diseases, a GAN that creates
        extra training images, and this web app.
      </PageHeader>

      <Section title="How it works">
        <ol className="list-decimal space-y-2 pl-5">
          <li>Your photo is cropped to a square and resized to 224 × 224 pixels.</li>
          <li>
            A deep learning model, trained on the PlantVillage dataset, gives a probability for each of the 10 classes.
          </li>
          <li>
            If the highest probability is below {threshold ? asPercent(threshold, 0) : 'a set level'}, the app says it
            is not sure instead of guessing.
          </li>
          <li>
            For a disease, Grad-CAM shows which parts of the leaf the model used for its answer: those parts stay
            bright and the rest of the photo is dimmed (or shown as a heatmap). The map is kept to the leaf, and on
            photos with a blurred background the blurred parts count less.
          </li>
          <li>The app shows the symptoms, treatment and prevention for that disease.</li>
        </ol>
      </Section>

      <Section title="The model in use">
        <ModelInUse info={info} />
      </Section>

      <Section title="Models compared">
        <p>
          Four models are trained with the same data split and settings, so the comparison is fair. Only the training
          images change from row to row.
        </p>
        <ul className="space-y-2">
          {MODELS.map(([name, text]) => (
            <li key={name}>
              <span className="font-semibold">{name}:</span> {text}
            </li>
          ))}
        </ul>
        {results.length > 0 ? <ResultsTable /> : <Pending>The results table is added after the models are trained.</Pending>}
      </Section>

      <Section title="Extra training images from a GAN">
        <p>
          The classes are unbalanced: Yellow leaf curl virus has about 5,400 photos, Mosaic virus fewer than 400. A
          class-conditional GAN learns from the training photos what each disease looks like and creates new photos for
          the small classes. The four models are then trained again with these images, and compared with training on
          real photos only, with ordinary augmentation (flips, rotation, zoom, brightness) and with simply repeating
          the photos of the small classes.
        </p>
        <GanSamples />
      </Section>

      <Section title="Limitations">
        <ul className="list-disc space-y-2 pl-5">
          {LIMITATIONS.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      </Section>
    </div>
  )
}
