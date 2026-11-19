const SERVER_PROBLEM = 'The server is not reachable or had a problem, so photos cannot be checked right now. Please try again in a moment.'

async function request(url, options) {
  let response
  try {
    response = await fetch(url, options)
  } catch {
    throw new Error(SERVER_PROBLEM)
  }
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    if (typeof body?.detail === 'string') throw new Error(body.detail)
    throw new Error(response.status >= 500 ? SERVER_PROBLEM : `Something went wrong (error ${response.status}).`)
  }
  if (body === null) throw new Error(SERVER_PROBLEM)
  return body
}

/** The model the server has loaded: name, classes, whether it is trained, the confidence threshold. */
export function getInfo() {
  return request('/api/info')
}

/** Send one photo; the server answers with the status, the top classes, the photo and the heatmap. */
export function predict(file) {
  const form = new FormData()
  form.append('file', file, file.name || 'photo.jpg')
  return request('/api/predict', { method: 'POST', body: form })
}

/**
 * Phone photos are often 3-5 MB. Shrink them to at most `maxSide` pixels before uploading,
 * which makes the upload fast on mobile data. The model only uses 224 x 224 pixels anyway.
 */
export async function shrinkImage(file, maxSide = 1024) {
  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file // the browser cannot read it; let the server decide
  }
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  if (scale === 1 && file.size < 1_500_000) {
    bitmap.close()
    return file
  }
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
  return blob ? new File([blob], 'photo.jpg', { type: 'image/jpeg' }) : file
}
