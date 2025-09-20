// app/api/debug/database/route.ts - DEBUG ENDPOINT
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET() {
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      tables: {},
      errors: []
    }

    // Test each table
    const tables = [
      'clients',
      'service_requests', 
      'payments',
      'portfolio_projects',
      'admin_users'
    ]

    for (const table of tables) {
      try {
        console.log(`Testing table: ${table}`)
        
        // Try to get the table structure and sample data
        const { data, error, count } = await supabaseAdmin
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (error) {
          results.tables[table] = {
            exists: false,
            error: error.message,
            code: error.code
          }
          results.errors.push(`${table}: ${error.message}`)
        } else {
          results.tables[table] = {
            exists: true,
            count: count || 0,
            status: 'ok'
          }

          // Get sample record to see structure
          if (count && count > 0) {
            const { data: sample } = await supabaseAdmin
              .from(table)
              .select('*')
              .limit(1)
              .single()

            if (sample) {
              results.tables[table].sampleFields = Object.keys(sample)
            }
          }
        }
      } catch (err: any) {
        results.tables[table] = {
          exists: false,
          error: err.message,
          critical: true
        }
        results.errors.push(`${table}: Critical error - ${err.message}`)
      }
    }

    // Test specific relationships
    try {
      const { data: serviceRequestsWithClients, error: joinError } = await supabaseAdmin
        .from('service_requests')
        .select(`
          id,
          title,
          clients (
            id,
            name,
            email
          )
        `)
        .limit(1)

      if (joinError) {
        results.relationships = {
          service_requests_clients: {
            error: joinError.message,
            working: false
          }
        }
        results.errors.push(`Relationship error: ${joinError.message}`)
      } else {
        results.relationships = {
          service_requests_clients: {
            working: true,
            sample: serviceRequestsWithClients
          }
        }
      }
    } catch (err: any) {
      results.relationships = {
        service_requests_clients: {
          error: err.message,
          working: false
        }
      }
    }

    return NextResponse.json(results, { status: 200 })

  } catch (error: any) {
    console.error("Database debug error:", error)
    return NextResponse.json({
      error: "Failed to debug database",
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}