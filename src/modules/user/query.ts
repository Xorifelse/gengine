import { Context } from '@interfaces/gql'

export default {
  me(parent: any, args: any, ctx: Context) {
    return 'hello world!'
  },
}
