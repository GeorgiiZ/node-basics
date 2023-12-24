const fs = require('fs')
const { Transform } = require('stream')
const path = require('path')

const ipA = '89.123.1.41'
const ipB = '34.48.240.111'

const readStream = fs.createReadStream(path.resolve(__dirname, 'access_tmp.log'), 'utf8')
const writeStreamBothIps = fs.createWriteStream(path.resolve(__dirname, `transformed_requests.log`), 'utf8')
const writeStreamIpA = fs.createWriteStream(path.resolve(__dirname, `${ipA}_requests.log`), {
    flags: 'a',
    encoding: 'utf8',
})
const writeStreamIpB = fs.createWriteStream(path.resolve(__dirname, `${ipB}_requests.log`), {
    flags: 'a',
    encoding: 'utf8',
})

readStream.on('data', (chunk) => {
    const satisfyingLinesIpA = getLinesWithSpecifiedStr(chunk.toString(), new RegExp(`\\b${ipA}\\b`))
    const satisfyingLinesIpB = getLinesWithSpecifiedStr(chunk.toString(), new RegExp(`\\b${ipB}\\b`))

    if (satisfyingLinesIpA) {
        writeStreamIpA.write(satisfyingLinesIpA)
    }

    if (satisfyingLinesIpB) {
        writeStreamIpB.write(satisfyingLinesIpB)
    }
})

readStream.on('end', () => {
    writeStreamIpA.end()
    writeStreamIpB.end()
    writeStreamBothIps.end()
})

const findLogWithIpPipe = new Transform({
    transform (chunk, encoding, callback) {
        const satisfyingLines = getLinesWithSpecifiedStr(chunk.toString(), new RegExp(`\\b${ipA}\\b|\\b${ipB}\\b`))

        if (satisfyingLines) {
            this.push(satisfyingLines)
        }

        callback()
    }
})

const getLinesWithSpecifiedStr = (text, regExp) => {
    const textLines = text.split('\n');
    const result = [];

    textLines.forEach((line) => {
        if (line.search(regExp) !== -1) {
            result.push(line)
        }
    })

    return result.join('\n')
}


readStream.pipe(findLogWithIpPipe).pipe(writeStreamBothIps)