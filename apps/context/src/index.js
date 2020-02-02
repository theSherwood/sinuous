import {root} from '../../sinuous'
import attempt from './attempt1'

root(() => {
document.body.append(attempt());
})