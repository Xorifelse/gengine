export const debug = (...params: any) => {
  if (!!process.env.DEBUG) {
    console.log(...params)
  }
}
