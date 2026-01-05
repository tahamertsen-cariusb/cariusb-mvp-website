'use client'

import { useCallback } from 'react'

const UPLOAD_URL = 'https://media-gateway-cariusb.tahamertsen.workers.dev/upload/image'
const MAX_FILE_SIZE = 50 * 1024 * 1024

export default function UploadClient() {
  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Only image files are allowed')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      alert('File too large')
      return
    }

    const res = await fetch(UPLOAD_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
        'x-user-id': '1',
        'x-project-id': '1',
      },
      body: file,
    })

    const data = await res.json()
    console.log('Uploaded:', data)
  }, [])

  const handleChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return
      await uploadFile(file)
    },
    [uploadFile]
  )

  return (
    <div>
      <section>
        <h2>Main Upload</h2>
        <input type="file" id="photoInputMain" accept="image/*" onChange={handleChange} />
      </section>
      <section>
        <h2>Toolbar Ref Image</h2>
        <input type="file" id="photoInputToolbar" accept="image/*" onChange={handleChange} />
      </section>
    </div>
  )
}
