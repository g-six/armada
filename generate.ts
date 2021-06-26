import * as readline from 'readline'
import { copySync, mkdirSync, readFileSync, writeFileSync } from 'fs-extra'
import * as handlebars from 'handlebars'
const sls_source = readFileSync('./_template/serverless.yml', { encoding: 'utf8' })
const pkg_source = readFileSync('./_template/package.json', { encoding: 'utf8' })
const mdl_source = readFileSync('./_template/src/models/index.ts', { encoding: 'utf8' })
const app_source = readFileSync('./_template/src/app.ts', { encoding: 'utf8' })
const sls_tpl = handlebars.compile(sls_source)
const pkg_tpl = handlebars.compile(pkg_source)
const mdl_tpl = handlebars.compile(mdl_source)
const app_tpl = handlebars.compile(app_source)

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})

rl.question(`What's the name of your service?   `, (service: string) => {
    rl.question(`What's the model name?   `, (model: string) => {
        const sls_contents = sls_tpl({ service, model })
        const pkg_contents = pkg_tpl({ service })
        const app_contents = app_tpl({ service, model })
        const mdl_contents = mdl_tpl({ service, model })
        mkdirSync(service)
        copySync('_template', `${service}`)

        writeFileSync(`${service}/serverless.yml`, sls_contents)
        writeFileSync(`${service}/package.json`, pkg_contents)
        writeFileSync(`${service}/src/models/index.ts`, mdl_contents)
        writeFileSync(`${service}/src/app.ts`, app_contents)
        console.log(`\nSuccessfully created your ${service} microservice!\nTo begin, enter:\n\ncd ${service} && npm i\n\n`)
        rl.close()
    })
})

