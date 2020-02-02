import * as S from '../packages/sinuous/module/sinuous'
import * as O from '../packages/sinuous/module/observable'

const Sinuous = {...S, ...O}

export const {html, o, root, subscribe, computed, createContext, getContext} = Sinuous;