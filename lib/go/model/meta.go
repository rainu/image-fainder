package model

import "net/url"

const (
	v1MetaKeyDimension = "d"
	v1MetaKeyUri       = "u"
)

type DumpEntryMeta map[string]interface{}

func (d DumpEntryMeta) GetEmbeddingDimension() int {
	if d[v1MetaKeyDimension] == nil {
		return 0
	}

	// check type
	if _, ok := d[v1MetaKeyDimension].(float64); !ok {
		return 0
	}

	return int(d[v1MetaKeyDimension].(float64))
}

func (d DumpEntryMeta) SetEmbeddingDimension(dim int) DumpEntryMeta {
	d[v1MetaKeyDimension] = float64(dim)
	return d
}

func (d DumpEntryMeta) GetUri() string {
	if d[v1MetaKeyUri] == nil {
		return ""
	}

	// check type
	if _, ok := d[v1MetaKeyUri].(string); !ok {
		return ""
	}

	return d[v1MetaKeyUri].(string)
}

func (d DumpEntryMeta) SetUri(uri string) DumpEntryMeta {
	d[v1MetaKeyUri] = uri
	return d
}

func (d DumpEntryMeta) SetFile(localFile interface{ AsUri() string }) DumpEntryMeta {
	return d.SetUri(localFile.AsUri())
}

func (d DumpEntryMeta) GetLocalFile() *LocalFile {
	parsed, err := url.Parse(d.GetUri())
	if err != nil {
		return nil
	}

	if parsed.Scheme != "file" {
		return nil
	}
	return &LocalFile{
		DirectoryName: parsed.Host,
		FileName:      parsed.Path[1:], // remove leading '/'
	}
}

func (d DumpEntryMeta) GetRemoteFile() *RemoteFile {
	parsed, err := url.Parse(d.GetUri())
	if err != nil {
		return nil
	}

	if parsed.Scheme == "file" {
		return nil
	}

	result := &RemoteFile{}
	if parsed.RawFragment != "" {
		result.Collection = parsed.RawFragment
	}
	if parsed.Fragment != "" {
		result.Collection = parsed.Fragment
	}

	parsed.RawFragment = ""
	parsed.Fragment = ""
	result.URL = parsed.String()

	return result
}
