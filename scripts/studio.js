// Node.js script to run Prisma Studio with default output path
// This works around the issue with custom output paths in Prisma Studio

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma');
const backupPath = schemaPath + '.backup';
const schemaRelativePath = 'prisma/schema.prisma';

// If backup exists, restore it first (in case schema was already modified)
if (fs.existsSync(backupPath)) {
  fs.copyFileSync(backupPath, schemaPath);
  console.log('✓ Restored schema from previous backup');
}

// Backup original schema
fs.copyFileSync(schemaPath, backupPath);
console.log('✓ Backed up schema file');

let studioProcess = null;

// Handle cleanup on exit
process.on('SIGINT', () => {
  restoreSchema();
  if (studioProcess) {
    studioProcess.kill();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  restoreSchema();
  if (studioProcess) {
    studioProcess.kill();
  }
  process.exit(0);
});

function restoreSchema() {
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, schemaPath);
    fs.unlinkSync(backupPath);
    console.log('\n✓ Schema restored to original');
  }
}

try {
  // Read the schema
  let content = fs.readFileSync(schemaPath, 'utf8');
  const originalContent = content;
  
  // Check if schema already has prisma-client-js (already modified)
  const hasPrismaClientJs = /provider\s*=\s*"prisma-client-js"/.test(content);
  const hasPrismaClient = /provider\s*=\s*"prisma-client"/.test(content);
  const hasOutput = /output\s*=\s*"[^"]*"/.test(content);
  
  // Modify schema to use prisma-client-js without output path
  if (hasPrismaClient && hasOutput) {
    // Case 1: Has prisma-client with output - change provider and remove output
    content = content.replace(
      /provider\s*=\s*"prisma-client"/g,
      'provider = "prisma-client-js"'
    );
    content = content.replace(
      /\s+output\s+=\s+"[^"]*"\s*\r?\n/g,
      '\n'
    );
    console.log('✓ Changed provider to prisma-client-js and removed custom output path');
  } else if (hasPrismaClient && !hasOutput) {
    // Case 2: Has prisma-client without output - just change provider
    content = content.replace(
      /provider\s*=\s*"prisma-client"/g,
      'provider = "prisma-client-js"'
    );
    console.log('✓ Changed provider to prisma-client-js');
  } else if (hasPrismaClientJs && hasOutput) {
    // Case 3: Has prisma-client-js with output - just remove output
    content = content.replace(
      /\s+output\s+=\s+"[^"]*"\s*\r?\n/g,
      '\n'
    );
    console.log('✓ Removed custom output path');
  } else if (hasPrismaClientJs && !hasOutput) {
    // Case 4: Already has prisma-client-js without output - no changes needed
    console.log('✓ Schema already configured for Prisma Studio (prisma-client-js, no custom output)');
  } else {
    console.warn('⚠ Warning: Could not detect generator configuration. Schema may be in unexpected format.');
  }
  
  // Write modified schema
  if (content !== originalContent) {
    fs.writeFileSync(schemaPath, content);
  }
  
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/cmsdb?schema=public';
    console.log('✓ Set DATABASE_URL');
  }
  
  // Generate Prisma Client with default output
  console.log('Generating Prisma Client with default output path...');
  try {
    execSync('npx prisma generate', { 
      stdio: 'inherit', 
      env: { ...process.env },
      cwd: projectRoot
    });
  } catch (generateError) {
    restoreSchema();
    throw generateError;
  }
  
  // Run Prisma Studio (this will block until Studio is closed)
  // Don't specify --schema flag, let prisma.config.ts handle it
  console.log('Starting Prisma Studio...');
  console.log('Press Ctrl+C to stop Prisma Studio and restore schema');
  execSync('npx prisma studio', { 
    stdio: 'inherit', 
    env: { ...process.env },
    cwd: projectRoot
  });
  
} catch (error) {
  console.error('\n✗ Error:', error.message);
  restoreSchema();
  process.exit(1);
}

// Restore schema when Studio exits normally
restoreSchema();

