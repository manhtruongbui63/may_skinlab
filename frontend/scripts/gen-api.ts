#!/usr/bin/env tsx
/**
 * API Code Generation Script
 * 
 * Usage: pnpm gen
 * 
 * Generates TypeScript types from OpenAPI spec
 */

import { execSync } from 'child_process'
import fs from 'fs'

const API_SPEC = 'api-contracts/api.json'
const TYPES_OUTPUT = 'shared/types/api.ts'
const ZOD_OUTPUT = 'shared/lib/api-guards.ts'

console.log('🚀 Generating API code from OpenAPI spec...\n')

// Check if api.json exists
if (!fs.existsSync(API_SPEC)) {
  console.error(`❌ ${API_SPEC} not found!`)
  process.exit(1)
}

// Generate TypeScript types
console.log('📦 Generating TypeScript types...')
try {
  execSync(`npx openapi-typescript ${API_SPEC} -o ${TYPES_OUTPUT}`, { 
    stdio: 'inherit',
    cwd: process.cwd()
  })
  console.log(`✅ Types written to ${TYPES_OUTPUT}\n`)
} catch {
  console.error('❌ Failed to generate types')
  process.exit(1)
}

// Generate Zod schemas (optional)
console.log('🛡️  Generating Zod schemas...')
try {
  execSync(`npx openapi-zod-client ${API_SPEC} -o ${ZOD_OUTPUT}`, { 
    stdio: 'inherit',
    cwd: process.cwd()
  })
  console.log(`✅ Zod schemas written to ${ZOD_OUTPUT}\n`)
} catch {
  console.log('⚠️  Zod generation skipped (tool may not be installed)\n')
}

// Check for schema changes
console.log('🔍 Checking for changes...')
const typesContent = fs.readFileSync(TYPES_OUTPUT, 'utf-8')
const endpoints = typesContent.match(/"\/[a-z/]+":\s*\{/g) || []
const schemas = typesContent.match(/"\w+Resource":|"\w+Request":/g) || []

console.log(`   Found ${endpoints.length} endpoints`)
console.log(`   Found ${schemas.length} schemas\n`)

console.log('✨ Generation complete!')
console.log('\n📋 Next steps:')
console.log('   1. Review shared/types/api.ts for new/changed types')
console.log('   2. Update Zod schemas in shared/schemas/')
console.log('   3. Update service files in shared/services/')
console.log('   4. Update hooks in shared/hooks/')
console.log('\n💡 Tip: Use "satisfies z.ZodType<components[\'schemas\'][\'Xxx\']>" to prevent type drift')
