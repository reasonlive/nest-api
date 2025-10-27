## Nestjs REST API

### Nestjs (v.11.0.1), Nodejs (v.22.21.0), Postgresql, Redis
### Api documentation at http://localhost:3000/api/docs

#### Project download
```bash
$ git clone https://github.com/reasonlive/nest-api
$ cd nest-api
```

#### Project setup
```bash
$ npm install
$ cp .env.example .env
```

#### Database initialization
```bash
$ npm run migration:run
$ npm run seed
```

#### Run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

#### Run tests
```bash
$ npm test
```

#### Run in docker
```bash
$ docker-comopose build
$ docker-compose up
```