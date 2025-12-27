import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Try a simple insert to the interviews table
    const testData = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      applicant_id: null,
      job_id: null,
      title: 'Test',
      position: 'Test',
      company: 'Test',
      client: 'Test',
      duration: 0,
      status: 'test',
      timestamp: new Date().toISOString(),
      skills: [],
      conversation: [],
      notes: 'Test'
    }

    const { data, error } = await supabaseAdmin
      .from('interviews')
      .insert([testData])
      .select()
      .single()

    if (error) {
      return Response.json({
        success: false,
        error: error.message,
        code: error.code,
        hint: error.hint,
        details: error.details
      })
    }

    // Delete test data
    await supabaseAdmin
      .from('interviews')
      .delete()
      .eq('id', testData.id)

    return Response.json({
      success: true,
      message: 'Interviews table exists and is writable',
      data: data
    })
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message,
      fullError: error
    }, { status: 500 })
  }
}
