package imagefainder

import (
	"fmt"
	"github.com/rainu/image-fainder/lib/go/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"io"
	"os"
	"testing"
)

func TestDumpIo(t *testing.T) {
	tempFile, err := os.CreateTemp("", "test")
	require.NoError(t, err)
	defer os.Remove(tempFile.Name())

	testWriter := NewDumpWriter(tempFile)

	for i := 0; i < 5; i++ {
		err := testWriter.Write(model.DumpEntry{
			Meta: model.DumpEntryMeta{}.
				SetFile(model.LocalFile{
					DirectoryName: "images",
					FileName:      fmt.Sprintf("test_%d.jpg", i),
				}),
			Embedding: []float32{1.0 + float32(i), 2.0 + float32(i), 3.0 + float32(i)},
		})
		assert.NoError(t, err)
	}
	for i := 0; i < 5; i++ {
		err := testWriter.Write(model.DumpEntry{
			Meta: model.DumpEntryMeta{}.
				SetFile(model.RemoteFile{
					Collection: "images",
					URL:        fmt.Sprintf("http://example.org/test_%d.jpg", i),
				}),
			Embedding: []float32{1.0 + float32(i), 2.0 + float32(i), 3.0 + float32(i)},
		})
		assert.NoError(t, err)
	}

	_, err = tempFile.Seek(0, 0)
	require.NoError(t, err)

	testReader := NewDumpReader(tempFile)
	for i := 0; i < 5; i++ {
		entry, err := testReader.Read()
		assert.NoError(t, err)
		assert.Equal(t, model.DumpEntry{
			Meta: model.DumpEntryMeta{}.
				SetFile(model.LocalFile{
					DirectoryName: "images",
					FileName:      fmt.Sprintf("test_%d.jpg", i),
				}).
				SetEmbeddingDimension(3),
			Embedding: []float32{1.0 + float32(i), 2.0 + float32(i), 3.0 + float32(i)},
		}, *entry)
		assert.Equal(t, model.LocalFile{
			DirectoryName: "images",
			FileName:      fmt.Sprintf("test_%d.jpg", i),
		}, *entry.Meta.GetLocalFile())
		assert.Nil(t, entry.Meta.GetRemoteFile())
	}
	for i := 0; i < 5; i++ {
		entry, err := testReader.Read()
		assert.NoError(t, err)
		assert.Equal(t, model.DumpEntry{
			Meta: model.DumpEntryMeta{}.
				SetFile(model.RemoteFile{
					Collection: "images",
					URL:        fmt.Sprintf("http://example.org/test_%d.jpg", i),
				}).
				SetEmbeddingDimension(3),
			Embedding: []float32{1.0 + float32(i), 2.0 + float32(i), 3.0 + float32(i)},
		}, *entry)
		assert.Equal(t, model.RemoteFile{
			Collection: "images",
			URL:        fmt.Sprintf("http://example.org/test_%d.jpg", i),
		}, *entry.Meta.GetRemoteFile())
		assert.Nil(t, entry.Meta.GetLocalFile())
	}
	_, err = testReader.Read()
	assert.Equal(t, err, io.EOF)
}
