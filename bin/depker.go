package main

import (
	"archive/zip"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

func extract(source, destination string) ([]string, error) {
	r, err := zip.OpenReader(source)
	if err != nil {
		return nil, err
	}

	defer func() {
		if err := r.Close(); err != nil {
			panic(err)
		}
	}()

	err = os.MkdirAll(destination, 0755)
	if err != nil {
		return nil, err
	}

	var extractedFiles []string
	for _, f := range r.File {
		err := extractAndWriteFile(destination, f)
		if err != nil {
			return nil, err
		}

		extractedFiles = append(extractedFiles, f.Name)
	}

	return extractedFiles, nil
}

func extractAndWriteFile(destination string, f *zip.File) error {
	rc, err := f.Open()
	if err != nil {
		return err
	}
	defer func() {
		if err := rc.Close(); err != nil {
			panic(err)
		}
	}()

	path := filepath.Join(destination, f.Name)
	if !strings.HasPrefix(path, filepath.Clean(destination)+string(os.PathSeparator)) {
		return fmt.Errorf("%s: illegal file path", path)
	}

	if f.FileInfo().IsDir() {
		err = os.MkdirAll(path, f.Mode())
		if err != nil {
			return err
		}
	} else {
		err = os.MkdirAll(filepath.Dir(path), f.Mode())
		if err != nil {
			return err
		}

		f, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
		if err != nil {
			return err
		}
		defer func() {
			if err := f.Close(); err != nil {
				panic(err)
			}
		}()

		_, err = io.Copy(f, rc)
		if err != nil {
			return err
		}
	}

	return nil
}

func version() (string, error) {
	// get version
	c := http.Client{CheckRedirect: func(req *http.Request, via []*http.Request) error {
		return errors.New("not allow redirect, get location")
	}}
	r, err := c.Head("https://github.com/denoland/deno/releases/latest")

	version := ""

	if err != nil && r.StatusCode == http.StatusFound {
		location, err := r.Location()
		if err != nil {
			return "", err
		}
		paths := strings.Split(location.Path, "/")
		version = paths[len(paths)-1]
	} else if err != nil {
		return "", err
	} else if r.StatusCode >= 400 {
		return "", errors.New(fmt.Sprintf("request failed, status code %d", r.StatusCode))
	}
	if version == "" {
		return "", errors.New("not found version")
	}

	return version, nil
}

func path() (string, error) {
	dir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "depker", "bin"), nil
}

func file() (string, error) {
	path, err := path()
	if err != nil {
		return "", err
	}
	name := "deno"
	//goland:noinspection GoBoolExpressions
	if runtime.GOOS == "windows" {
		name = "deno.exe"
	}
	return filepath.Join(path, name), nil
}

func installed() (bool, error) {
	path, err := file()
	if err != nil {
		return false, err
	}
	_, err = os.Stat(path)
	return !errors.Is(err, os.ErrNotExist), nil
}

func download() error {
	fmt.Println("deno not found, installing...")

	// get latest version
	fmt.Println("searching deno latest version")
	version, err := version()
	if err != nil {
		return err
	}

	// get url
	url := ""
	switch runtime.GOOS {
	case "windows":
		url = fmt.Sprintf("https://github.com/denoland/deno/releases/download/%s/deno-x86_64-pc-windows-msvc.zip", version)
	case "darwin":
		name := "deno-x86_64-apple-darwin.zip"
		//goland:noinspection GoBoolExpressions
		if runtime.GOARCH == "arm" {
			name = "deno-aarch64-apple-darwin.zip"
		}
		url = fmt.Sprintf("https://github.com/denoland/deno/releases/download/%s/%s", version, name)
	default:
		url = fmt.Sprintf("https://github.com/denoland/deno/releases/download/%s/deno-x86_64-unknown-linux-gnu.zip", version)
	}

	// download zip
	fmt.Println("downloading deno zip to temp")
	r, err := http.Get(url)
	if err != nil {
		return err
	}
	defer func() {
		if err := r.Body.Close(); err != nil {
			panic(err)
		}
	}()

	// store zip to temp
	temp, err := os.CreateTemp("", "deno")
	if err != nil {
		return err
	}
	_, err = io.Copy(temp, r.Body)
	if err != nil {
		return err
	}

	// unzip
	fmt.Println("extract deno zip to binary")
	path, err := path()
	if err != nil {
		return err
	}
	_, err = extract(temp.Name(), path)
	return err
}

func install() error {
	installed, err := installed()
	if err != nil {
		return err
	}
	if installed {
		return nil
	}
	return download()
}

func main() {
	// ensure deno install
	err := install()
	if err != nil {
		panic(err)
	}

	// path
	path, err := file()
	if err != nil {
		panic(err)
	}
	cwd, err := os.Getwd()
	if err != nil {
		panic(err)
	}

	// upgrade
	if os.Args[1] == "upgrade" {
		err = os.Remove(path)
		if err != nil {
			panic(err)
		}
		return
	}

	// run deno
	args := []string{"run", "-q", "-A", "https://github.com/syfxlin/depker/raw/master/src/index.ts"}
	cmd := exec.Command(path, append(args, os.Args[1:]...)...)
	cmd.Dir = cwd
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err = cmd.Run()
	if err != nil {
		panic(err)
	}
}
