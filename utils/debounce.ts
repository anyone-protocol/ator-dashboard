import { debounce } from 'lodash'

export default (fn: (...args: any) => any) => {
  return debounce(fn, 300, { leading: true, trailing: false })
}
