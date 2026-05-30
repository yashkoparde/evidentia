# Remote File Storage (evidence.md)

Currently, the app stores images as "Base64" strings (text). For production (images/videos), you must use a **Storage Bucket**.

## 1. The Strategy
1. **Frontend:** The user selects a file.
2. **Frontend:** You calculate the SHA-256 Hash locally.
3. **Storage:** You upload the raw file to `supabase.storage.from('artifacts')`.
4. **Database:** You save the *path* (URL) and the *Hash* to the `evidence` table.

## 2. Code implementation (Supabase Library)
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('YOUR_URL', 'YOUR_KEY')

async function uploadEvidence(file: File, userId: string) {
  // 1. Upload to storage
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random()}.${fileExt}`
  const filePath = `${userId}/${fileName}`

  let { error: uploadError } = await supabase.storage
    .from('evidence-vault')
    .upload(filePath, file)

  // 2. Get Public URL
  const { data } = supabase.storage
    .from('evidence-vault')
    .getPublicUrl(filePath)

  return data.publicUrl
}
```

## 3. Handling Large Files (Video)
For video, never try to generate thumbnails in the browser. Use a **Background Task** or an **Edge Function** to process the video once it hits the server, then update the `thumbnail_url` value in your database.
