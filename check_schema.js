import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://wggiwxwfxhzhqbuxcwpb.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZ2l3eHdmeGh6aHFidXhjd3BiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNjk5NzgsImV4cCI6MjA5MDc0NTk3OH0.Mw9xrGEeKPCyd2L3RxiILV1MiEEjiyN4CK3Z1HpgOes"

const supabase = createClient(supabaseUrl, supabaseKey)

async function testInsert() {
  const email = `barber_test_${Math.floor(Math.random() * 100000)}@gmail.com`
  const password = "password123"
  
  console.log(`Signing up test user: ${email}...`)
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password
  })
  
  if (authError) {
    console.error("Auth Error:", authError)
    return
  }
  
  const user = authData.user
  console.log("User signed up successfully. ID:", user.id)
  
  // Try inserting with just user_id
  console.log("Attempting insert with only user_id...")
  const { data: insertData, error: insertError } = await supabase
    .from("haircuts")
    .insert({ user_id: user.id })
    .select()
  
  if (insertError) {
    console.error("Insert Error with only user_id:", insertError)
  } else {
    console.log("Insert Success! Row data:", insertData)
  }
}

testInsert().catch(console.error)
