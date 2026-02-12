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


require("./system/module.js")
const { version } = require("./package.json")

global.owner = ['']
global.versi = "2.0"
global.storename = "sanhua"
global.namaOwner = "Danzz"
global.packname = 'sanhua'
global.botname = 'sanhua'
global.youtube = 'https://www.youtube.com/@Danzzthumbnail'
global.botnumber = '6282130979808@s.whatsapp.net' 
//☝🏻 ISI PAKE NO BOT KAMU

// SERVER 1
global.domain = '';
// ☝🏻ISI DENGAN LINK DOMAIN PANEL KAMU
global.apikey = ''; 
//☝🏻ISI DENGAN PTLA
global.capikey = ''; 
//☝🏻ISI DENGAN PTLC
global.egg = "15"; 
global.nestid = "5"; 
global.loc = "1";

//SERVER 2
global.domainv2 = '';
// ☝🏻ini domain panel kamu
global.apikeyv2 = ''; 
//☝🏻isi dengan ptla ini
global.capikeyv2 = ''; 
//☝🏻isi dengan ptlc
global.eggv2 = "15"; 
global.nestidv2 = "5"; 
global.locv2 = "1";

global.systemN = '*sʏsᴛᴇᴍ ɴᴏᴛɪᴄᴇ*'
global.makeMsg = (text) => {
  return {
    text: `${global.systemN}\n${text}`,
    contextInfo: {
      externalAdReply: { 
        title: '𝗦𝗔𝗡𝗛𝗨𝗔',
        body: 'sanhua asisten',
        thumbnailUrl: 'https://files.catbox.moe/f0fv6j.jpeg',
        mediaType: 1,
        renderLargerThumbnail: false,
        showAdAttribution: false
      }
    }
  }
}



global.mess = {
  wait: '⏳ Tunggu sebentar... sedang diproses.',
  success: '✅ Berhasil!',
  error: 'Ups! Terjadi kesalahan sistem.',
  errorF: 'Fitur ini sedang dalam perbaikan.',
  group: 'Perintah ini hanya dapat digunakan di grup.',
  private: 'Perintah ini hanya dapat digunakan di chat pribadi.',
  admin: 'Perintah ini hanya untuk admin grup.',
  owner: 'Perintah ini khusus untuk Owner.',
  botAdmin: 'Jadikan bot sebagai admin dulu ya.'
};

let file = require.resolve(__filename) 
fs.watchFile(file, () => {
fs.unwatchFile(file)
console.log(chalk.cyan("File Update => "), chalk.cyan.bgBlue.bold(`${__filename}`))
delete require.cache[file]
require(file)
})