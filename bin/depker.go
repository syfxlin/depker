package main

import (
	"errors"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

func main() {
	deno := deno()
	path := lookup()

	if len(os.Args) > 1 && os.Args[1] == "create" {
		create(deno, path, os.Args[2:]...)
		return
	}
	if len(os.Args) > 1 && os.Args[1] == "reload" {
		reload(deno, path, os.Args[2:]...)
		return
	}

	depker(deno, path, os.Args[1:]...)
}

func deno() string {
	deno, err := exec.LookPath("deno")
	if err == nil {
		return deno
	}
	home, err := os.UserHomeDir()
	if err != nil {
		panic(err)
	}
	if runtime.GOOS == "windows" {
		deno = filepath.Join(home, ".deno", "bin", "deno.exe")
		look, err := exec.LookPath(deno)
		if err == nil {
			return look
		}
		execute("powershell.exe", "-Command", "irm https://deno.land/install.ps1 | iex")
		return deno
	} else {
		deno = filepath.Join(home, ".deno", "bin", "deno")
		look, err := exec.LookPath(deno)
		if err == nil {
			return look
		}
		execute("sh", "-c", "curl -fsSL https://deno.land/install.sh | sh")
		return deno
	}
}

func lookup() string {
	dir, err := os.Getwd()
	if err != nil {
		panic(err)
	}
	paths := []string{
		filepath.Join(dir, "depker.config.ts"),
		filepath.Join(dir, "depker.config.js"),
		filepath.Join(dir, ".depker/depker.config.ts"),
		filepath.Join(dir, ".depker/depker.config.js"),
		filepath.Join(dir, ".depker/depker.ts"),
		filepath.Join(dir, ".depker/depker.js"),
		filepath.Join(dir, ".depker/config.ts"),
		filepath.Join(dir, ".depker/config.js"),
	}
	for _, path := range paths {
		if _, err := os.Stat(path); !errors.Is(err, os.ErrNotExist) {
			// Ref: https://github.com/sayjun0505/Golangvuln/blob/0c3dd31c3533348628b74edaa5230501afb69e29/internal/web/url.go
			if !filepath.IsAbs(path) {
				panic(errors.New("path is not absolute"))
			}
			u := url.URL{Scheme: "file"}
			if vol := filepath.VolumeName(path); vol != "" {
				if strings.HasPrefix(vol, `\\`) {
					path = filepath.ToSlash(path[2:])
					i := strings.IndexByte(path, '/')

					if i < 0 {
						u.Host = path
						u.Path = "/"
					} else {
						u.Host = path[:i]
						u.Path = filepath.ToSlash(path[i:])
					}
				} else {
					u.Path = "/" + filepath.ToSlash(path)
				}
			} else {
				u.Path = filepath.ToSlash(path)
			}
			return u.String()
		}
	}
	return "https://raw.githubusercontent.com/syfxlin/depker/master/mod.ts"
}

func create(deno string, path string, args ...string) {
	dir, err := os.Getwd()
	if err != nil {
		panic(err)
	}
	file, err1 := os.OpenFile(filepath.Join(dir, "depker.config.ts"), os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0755)
	if err1 != nil {
		panic(err1)
	}
	_, err2 := file.WriteString(strings.Join(
		[]string{
			"import { depker } from \"https://raw.githubusercontent.com/syfxlin/depker/master/mod.ts\";",
			"",
			"const app = depker();",
			"",
			"export default app;",
			"",
		},
		"\n",
	))
	if err2 != nil {
		panic(err2)
	}
	err3 := file.Close()
	if err3 != nil {
		panic(err3)
	}
}

func reload(deno string, path string, args ...string) {
	execute(deno, append([]string{"cache", "-r", path}, args...)...)
}

func depker(deno string, path string, args ...string) {
	file, err1 := os.CreateTemp("", "depker-cli-")
	if err1 != nil {
		panic(err1)
	}
	_, err2 := file.WriteString(strings.Join(
		[]string{
			"const depker = await import('" + path + "');",
			"if (typeof depker?.default?.execute === 'function') {",
			"  await depker.default.execute();",
			"} else if (typeof depker?.depker?.execute === 'function') {",
			"  await depker.depker.execute();",
			"} else if (typeof depker?.app?.execute === 'function') {",
			"  await depker.app.execute();",
			"} else if (typeof globalThis?.depker?.execute === 'function') {",
			"  await globalThis.depker.execute();",
			"} else if (typeof depker?.execute === 'function') {",
			"  await depker.execute();",
			"} else {",
			"  throw new ReferenceError('Missing depker instance! Ensure your config file does export the Site instance as default.');",
			"}",
		},
		"\n",
	))
	if err2 != nil {
		panic(err2)
	}
	err3 := file.Close()
	if err3 != nil {
		panic(err3)
	}
	execute(deno, append([]string{"run", "-A", file.Name()}, args...)...)
}

func execute(name string, args ...string) {
	cmd := exec.Command(name, args...)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		if code, ok := err.(*exec.ExitError); ok {
			os.Exit(code.ExitCode())
		}
		panic(err)
	}
}
