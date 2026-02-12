/*
CPANEL SANHUA BY DANZZ TSUYOI 
-NO JUAL SC INI 
-PEMBUAT-DANZZ TSUYOI 
• CH INFORMATION

https://whatsapp.com/channel/0029VbAQWw3Gk1FsOwv2xR32
☝🏻SALURAN SANHUA

https://whatsapp.com/channel/0029Vb9ltdiEAKW7EHwjLX3s

https://whatsapp.com/channel/0029Vb6HsTtIt5rrIu3eOa36

https://whatsapp.com/channel/0029VbBH8geBPzjgWsEmQN2c

https://whatsapp.com/channel/0029Vb6FW5nChq6QHZIGtu2Z
*/


const fs = require('fs')
const path = require('path')
const ff = require('fluent-ffmpeg')
const webp = require('node-webpmux') 
const Crypto = require('crypto')

async function writeExifImg(media, metadata) {
    let wMedia = await imageToWebp(media)
    const tmpFileOut = path.join(process.cwd(), "tmp", `Keluar-${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`)
    const tmpFileIn = path.join(process.cwd(), "tmp", `Masuk-${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.jpg`)
    fs.writeFileSync(tmpFileIn, wMedia)
    
    if (metadata.packname || metadata.author) {
        const img = new webp.Image()
        const json = {
            "sticker-pack-id": `https://berkahesport.my.id/`,
            "sticker-pack-name": metadata.packname,
            "sticker-pack-publisher": metadata.author,
            "emojis": metadata.categories || [""]
        }
        const exifAttr = Buffer.from([
            0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00,
            0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x16, 0x00, 0x00, 0x00
        ])
        const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8")
        const exif = Buffer.concat([exifAttr, jsonBuff])
        exif.writeUIntLE(jsonBuff.length, 14, 4)

        await img.load(tmpFileIn)
        img.exif = exif
        await img.save(tmpFileOut)
        return tmpFileOut
    }
}
async function imageToWebp(media) {
    const tmpFileOut = path.join(process.cwd(), "tmp", `Keluar-${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`)
    const tmpFileIn = path.join(process.cwd(), "tmp", `Masuk-${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.jpg`)

    if (!media || media.length === 0) {
        throw new Error("Invalid media file");
    }
    fs.writeFileSync(tmpFileIn, media)
    await new Promise((resolve, reject) => {
        ff(tmpFileIn)
            .on("error", (err) => {
                fs.unlinkSync(tmpFileIn)
                reject(new Error(`ffmpeg error: ${err.message}`))
            })
            .on("end", () => {
                fs.unlinkSync(tmpFileIn)
                resolve(true)
            })
            .addOutputOptions([
                "-vcodec",
                "libwebp",
                "-vf",
                "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse"
            ])
            .toFormat("webp")
            .save(tmpFileOut)
    })
    const buff = fs.readFileSync(tmpFileOut)
    return buff
}


module.exports = { writeExifImg,imageToWebp }
