package model

import "fmt"

type LocalFile struct {
	DirectoryName string
	FileName      string
}

func (l LocalFile) AsUri() string {
	return fmt.Sprintf("file://%s/%s", l.DirectoryName, l.FileName)
}
