package common

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
)

type JSONMap[T any] struct {
	Data T
}

func (j JSONMap[T]) Value() (driver.Value, error) {
	return json.Marshal(j.Data)
}

func (j *JSONMap[T]) Scan(value any) error {
	bytes, ok := value.([]byte)
	if !ok {
		asString, okString := value.(string)
		if !okString {
			return errors.New("error al escanear json: tipo incorrecto")
		}
		bytes = []byte(asString)
	}
	return json.Unmarshal(bytes, &j.Data)
}
