
Object.defineProperty(exports, "__esModule", { value: true });

const {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError,
  NotFoundError,
  getPrismaClient,
  sqltag,
  empty,
  join,
  raw,
  skip,
  Decimal,
  Debug,
  objectEnumValues,
  makeStrictEnum,
  Extensions,
  warnOnce,
  defineDmmfProperty,
  Public,
  getRuntime
} = require('./runtime/wasm.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = PrismaClientKnownRequestError;
Prisma.PrismaClientUnknownRequestError = PrismaClientUnknownRequestError
Prisma.PrismaClientRustPanicError = PrismaClientRustPanicError
Prisma.PrismaClientInitializationError = PrismaClientInitializationError
Prisma.PrismaClientValidationError = PrismaClientValidationError
Prisma.NotFoundError = NotFoundError
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = sqltag
Prisma.empty = empty
Prisma.join = join
Prisma.raw = raw
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = Extensions.getExtensionContext
Prisma.defineExtension = Extensions.defineExtension

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}





/**
 * Enums
 */
exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  password: 'password',
  emailVerified: 'emailVerified',
  image: 'image',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AccountScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  provider: 'provider',
  providerAccountId: 'providerAccountId',
  token_type: 'token_type',
  refresh_token: 'refresh_token',
  access_token: 'access_token',
  expires_at: 'expires_at',
  scope: 'scope',
  id_token: 'id_token',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  sessionToken: 'sessionToken',
  accessToken: 'accessToken',
  expires: 'expires',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.VerificationRequestScalarFieldEnum = {
  id: 'id',
  identifier: 'identifier',
  token: 'token',
  expires: 'expires',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RepositoryScalarFieldEnum = {
  id: 'id',
  repoId: 'repoId',
  owner: 'owner',
  name: 'name',
  fullName: 'fullName',
  description: 'description',
  language: 'language',
  stars: 'stars',
  forks: 'forks',
  issues: 'issues',
  ownerAvatar: 'ownerAvatar',
  topics: 'topics',
  size: 'size',
  url: 'url',
  homepage: 'homepage',
  license: 'license',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  lastFetchedAt: 'lastFetchedAt'
};

exports.Prisma.SavedRepositoryScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  repositoryId: 'repositoryId',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};


exports.Prisma.ModelName = {
  User: 'User',
  Account: 'Account',
  Session: 'Session',
  VerificationRequest: 'VerificationRequest',
  Repository: 'Repository',
  SavedRepository: 'SavedRepository'
};
/**
 * Create the Client
 */
const config = {
  "generator": {
    "name": "edge",
    "provider": {
      "fromEnvVar": null,
      "value": "prisma-client-js"
    },
    "output": {
      "value": "C:\\Websites\\sourceseekr - Copy\\prisma\\generated\\edge",
      "fromEnvVar": null
    },
    "config": {
      "engineType": "library"
    },
    "binaryTargets": [
      {
        "fromEnvVar": null,
        "value": "windows",
        "native": true
      }
    ],
    "previewFeatures": [
      "driverAdapters"
    ],
    "sourceFilePath": "C:\\Websites\\sourceseekr - Copy\\prisma\\schema.prisma",
    "isCustomOutput": true
  },
  "relativeEnvPaths": {
    "rootEnvPath": null,
    "schemaEnvPath": "../../../.env"
  },
  "relativePath": "../..",
  "clientVersion": "5.22.0",
  "engineVersion": "605197351a3c8bdd595af2d2a9bc3025bca48ea2",
  "datasourceNames": [
    "db"
  ],
  "activeProvider": "postgresql",
  "postinstall": false,
  "inlineDatasources": {
    "db": {
      "url": {
        "fromEnvVar": "DATABASE_URL",
        "value": null
      }
    }
  },
  "inlineSchema": "// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.lyly/d/prisma-schema\n\ngenerator client {\n  provider        = \"prisma-client-js\"\n  // Keep your existing binaryTargets\n  binaryTargets   = [\"native\", \"windows\", \"debian-openssl-3.0.x\", \"rhel-openssl-1.0.x\", \"linux-musl-openssl-3.0.x\"]\n  previewFeatures = [\"driverAdapters\"] // Add this line for modern bundler compatibility\n}\n\n// Add this new generator for the Edge-compatible client\ngenerator edge {\n  provider        = \"prisma-client-js\"\n  output          = \"./generated/edge\" // Generate it into a separate folder\n  engineType      = \"library\"\n  previewFeatures = [\"driverAdapters\"] // Also add this line here\n}\n\ndatasource db {\n  provider = \"postgresql\"\n  url      = env(\"DATABASE_URL\")\n}\n\nmodel User {\n  id                String            @id @default(uuid())\n  name              String\n  email             String?           @unique\n  password          String?\n  emailVerified     DateTime?         @map(\"email_verified\")\n  image             String?\n  createdAt         DateTime          @default(now())\n  updatedAt         DateTime          @updatedAt\n  accounts          Account[]\n  sessions          Session[]\n  savedRepositories SavedRepository[]\n\n  @@map(\"users\")\n}\n\nmodel Account {\n  id                String   @id @default(cuid())\n  userId            String   @map(\"user_id\")\n  type              String\n  provider          String\n  providerAccountId String   @map(\"provider_account_id\")\n  token_type        String?\n  refresh_token     String?  @db.Text\n  access_token      String?  @db.Text\n  expires_at        Int?\n  scope             String?\n  id_token          String?  @db.Text\n  createdAt         DateTime @default(now())\n  updatedAt         DateTime @updatedAt\n  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([provider, providerAccountId])\n  @@map(\"accounts\")\n}\n\nmodel Session {\n  id           String   @id @default(cuid())\n  userId       String?  @map(\"user_id\")\n  sessionToken String   @unique @map(\"session_token\") @db.Text\n  accessToken  String?  @map(\"access_token\") @db.Text\n  expires      DateTime\n  user         User?    @relation(fields: [userId], references: [id], onDelete: Cascade)\n  createdAt    DateTime @default(now())\n  updatedAt    DateTime @updatedAt\n\n  @@map(\"sessions\")\n}\n\nmodel VerificationRequest {\n  id         String   @id @default(cuid())\n  identifier String\n  token      String   @unique\n  expires    DateTime\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n\n  @@unique([identifier, token])\n}\n\nmodel Repository {\n  id            String            @id @default(uuid())\n  repoId        Int               @unique @map(\"repo_id\")\n  owner         String\n  name          String\n  fullName      String            @unique @map(\"full_name\")\n  description   String?           @db.Text\n  language      String?\n  stars         Int               @default(0)\n  forks         Int               @default(0)\n  issues        Int               @default(0)\n  ownerAvatar   String?           @map(\"owner_avatar\") @db.Text\n  topics        String[]\n  size          Int               @default(0)\n  url           String            @db.Text\n  homepage      String?           @db.Text\n  license       String?\n  createdAt     DateTime          @default(now())\n  updatedAt     DateTime          @updatedAt\n  lastFetchedAt DateTime          @default(now()) @map(\"last_fetched_at\")\n  savedBy       SavedRepository[]\n\n  @@index([language])\n  @@index([stars])\n  @@map(\"repositories\")\n}\n\nmodel SavedRepository {\n  id           String     @id @default(uuid())\n  userId       String     @map(\"user_id\")\n  repositoryId String     @map(\"repository_id\")\n  notes        String?    @db.Text\n  createdAt    DateTime   @default(now())\n  updatedAt    DateTime   @updatedAt\n  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)\n  repository   Repository @relation(fields: [repositoryId], references: [id], onDelete: Cascade)\n\n  @@unique([userId, repositoryId])\n  @@index([userId])\n  @@map(\"saved_repositories\")\n}\n",
  "inlineSchemaHash": "ccdfb00972646150a6778a73d2799112305923e01b3f8d5da9778e71020a6e49",
  "copyEngine": true
}
config.dirname = '/'

