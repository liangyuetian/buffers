const zlib = require('zlib')

const database = [[], [], [], [], [], [], [], []]
const bitmasks = [1, 2, 4, 8, 16, 32, 64, 128]

function store(buf) {
    const db = buf[0]
    const key = buf.readUInt8(1)

    if (buf[2] === 0x78) {

        zlib.inflate(buf.slice(2), function (err, inflatedBuf) {
            if (err) {
                return console.error(err)
            }
            const data = inflatedBuf.toString()
            bitmasks.forEach((bitmask, index) => {
                if (db & bitmask) {
                    database[index][key] = data
                }
            })
        })
    }
}

const header = new Buffer(2)
header[0] = 8
header[1] = 0

zlib.deflate('my message', (err, deflateBuf) => {
    if (err){
        return console.error(err)
    }
    const message = Buffer.concat([header, deflateBuf])
    store(message)

    console.log(database)
})