export type URI = string

export type ParsedURI = {
	readonly rawURI: URI
	readonly collection: string
	readonly name: string
} & LocalFileURI
export type LocalFileURI = {
	readonly type: 'localFile'
	readonly directory: string
}

export const parseURI = (uri: URI): ParsedURI | null => {
	const url = new URL(uri)
	if (url.protocol === 'file:') {
		return {
			rawURI: uri,
			type: 'localFile',
			collection: url.host,
			directory: url.host,
			name: url.pathname.substring(1), // remove leading '/'
		}
	}

	return null
}

export const localFileURI = (directory: string, fileName: string) => `file://${directory}/${fileName}`
