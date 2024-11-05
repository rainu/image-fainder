package model

type RemoteFile struct {
	Collection string
	URL        string
}

func (r RemoteFile) AsUri() string {
	return r.URL + "#" + r.Collection
}
