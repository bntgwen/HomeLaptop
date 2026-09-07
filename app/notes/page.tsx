import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server' 

async function NotesList() {
  const supabase = await createClient()
  const { data: notes } = await supabase.from('notes').select()
  
  return <pre>{JSON.stringify(notes, null, 2)}</pre>
}

export default function Page() {
  return (
    <div>
      <h1>My Notes</h1>
      <Suspense fallback={<p>Loading notes...</p>}>
        <NotesList />
      </Suspense>
    </div>
  )
}