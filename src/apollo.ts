import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { join } from 'path'

const typeDefs = join(process.cwd(), 'generated/prisma.graphql')
const tsTypes = join(process.cwd(), 'generated/graphql.ts')

@Module({
  imports: [
    GraphQLModule.forRoot({
      typeDefs,
      definitions: {
        path: tsTypes,
        outputAs: 'interface',
      },
      debug: true,
      playground: true,
    }),
  ],
})
export class ApplicationModule {}
