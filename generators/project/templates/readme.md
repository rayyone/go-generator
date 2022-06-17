## New to Golang?

Read this first if you're new to Go Language:
[https://golang.org/doc/code.html](https://golang.org/doc/code.html)

### Install

Run `ry app [appname]`

Replace go-core if needed, add this line to go.mod file

```
replace github.com/rayyone/go-core => ../../go-core
```

```
go mod tidy && go mod vendor
```

Generate Swagger

```
./bash/swagger.sh
```

Wire dependencies

```
./bash/wire.sh
```

Generate Redocly

```
./bash/redocly.sh
```

Run local

```
air
```

### API Documents

#### Swagger

Run `./bash/swagger.sh` to generate swagger doc files.

Then access http://localhost:port/ba/swagger/index.html

#### Redocly

Run `./bash/redocly.sh`

#### Postman (How to use)

Import `docs/swagger.json` to a new postman collection

If you want to update the authorization to Bearer in postman:

1. Export the above postman collection to a json file
2. Make a global replacement to type "auth"
3. Import this collection again

## Commands

### Database

### Seeder

Run all seeders:

```
go run cmd/seeder/main.go
```

Run particular seed function:

```
go run cmd/seeder/main.go [functionName]
```

Refresh seeders:

```
go run cmd/seeder/main.go refresh
```

Truncate all tables!!:

```
go run cmd/seeder/main.go flush
```

## Upgrade a dependency

```
go list -mod=mod -m -u github.com/swaggo/swag
```

```
go get -v -u github.com/swaggo/swag@v1.8.2
```

or

```
go get -v -u github.com/swaggo/swag@latest
```

```
go mod tidy && go mod vendor
```

## Install Libvip (MacOs): (To handle image processing)

https://github.com/libvips/libvips/wiki/Build-for-macOS

- brew install vips
- export PKG_CONFIG_PATH=/usr/local/opt/openssl/lib/pkgconfig:/usr/local/opt/libffi/lib/pkgconfig:/usr/local/lib/pkgconfig:/usr/lib/pkgconfig
- export CGO_CFLAGS_ALLOW="-Xpreprocessor"
- Verify with running this following command:

```
  vips --version
  pkg-config vips --libs
```

## Troubleshooting

If you get error `filepath.Walk():too many open file` when try to compile / build, try to run this before compiling / building go files:

```
$ ulimit -n 10000
$ sudo sysctl -w kern.maxfiles=20480
$ sudo sysctl -w kern.maxfilesperproc=18000
```

If you get error when generate swagger. Try to update swaggo CLI to their latest version

```
go get -u github.com/swaggo/swag/cmd/swag@latest
```
