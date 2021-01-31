const fs = require('fs')

const filename = 't2.dbf'
const buf = fs.readFileSync(`${__dirname}/${filename}`)

const header = {}
const date = new Date()
date.setUTCFullYear(1900 + buf[1])
date.setUTCMonth(buf[2])
date.setUTCDate(buf[3])
header.lastUpdated = date.toUTCString()

// 读取数据条数
header.totalRecords = buf.readUInt32LE(4)

// 头部字节数
header.bytesInHeader = buf.readUInt16LE(8)

// 记录部分的字节数
header.bytesPerRecord = buf.readUInt16LE(10)

// 解析内容部分
const fields = []
let fieldOffset = 32
let fieldTerminator = 0x0D // 回车符
// 0x0A 换行符 String.fromCharCode(0x0A.toString(10))

const FIELD_TYPES = {
    C: 'Character',
    N: 'Numeric',
    I: 'Int'
}

const TypeFn = function (value, type) {
    if (type === 'Int') {
        return value
        // return Number(value)
    } else if (type === 'Character') {
        return String(value)
    }
}

while (buf[fieldOffset] !== fieldTerminator) {
    const fieldBuf = buf.slice(fieldOffset, fieldOffset + 32) // 返回快照、引用
    const field = {
        name: fieldBuf.toString('utf-8', 0, 11).replace(/\u0000/g, ''),
        type: FIELD_TYPES[fieldBuf.toString('utf-8', 11, 12)],
        typeOf: fieldBuf.toString('utf-8', 11, 12),
        length: fieldBuf[16]
    }
    // console.log(field)
    fields.push(field)
    fieldOffset += 32

}
header.fields = fields

let startingRecordOffset = header.bytesInHeader;
const records = [];

for (let i = 0; i < header.totalRecords; i++) {
    let recordOffset = startingRecordOffset + (i * header.bytesPerRecord);
    let record = {};

    record._isDel = buf.readUInt8(recordOffset) === 0x2A; // asterisk indicates deleted record
    recordOffset++;

    for (let j = 0; j < fields.length; j++) {
        const field = fields[j];
        const value = buf.toString('utf-8', recordOffset, recordOffset + field.length).trim()
        record[field.name] = TypeFn(value, field.type);
        recordOffset += field.length;
    }

    records.push(record);
}
header.records = records

fs.writeFileSync(`${__dirname}/${filename}.json`, JSON.stringify(header, null,4))
