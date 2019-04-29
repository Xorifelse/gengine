import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'

import { Context } from '@interfaces/gql'

const JWT_SECRET = process.env.JWT_SECRET as string

export interface IMutationLoginArgs {
  email: string
  password: string
}

export const signup = async (parent: any, args: any, ctx: Context) => {
  return {
    token: 'world',
  }
  // const password = await bcrypt.hash(args.password, 10)
  // const user = await ctx.prisma.createUser({ ...args, password })

  // return {
  //   token: jwt.sign({ userId: user.id }, JWT_SECRET),
  //   user,
  // }
}

export const signin = async (parent: any, { email, password }: IMutationLoginArgs, ctx: Context) => {
  return {
    token: 'hello',
  }
  // const user = await ctx.prisma.user({ email })
  // if (!user) {
  //   throw new Error(`No such user found for email: ${email}`)
  // }

  // const valid = await bcrypt.compare(password, user.password)
  // if (!valid) {
  //   throw new Error('Invalid password')
  // }

  // return {
  //   token: jwt.sign({ userId: user.id }, JWT_SECRET),
  //   user,
  // }
}

export default {
  signin,
  signup,
}
