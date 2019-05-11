import {
  Param,
  Body,
  Get,
  Post,
  Put,
  Delete,
  Ctx,
  Action,
  Controller,
} from 'routing-controllers'

import { User } from '@gql'

@Controller('/users')
export default class UserController {
  @Get('')
  all(@Ctx() ctx: Action) {
    return 'This action returns all users'
  }

  @Get('/:id')
  one(@Param('id') id: number) {
    return 'This action returns user #' + id
  }

  @Post('')
  post(@Body() user: User) {
    return 'Saving user...'
  }

  @Put('/:id')
  put(@Param('id') id: number, @Body() user: User) {
    return 'Updating a user...'
  }

  @Delete('/:id')
  remove(@Param('id') id: number) {
    return 'Removing user...'
  }
}
