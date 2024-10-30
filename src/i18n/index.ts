import de from './de.json'
import en from './en.json'

const localeMappings = {
	'de': de,
	'en': en
}

export default {
	locales: Object.keys(localeMappings),
	localeMappings,
	defaultLocale: 'en'
}
