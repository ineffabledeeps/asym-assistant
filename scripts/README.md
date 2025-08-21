# Database Management Scripts

This directory contains Node.js scripts for managing your database operations.

## Available Scripts

### JavaScript Version (`db.js`)
- **Usage**: `node scripts/db.js [command]`
- **Commands**:
  - `generate` - Generate new migration files
  - `migrate` - Run pending migrations
  - `studio` - Open Drizzle Studio
  - `push` - Push schema to database (development)
  - `drop` - Drop all tables (development only)
  - `check` - Check database connection
  - `help` - Show help message

### TypeScript Version (`db.ts`)
- **Usage**: `npx tsx scripts/db.ts [command]`
- **Commands**: Same as JavaScript version
- **Benefits**: Better type safety and modern ES modules

## Quick Start

1. **Check your environment**:
   ```bash
   npm run db:check
   # or
   npx tsx scripts/db.ts check
   ```

2. **Generate migrations**:
   ```bash
   npm run db:generate
   ```

3. **Run migrations**:
   ```bash
   npm run db:migrate
   ```

4. **Open Drizzle Studio**:
   ```bash
   npm run db:studio
   ```

## Environment Setup

Make sure you have a `.env.local` file in your project root with:

```bash
DATABASE_URL="postgresql://username:password@host:port/database"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_GENERATIVE_AI_API_KEY="your-api-key"
```

## NPM Scripts

The following npm scripts are available for convenience:

- `npm run db:check` - Check database connection
- `npm run db:generate` - Generate new migration files
- `npm run db:migrate` - Run pending migrations (with SSL bypass)
- `npm run db:studio` - Open Drizzle Studio
- `npm run db:push` - Push schema to database (development)
- `npm run db:drop` - Drop all tables (with confirmation)
- `npm run db:ts:check` - TypeScript version of check
- `npm run db:ts:generate` - TypeScript version of generate
- `npm run db:ts:migrate` - TypeScript version of migrate
- `npm run db:ts:studio` - TypeScript version of studio
- `npm run db:ts:push` - TypeScript version of push
- `npm run db:ts:drop` - TypeScript version of drop
- `npm run env:check` - Check environment configuration

## Safety Features

- **Environment Check**: Scripts verify `.env.local` exists and `DATABASE_URL` is set
- **Confirmation Prompts**: Dangerous operations like `drop` require explicit confirmation
- **Error Handling**: Comprehensive error handling with colored output
- **Validation**: Input validation and helpful error messages

## Examples

```bash
# Check if everything is set up correctly
npm run db:check

# Generate a new migration after schema changes
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Open Drizzle Studio for database inspection
npm run db:studio

# Push schema changes directly (development only)
npm run db:push
```

## Troubleshooting

1. **Missing .env.local**: Create the file with your database configuration
2. **Invalid DATABASE_URL**: Ensure your PostgreSQL connection string is correct
3. **Permission errors**: Make sure you have access to your database
4. **Migration conflicts**: Use `db:push` for development or resolve conflicts manually

## Development vs Production

- **Development**: Use `db:push` for quick schema updates
- **Production**: Always use `db:generate` and `db:migrate` for proper version control
- **Testing**: Use `db:drop` to reset your development database
