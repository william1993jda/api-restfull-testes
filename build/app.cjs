"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/app.ts
var app_exports = {};
__export(app_exports, {
  app: () => app
});
module.exports = __toCommonJS(app_exports);
var import_fastify = __toESM(require("fastify"), 1);

// src/env/index.ts
var import_dotenv = require("dotenv");
var import_zod = __toESM(require("zod"), 1);
if (process.env.NODE_ENV === "test") {
  (0, import_dotenv.config)({ path: ".env.test" });
} else {
  (0, import_dotenv.config)();
}
var envSchema = import_zod.default.object({
  NODE_ENV: import_zod.default.enum(["development", "production", "test"]).default("development"),
  DATABASE_CLIENT: import_zod.default.enum(["sqlite", "pg"]),
  DATABASE_URL: import_zod.default.string(),
  PORT: import_zod.default.coerce.number().default(3333)
});
var _env = envSchema.safeParse(process.env);
if (_env.success === false) {
  console.error("\u274C Invalid environment variables", _env.error.format());
  throw new Error("Invalid environment variables.");
}
var env = _env.data;

// src/database.ts
var import_knex = __toESM(require("knex"), 1);
var config2 = {
  client: env.DATABASE_CLIENT,
  connection: env.DATABASE_CLIENT === "sqlite" ? {
    filename: env.DATABASE_URL
  } : env.DATABASE_URL,
  useNullAsDefault: true,
  migrations: {
    extension: "ts",
    directory: "./db/migrations"
  }
};
var setupKnex = (0, import_knex.default)(config2);

// src/routes/transactions.ts
var import_zod2 = __toESM(require("zod"), 1);

// src/middlewares/check-session-id-exists.ts
async function checkSessionIdExists(request, reply) {
  const sessionId = request.cookies.sessionId;
  if (!sessionId) {
    return reply.status(401).send({
      error: "Unauthorized"
    });
  }
}

// src/routes/transactions.ts
var import_node_crypto = require("crypto");
async function transactrionsRoutes(app2) {
  app2.get("/", { preHandler: [checkSessionIdExists] }, async (request, reply) => {
    const { sessionId } = request.cookies;
    const transactions = await setupKnex("transactions").where({ session_id: sessionId }).select("*");
    return { transactions };
  });
  app2.get("/:id", { preHandler: [checkSessionIdExists] }, async (request) => {
    const { sessionId } = request.cookies;
    const getTransactionParamsSchema = import_zod2.default.object({
      id: import_zod2.default.string().uuid()
    });
    const { id } = getTransactionParamsSchema.parse(request.params);
    const transaction = await setupKnex("transactions").where({
      session_id: sessionId,
      id
    }).first();
    return { transaction };
  });
  app2.get("/summary", { preHandler: [checkSessionIdExists] }, async (request) => {
    const { sessionId } = request.cookies;
    const summary = await setupKnex("transactions").where({ session_id: sessionId }).sum("amount", { as: "amount" }).first();
    return { summary };
  });
  app2.post("/", async (request, reply) => {
    const createTransactionBodySchema = import_zod2.default.object({
      title: import_zod2.default.string(),
      amount: import_zod2.default.number(),
      type: import_zod2.default.enum(["credit", "debit"])
    });
    const { title, amount, type } = createTransactionBodySchema.parse(request.body);
    let sessionId = request.cookies.sessionId;
    if (!sessionId) {
      sessionId = (0, import_node_crypto.randomUUID)();
      reply.cookie("sessionId", sessionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7
        // 7 days
      });
    }
    await setupKnex("transactions").insert({
      id: (0, import_node_crypto.randomUUID)(),
      title,
      amount: type === "credit" ? amount : amount * -1,
      session_id: sessionId
    });
    return reply.status(201).send();
  });
}

// src/app.ts
var import_cookie = __toESM(require("@fastify/cookie"), 1);
var app = (0, import_fastify.default)();
app.register(import_cookie.default);
app.register(transactrionsRoutes, { prefix: "/transactions" });
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  app
});
