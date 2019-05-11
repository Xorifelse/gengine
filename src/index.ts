import { lstatSync, readdirSync, readFileSync } from 'fs'
import { join, parse, basename } from 'path'

import 'reflect-metadata' // required for the use of decorators

import { Action, createKoaServer } from 'routing-controllers'

import { ApolloServer } from 'apollo-server-koa'
import { makeExecutableSchema, mergeSchemas } from 'graphql-tools'

import { Prisma } from 'prisma-binding'

import { debug } from './lib/common'
import { verify, getToken } from './lib/jwt'

const isDirectory = (path: string): boolean => {
  return lstatSync(path).isDirectory()
}

const isResolver = (path: string): boolean => {
  return /modules\/[a-z].+\/(?:query|mutation|subscription)\./.test(path)
}

const isSchema = (path: string): boolean => {
  return /schema\.(?:gql|graphql)/.test(basename(path))
}

const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const walkDirectory = (path: string): string[] => {
  return readdirSync(path).map(source => join(path, source))
}

const getModules = (): string[] => {
  return walkDirectory('./src/modules').filter(isDirectory)
}

const loadSchema = (path: string): string => readFileSync(path, 'utf8')

const loadResolver = (path: string): Promise<any> =>
  import('../' + path).then(resolver => ({
    [capitalize(parse(path).name)]: resolver.default,
  }))

const makeModuleSchema = async (path: string) =>
  makeExecutableSchema({
    typeDefs: walkDirectory(path)
      .filter(isSchema)
      .map(schema => loadSchema(schema)),
    resolvers: await Promise.all(
      walkDirectory(path)
        .filter(isResolver)
        .map(file => loadResolver(file))
    )
      .then(resolvers => {
        const [...resolver] = resolvers
        return resolver
      })
      .catch(err => {
        throw new Error(err)
      }),
  })

const makeModulesSchema = async () =>
  mergeSchemas({
    schemas: await Promise.all(getModules().map(mod => makeModuleSchema(mod))).catch(
      err => {
        throw new Error(err)
      }
    ),
  })

const start = async () => {
  const schema = await makeModulesSchema()

  const prisma = new Prisma({
    typeDefs: 'generated/prisma.graphql',
    endpoint: process.env.PRISMA_ENDPOINT,
    debug: !!process.env.DEBUG,
    secret: process.env.PRISMA_SECRET,
  })

  const apollo = new ApolloServer({
    schema,
    context: ({ ctx: ctx }) => {
      return {
        ...ctx,
        user: ctx.state.user,
        prisma,
      }
    },
    subscriptions: {
      onConnect: (...params) => {
        console.table('onConnect: ', params)
      },
      onDisconnect: (...params) => {
        console.table('onDisconnect: ', params)
      },
    },

    playground: {
      endpoint: process.env.APOLLO_PLAYGROUND,
    },
  })

  const koaLogger = (ctx: any, next: (err?: any) => Promise<any>): Promise<any> => {
    const { request, response } = ctx
    const { method, url } = request
    const { status, message, header, body } = response

    debug(
      `\x1b[33m[koa]\x1b[0m [${new Date().toLocaleString()}]`,
      `📞 "${method}"`,
      `🔗 "${url}"`,
      (status < 400 ? '✅' : '⚠️') + ` "${status}"`,
      `💬 "${message}"`,
      `\n🔑 ${JSON.stringify(header)}`,
      `\n📂 ${JSON.stringify(body)}`
    )

    return next().catch(error => {
      console.error(error)
    })
  }

  const addCtx = async (ctx: any, next: (err?: any) => Promise<any>): Promise<any> => {
    ctx.hi = 'test'
    return await next()
  }

  const koa = createKoaServer({
    cors: true,
    controllers: [__dirname + '/controllers/*.ts'],
    authorizationChecker: (action: Action) => {
      try {
        return !!verify(getToken(action.request.header.authorization))
      } catch (e) {
        throw new Error('Not Authorized!')
      }
    },
    currentUserChecker: async (action: Action) => {
      try {
        const { id } = verify(getToken(action.request.header.authorization))
        return id
      } catch (e) {
        return undefined
      }
    },
  })

  koa.use(addCtx)
  koa.use(koaLogger)

  const http = koa.listen({ port: process.env.KOA_PORT }, () => {
    console.log(` 🌐 Http server ready at ${process.env.KOA_ENDPOINT}`)
    console.log(` 🌐 Graphql playground is ready at ${process.env.APOLLO_ENDPOINT}`)
  })

  apollo.applyMiddleware({ app: koa })
  apollo.installSubscriptionHandlers(http)
}

start()