config.runtimeDataModel = JSON.parse("{\"models\":{\"User\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"email\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"password\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"emailVerified\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"email_verified\"},{\"name\":\"image\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"accounts\",\"kind\":\"object\",\"type\":\"Account\",\"relationName\":\"AccountToUser\"},{\"name\":\"sessions\",\"kind\":\"object\",\"type\":\"Session\",\"relationName\":\"SessionToUser\"},{\"name\":\"savedRepositories\",\"kind\":\"object\",\"type\":\"SavedRepository\",\"relationName\":\"SavedRepositoryToUser\"}],\"dbName\":\"users\"},\"Account\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\",\"dbName\":\"user_id\"},{\"name\":\"type\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"provider\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"providerAccountId\",\"kind\":\"scalar\",\"type\":\"String\",\"dbName\":\"provider_account_id\"},{\"name\":\"token_type\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"refresh_token\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"access_token\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"expires_at\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"scope\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"id_token\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"AccountToUser\"}],\"dbName\":\"accounts\"},\"Session\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\",\"dbName\":\"user_id\"},{\"name\":\"sessionToken\",\"kind\":\"scalar\",\"type\":\"String\",\"dbName\":\"session_token\"},{\"name\":\"accessToken\",\"kind\":\"scalar\",\"type\":\"String\",\"dbName\":\"access_token\"},{\"name\":\"expires\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"SessionToUser\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":\"sessions\"},\"VerificationRequest\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"identifier\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"token\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"expires\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null},\"Repository\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"repoId\",\"kind\":\"scalar\",\"type\":\"Int\",\"dbName\":\"repo_id\"},{\"name\":\"owner\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"fullName\",\"kind\":\"scalar\",\"type\":\"String\",\"dbName\":\"full_name\"},{\"name\":\"description\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"language\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"stars\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"forks\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"issues\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"ownerAvatar\",\"kind\":\"scalar\",\"type\":\"String\",\"dbName\":\"owner_avatar\"},{\"name\":\"topics\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"size\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"url\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"homepage\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"license\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"lastFetchedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"last_fetched_at\"},{\"name\":\"savedBy\",\"kind\":\"object\",\"type\":\"SavedRepository\",\"relationName\":\"RepositoryToSavedRepository\"}],\"dbName\":\"repositories\"},\"SavedRepository\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\",\"dbName\":\"user_id\"},{\"name\":\"repositoryId\",\"kind\":\"scalar\",\"type\":\"String\",\"dbName\":\"repository_id\"},{\"name\":\"notes\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"SavedRepositoryToUser\"},{\"name\":\"repository\",\"kind\":\"object\",\"type\":\"Repository\",\"relationName\":\"RepositoryToSavedRepository\"}],\"dbName\":\"saved_repositories\"}},\"enums\":{},\"types\":{}}")
defineDmmfProperty(exports.Prisma, config.runtimeDataModel)
config.engineWasm = {
  getRuntime: () => require('./query_engine_bg.js'),
  getQueryEngineWasmModule: async () => {
    const loader = (await import('#wasm-engine-loader')).default
    const engine = (await loader).default
    return engine 
  }
}

config.injectableEdgeEnv = () => ({
  parsed: {
    DATABASE_URL: typeof globalThis !== 'undefined' && globalThis['DATABASE_URL'] || typeof process !== 'undefined' && process.env && process.env.DATABASE_URL || undefined
  }
})

if (typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined) {
  Debug.enable(typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined)
}

const PrismaClient = getPrismaClient(config)
exports.PrismaClient = PrismaClient
Object.assign(exports, Prisma)

