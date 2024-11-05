package imagefainder

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"github.com/rainu/image-fainder/lib/go/model"
	"io"
)

type DumpReader struct {
	version int

	in io.ReadCloser
}

func NewDumpReader(in io.ReadCloser) *DumpReader {
	return &DumpReader{
		in:      in,
		version: -1,
	}
}

func (d *DumpReader) Version() int {
	return d.version
}

func (d *DumpReader) Read() (*model.DumpEntry, error) {
	if d.version == -1 {
		if err := d.readHeader(); err != nil {
			return nil, err
		}
	}

	switch d.version {
	case 1:
		return d.readV1()
	}

	return nil, fmt.Errorf("unsupported version")
}

func (d *DumpReader) readHeader() error {
	rawInt := make([]byte, 4)
	if _, err := d.in.Read(rawInt); err != nil {
		return fmt.Errorf("unable to read magic number: %w", err)
	}

	if magicNumber != int(binary.BigEndian.Uint32(rawInt)) {
		return fmt.Errorf("invalid magic number")
	}

	if _, err := d.in.Read(rawInt); err != nil {
		return fmt.Errorf("unable to read version: %w", err)
	}

	d.version = int(binary.BigEndian.Uint32(rawInt))
	return nil
}

func (d *DumpReader) readV1() (*model.DumpEntry, error) {
	//v1:
	//[json-length][json][embedding]

	rawInt := make([]byte, 4)
	if _, err := d.in.Read(rawInt); err != nil {
		if err == io.EOF {
			return nil, io.EOF
		}
		return nil, fmt.Errorf("unable to read json length: %w", err)
	}
	jsonLength := int(binary.BigEndian.Uint32(rawInt))

	pr, pw := io.Pipe()
	var pipeErr error
	go func() {
		defer pw.Close()

		pipeErr = d.pipeNextNBytes(jsonLength, pw)
	}()

	entry := &model.DumpEntry{}
	if err := json.NewDecoder(pr).Decode(&entry.Meta); err != nil {
		return nil, fmt.Errorf("unable to decode meta-json: %w", err)
	}
	if pipeErr != nil {
		return nil, fmt.Errorf("unable to read meta-json: %w", pipeErr)
	}

	entry.Embedding = make([]float32, entry.Meta.GetEmbeddingDimension())
	for i := 0; i < entry.Meta.GetEmbeddingDimension(); i++ {
		var f float32
		if err := binary.Read(d.in, binary.LittleEndian, &f); err != nil {
			return nil, fmt.Errorf("unable to read embedding: %w", err)
		}
		entry.Embedding[i] = f
	}

	return entry, nil
}

func (d *DumpReader) pipeNextNBytes(number int, pw *io.PipeWriter) error {
	buffer := make([]byte, 4096)
	remaining := number

	for remaining > 0 {
		n := len(buffer)
		if remaining < len(buffer) {
			n = remaining
		}

		r, err := d.in.Read(buffer[:n])
		if err != nil {
			return fmt.Errorf("unable to read next %d bytes: %w", n, err)
		}
		if r > 0 {
			_, err := pw.Write(buffer[:r])
			if err != nil {
				return fmt.Errorf("unable to write next %d bytes: %w", r, err)
			}
			remaining -= r
		}
	}

	return nil
}

func (d *DumpReader) Close() error {
	return d.in.Close()
}
