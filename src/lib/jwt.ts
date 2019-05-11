import * as jwt from 'jsonwebtoken'

export const secret = process.env.JWT_SECRET || 'Efiho*G*qbBoB3d8Qw{V2efwY6evCQ}b'
const expiresIn = 3600 * 4 // time to live

interface JwtPayload {
  id: number
}

export const sign = (data: JwtPayload) => {
  return jwt.sign(data, secret, { expiresIn })
}

export const verify = (token: string): JwtPayload => {
  return jwt.verify(token, secret) as JwtPayload
}

export const getToken = (authorization: string | undefined): string => {
  return authorization ? authorization.split('Bearer ')[1] : ''
}
