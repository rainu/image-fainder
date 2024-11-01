export type URI = string

export type ParsedURI = {
	readonly rawURI: URI
	readonly collection: string
	readonly name: string
} & (LocalFileURI | RemoteFileURI)
export type LocalFileURI = {
	readonly type: 'localFile'
	readonly directory: string
}
export type RemoteFileURI = {
	readonly type: 'remoteFile'
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
	} else if(url.protocol) {
		const ps = url.pathname.split('/')
		const uriWithoutHash = url.href.substring(0, url.href.length - url.hash.length)
		return {
			rawURI: uriWithoutHash,
			type: 'remoteFile',
			collection: url.hash.substring(1), // remove leading '#'
			name: ps[ps.length - 1], // last element
		}
	}

	return null
}

export const localFileURI = (directory: string, fileName: string) => `file://${directory}/${fileName}`
export const remoteFileURI = (collection: string, url: string) => {
	const urlObj = new URL(url)
	urlObj.hash = collection
	return urlObj.toString()
}