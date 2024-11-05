package imagefainder

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"github.com/rainu/image-fainder/lib/go/model"
	"io"
)

type DumpWriter struct {
	headerWritten bool

	out io.WriteCloser
}

func NewDumpWriter(out io.WriteCloser) *DumpWriter {
	return &DumpWriter{
		out: out,
	}
}

func (d *DumpWriter) Write(entry model.DumpEntry) error {
	//v1:
	//[json-length][json][embedding]
	if !d.headerWritten {
		if err := d.writeHeader(); err != nil {
			return err
		}
		d.headerWritten = true
	}

	return d.writeEntry(entry)
}

func (d *DumpWriter) writeHeader() error {
	numberBytes := make([]byte, 4)

	//write magic number
	binary.BigEndian.PutUint32(numberBytes, uint32(magicNumber))
	if _, err := d.out.Write(numberBytes); err != nil {
		return fmt.Errorf("unable to write magic number: %w", err)
	}

	//write version
	binary.BigEndian.PutUint32(numberBytes, uint32(currentVersion))
	if _, err := d.out.Write(numberBytes); err != nil {
		return fmt.Errorf("unable to write version: %w", err)
	}

	return nil
}

func (d *DumpWriter) writeEntry(entry model.DumpEntry) error {
	//v1:
	//[json-length][json][embedding]

	entry.Meta.SetEmbeddingDimension(len(entry.Embedding))

	//write json length
	jsonBytes, err := json.Marshal(entry.Meta)
	if err != nil {
		return fmt.Errorf("unable to marshal meta-json: %w", err)
	}
	jsonLength := make([]byte, 4)
	binary.BigEndian.PutUint32(jsonLength, uint32(len(jsonBytes)))
	if _, err := d.out.Write(jsonLength); err != nil {
		return fmt.Errorf("unable to write meta-json length: %w", err)
	}

	//write json
	if _, err := d.out.Write(jsonBytes); err != nil {
		return fmt.Errorf("unable to write meta-json: %w", err)
	}

	//write embedding
	for _, f := range entry.Embedding {
		if err := binary.Write(d.out, binary.LittleEndian, f); err != nil {
			return fmt.Errorf("unable to write embedding: %w", err)
		}
	}

	return nil
}

func (d *DumpWriter) Close() error {
	return d.out.Close()
}
