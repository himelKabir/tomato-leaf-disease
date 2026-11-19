import { useRef, useState } from 'react'
import { Camera, ImageUp, Leaf } from 'lucide-react'

// Phones and tablets get a "Take photo" button that opens the camera directly.
const isTouch = window.matchMedia('(pointer: coarse)').matches

export default function ImagePicker({ onFile }) {
  const cameraInput = useRef(null)
  const fileInput = useRef(null)
  const [dragging, setDragging] = useState(false)

  function pick(event) {
    const file = event.target.files?.[0]
    event.target.value = '' // so choosing the same photo again still counts
    if (file) onFile(file)
  }

  function drop(event) {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) onFile(file)
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false)
      }}
      onDrop={drop}
      className={`rounded-3xl border-2 border-dashed p-6 text-center transition sm:p-10 ${
        dragging
          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
          : 'border-stone-300 bg-white dark:border-stone-700 dark:bg-stone-900'
      }`}
    >
      <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
        <Leaf size={32} />
      </div>
      <p className="mt-4 text-lg font-semibold">Add a photo of one tomato leaf</p>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        {isTouch ? 'Take a photo now, or choose one from your gallery.' : 'Drag a photo here, or choose a file.'}
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {isTouch && (
          <button type="button" className="btn btn-primary" onClick={() => cameraInput.current.click()}>
            <Camera size={18} /> Take photo
          </button>
        )}
        <button
          type="button"
          className={`btn ${isTouch ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => fileInput.current.click()}
        >
          <ImageUp size={18} /> {isTouch ? 'Choose from gallery' : 'Choose a photo'}
        </button>
      </div>
      <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={pick} />
      <input ref={fileInput} type="file" accept="image/*" hidden onChange={pick} />
    </div>
  )
}
