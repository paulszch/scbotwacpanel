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

const crypto = require("crypto");
const fs = require('fs');
const axios = require('axios');
const util = require('util');
const { exec } = require('child_process');
const chalk = require('chalk');
const jimp = require('jimp')
const { Sticker, StickerTypes } = require('wa-sticker-formatter');    
const { loadMutedGroups, saveMutedGroups } = require('./system/mutedGroups');

const { prepareWAMessageMedia, generateWAMessageFromContent } = require('baileys');
const { saveSettings } = require('./system/sistem.js');
const resellerFilePath = './reseller.json';

const loadResellerGroups = () => {
    try {
        if (fs.existsSync(resellerFilePath)) {
            const data = fs.readFileSync(resellerFilePath, 'utf8');
            const parsedData = JSON.parse(data);
            return Array.isArray(parsedData) ? parsedData : [];
        }
    } catch (error) {
        console.error('Gagal memuat reseller.json:', error);
    }
    return [];
};

const saveResellerGroups = (data) => {
    try {
        fs.writeFileSync(resellerFilePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Gagal menyimpan reseller.json:', error);
    }
};

global.resellergroups = loadResellerGroups();

const Styles = (text, style = 1) => {
  var xStr = 'abcdefghijklmnopqrstuvwxyz1234567890'.split('');
  var yStr = {
    1: 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘqʀꜱᴛᴜᴠᴡxʏᴢ1234567890'
  };
  var replacer = [];
  xStr.map((v, i) =>
    replacer.push({
      original: v,
      convert: yStr[style].split('')[i]
    })
  );
  var str = text.toLowerCase().split('');
  var output = [];
  str.map((v) => {
    const find = replacer.find((x) => x.original == v);
    find ? output.push(find.convert) : output.push(v);
  });
  return output.join('');
};

async function saveOwnerToSettingsFile() {
  const settingsPath = './settings.js';
  try {
    let fileContent = fs.readFileSync(settingsPath, 'utf8');
    const ownerArrayString = `['${global.owner.join("','")}']`;
    const newOwnerLine = `global.owner = ${ownerArrayString}`;

    const regex = /global\.owner\s*=\s*\[.*\]/g;
    
    if (regex.test(fileContent)) {
      fileContent = fileContent.replace(regex, newOwnerLine);
    } else {
      console.log("Baris 'global.owner' tidak ditemukan di settings.js, tidak dapat menyimpan.");
      return;
    }

    fs.writeFileSync(settingsPath, fileContent, 'utf8');
    console.log(chalk.green('✅ Berhasil menyimpan daftar owner baru ke settings.js'));
  } catch (error) {
    console.error(chalk.red('❌ Gagal menyimpan owner ke settings.js:', error));
  }
}

async function updateApiKeys(updates) {
  const settingsPath = './settings.js';
  try {
    let fileContent = fs.readFileSync(settingsPath, 'utf8');
    updates.forEach(update => {
      const regex = new RegExp(`(global\\.${update.key}\\s*=\\s*)['"].*?['"]`);
      if (regex.test(fileContent)) {
        fileContent = fileContent.replace(regex, `$1'${update.value}'`);
      }
    });
    fs.writeFileSync(settingsPath, fileContent, 'utf8');
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Gagal menyimpan API Key ke settings.js:', error));
    return false;
  }
}

function getVideoResolution(videoPath) {

    return new Promise((resolve, reject) => {

        const ffprobeCommand = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${videoPath}"`;

        exec(ffprobeCommand, (err, stdout, stderr) => {

            if (err) {

                return reject(new Error(`Gagal mendapatkan resolusi video: ${stderr || err.message}`));

            }

            if (!stdout) {

                return reject(new Error('Tidak dapat membaca output resolusi video.'));

            }

            const [width, height] = stdout.trim().split('x').map(Number);

            resolve({ width, height });

        });

    });

}

function getVideoResolution(videoPath) {
    const { exec } = require('child_process');
    return new Promise((resolve, reject) => {
        const ffprobeCommand = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${videoPath}"`;
        exec(ffprobeCommand, (err, stdout, stderr) => {
            if (err) {
                return reject(new Error(`Gagal mendapatkan resolusi video. Pastikan ffmpeg terpasang. Error: ${stderr || err.message}`));
            }
            if (!stdout) {
                return reject(new Error('Tidak dapat membaca output resolusi video.'));
            }
            const [width, height] = stdout.trim().split('x').map(Number);
            resolve({ width, height });
        });
    });
}


module.exports = async (sanhua, m, store) => {
try {
const sender = (m.key?.fromMe)
  ? (sanhua.user.id.split(':')[0] + '@s.whatsapp.net')
  : (m.key?.participant || m.key?.remoteJid || '');
    const senderNumber = m.sender.split('@')[0];
    const chatType = m.isGroup ? 'GROUP' : 'PRIVATE';
    
    const isOwner = global.owner.includes(senderNumber) || m.sender === global.botnumber;
    const isCreator = m.sender === global.botnumber;
    

    if (!sanhua.public && !isOwner) {
        console.log(chalk.gray(`[MODE SELF] Pesan dari ${m.pushName || senderNumber} diabaikan`));
        return;
    }

    console.log(chalk.cyan(`[${chatType}] Dari: ${m.pushName || senderNumber} | Pesan: ${m.text || '(media)'}`));

    const reply = async (message) => {
        await sanhua.sendMessage(m.chat, global.makeMsg(message), { quoted: m });
    };
    m.reply = reply;
const body = (m.mtype === 'conversation' && m.message.conversation) ? m.message.conversation : (m.mtype == 'imageMessage') && m.message.imageMessage.caption ? m.message.imageMessage.caption : (m.mtype == 'documentMessage') && m.message.documentMessage.caption ? m.message.documentMessage.caption : (m.mtype == 'videoMessage') && m.message.videoMessage.caption ? m.message.videoMessage.caption : (m.mtype == 'extendedTextMessage') && m.message.extendedTextMessage.text ? m.message.extendedTextMessage.text : (m.mtype == 'buttonsResponseMessage' && m.message.buttonsResponseMessage.selectedButtonId) ? m.message.buttonsResponseMessage.selectedButtonId : (m.mtype == 'interactiveResponseMessage') ? JSON.parse(m.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson).id : (m.mtype == 'templateButtonReplyMessage') && m.message.templateButtonReplyMessage.selectedId ? m.message.templateButtonReplyMessage.selectedId : ""
	
const budy = (typeof m.text == 'string' ? m.text : '') 
const from = m.key.remoteJid
const prefix = /^[°zZ#$@+,.?=''():√%!¢£¥€π¤ΠΦ&><™©®Δ^βα¦|/\\©^]/.test(body) ? body.match(/^[°zZ#$@+,.?=''():√%¢£¥€π¤ΠΦ&><!™©®Δ^βα¦|/\\©^]/gi) : '.'
const isCmd = body.startsWith(prefix)
const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : ''
function isCommandExistInCode(cmd) {
  const fs = require('fs');
  const source = fs.readFileSync(__filename, 'utf8');
  const regex = new RegExp(`case ['"\`]${cmd}['"\`]`, 'i');
  return regex.test(source);
}
if (isCmd && isCommandExistInCode(command)) {
  await sanhua.sendPresenceUpdate('composing', m.chat);
  setTimeout(() => sanhua.sendPresenceUpdate('paused', m.chat), 5000); 
}

const args = body.trim().split(/ +/).slice(1)
const text = q = args.join(" ")
const botNumber = await sanhua.decodeJid(sanhua.user.id)
const pushname = m.pushName || `${m.sender.split("@")[0]}`
const { runtime, isUrl, getRandom, getTime, tanggal, toRupiah, telegraPh, pinterest, toHD, ucapan, generateProfilePicture, formatp, getBuffer, fetchJson, resize, sleep } = require('./system/function.js')

m.isGroup = m.chat.endsWith("g.us")
m.metadata = m.isGroup ? (await sanhua.groupMetadata(m.chat).catch(_ => {}) || {}) : {}
m.isAdmin = m.isGroup && m.metadata.participants ? (m.metadata.participants.find(e => e.admin !== null && e.id == m.sender) ? true : false) : false;
m.isBotAdmin = m.isGroup && m.metadata.participants ? (m.metadata.participants.find(e => e.admin !== null && e.id == botNumber) ? true : false) : false;


const isReseller = m.isGroup && global.resellergroups.includes(m.chat);

if (body) {
    console.log(chalk.yellow.bgCyan.bold(global.botname || 'BOT'), 
        chalk.blue.bold(isCmd ? '[ COMMAND ]' : '[ CHAT ]'), 
        chalk.blue.bold('DARI'), chalk.blue.bold(`${pushname}`), 
        chalk.blue.bold('Isi Pesan :'), chalk.blue.bold(`${body}`)
    );
}


function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

if (m.isGroup && global.mutedGroups.includes(m.chat) && !isOwner) {
    console.log(chalk.gray(`[MUTED] Pesan dari ${m.chat} diabaikan (grup dimute)`));
    return;
}

if ((budy.match) && ["Sanhua", "sanhua",].includes(budy) && !isCmd) {

await reply('SANHUA ONLINE😃')

}    

switch (command) {

case 'menu': {
    await sanhua.sendMessage(m.chat, { react: { text: "🕓", key: m.key } });

    const moment = require('moment-timezone');
    moment.tz.setDefault('Asia/Jakarta');

    const jam = moment().format('HH:mm');
    const hari = moment().format('dddd, D MMMM YYYY');

    const imageUrl = 'https://raw.githubusercontent.com/RInanjay/IMAGE/main/IMG-20250726-WA0308.jpg';
    const audioUrl = 'https://files.catbox.moe/d2e4xa.mp3';

    const menuText = `
*SANHUA Assistant Active🌐*

Halo👋🏻 *${pushname}*, saya siap membantu.
Berikut beberapa kemampuan saya :

╭───☢︎ *Informasi Bot*
│ ◈ Nama-Bot : ${global.botname}
│ ◈ Devoloper : ${global.namaOwner}
│ ◈ Mode : ${sanhua.public ? '🌐 Public' : '🔒 Self'}
│ ◈ Version : ${global.versi}
│ ◈ date : ${hari}, pukul ${jam}
│ ◈ Runtime : ${runtime(process.uptime())}
│ ◈ YouTube : ${global.youtube}
╰──────────────────⪨

╔═ *PANEL SERVER 1 MENU* ═╗
╠> \`\`\`.listram\`\`\`
╠> \`\`\`.cadmin\`\`\`
╠> \`\`\`.delpanel\`\`\`
╠> \`\`\`.deladmin\`\`\`
╠> \`\`\`.listpanel\`\`\`
╠> \`\`\`.listadmin\`\`\`

╔═ *PANEL SERVER 2 MENU* ═╗
╠> \`\`\`.listramv2\`\`\`
╠> \`\`\`.cadminv2\`\`\`
╠> \`\`\`.delpanelv2\`\`\`
╠> \`\`\`.deladminv2\`\`\`
╠> \`\`\`.listpanelv2\`\`\`
╠> \`\`\`.listadminv2\`\`\`

╔═ *RESELLER MENU*═╗
╠> \`\`\`.addakses (add akses grub reseller panel)\`\`\`
╠> \`\`\`.delakses (menghapus akses grub reseller panel)\`\`\`

╔═ *OWNER MENU* ═╗
╠> \`\`\`.tqto\`\`\`  
╠> \`\`\`.delowner\`\`\`  
╠> \`\`\`.addowner\`\`\`  
╠> \`\`\`.jpm\`\`\`
╠> \`\`\`.listjpmgc\`\`\`
╠> \`\`\`.self\`\`\`
╠> \`\`\`.public\`\`\`
╠> \`\`\`.mute\`\`\`
╠> \`\`\`.unmute\`\`\`
╠> \`\`\`.owner\`\`\`
╠> \`\`\`.upapikey\`\`\`
╠> \`\`\`.upapikey2\`\`\`
╠> \`\`\`.delapikey\`\`\`
╠> \`\`\`.delapikey2\`\`\`

╔═ *STIKCKER MENU* ═╗
╠> \`\`\`.brat\`\`\` 
╠> \`\`\`.bratvid\`\`\` 
╠> \`\`\`.qc\`\`\` 
╠> \`\`\`.s\`\`\` 
╠> \`\`\`.smeme\`\`\` 

╔═ *CONVERT* ═╗
╠> \`\`\`.tourl\`\`\` 

╔═ *GROUP MENU* ═╗
╠> \`\`\`.hidetag\`\`\` 
╠> \`\`\`.add\`\`\` 
╠> \`\`\`.kick\`\`\` 

╔═ *PLAY DOWNLOAD* ═╗
╠> \`\`\`.play \`\`\`
╠> \`\`\`.tiktok\`\`\`

╔═ *CEK ID CH/GC* ═╗
╠> \`\`\`.cekidch\`\`\`
╠> \`\`\`.cekidgc\`\`\`

*— SANHUA, evolving assistant built by Danzz.*
    `.trim();

try {
    const preparedImage = await prepareWAMessageMedia({ 
        image: { url: imageUrl }
    }, { upload: sanhua.waUploadToServer });

    const interactiveMessage = {
        body: { text: menuText },
        footer: { text: '©2025 - by danz' },
        header: {
            title: "",
            hasMediaAttachment: true,
            imageMessage: preparedImage.imageMessage
        },
        nativeFlowMessage: {
            buttons: [
                {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: "OWNER👑",
                        id: `${prefix}owner`
                    })
                },
                {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: "TQTO💝",
                        id: `${prefix}tqto`
                    })
                }
            ]
        }
    };

    const msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: interactiveMessage
            }
        }
    }, {
        quoted: m
    });

    await sanhua.relayMessage(m.chat, msg.message, { messageId: msg.key.id });

    await sanhua.sendMessage(m.chat, {
        audio: { url: audioUrl },
        mimetype: 'audio/mpeg',
        ptt: true
    });

} catch (err) {
    console.warn("Gagal mengirim audio:", err.message);
    await m.reply("⚠️ Audio gagal diputar. Mungkin sedang down.");    
}

}
break;

case "1gb":
case "2gb":
case "3gb":
case "4gb":
case "5gb":
case "6gb":
case "7gb":
case "8gb":
case "9gb":
case "10gb":
case "unli":
case "unlimited": {
    const missingSettings = [];

if (!global.domain || global.domain === "-") {
    missingSettings.push("`global.domain`");
}
if (!global.apikey || global.apikey === "-") {
    missingSettings.push("`global.apikey` (kunci ptla)");
}
if (!global.capikey || global.capikey === "-") {
    missingSettings.push("`global.capikey` (kunci ptlc)");
}
if (missingSettings.length > 0) {
    let replyText = '⚠️ *Konfigurasi Belum Lengkap!*\n\n';
    replyText += 'Harap isi informasi berikut di file `settings.js` untuk dapat menggunakan fitur ini:\n\n';
    missingSettings.forEach(setting => {
        replyText += `• ${setting}\n`;
    });
    return m.reply(replyText.trim());
}

    if (!isOwner && !isReseller) {
        return m.reply("Perintah ini hanya bisa diakses oleh Owner atau anggota grup Reseller.");
    }
    
    if (!text) return m.reply(`Contoh Penggunaan:\n.command username`);

    let nomor, usernem;

    if (isOwner) {
        const tek = text.split(",");
        if (tek.length > 1) {
            const [users, nom] = tek;
            if (!users || !nom) return m.reply(`Format Owner Salah. Contoh:\n.${command} username,628xxxxxx`);
            nomor = nom.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
            usernem = users.toLowerCase();
        } else {
            usernem = text.toLowerCase();
            nomor = m.sender;
        }
    } else if (isReseller) {
        if (text.includes(',')) return m.reply("Format Reseller Salah. Cukup ketik `.command username` tanpa nomor.");
        usernem = text.toLowerCase();
        nomor = m.sender;
    }

    const [onWa] = await sanhua.onWhatsApp(nomor.split("@")[0]);
    if (!onWa?.exists) return m.reply("❌ Nomor target tidak terdaftar di WhatsApp!");

    const paket = {
        "1gb": { ram: "1000", disk: "1000", cpu: "40" },
        "2gb": { ram: "2000", disk: "1000", cpu: "60" },
        "3gb": { ram: "3000", disk: "2000", cpu: "80" },
        "4gb": { ram: "4000", disk: "2000", cpu: "100" },
        "5gb": { ram: "5000", disk: "3000", cpu: "120" },
        "6gb": { ram: "6000", disk: "3000", cpu: "140" },
        "7gb": { ram: "7000", disk: "4000", cpu: "160" },
        "8gb": { ram: "8000", disk: "4000", cpu: "180" },
        "9gb": { ram: "9000", disk: "5000", cpu: "200" },
        "10gb": { ram: "10000", disk: "5000", cpu: "220" },
        "unli": { ram: "0", disk: "0", cpu: "0" },
        "unlimited": { ram: "0", disk: "0", cpu: "0" }
    };

    const specs = paket[command];
    if (!specs) return m.reply("❌ Paket tidak ditemukan.");

    const { ram, disk: disknya, cpu } = specs;
    const username = usernem.toLowerCase();
    const email = `${username}@gmail.com`;
    const name = capitalize(username) + " sanhua";
    const password = username + crypto.randomBytes(3).toString("hex");

    try {
        await m.reply("🛠 Membuat akun panel...");

        const userResponse = await axios.post(`${global.domain}/api/application/users`, {
            email, username, first_name: name, last_name: "Server", language: "en", password
        }, {
            headers: {
                Authorization: `Bearer ${global.apikey}`,
                "Content-Type": "application/json",
                Accept: "application/json"
            }
        });

        const user = userResponse.data.attributes;

        const eggResponse = await axios.get(`${global.domain}/api/application/nests/${global.nestid}/eggs/${global.egg}`, {
            headers: {
                Authorization: `Bearer ${global.apikey}`,
                "Content-Type": "application/json",
                Accept: "application/json"
            }
        });

        const startup_cmd = eggResponse.data.attributes.startup;

        const serverResponse = await axios.post(`${global.domain}/api/application/servers`, {
            name, description: tanggal(Date.now()), user: user.id, egg: parseInt(global.egg),
            docker_image: "ghcr.io/parkervcp/yolks:nodejs_18", startup: startup_cmd,
            environment: { INST: "npm", USER_UPLOAD: "0", AUTO_UPDATE: "0", CMD_RUN: "npm start" },
            limits: { memory: ram, swap: 0, disk: disknya, io: 500, cpu },
            feature_limits: { databases: 5, backups: 5, allocations: 5 },
            deploy: { locations: [parseInt(global.loc)], dedicated_ip: false, port_range: [] }
        }, {
            headers: {
                Authorization: `Bearer ${global.apikey}`,
                "Content-Type": "application/json",
                Accept: "application/json"
            }
        });

        const server = serverResponse.data.attributes;

        if (m.isGroup) {
            if (isOwner && nomor !== m.sender) {
                await m.reply(`✅ Akun panel berhasil dibuat!\nData telah dikirim ke nomor ${nomor.split("@")[0]}`);
            } else {
                await m.reply(`✅ Akun panel berhasil dibuat!\nData telah dikirim ke chat pribadi Anda.`);
            }
        }

        const detailTeks = `
*✅ Panel Telah Dibuat!*

👤 *Username:* ${user.username}
🔐 *Password:* ${password}
🆔 *Server ID:* ${server.id}
🗓️ *Tanggal:* ${tanggal(Date.now())}

🧠 *Spesifikasi:*
• RAM: ${ram === "0" ? "Unlimited" : `${parseInt(ram) / 1000} GB`}
• Disk: ${disknya === "0" ? "Unlimited" : `${parseInt(disknya) / 1000} GB`}
• CPU: ${cpu === "0" ? "Unlimited" : `${cpu}%`}

🌐 *Login Panel:*
${global.domain}

📝 *Catatan:*
- Masa aktif 30 hari
- Garansi 16 hari (1x klaim)
- Simpan data ini baik-baik!
- Jangan bagikan data ini ke siapa pun meskipun itu teman mu
`.trim();

        const preparedImage = await prepareWAMessageMedia({
            image: { url: 'https://files.catbox.moe/gjo8yg.png' }
        }, { upload: sanhua.waUploadToServer });

        preparedImage.imageMessage.contextInfo = {
            ...preparedImage.imageMessage.contextInfo,
            renderLargerThumbnail: true
        };

        const interactiveMessage = {
            body: { text: detailTeks },
            footer: { text: '© SANHUA PANEL' },
            header: {
                title: "🎉 Akun Anda Siap Digunakan!",
                hasMediaAttachment: true,
                imageMessage: preparedImage.imageMessage
            },
            nativeFlowMessage: {
                buttons: [
                    {
                        name: "cta_copy",
                        buttonParamsJson: JSON.stringify({ display_text: "COPY USERNAME", copy_code: user.username })
                    },
                    {
                        name: "cta_copy",
                        buttonParamsJson: JSON.stringify({ display_text: "COPY PASSWORD", copy_code: password })
                    }
                ]
            }
        };

        const msg = generateWAMessageFromContent(nomor, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                    interactiveMessage
                }
            }
        }, { userJid: nomor });

        await sanhua.relayMessage(nomor, msg.message, { messageId: msg.key.id });

    } catch (err) {
        const e = err?.response?.data?.errors?.[0]?.detail || err.message;
        return m.reply(`❌ Error:\n${e}`);
    }
}
break;
case "cadmin": {
    const missingSettings = [];
if (!global.domain || global.domain === "-") {
    missingSettings.push("`global.domain`");
}
if (!global.apikey || global.apikey === "-") {
    missingSettings.push("`global.apikey` (kunci ptla)");
}
if (!global.capikey || global.capikey === "-") {
    missingSettings.push("`global.capikey` (kunci ptlc)");
}

if (missingSettings.length > 0) {
    let replyText = '⚠️ *Konfigurasi Belum Lengkap!*\n\n';
    replyText += 'Harap isi informasi berikut di file `settings.js` untuk dapat menggunakan fitur ini:\n\n';
    missingSettings.forEach(setting => {
        replyText += `• ${setting}\n`;
    });
    return m.reply(replyText.trim());
}

    if (!isOwner) return m.reply(mess.owner);
    if (!text) return m.reply(`Contoh Penggunaan:\n.cadmin username,628...`);
    
    let nomor, usernem;
    let tek = text.split(",");
    if (tek.length > 1) {
        let [users, nom] = text.split(",");
        if (!users || !nom) return m.reply(`Contoh Penggunaan:\n.cadmin username,628...`);
        nomor = nom.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        usernem = users.toLowerCase();
    } else {
        usernem = text.toLowerCase();
        nomor = m.isGroup ? m.sender : m.chat;
    }
    
    const [onWa] = await sanhua.onWhatsApp(nomor.split("@")[0]);
    if (!onWa?.exists) return m.reply("Nomor target tidak terdaftar di WhatsApp!");

    let username = usernem.toLowerCase();
    let email = username + "@gmail.com";
    let name = capitalize(usernem);
    let password = username + crypto.randomBytes(2).toString('hex');
    
    try {
        await m.reply("Sedang membuat akun admin, mohon tunggu...");
        const userResponse = await axios.post(global.domain + "/api/application/users", {
            "email": email,
            "username": username,
            "first_name": name,
            "last_name": "Admin",
            "root_admin": true,
            "language": "en",
            "password": password
        }, {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + global.apikey
            }
        });

        const user = userResponse.data.attributes;

        const detailTeks = `
*Berikut Detail Akun Admin Panel Anda 📦*

*📡 ID User:* ${user.id}
*👤 Username:* ${user.username}
*🔐 Password:* ${password}
*🌐 Login Panel:* ${global.domain}
*🗓️ Dibuat Pada:* ${tanggal(Date.now())}

*Syarat & Ketentuan:*
- Akun akan kedaluwarsa dalam 1 bulan.
- Simpan data ini dengan baik.
- Dilarang menghapus server sembarangan!
- Ketahuan mencuri, akun akan dihapus tanpa refund!
`.trim();
        
        const preparedImage = await prepareWAMessageMedia({ image: { url: 'https://files.catbox.moe/gjo8yg.png' } }, { upload: sanhua.waUploadToServer });

        const interactiveMessage = {
            body: { text: detailTeks },
            footer: { text: '© SANHUA PANEL' },
            header: {
                title: "✅ Akun Admin Panel Anda Telah Siap!",
                hasMediaAttachment: true,
                imageMessage: preparedImage.imageMessage
            },
            nativeFlowMessage: {
                buttons: [
                    {
                        name: "cta_copy",
                        buttonParamsJson: JSON.stringify({
                            display_text: "COPY USERNAME",
                            copy_code: user.username
                        })
                    },
                    {
                        name: "cta_copy",
                        buttonParamsJson: JSON.stringify({
                            display_text: "COPY PASSWORD",
                            copy_code: password
                        })
                    }
                ]
            }
        };

        const msg = generateWAMessageFromContent(nomor, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: interactiveMessage
                }
            }
        }, { userJid: nomor });

        await sanhua.relayMessage(nomor, msg.message, { messageId: msg.key.id });

        await m.reply(`✅ Berhasil membuat akun Admin Panel!\nData akun telah dikirim ke nomor ${nomor.split("@")[0]}`);
    } catch (error) {
        const errorMsg = error.response ? JSON.stringify(error.response.data.errors[0], null, 2) : error.message;
        return m.reply(`Terjadi Kesalahan:\n${errorMsg}`);
    }
}
break;
case 'delpanel': {
    if (!isOwner) return m.reply(mess.owner);

    if (args[0]) {
        const serverId = args[0];
        if (isNaN(serverId)) return m.reply("ID Server harus berupa angka.");

        try {
            const serverDetailsResponse = await axios.get(`${global.domain}/api/application/servers/${serverId}`, {
                headers: { "Authorization": "Bearer " + global.apikey }
            });
            const serverDetails = serverDetailsResponse.data.attributes;
            const serverName = serverDetails.name;
            const userId = serverDetails.user;

            const userDetailsResponse = await axios.get(`${global.domain}/api/application/users/${userId}`, {
                headers: { "Authorization": "Bearer " + global.apikey }
            });
            const isUserAdmin = userDetailsResponse.data.attributes.root_admin;

            let buttons = [];

            if (!isUserAdmin) {
                buttons.unshift({
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: "Hapus Panel + User",
                        id: `${prefix}delpanel_user_and_panel ${serverId}`
                    })
                });
            }

            buttons.push({
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: "Hapus Panel Saja",
                    id: `${prefix}delpanel_only ${serverId}`
                })
            });

            const interactiveMessage = {
                body: { text: `Anda telah memilih server:\n\n*Nama:* ${serverName}\n*ID:* ${serverId}\n*Status User:* ${isUserAdmin ? 'Admin' : 'Bukan Admin'}` },
                footer: { text: 'Tindakan ini tidak dapat diurungkan!' },
                header: { title: "KONFIRMASI PENGHAPUSAN", hasMediaAttachment: false },
                nativeFlowMessage: {
                    buttons: buttons
                }
            };

            const msg = generateWAMessageFromContent(m.chat, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                        interactiveMessage: interactiveMessage
                    }
                }
            }, { quoted: m });

            await sanhua.relayMessage(m.chat, msg.message, { messageId: msg.key.id });

        } catch (error) {
            m.reply("Gagal mendapatkan detail server. Pastikan ID Server benar.");
        }

    } else {
        try {
            await m.reply("proses..... jika tidak muncul berarti anda pakai wa bussines anda bisa pakai .listpanel trus ketik .delpanel angka sesuai di list");

            const serverListResponse = await axios.get(`${global.domain}/api/application/servers`, {
                headers: {
                    "Accept": "application/json",
                    "Authorization": "Bearer " + global.apikey
                }
            });

            const servers = serverListResponse.data.data;
            if (!servers || servers.length === 0) {
                return m.reply("Tidak ada server yang ditemukan di panel.");
            }

            const serverRows = servers.map(server => ({
                title: server.attributes.name,
                description: `ID: ${server.attributes.id} | RAM: ${server.attributes.limits.memory} MB`,
                id: `${prefix}delpanel ${server.attributes.id}` 
            }));
            
            const paramsJson = {
                title: 'Pilih Server Untuk Dihapus',
                sections: [{
                    title: 'DAFTAR SERVER PANEL',
                    highlight_label: `${servers.length} Server Tersedia`,
                    rows: serverRows
                }]
            };

            
            const interactiveMessage = {
                body: { text: "Silakan pilih server yang ingin Anda hapus." },
                footer: { text: "Manajemen Panel © SANHUA" },
                header: { title: "PILIH SERVER", hasMediaAttachment: false },
                nativeFlowMessage: {
                    buttons: [{
                        name: "single_select",
                        buttonParamsJson: JSON.stringify(paramsJson)
                    }]
                }
            };
    
            const msg = generateWAMessageFromContent(m.chat, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                        interactiveMessage: interactiveMessage
                    }
                }
            }, { quoted: m });
    
            await sanhua.relayMessage(m.chat, msg.message, { messageId: msg.key.id });

        } catch (error) {
            m.reply(`Terjadi Kesalahan:\n${error.message}`);
        }
    }
}
break;
case 'listpanel': {
    if (!isOwner) return m.reply(mess.owner);
    
    try {
        await m.reply("⏳ Mengambil daftar server dan user, mohon tunggu...");
        
        const serverListResponse = await axios.get(`${global.domain}/api/application/servers`, {
            headers: { "Authorization": "Bearer " + global.apikey }
        });

        const servers = serverListResponse.data.data;
        if (!servers || servers.length === 0) {
            return m.reply("Tidak ada server yang ditemukan di panel.");
        }

        let listText = "*DAFTAR SEMUA PANEL & USER*\n";
        for (const server of servers) {
            try {
                const userDetails = await axios.get(`${global.domain}/api/application/users/${server.attributes.user}`, {
                    headers: { "Authorization": "Bearer " + global.apikey }
                });
                const username = userDetails.data.attributes.username;
                const isAdmin = userDetails.data.attributes.root_admin;
                listText += `\n─────────────────\n`;
                listText += `*Server:* ${server.attributes.name}\n`;
                listText += `*ID Server:* ${server.attributes.id}\n`;
                listText += `*User:* ${username} ${isAdmin ? '*(Admin)*' : ''}`;
            } catch (userError) {
                listText += `\n─────────────────\n`;
                listText += `*Server:* ${server.attributes.name}\n`;
                listText += `*ID Server:* ${server.attributes.id}\n`;
                listText += `*User:* (Gagal mengambil data)`;
            }
        }
        
        m.reply(listText.trim());

    } catch (error) {
        m.reply(`Terjadi Kesalahan:\n${error.message}`);
    }
}
break;

case 'delpanel_only': {
    if (!isOwner) return m.reply(mess.owner);
    const serverId = args[0];
    if (!serverId || isNaN(serverId)) return m.reply("ID Server tidak valid.");

    try {
        await m.reply(`Menghapus server dengan ID ${serverId}...`);
        await axios.delete(`${global.domain}/api/application/servers/${serverId}?force=true`, {
            headers: { "Authorization": "Bearer " + global.apikey }
        });
        m.reply(`✅ Sukses menghapus server dengan ID *${serverId}*.\n\nCatatan: User yang terkait tidak ikut terhapus.`);
    } catch (error) {
        const errorMsg = error.response ? `Gagal menghapus server. Status: ${error.response.status}.` : error.message;
        return m.reply(`Terjadi Kesalahan:\n${errorMsg}\n\nPastikan ID Server benar.`);
    }
}
break;

case 'delpanel_user_and_panel': {
    if (!isOwner) return m.reply(mess.owner);
    const serverId = args[0];
    if (!serverId || isNaN(serverId)) return m.reply("ID Server tidak valid.");

    try {
        await m.reply(`⏳ Memulai proses penghapusan untuk server ID ${serverId}...`);

        const serverDetails = await axios.get(`${global.domain}/api/application/servers/${serverId}`, {
            headers: { "Authorization": "Bearer " + global.apikey }
        });

        const userId = serverDetails.data.attributes.user;
        const serverName = serverDetails.data.attributes.name;

        const userDetails = await axios.get(`${global.domain}/api/application/users/${userId}`, {
            headers: { "Authorization": "Bearer " + global.apikey }
        });
        
        if (userDetails.data.attributes.root_admin) {
            await m.reply(`⚠️ User terkait adalah Admin. Hanya server [${serverName}] yang akan dihapus.`);
            await axios.delete(`${global.domain}/api/application/servers/${serverId}?force=true`, {
                headers: { "Authorization": "Bearer " + global.apikey }
            });
            await m.reply(`✅ Server [${serverName}] berhasil dihapus. User Admin tidak dihapus.`);
        } else {
            await axios.delete(`${global.domain}/api/application/servers/${serverId}?force=true`, {
                headers: { "Authorization": "Bearer " + global.apikey }
            });
            await m.reply(`✅ Server [${serverName}] berhasil dihapus.`);
            
            await axios.delete(`${global.domain}/api/application/users/${userId}`, {
                headers: { "Authorization": "Bearer " + global.apikey }
            });
            await m.reply(`✅ User terkait dengan ID ${userId} juga berhasil dihapus.`);
        }
    } catch (error) {
        let errorMsg = error.response ? `Gagal. Status: ${error.response.status}. Mungkin server atau user sudah dihapus.` : error.message;
        return m.reply(`Terjadi Kesalahan:\n${errorMsg}`);
    }
}
break;
case 'deladmin': {
    if (!isOwner) return m.reply(mess.owner);

    if (args[0]) {
        const userId = args[0];
        if (isNaN(userId)) return m.reply("ID User harus berupa angka.");

        try {
            const userDetailsResponse = await axios.get(`${global.domain}/api/application/users/${userId}`, {
                headers: { "Authorization": "Bearer " + global.apikey }
            });
            const userDetails = userDetailsResponse.data.attributes;

            if (!userDetails.root_admin) {
                return m.reply(`User dengan ID ${userId} bukan seorang admin.`);
            }

            const serverListResponse = await axios.get(`${global.domain}/api/application/servers`, {
                headers: { "Authorization": "Bearer " + global.apikey }
            });
            const allServers = serverListResponse.data.data;
            const adminServers = allServers.filter(server => server.attributes.user == userId);

            if (adminServers.length > 0) {
                let serverListText = `*Gagal!* User admin *${userDetails.username}* tidak bisa dihapus karena masih memiliki server berikut. Anda harus menghapus server ini terlebih dahulu menggunakan perintah \`.deladmin <id>\`:\n`;
                adminServers.forEach(server => {
                    serverListText += `\n─────────────────\n`;
                    serverListText += `*Nama Server:* ${server.attributes.name}\n`;
                    serverListText += `*ID Server:* ${server.attributes.id}`;
                });
                return m.reply(serverListText);
            } else {
                const interactiveMessage = {
                    body: { text: `Anda akan menghapus admin:\n\n*Username:* ${userDetails.username}\n*ID User:* ${userDetails.id}` },
                    footer: { text: 'Tindakan ini akan menghapus user admin secara permanen!' },
                    header: { title: "KONFIRMASI PENGHAPUSAN ADMIN", hasMediaAttachment: false },
                    nativeFlowMessage: {
                        buttons: [{
                            name: "quick_reply",
                            buttonParamsJson: JSON.stringify({
                                display_text: "Ya, Hapus User Admin Ini",
                                id: `${prefix}deladmin_confirm ${userId}`
                            })
                        }]
                    }
                };

                const msg = generateWAMessageFromContent(m.chat, {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                            interactiveMessage: interactiveMessage
                        }
                    }
                }, { quoted: m });
                await sanhua.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
            }
        } catch (error) {
            m.reply("Gagal mendapatkan detail user. Pastikan ID User Admin benar.");
        }
    } else {
        try {
            await m.reply("proses..... jika tidak muncul berarti anda pakai wa bussines anda bisa pakai .listadmin trus ketik .deladmin angka sesuai di list");

            const userListResponse = await axios.get(`${global.domain}/api/application/users`, {
                headers: { "Authorization": "Bearer " + global.apikey }
            });
            const allUsers = userListResponse.data.data;
            const adminUsers = allUsers.filter(user => user.attributes.root_admin);

            if (adminUsers.length === 0) {
                return m.reply("Tidak ada user admin yang ditemukan di panel.");
            }

            const adminRows = adminUsers.map(user => ({
                title: user.attributes.username,
                description: `ID: ${user.attributes.id} | Email: ${user.attributes.email}`,
                id: `${prefix}deladmin ${user.attributes.id}` 
            }));

            const paramsJson = {
                title: 'Pilih Admin Untuk Dihapus',
                sections: [{
                    title: 'DAFTAR USER ADMIN',
                    highlight_label: `${adminUsers.length} Admin Tersedia`,
                    rows: adminRows
                }]
            };

            const interactiveMessage = {
                body: { text: "Silakan pilih user admin yang ingin Anda hapus." },
                footer: { text: "Manajemen Admin © SANHUA" },
                header: { title: "PILIH ADMIN", hasMediaAttachment: false },
                nativeFlowMessage: {
                    buttons: [{
                        name: "single_select",
                        buttonParamsJson: JSON.stringify(paramsJson)
                    }]
                }
            };

            const msg = generateWAMessageFromContent(m.chat, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                        interactiveMessage: interactiveMessage
                    }
                }
            }, { quoted: m });
    
            await sanhua.relayMessage(m.chat, msg.message, { messageId: msg.key.id });

        } catch (error) {
            m.reply(`Terjadi Kesalahan:\n${error.message}`);
        }
    }
}
break;

case 'listadmin': {
    if (!isOwner) return m.reply(mess.owner);
    
    try {
        await m.reply("⏳ Mengambil daftar user admin, mohon tunggu...");
        
        const userListResponse = await axios.get(`${global.domain}/api/application/users`, {
            headers: { "Authorization": "Bearer " + global.apikey }
        });
        const allUsers = userListResponse.data.data;
        const adminUsers = allUsers.filter(user => user.attributes.root_admin);

        if (adminUsers.length === 0) {
            return m.reply("Tidak ada user admin yang ditemukan di panel.");
        }

        let listText = "*DAFTAR SEMUA USER ADMIN*\n";
        adminUsers.forEach(user => {
            listText += `\n─────────────────\n`;
            listText += `*Username:* ${user.attributes.username}\n`;
            listText += `*ID User:* ${user.attributes.id}\n`;
            listText += `*Email:* ${user.attributes.email}`;
        });
        
        m.reply(listText.trim());

    } catch (error) {
        m.reply(`Terjadi Kesalahan:\n${error.message}`);
    }
}
break;

case 'deladmin_confirm': {
    if (!isOwner) return m.reply(mess.owner);
    const userId = args[0];
    if (!userId || isNaN(userId)) return m.reply("ID User tidak valid.");

    try {
        await m.reply(`Menghapus user admin dengan ID ${userId}...`);
        await axios.delete(`${global.domain}/api/application/users/${userId}`, {
            headers: { "Authorization": "Bearer " + global.apikey }
        });
        m.reply(`✅ Sukses menghapus user admin dengan ID *${userId}*.`);
    } catch (error) {
        const errorMsg = error.response ? `Gagal menghapus user admin. Status: ${error.response.status}.` : error.message;
        return m.reply(`Terjadi Kesalahan:\n${errorMsg}\n\nPastikan ID User benar dan bukan user utama.`);
    }
}
break;

case 'addakses': {
    if (!isOwner) return m.reply(mess.owner);
    if (!m.isGroup) return m.reply("Perintah ini hanya bisa digunakan di dalam grup.");
    
    const groupId = m.chat;
    if (global.resellergroups.includes(groupId)) return m.reply("Grup ini sudah terdaftar sebagai reseller.");

    global.resellergroups.push(groupId);
    saveResellerGroups(global.resellergroups);
    await m.reply("✅ Berhasil! Semua anggota di grup ini sekarang mendapatkan hak akses sebagai Reseller.");
}
break;

//SERVER 2
case "1gbv2":
case "2gbv2":
case "3gbv2":
case "4gbv2":
case "5gbv2":
case "6gbv2":
case "7gbv2":
case "8gbv2":
case "9gbv2":
case "10gbv2":
case "unliv2":
case "unlimitedv2": {
    const missingSettings = [];

if (!global.domainv2 || global.domainv2 === "-") {
    missingSettings.push("`global.domainv2`");
}
if (!global.apikeyv2 || global.apikeyv2 === "-") {
    missingSettings.push("`global.apikeyv2` (kunci ptla)");
}
if (!global.capikeyv2 || global.capikeyv2 === "-") {
    missingSettings.push("`global.capikeyv2` (kunci ptlc)");
}

if (missingSettings.length > 0) {
    let replyText = '⚠️ *Konfigurasi Belum Lengkap!*\n\n';
    replyText += 'Harap isi informasi berikut di file `settings.js` untuk dapat menggunakan fitur ini:\n\n';
    missingSettings.forEach(setting => {
        replyText += `• ${setting}\n`;
    });
    return m.reply(replyText.trim());
}

    if (!isOwner && !isReseller) {
        return m.reply("Perintah ini hanya bisa diakses oleh Owner atau anggota grup Reseller.");
    }
    
    if (!text) return m.reply(`Contoh Penggunaan:\n.command username`);

    let nomor, usernem;

    if (isOwner) {
        const tek = text.split(",");
        if (tek.length > 1) {
            const [users, nom] = tek;
            if (!users || !nom) return m.reply(`Format Owner Salah. Contoh:\n.${command} username,628xxxxxx`);
            nomor = nom.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
            usernem = users.toLowerCase();
        } else {
            usernem = text.toLowerCase();
            nomor = m.sender;
        }
    } else if (isReseller) {
        if (text.includes(',')) return m.reply("Format Reseller Salah. Cukup ketik `.command username` tanpa nomor.");
        usernem = text.toLowerCase();
        nomor = m.sender;
    }

    const [onWa] = await sanhua.onWhatsApp(nomor.split("@")[0]);
    if (!onWa?.exists) return m.reply("❌ Nomor target tidak terdaftar di WhatsApp!");

    const paket = {
        "1gb": { ram: "1000", disk: "1000", cpu: "40" },
        "2gb": { ram: "2000", disk: "1000", cpu: "60" },
        "3gb": { ram: "3000", disk: "2000", cpu: "80" },
        "4gb": { ram: "4000", disk: "2000", cpu: "100" },
        "5gb": { ram: "5000", disk: "3000", cpu: "120" },
        "6gb": { ram: "6000", disk: "3000", cpu: "140" },
        "7gb": { ram: "7000", disk: "4000", cpu: "160" },
        "8gb": { ram: "8000", disk: "4000", cpu: "180" },
        "9gb": { ram: "9000", disk: "5000", cpu: "200" },
        "10gb": { ram: "10000", disk: "5000", cpu: "220" },
        "unli": { ram: "0", disk: "0", cpu: "0" },
        "unlimited": { ram: "0", disk: "0", cpu: "0" }
    };
    
const baseCommand = command.replace('v2', '');
    const specs = paket[baseCommand];
    if (!specs) return m.reply("❌ Paket tidak ditemukan.");

    const { ram, disk: disknya, cpu } = specs;
    const username = usernem.toLowerCase();
    const email = `${username}@gmail.com`;
    const name = capitalize(username) + " sanhua";
    const password = username + crypto.randomBytes(3).toString("hex");

    try {
        await m.reply("🛠 Membuat akun panel...");

        const userResponse = await axios.post(`${global.domainv2}/api/application/users`, {
            email, username, first_name: name, last_name: "Server", language: "en", password
        }, {
            headers: {
                Authorization: `Bearer ${global.apikeyv2}`,
                "Content-Type": "application/json",
                Accept: "application/json"
            }
        });

        const user = userResponse.data.attributes;

        const eggResponse = await axios.get(`${global.domainv2}/api/application/nests/${global.nestidv2}/eggs/${global.eggv2}`, {
            headers: {
                Authorization: `Bearer ${global.apikeyv2}`,
                "Content-Type": "application/json",
                Accept: "application/json"
            }
        });

        const startup_cmd = eggResponse.data.attributes.startup;

        const serverResponse = await axios.post(`${global.domainv2}/api/application/servers`, {
            name, description: tanggal(Date.now()), user: user.id, egg: parseInt(global.eggv2),
            docker_image: "ghcr.io/parkervcp/yolks:nodejs_18", startup: startup_cmd,
            environment: { INST: "npm", USER_UPLOAD: "0", AUTO_UPDATE: "0", CMD_RUN: "npm start" },
            limits: { memory: ram, swap: 0, disk: disknya, io: 500, cpu },
            feature_limits: { databases: 5, backups: 5, allocations: 5 },
            deploy: { locations: [parseInt(global.locv2)], dedicated_ip: false, port_range: [] }
        }, {
            headers: {
                Authorization: `Bearer ${global.apikeyv2}`,
                "Content-Type": "application/json",
                Accept: "application/json"
            }
        });

        const server = serverResponse.data.attributes;

        if (m.isGroup) {
            if (isOwner && nomor !== m.sender) {
                await m.reply(`✅ Akun panel berhasil dibuat!\nData telah dikirim ke nomor ${nomor.split("@")[0]}`);
            } else {
                await m.reply(`✅ Akun panel berhasil dibuat!\nData telah dikirim ke chat pribadi Anda.`);
            }
        }

        const detailTeks = `
*✅ Panel Telah Dibuat!*

👤 *Username:* ${user.username}
🔐 *Password:* ${password}
🆔 *Server ID:* ${server.id}
🗓️ *Tanggal:* ${tanggal(Date.now())}

🧠 *Spesifikasi:*
• RAM: ${ram === "0" ? "Unlimited" : `${parseInt(ram) / 1000} GB`}
• Disk: ${disknya === "0" ? "Unlimited" : `${parseInt(disknya) / 1000} GB`}
• CPU: ${cpu === "0" ? "Unlimited" : `${cpu}%`}

🌐 *Login Panel:*
${global.domainv2}

📝 *Catatan:*
- Masa aktif 30 hari
- Garansi 16 hari (1x klaim)
- Simpan data ini baik-baik!
- Jangan bagikan data ini ke siapa pun meskipun itu teman mu
`.trim();

        const preparedImage = await prepareWAMessageMedia({
            image: { url: 'https://files.catbox.moe/gjo8yg.png' }
        }, { upload: sanhua.waUploadToServer });

        preparedImage.imageMessage.contextInfo = {
            ...preparedImage.imageMessage.contextInfo,
            renderLargerThumbnail: true
        };

        const interactiveMessage = {
            body: { text: detailTeks },
            footer: { text: '© SANHUA PANEL' },
            header: {
                title: "🎉 Akun Anda Siap Digunakan!",
                hasMediaAttachment: true,
                imageMessage: preparedImage.imageMessage
            },
            nativeFlowMessage: {
                buttons: [
                    {
                        name: "cta_copy",
                        buttonParamsJson: JSON.stringify({ display_text: "COPY USERNAME", copy_code: user.username })
                    },
                    {
                        name: "cta_copy",
                        buttonParamsJson: JSON.stringify({ display_text: "COPY PASSWORD", copy_code: password })
                    }
                ]
            }
        };

        const msg = generateWAMessageFromContent(nomor, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                    interactiveMessage
                }
            }
        }, { userJid: nomor });

        await sanhua.relayMessage(nomor, msg.message, { messageId: msg.key.id });

    } catch (err) {
        const e = err?.response?.data?.errors?.[0]?.detail || err.message;
        return m.reply(`❌ Error:\n${e}`);
    }
}
break;

case "cadminv2": {
    const missingSettings = [];

if (!global.domainv2 || global.domainv2 === "-") {
    missingSettings.push("`global.domainv2`");
}
if (!global.apikeyv2 || global.apikeyv2 === "-") {
    missingSettings.push("`global.apikeyv2` (kunci ptla)");
}
if (!global.capikeyv2 || global.capikeyv2 === "-") {
    missingSettings.push("`global.capikeyv2` (kunci ptlc)");
}

if (missingSettings.length > 0) {
    let replyText = '⚠️ *Konfigurasi Belum Lengkap!*\n\n';
    replyText += 'Harap isi informasi berikut di file `settings.js` untuk dapat menggunakan fitur ini:\n\n';
    missingSettings.forEach(setting => {
        replyText += `• ${setting}\n`;
    });
    return m.reply(replyText.trim());
}

    if (!isOwner) return m.reply(mess.owner);
    if (!text) return m.reply(`Contoh Penggunaan:\n.cadmin username,628...`);
    
    let nomor, usernem;
    let tek = text.split(",");
    if (tek.length > 1) {
        let [users, nom] = text.split(",");
        if (!users || !nom) return m.reply(`Contoh Penggunaan:\n.cadmin username,628...`);
        nomor = nom.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        usernem = users.toLowerCase();
    } else {
        usernem = text.toLowerCase();
        nomor = m.isGroup ? m.sender : m.chat;
    }
    
    const [onWa] = await sanhua.onWhatsApp(nomor.split("@")[0]);
    if (!onWa?.exists) return m.reply("Nomor target tidak terdaftar di WhatsApp!");

    let username = usernem.toLowerCase();
    let email = username + "@gmail.com";
    let name = capitalize(usernem);
    let password = username + crypto.randomBytes(2).toString('hex');
    
    try {
        await m.reply("Sedang membuat akun admin, mohon tunggu...");
        const userResponse = await axios.post(global.domainv2 + "/api/application/users", {
            "email": email,
            "username": username,
            "first_name": name,
            "last_name": "Admin",
            "root_admin": true,
            "language": "en",
            "password": password
        }, {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + global.apikeyv2
            }
        });

        const user = userResponse.data.attributes;

        const detailTeks = `
*Berikut Detail Akun Admin Panel Anda 📦*

*📡 ID User:* ${user.id}
*👤 Username:* ${user.username}
*🔐 Password:* ${password}
*🌐 Login Panel:* ${global.domainv2}
*🗓️ Dibuat Pada:* ${tanggal(Date.now())}

*Syarat & Ketentuan:*
- Akun akan kedaluwarsa dalam 1 bulan.
- Simpan data ini dengan baik.
- Dilarang menghapus server sembarangan!
- Ketahuan mencuri, akun akan dihapus tanpa refund!
`.trim();
        
        const preparedImage = await prepareWAMessageMedia({ image: { url: 'https://files.catbox.moe/gjo8yg.png' } }, { upload: sanhua.waUploadToServer });

        const interactiveMessage = {
            body: { text: detailTeks },
            footer: { text: '© SANHUA PANEL' },
            header: {
                title: "✅ Akun Admin Panel Anda Telah Siap!",
                hasMediaAttachment: true,
                imageMessage: preparedImage.imageMessage
            },
            nativeFlowMessage: {
                buttons: [
                    {
                        name: "cta_copy",
                        buttonParamsJson: JSON.stringify({
                            display_text: "COPY USERNAME",
                            copy_code: user.username
                        })
                    },
                    {
                        name: "cta_copy",
                        buttonParamsJson: JSON.stringify({
                            display_text: "COPY PASSWORD",
                            copy_code: password
                        })
                    }
                ]
            }
        };

        const msg = generateWAMessageFromContent(nomor, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: interactiveMessage
                }
            }
        }, { userJid: nomor });

        await sanhua.relayMessage(nomor, msg.message, { messageId: msg.key.id });

        await m.reply(`✅ Berhasil membuat akun Admin Panel!\nData akun telah dikirim ke nomor ${nomor.split("@")[0]}`);
    } catch (error) {
        const errorMsg = error.response ? JSON.stringify(error.response.data.errors[0], null, 2) : error.message;
        return m.reply(`Terjadi Kesalahan:\n${errorMsg}`);
    }
}
break;

case 'delpanelv2': {
    if (!isOwner) return m.reply(mess.owner);

    if (args[0]) {
        const serverId = args[0];
        if (isNaN(serverId)) return m.reply("ID Server harus berupa angka.");

        try {
            const serverDetailsResponse = await axios.get(`${global.domainv2}/api/application/servers/${serverId}`, {
                headers: { "Authorization": "Bearer " + global.apikeyv2 }
            });
            const serverDetails = serverDetailsResponse.data.attributes;
            const serverName = serverDetails.name;
            const userId = serverDetails.user;

            const userDetailsResponse = await axios.get(`${global.domainv2}/api/application/users/${userId}`, {
                headers: { "Authorization": "Bearer " + global.apikeyv2 }
            });
            const isUserAdmin = userDetailsResponse.data.attributes.root_admin;

            let buttons = [];

            if (!isUserAdmin) {
                buttons.unshift({
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: "Hapus Panel + User",
                        id: `${prefix}delpanel_user_and_panelv2 ${serverId}`
                    })
                });
            }

            buttons.push({
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: "Hapus Panel Saja",
                    id: `${prefix}delpanel_onlyv2 ${serverId}`
                })
            });

            const interactiveMessage = {
                body: { text: `Anda telah memilih server:\n\n*Nama:* ${serverName}\n*ID:* ${serverId}\n*Status User:* ${isUserAdmin ? 'Admin' : 'Bukan Admin'}` },
                footer: { text: 'Tindakan ini tidak dapat diurungkan!' },
                header: { title: "KONFIRMASI PENGHAPUSAN", hasMediaAttachment: false },
                nativeFlowMessage: {
                    buttons: buttons
                }
            };

            const msg = generateWAMessageFromContent(m.chat, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                        interactiveMessage: interactiveMessage
                    }
                }
            }, { quoted: m });

            await sanhua.relayMessage(m.chat, msg.message, { messageId: msg.key.id });

        } catch (error) {
            m.reply("Gagal mendapatkan detail server. Pastikan ID Server benar.");
        }

    } else {
        try {
            await m.reply("proses..... jika tidak muncul berarti anda pakai wa bussines anda bisa pakai .listpanel trus ketik .delpanel angka sesuai di list");

            const serverListResponse = await axios.get(`${global.domainv2}/api/application/servers`, {
                headers: {
                    "Accept": "application/json",
                    "Authorization": "Bearer " + global.apikeyv2
                }
            });

            const servers = serverListResponse.data.data;
            if (!servers || servers.length === 0) {
                return m.reply("Tidak ada server yang ditemukan di panel.");
            }

            const serverRows = servers.map(server => ({
    title: server.attributes.name,
    description: `ID: ${server.attributes.id} | RAM: ${server.attributes.limits.memory} MB`,
    id: `${prefix}delpanelv2 ${server.attributes.id}` 
}));
            
            const paramsJson = {
                title: 'Pilih Server Untuk Dihapus',
                sections: [{
                    title: 'DAFTAR SERVER PANEL',
                    highlight_label: `${servers.length} Server Tersedia`,
                    rows: serverRows
                }]
            };

            
            const interactiveMessage = {
                body: { text: "Silakan pilih server yang ingin Anda hapus." },
                footer: { text: "Manajemen Panel © SANHUA" },
                header: { title: "PILIH SERVER", hasMediaAttachment: false },
                nativeFlowMessage: {
                    buttons: [{
                        name: "single_select",
                        buttonParamsJson: JSON.stringify(paramsJson)
                    }]
                }
            };
    
            const msg = generateWAMessageFromContent(m.chat, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                        interactiveMessage: interactiveMessage
                    }
                }
            }, { quoted: m });
    
            await sanhua.relayMessage(m.chat, msg.message, { messageId: msg.key.id });

        } catch (error) {
            m.reply(`Terjadi Kesalahan:\n${error.message}`);
        }
    }
}
break;
case 'listpanelv2': {
    if (!isOwner) return m.reply(mess.owner);
    
    try {
        await m.reply("⏳ Mengambil daftar server dan user, mohon tunggu...");
        
        const serverListResponse = await axios.get(`${global.domainv2}/api/application/servers`, {
            headers: { "Authorization": "Bearer " + global.apikeyv2 }
        });

        const servers = serverListResponse.data.data;
        if (!servers || servers.length === 0) {
            return m.reply("Tidak ada server yang ditemukan di panel.");
        }

        let listText = "*DAFTAR SEMUA PANEL & USER*\n";
        for (const server of servers) {
            try {
                const userDetails = await axios.get(`${global.domainv2}/api/application/users/${server.attributes.user}`, {
                    headers: { "Authorization": "Bearer " + global.apikeyv2 }
                });
                const username = userDetails.data.attributes.username;
                const isAdmin = userDetails.data.attributes.root_admin;
                listText += `\n─────────────────\n`;
                listText += `*Server:* ${server.attributes.name}\n`;
                listText += `*ID Server:* ${server.attributes.id}\n`;
                listText += `*User:* ${username} ${isAdmin ? '*(Admin)*' : ''}`;
            } catch (userError) {
                listText += `\n─────────────────\n`;
                listText += `*Server:* ${server.attributes.name}\n`;
                listText += `*ID Server:* ${server.attributes.id}\n`;
                listText += `*User:* (Gagal mengambil data)`;
            }
        }
        
        m.reply(listText.trim());

    } catch (error) {
        m.reply(`Terjadi Kesalahan:\n${error.message}`);
    }
}
break;

case 'delpanel_onlyv2': {
    if (!isOwner) return m.reply(mess.owner);
    const serverId = args[0];
    if (!serverId || isNaN(serverId)) return m.reply("ID Server tidak valid.");

    try {
        await m.reply(`Menghapus server dengan ID ${serverId}...`);
        await axios.delete(`${global.domainv2}/api/application/servers/${serverId}?force=true`, {
            headers: { "Authorization": "Bearer " + global.apikeyv2 }
        });
        m.reply(`✅ Sukses menghapus server dengan ID *${serverId}*.\n\nCatatan: User yang terkait tidak ikut terhapus.`);
    } catch (error) {
        const errorMsg = error.response ? `Gagal menghapus server. Status: ${error.response.status}.` : error.message;
        return m.reply(`Terjadi Kesalahan:\n${errorMsg}\n\nPastikan ID Server benar.`);
    }
}
break;

case 'delpanel_user_and_panelv2': {
    if (!isOwner) return m.reply(mess.owner);
    const serverId = args[0];
    if (!serverId || isNaN(serverId)) return m.reply("ID Server tidak valid.");

    try {
        await m.reply(`⏳ Memulai proses penghapusan untuk server ID ${serverId}...`);

        const serverDetails = await axios.get(`${global.domainv2}/api/application/servers/${serverId}`, {
            headers: { "Authorization": "Bearer " + global.apikeyv2 }
        });

        const userId = serverDetails.data.attributes.user;
        const serverName = serverDetails.data.attributes.name;

        const userDetails = await axios.get(`${global.domainv2}/api/application/users/${userId}`, {
            headers: { "Authorization": "Bearer " + global.apikeyv2 }
        });
        
        if (userDetails.data.attributes.root_admin) {
            await m.reply(`⚠️ User terkait adalah Admin. Hanya server [${serverName}] yang akan dihapus.`);
            await axios.delete(`${global.domainv2}/api/application/servers/${serverId}?force=true`, {
                headers: { "Authorization": "Bearer " + global.apikeyv2 }
            });
            await m.reply(`✅ Server [${serverName}] berhasil dihapus. User Admin tidak dihapus.`);
        } else {
            await axios.delete(`${global.domainv2}/api/application/servers/${serverId}?force=true`, {
                headers: { "Authorization": "Bearer " + global.apikeyv2 }
            });
            await m.reply(`✅ Server [${serverName}] berhasil dihapus.`);
            
            await axios.delete(`${global.domainv2}/api/application/users/${userId}`, {
                headers: { "Authorization": "Bearer " + global.apikeyv2 }
            });
            await m.reply(`✅ User terkait dengan ID ${userId} juga berhasil dihapus.`);
        }
    } catch (error) {
        let errorMsg = error.response ? `Gagal. Status: ${error.response.status}. Mungkin server atau user sudah dihapus.` : error.message;
        return m.reply(`Terjadi Kesalahan:\n${errorMsg}`);
    }
}
break;
case 'deladminv2': {
    if (!isOwner) return m.reply(mess.owner);

    if (args[0]) {
        const userId = args[0];
        if (isNaN(userId)) return m.reply("ID User harus berupa angka.");

        try {
            const userDetailsResponse = await axios.get(`${global.domainv2}/api/application/users/${userId}`, {
                headers: { "Authorization": "Bearer " + global.apikeyv2 }
            });
            const userDetails = userDetailsResponse.data.attributes;

            if (!userDetails.root_admin) {
                return m.reply(`User dengan ID ${userId} bukan seorang admin.`);
            }

            const serverListResponse = await axios.get(`${global.domainv2}/api/application/servers`, {
                headers: { "Authorization": "Bearer " + global.apikeyv2 }
            });
            const allServers = serverListResponse.data.data;
            const adminServers = allServers.filter(server => server.attributes.user == userId);

            if (adminServers.length > 0) {
                let serverListText = `*Gagal!* User admin *${userDetails.username}* tidak bisa dihapus karena masih memiliki server berikut. Anda harus menghapus server ini terlebih dahulu menggunakan perintah \`.deladmin <id>\`:\n`;
                adminServers.forEach(server => {
                    serverListText += `\n─────────────────\n`;
                    serverListText += `*Nama Server:* ${server.attributes.name}\n`;
                    serverListText += `*ID Server:* ${server.attributes.id}`;
                });
                return m.reply(serverListText);
            } else {
                const interactiveMessage = {
                    body: { text: `Anda akan menghapus admin:\n\n*Username:* ${userDetails.username}\n*ID User:* ${userDetails.id}` },
                    footer: { text: 'Tindakan ini akan menghapus user admin secara permanen!' },
                    header: { title: "KONFIRMASI PENGHAPUSAN ADMIN", hasMediaAttachment: false },
                    nativeFlowMessage: {
                        buttons: [{
                            name: "quick_reply",
                            buttonParamsJson: JSON.stringify({
                                display_text: "Ya, Hapus User Admin Ini",
                                id: `${prefix}deladmin_confirmv2 ${userId}`
                            })
                        }]
                    }
                };

                const msg = generateWAMessageFromContent(m.chat, {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                            interactiveMessage: interactiveMessage
                        }
                    }
                }, { quoted: m });
                await sanhua.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
            }
        } catch (error) {
            m.reply("Gagal mendapatkan detail user. Pastikan ID User Admin benar.");
        }
    } else {
        try {
            await m.reply("proses..... jika tidak muncul berarti anda pakai wa bussines anda bisa pakai .listadmin trus ketik .deladmin angka sesuai di list");

            const userListResponse = await axios.get(`${global.domainv2}/api/application/users`, {
                headers: { "Authorization": "Bearer " + global.apikeyv2 }
            });
            const allUsers = userListResponse.data.data;
            const adminUsers = allUsers.filter(user => user.attributes.root_admin);

            if (adminUsers.length === 0) {
                return m.reply("Tidak ada user admin yang ditemukan di panel.");
            }

            const adminRows = adminUsers.map(user => ({
    title: user.attributes.username,
    description: `ID: ${user.attributes.id} | Email: ${user.attributes.email}`,
    id: `${prefix}deladminv2 ${user.attributes.id}` 
}));

            const paramsJson = {
                title: 'Pilih Admin Untuk Dihapus',
                sections: [{
                    title: 'DAFTAR USER ADMIN',
                    highlight_label: `${adminUsers.length} Admin Tersedia`,
                    rows: adminRows
                }]
            };

            const interactiveMessage = {
                body: { text: "Silakan pilih user admin yang ingin Anda hapus." },
                footer: { text: "Manajemen Admin © SANHUA" },
                header: { title: "PILIH ADMIN", hasMediaAttachment: false },
                nativeFlowMessage: {
                    buttons: [{
                        name: "single_select",
                        buttonParamsJson: JSON.stringify(paramsJson)
                    }]
                }
            };

            const msg = generateWAMessageFromContent(m.chat, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                        interactiveMessage: interactiveMessage
                    }
                }
            }, { quoted: m });
    
            await sanhua.relayMessage(m.chat, msg.message, { messageId: msg.key.id });

        } catch (error) {
            m.reply(`Terjadi Kesalahan:\n${error.message}`);
        }
    }
}
break;

case 'listadminv2': {
    if (!isOwner) return m.reply(mess.owner);
    
    try {
        await m.reply("⏳ Mengambil daftar user admin, mohon tunggu...");
        
        const userListResponse = await axios.get(`${global.domainv2}/api/application/users`, {
            headers: { "Authorization": "Bearer " + global.apikeyv2 }
        });
        const allUsers = userListResponse.data.data;
        const adminUsers = allUsers.filter(user => user.attributes.root_admin);

        if (adminUsers.length === 0) {
            return m.reply("Tidak ada user admin yang ditemukan di panel.");
        }

        let listText = "*DAFTAR SEMUA USER ADMIN*\n";
        adminUsers.forEach(user => {
            listText += `\n─────────────────\n`;
            listText += `*Username:* ${user.attributes.username}\n`;
            listText += `*ID User:* ${user.attributes.id}\n`;
            listText += `*Email:* ${user.attributes.email}`;
        });
        
        m.reply(listText.trim());

    } catch (error) {
        m.reply(`Terjadi Kesalahan:\n${error.message}`);
    }
}
break;

case 'deladmin_confirmv2': {
    if (!isOwner) return m.reply(mess.owner);
    const userId = args[0];
    if (!userId || isNaN(userId)) return m.reply("ID User tidak valid.");

    try {
        await m.reply(`Menghapus user admin dengan ID ${userId}...`);
        await axios.delete(`${global.domainv2}/api/application/users/${userId}`, {
            headers: { "Authorization": "Bearer " + global.apikeyv2 }
        });
        m.reply(`✅ Sukses menghapus user admin dengan ID *${userId}*.`);
    } catch (error) {
        const errorMsg = error.response ? `Gagal menghapus user admin. Status: ${error.response.status}.` : error.message;
        return m.reply(`Terjadi Kesalahan:\n${errorMsg}\n\nPastikan ID User benar dan bukan user utama.`);
    }
}
break;


case 'delakses': {
    if (!isOwner) return m.reply(mess.owner);
    if (!m.isGroup) return m.reply("Perintah ini hanya bisa digunakan di dalam grup.");

    const groupId = m.chat;
    const index = global.resellergroups.indexOf(groupId);

    if (index === -1) return m.reply("Grup ini tidak terdaftar sebagai reseller.");

    global.resellergroups.splice(index, 1);
    saveResellerGroups(global.resellergroups);
    await m.reply("✅ Berhasil! Hak akses reseller untuk semua anggota di grup ini telah dicabut.");
}
break;

case 'listreseller': {
    if (!isOwner) return m.reply(mess.owner);

    const activeResellerGroups = global.resellergroups;

    if (!activeResellerGroups || activeResellerGroups.length === 0) {
        return m.reply("Saat ini tidak ada grup reseller yang terdaftar.");
    }

    let text = "*DAFTAR GRUP RESELLER AKTIF*\n\n";
    for (const groupId of activeResellerGroups) {
        try {
            const metadata = await sanhua.groupMetadata(groupId);
            text += `• *Nama Grup:* ${metadata.subject}\n`;
            text += `  *ID Grup:* ${groupId}\n\n`;
        } catch (e) {
            text += `• Gagal mengambil data untuk ID: ${groupId}\n\n`;
        }
    }
    m.reply(text.trim());
}
break;
case 'listram': {
    const isReseller = m.isGroup && global.resellergroups.includes(m.chat);
    if (!isOwner && !isReseller) {
        return m.reply("Perintah ini hanya bisa diakses oleh Owner atau anggota grup Reseller.");
    }

    const paket = {
        "1gb": { ram: "1000", disk: "1000", cpu: "40" },
        "2gb": { ram: "2000", disk: "1000", cpu: "60" },
        "3gb": { ram: "3000", disk: "2000", cpu: "80" },
        "4gb": { ram: "4000", disk: "2000", cpu: "100" },
        "5gb": { ram: "5000", disk: "3000", cpu: "120" },
        "6gb": { ram: "6000", disk: "3000", cpu: "140" },
        "7gb": { ram: "7000", disk: "4000", cpu: "160" },
        "8gb": { ram: "8000", disk: "4000", cpu: "180" },
        "9gb": { ram: "9000", disk: "5000", cpu: "200" },
        "10gb": { ram: "10000", disk: "5000", cpu: "220" },
        "unli": { ram: "0", disk: "0", cpu: "0" }
    };

    let listText = "*DAFTAR PAKET RAM TERSEDIA*\n\n";
    listText += "Gunakan perintah `.paket username`\nContoh: `.1gb sanhua`\n\n";

    for (const [key, value] of Object.entries(paket)) {
        const ram = value.ram === "0" ? "Unlimited" : `${parseInt(value.ram) / 1000} GB`;
        const disk = value.disk === "0" ? "Unlimited" : `${parseInt(value.disk) / 1000} GB`;
        const cpu = value.cpu === "0" ? "Unlimited" : `${value.cpu}%`;
        
        listText += `─────────────────\n`;
        listText += `*Paket:* ${key}\n`;
        listText += `• RAM: ${ram}\n`;
        listText += `• Disk: ${disk}\n`;
        listText += `• CPU: ${cpu}\n`;
    }

    m.reply(listText.trim());
}
break;
case 'self':
case 'public': {
    if (!isOwner) return m.reply('Perintah ini hanya untuk Owner.');

    const newMode = command === 'public';
    sanhua.public = newMode;
    
    if (global.botSettings && typeof saveSettings === 'function') {
        global.botSettings.isPublic = newMode;
        saveSettings(global.botSettings);
    }
    
    const modeStatus = newMode ? 'PUBLIC' : 'SELF';
    
    console.log(chalk.yellow(
        `[MODE CHANGE] Mode diubah ke ${modeStatus} oleh ${m.pushName || m.sender.split('@')[0]}`
    ));
    
    await m.reply(`✅ Mode bot berhasil diubah ke: *${modeStatus}*`);
    
    if (m.isGroup) {
        const groupInfo = await sanhua.groupMetadata(m.chat).catch(e => null);
        const groupName = groupInfo?.subject || 'Unknown Group';
        console.log(chalk.yellow(`[GROUP INFO] Nama Grup: ${groupName} | ID: ${m.chat}`));
    }
    }
    break;

case 'mute': {
    if (!isOwner) return m.reply("Hanya owner yang bisa menggunakan perintah ini.");
    if (!m.isGroup) return m.reply("Perintah ini hanya bisa digunakan di dalam grup.");

    if (global.mutedGroups.includes(m.chat)) {
        return m.reply("Grup ini sudah di-mute sebelumnya.");
    }

    global.mutedGroups.push(m.chat);
    saveMutedGroups(global.mutedGroups);
    console.log(chalk.yellow(`[MUTE] Grup ${m.chat} telah dimute`));
    await m.reply("✅ Bot berhasil di-mute di grup ini.");
    break;
}

case 'unmute': {
    if (!isOwner) return m.reply("Hanya owner yang bisa menggunakan perintah ini.");
    if (!m.isGroup) return m.reply("Perintah ini hanya bisa digunakan di dalam grup.");

    const index = global.mutedGroups.indexOf(m.chat);
    if (index === -1) {
        return m.reply("Grup ini tidak sedang dalam mode mute.");
    }

    global.mutedGroups.splice(index, 1);
    saveMutedGroups(global.mutedGroups);
    console.log(chalk.yellow(`[UNMUTE] Grup ${m.chat} telah diunmute`));
    await m.reply("✅ Bot berhasil di-unmute di grup ini.");
    }
    break;
    
case 'owner': {
    try {
        await sanhua.sendMessage(m.chat, { react: { text: "👑", key: m.key } });

        const ownerList = global.owner.filter(owner => owner && owner.trim() !== '');

        if (ownerList.length === 0) {
            return m.reply("Nomor owner belum diatur di file settings.js.");
        }

        const ownerName = global.namaOwner || "Danzz";
        const ownerImageUrl = 'https://files.catbox.moe/gjo8yg.png';

        let captionText = `*-- My Creator(s) --*\n\n*Nama:* ${ownerName}\n\n`;

        ownerList.forEach((ownerNumber, index) => {
            captionText += `*Kontak ${index + 1}:* wa.me/${ownerNumber}\n`;
        });

        captionText += "\nJangan di-spam ya kak!";

        await sanhua.sendMessage(m.chat, {
            image: { url: ownerImageUrl },
            caption: captionText.trim(),
            contextInfo: {
                mentionedJid: [m.sender]
            }
        }, { quoted: m });

    } catch (e) {
        console.error("Gagal mengirim info owner:", e);
        const ownerList = global.owner.filter(owner => owner && owner.trim() !== '');
        if (ownerList.length > 0) {
            let fallbackText = "Terjadi error, ini kontak owner saya:\n\n";
            ownerList.forEach((ownerNumber, index) => {
                fallbackText += `*Kontak ${index + 1}:* wa.me/${ownerNumber}\n`;
            });
            m.reply(fallbackText.trim());
        } else {
            m.reply("Terjadi error dan nomor owner belum diatur.");
        }
    }
}
break;
case 'brat': {
    if (!m.isGroup) return m.reply("Fitur ini khusus untuk grup ya!");

    let text;

    if (args.length >= 1) {
        text = args.slice(0).join(" ");
    } else if (m.quoted && m.quoted.text) {
        text = m.quoted.text;
    } else {
        return m.reply("Masukkan teks atau reply teks yang ingin dijadikan sticker!");
    }

    if (!text) {
        return m.reply(`Penggunaan: ${prefix + command} `);
    }

    try {

        const tmpDir = './tmp';
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }
        

        await sanhua.sendMessage(m.chat, { react: { text: "🕐", key: m.key } });
        
        let ngawiStik = await getBuffer(`https://api.siputzx.my.id/api/m/brat?text=${encodeURIComponent(text)}&isVideo=false&delay=500`);
        
        await sanhua.sendImageAsSticker(m.chat, ngawiStik, m, {
            packname: `𓄯ִ ── ꯭𐑈ƚꪱִ𝖼𝗄ᧉׄ𝗋 ᎓`,
            author: `Aina-md`
        });
    } catch (error) {
        console.error("Error generating sticker:", error);
        return m.reply("Maaf, terjadi kesalahan saat membuat sticker. Silakan coba lagi nanti.");
    }
}
break;

case 'idch':
case 'cekidch': {
    if (!text) return reply("Silakan masukkan link channel WhatsApp.");
    if (!text.includes("https://whatsapp.com/channel/")) return reply("Link tautan channel tidak valid.");

    try {
        const channelCode = text.split('https://whatsapp.com/channel/')[1];
        const res = await sanhua.newsletterMetadata("invite", channelCode);

        if (!res || !res.id) {
            return reply("Gagal mendapatkan informasi channel. Pastikan link yang Anda berikan benar dan channel tersebut publik.");
        }

        const verificationStatus = res.verification === "VERIFIED" ? "Terverifikasi" : "Tidak Terverifikasi";

        const teks = `*Detail Informasi Channel*\n\n` +
                     `*ID :* ${res.id}\n` +
                     `*Nama :* ${res.name}\n` +
                     `*Total Pengikut :* ${res.subscribers}\n` +
                     `*Status :* ${res.state}\n` +
                     `*Verifikasi :* ${verificationStatus}`;

        const msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    "messageContextInfo": {
                        "deviceListMetadata": {},
                        "deviceListMetadataVersion": 2
                    },
                    interactiveMessage: {
                        body: {
                            text: teks
                        },
                        footer: {
                            text: '© Sanhua Assistant'
                        },
                        nativeFlowMessage: {
                            buttons: [{
                                "name": "cta_copy",
                                "buttonParamsJson": JSON.stringify({
                                    "display_text": "Salin ID Channel",
                                    "copy_code": res.id
                                })
                            }],
                        },
                    },
                },
            },
        }, {
            quoted: m
        });

        await sanhua.relayMessage(m.chat, msg.message, {
            messageId: msg.key.id
        });

    } catch (e) {
        console.error("Error pada perintah 'cekidch':", e);
        reply("Terjadi kesalahan. Gagal mengambil informasi channel. Pastikan link yang Anda berikan valid.");
    }
}
break; 
case "cekidgc": {
    if (!isOwner) return m.reply(mess.owner);

    await m.reply("⏳ Sedang mengambil daftar grup, mohon tunggu...");

    try {
        let getGroups = await sanhua.groupFetchAllParticipating();
        let groups = Object.entries(getGroups).slice(0).map((entry) => entry[1]);
        let anu = groups.map((v) => v.id);
        let teks = `⬣ *LIST GROUP DI BAWAH*\n\nTotal Group : ${anu.length} Group\n\n`;
        
        for (let x of anu) {
            let metadata2 = await sanhua.groupMetadata(x);
            teks += `◉ Nama : ${metadata2.subject}\n◉ ID : ${metadata2.id}\n◉ Member : ${metadata2.participants.length}\n\n────────────────────────\n\n`;
        }

        await m.reply(teks.trim());

    } catch (e) {
        console.error(e);
        await m.reply("Terjadi kesalahan saat mengambil data grup.");
    }
}
break;

case 'tourl': {
    if (!m.quoted) return m.reply('Reply media (foto, video, dokumen) yang ingin diubah ke link!');
    
    const tmpDir = './tmp';
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
    }

    const mime = (m.quoted.msg || m.quoted).mimetype || '';
    if (!mime) {
        return m.reply('Gagal mendeteksi jenis media!');
    }
    
    const { fromBuffer } = require('file-type');
    const quotedBuffer = await m.quoted.download();
    const type = await fromBuffer(quotedBuffer);
    const extension = type ? type.ext : mime.split('/')[1] || 'bin';

    if (!extension) {
        console.error("Gagal mendapatkan ekstensi untuk mime-type:", mime);
        return m.reply("Tidak bisa menentukan ekstensi file untuk media ini.");
    }
    
    m.reply('⏳ Mengupload media ke Catbox.moe...');
    
    try {
        const tmpFile = path.join(tmpDir, `${getRandom()}.${extension}`);
        fs.writeFileSync(tmpFile, quotedBuffer);

        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('fileToUpload', fs.createReadStream(tmpFile));

        const res = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: form.getHeaders()
        });

        const url = res.data;
        fs.unlinkSync(tmpFile);

        const teks = `✅ *Sukses Upload!*\n\n🔗 Link: ${url}`;

        const msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                    interactiveMessage: {
                        body: { text: teks },
                        footer: { text: "Link Hosting via Catbox.moe" },
                        header: { title: "Media Telah Diupload!", hasMediaAttachment: false },
                        nativeFlowMessage: {
                            buttons: [{
                                name: "cta_copy",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "SALIN LINK",
                                    copy_code: url
                                })
                            }]
                        }
                    }
                }
            }
        }, { quoted: m });

        await sanhua.relayMessage(m.chat, msg.message, { messageId: msg.key.id });

    } catch (err) {
        console.error("Error 'tourl':", err);
        m.reply('❌ Gagal upload ke Catbox. Coba lagi atau pastikan medianya tidak kosong.');
    }
}
break;

case 'tqto': {
    await sanhua.sendMessage(m.chat, { react: { text: "💝", key: m.key } });

    const teks = `
Terima kasih sebesar-besarnya kepada:

💠 *Allah SWT* — Atas segala Rahmat & Karunia-Nya  
💠 *Danzz*, *FIXZ* — creator sanhua
💠 *Terimakasih telah menggunakan sc sanhua ini*

💬 Tetap semangat dan jangan lupa berdoa 🙏
    `.trim();

    const preparedImage = await prepareWAMessageMedia({
        image: { url: 'https://files.catbox.moe/gjo8yg.png' } 
    }, { upload: sanhua.waUploadToServer });

    const interactiveMessage = {
        body: { text: teks },
        footer: { text: 'SANHUA Assistant - All Rights Reserved' },
        header: {
            title: "✨ TQTO - Credits & Thanks ✨",
            hasMediaAttachment: true,
            imageMessage: preparedImage.imageMessage
        },
        nativeFlowMessage: {
            buttons: [{
                name: "cta_copy",
                buttonParamsJson: JSON.stringify({
                    display_text: "COPY UCAPAN",
                    copy_code: teks
                })
            }]
        }
    };

    const msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage
            }
        }
    }, { quoted: m });

    await sanhua.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}
break;
case 'addowner': {
        if (!isOwner) return m.reply(mess.owner);

        let newOwner;
        if (m.quoted) {
            newOwner = m.quoted.sender.split('@')[0];
        } else {
            newOwner = args[0] ? args[0].replace(/[^0-9]/g, '') : null;
        }

        if (!newOwner) return m.reply("Silakan balas pesan orang yang ingin dijadikan owner atau masukkan nomor teleponnya.");

        if (global.owner.includes(newOwner)) {
            return m.reply("Nomor tersebut sudah menjadi owner.");
        }

        global.owner.push(newOwner);
        await saveOwnerToSettingsFile();
        await m.reply(`✅ Berhasil! ${newOwner} sekarang menjadi owner dan telah disimpan secara permanen di settings.js.`);
      }
      break;

      case 'delowner': {
        if (!isOwner) return m.reply(mess.owner);

        let target;
        if (m.quoted) {
            target = m.quoted.sender.split('@')[0];
        } else {
            target = args[0] ? args[0].replace(/[^0-9]/g, '') : null;
        }

        if (!target) return m.reply("Silakan balas pesan orang yang ingin dihapus dari daftar owner atau masukkan nomor teleponnya.");

        const ownerIndex = global.owner.indexOf(target);
        if (ownerIndex === -1) {
            return m.reply("Nomor tersebut tidak ada dalam daftar owner.");
        }

        global.owner.splice(ownerIndex, 1);
        await saveOwnerToSettingsFile();
        await m.reply(`✅ Berhasil! ${target} telah dihapus dari daftar owner dan perubahannya disimpan di settings.js.`);
      }
      break;
case 'backup': {
    if (!isCreator) return m.reply("Perintah ini khusus untuk dijalankan dari nomor Bot itu sendiri.");
    
    try {
        await m.reply("⏳ Sedang membuat file backup, proses ini mungkin memakan waktu beberapa saat...");

        const backupFileName = `backup-sanhua-${Date.now()}.zip`;
        
        const filesToBackup = fs.readdirSync('./').filter(item => 
            ![
                "node_modules", 
                "session", 
                "package-lock.json",
                ".npm",
                backupFileName
            ].includes(item) && !item.endsWith('.zip')
        ).join(" ");

        if (!filesToBackup) {
            return m.reply("Tidak ada file yang bisa di-backup.");
        }

        execSync(`zip -r ${backupFileName} ${filesToBackup}`);

        await sanhua.sendMessage(
            m.chat,
            {
                document: fs.readFileSync(`./${backupFileName}`),
                mimetype: "application/zip",
                fileName: backupFileName,
            },
            { quoted: m }
        );

        fs.unlinkSync(`./${backupFileName}`);

    } catch (error) {
        console.error("Backup Error:", error);
        m.reply(`Terjadi kesalahan saat membuat backup: ${error.message}`);
    }
}
break;
case 'hd': {
    try {
        if (!m.quoted) {
            return m.reply('Silakan balas (reply) gambar dengan perintah .hd');
        }

        const quotedMessage = m.quoted.msg || m.quoted;
        const mime = quotedMessage.mimetype || '';

        if (!/image\/(jpe?g|png)/.test(mime)) {
            return m.reply(`Format ${mime} tidak didukung. Bot hanya menerima gambar JPG atau PNG.`);
        }

        await m.reply('⏳ Sedang memproses gambar, mohon tunggu...');

        const img = await m.quoted.download?.();
        if (!img) {
            throw new Error('Gagal mengunduh gambar dari pesan yang Anda balas.');
        }

        const form = new FormData();
        form.append('image', img, {
            filename: 'upload.jpg',
            contentType: 'image/jpeg'
        });
        form.append('user_id', 'undefined');
        form.append('is_public', 'true');

        const headers = {
            ...form.getHeaders(),
            'Accept': '*/*',
            'Origin': 'https://picupscaler.com',
            'Referer': 'https://picupscaler.com/',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'
        };
        
        const { data } = await axios.post('https://picupscaler.com/api/generate/handle', form, { headers });

        const resultUrl = data?.image_url || data?.url;
        if (!resultUrl) {
            throw new Error('API gagal memproses gambar.');
        }
        
        const imgRes = await axios.get(resultUrl, { responseType: 'arraybuffer' });

        await sanhua.sendMessage(m.chat, {
            image: Buffer.from(imgRes.data),
            caption: '*Donee kak*'
        }, { quoted: m });

    } catch (e) {
        console.error("Error pada fitur 'hd':", e);
        m.reply(`Maaf, terjadi error: ${e.message}`);
    }
}
break;
case 'readviewonce':
case 'rvo': {
    if (!m.quoted) return m.reply('Balas pesan view once yang ingin dibaca');

    try {
        const quoted = m.quoted;
        const mime = (quoted.msg || quoted).mimetype || '';
        const captionAsli = quoted.msg?.caption || quoted.caption || quoted.text || 'Tidak ada caption';
        
        if (!mime) return m.reply('Jenis media tidak dikenali');
        
        
        let media;
        try {
            media = await sanhua.downloadAndSaveMediaMessage(quoted);
        } catch (downloadError) {
            console.error('Error downloading media:', downloadError);
            return m.reply('Gagal mengunduh media. Pastikan bot memiliki izin.');
        }

        let opsiPesan = { 
            quoted: m,
            caption: captionAsli ? captionAsli : 'Tidak ada caption',
        };

        if (/image/.test(mime)) {
            opsiPesan.image = { url: media };
        } else if (/video/.test(mime)) {
            opsiPesan.video = { url: media };
        } else if (/audio/.test(mime)) {
            opsiPesan.audio = { url: media };
            opsiPesan.mimetype = 'audio/mpeg';
            opsiPesan.ptt = false;
        } else if (/document/.test(mime)) {
            opsiPesan.document = { url: media };
            opsiPesan.mimetype = mime;
            opsiPesan.fileName = quoted.msg?.fileName || 'document';
        } else if (/sticker/.test(mime)) {
            opsiPesan.sticker = { url: media };
        } else {
            fs.unlinkSync(media); 
            return m.reply('Jenis media ini tidak didukung');
        }

        await sanhua.sendMessage(m.chat, opsiPesan);
        

        if (fs.existsSync(media)) {
            fs.unlinkSync(media);
        }
    } catch (error) {
        console.error('Gagal membaca view once:', error);
        m.reply('Gagal membaca pesan, coba lagi atau pastikan bot memiliki izin');
    }
}
break;
case 'qc': {
    if (!text) return m.reply("Mana Teksnya?");

    const pushname = m.pushName || m.sender.split('@')[0];

    await m.reply("⏳ Proses generate quote sticker . . .");

    let ppuser;
    try {
        ppuser = await sanhua.profilePictureUrl(m.sender, 'image');
    } catch (e) {
        console.log("Gagal mengambil foto profil, menggunakan gambar default. Error:", e);
        ppuser = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';
    }

    try {
        const json = {
            "type": "quote",
            "format": "png",
            "backgroundColor": "#FFFFFF",
            "width": 512,
            "height": 768,
            "scale": 2,
            "messages": [{
                "entities": [],
                "avatar": true,
                "from": {
                    "id": 1,
                    "name": pushname,
                    "photo": {
                        "url": ppuser
                    }
                },
                "text": text,
                "replyMessage": {}
            }]
        };

        const response = await axios.post('https://bot.lyo.su/quote/generate', json, {
            headers: { 'Content-Type': 'application/json' }
        });

        const buffer = Buffer.from(response.data.result.image, 'base64');

        await sanhua.sendImageAsSticker(m.chat, buffer, m, {
            packname: global.packname || "Quote Sticker",
            author: global.author || "©sanhuaBot"
        });

    } catch (error) {
        console.error("Error di perintah 'qc' saat generate/send sticker:", error);
        m.reply("Maaf, terjadi kesalahan saat membuat stiker quote. Silakan coba lagi.");
    }
}
break;
case 'sticker':
case 's': {
    const fs = require('fs');
    const path = require('path');
    const { exec } = require('child_process');

    const mediaSource = (m.mtype === 'imageMessage' || m.mtype === 'videoMessage') ? m : m.quoted;

    if (!mediaSource || !/image|video/.test(mediaSource.mtype)) {
        return m.reply(`Untuk membuat stiker, kirim gambar/video dengan caption *${prefix}sticker* atau balas media yang ada.\n\nUntuk memotong (crop), tambahkan rasio. Contoh: *${prefix}sticker 1:1*`);
    }

    const stickerMetadata = {
        packname: global.packname || 'Sanhua Sticker',
        author: global.author || '© Danzz'
    };

    let tempFilePath;

    try {
        const tmpDir = './tmp';
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }
        
        await sanhua.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });
        tempFilePath = await sanhua.downloadAndSaveMediaMessage(mediaSource);
        const messageType = mediaSource.mtype;
        const ratioArg = args[0];

        if (!ratioArg) {
            const mediaBuffer = fs.readFileSync(tempFilePath);
            if (messageType === 'imageMessage') {
                await sanhua.sendImageAsSticker(m.chat, mediaBuffer, m, stickerMetadata);
            } else if (messageType === 'videoMessage') {
                const duration = mediaSource.message.videoMessage.seconds || 0;
                if (duration > 15) {
                    fs.unlinkSync(tempFilePath);
                    return m.reply('Maksimal durasi video untuk stiker adalah 15 detik!');
                }
                await sanhua.sendVideoAsSticker(m.chat, mediaBuffer, m, stickerMetadata);
            }
        } else {
            const ratios = {
                '1:1': { width: 1, height: 1 }, '4:3': { width: 4, height: 3 }, '4:5': { width: 4, height: 5 },
                '9:16': { width: 9, height: 16 }, '16:9': { width: 16, height: 9 }
            };

            if (!ratios[ratioArg]) {
                return m.reply(`Rasio tidak valid. Pilih dari: ${Object.keys(ratios).join(', ')}`);
            }
            const ratio = ratios[ratioArg];

            if (messageType === 'imageMessage') {
                const jimpImage = await jimp.read(tempFilePath);
                const { width, height } = jimpImage.bitmap;
                const targetRatio = ratio.width / ratio.height;
                let cropWidth = width, cropHeight = height;

                if (width / height > targetRatio) {
                    cropWidth = height * targetRatio;
                } else {
                    cropHeight = width / targetRatio;
                }
                
                const x = (width - cropWidth) / 2;
                const y = (height - cropHeight) / 2;
                
                jimpImage.crop(x, y, cropWidth, cropHeight);
                const buffer = await jimpImage.getBufferAsync(jimp.MIME_JPEG);
                await sanhua.sendImageAsSticker(m.chat, buffer, m, stickerMetadata);

            } else if (messageType === 'videoMessage') {
                const duration = mediaSource.message.videoMessage.seconds || 0;
                if (duration > 15) {
                    fs.unlinkSync(tempFilePath);
                    return m.reply('Maksimal durasi video untuk stiker adalah 15 detik!');
                }

                const outputPath = path.join(tmpDir, `output_${Date.now()}.mp4`);
                
                const { width, height } = await getVideoResolution(tempFilePath);
                const targetRatio = ratio.width / ratio.height;
                let cropWidth = width, cropHeight = height;

                if (width / height > targetRatio) {
                    cropWidth = Math.round(height * targetRatio);
                } else {
                    cropHeight = Math.round(width / targetRatio);
                }
                
                const x = Math.round((width - cropWidth) / 2);
                const y = Math.round((height - cropHeight) / 2);

                const ffmpegCommand = `ffmpeg -i "${tempFilePath}" -vf "crop=${cropWidth}:${cropHeight}:${x}:${y},scale=512:512" -an -y "${outputPath}"`;
                
                await new Promise((resolve, reject) => {
                    exec(ffmpegCommand, (err, stdout, stderr) => {
                        if (err) return reject(new Error(`Gagal memotong video: ${stderr || err.message}`));
                        resolve(true);
                    });
                });

                const buffer = fs.readFileSync(outputPath);
                await sanhua.sendVideoAsSticker(m.chat, buffer, m, stickerMetadata);
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            }
        }
    } catch (err) {
        console.error('Sticker general error:', err);
        let errorMessage = `Terjadi kesalahan saat membuat stiker: ${err.message}`;
        if (err.message.toLowerCase().includes('ffmpeg') || err.message.toLowerCase().includes('ffprobe')) {
            errorMessage += '\n\n*Penyebab umum:* `ffmpeg` belum terpasang di sistem Anda. Silakan install terlebih dahulu.';
        }
        return m.reply(errorMessage);
    } finally {
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
    }
}
break;
case 'add': {
    if (!m.isGroup) return m.reply("Perintah ini hanya bisa digunakan di dalam grup.");
    const groupMetadata = await sanhua.groupMetadata(m.chat).catch(e => {});
    if (!groupMetadata) return m.reply("Gagal mengambil data grup.");

    const participants = groupMetadata.participants;
    const senderIsAdmin = participants.find(p => p.id === m.sender)?.admin !== null;
    const botIsAdmin = participants.find(p => p.id === botNumber)?.admin !== null;

    if (!senderIsAdmin) return m.reply("Anda harus menjadi admin untuk menggunakan perintah ini.");
    if (!botIsAdmin) return m.reply("Jadikan bot sebagai admin terlebih dahulu.");

    let users = m.quoted ? m.quoted.sender : args.join(" ").replace(/[^0-9]/g, '');
    if (!users) return m.reply("Masukkan nomor telepon yang ingin ditambahkan.");

    const targetUser = users + "@s.whatsapp.net";

    try {
        const response = await sanhua.groupParticipantsUpdate(m.chat, [targetUser], "add");
        const code = response[0].status;

        if (code === '200') {
            await m.reply(`✅ Berhasil menambahkan ${"@" + users} ke dalam grup.`);
        } else if (code === '409') {
            await m.reply(`Maaf, ${"@" + users} sudah menjadi anggota grup ini.`);
        } else if (code === '403') {
            await m.reply(`Gagal menambahkan ${"@" + users} karena privasi.\nMengirimkan undangan grup...`);
            const inviteCode = await sanhua.groupInviteCode(m.chat);
            await sanhua.sendMessage(targetUser, {
                text: `Halo! Anda diundang untuk bergabung ke grup *${m.metadata.subject}*.\n\nKlik tautan di bawah untuk bergabung:\nhttps://chat.whatsapp.com/${inviteCode}`
            });
        } else {
             m.reply(`Gagal menambahkan anggota, status: ${code}`);
        }
    } catch (e) {
        console.error(e);
        m.reply("Terjadi kesalahan. Pastikan nomor yang Anda masukkan benar dan terdaftar di WhatsApp.");
    }
}
break;
case 'kick': {
    if (!m.isGroup) return m.reply("Perintah ini hanya bisa digunakan di dalam grup.");

    const groupMetadata = await sanhua.groupMetadata(m.chat).catch(e => {});
    if (!groupMetadata) return m.reply("Gagal mengambil data grup.");

    const participants = groupMetadata.participants;
    const senderIsAdmin = participants.find(p => p.id.startsWith(m.sender.split('@')[0]))?.admin !== null;
    const botIsAdmin = participants.find(p => p.id.startsWith(botNumber.split('@')[0]))?.admin !== null;

    if (!senderIsAdmin) return m.reply("Anda harus menjadi admin untuk menggunakan perintah ini.");
    if (!botIsAdmin) return m.reply("Jadikan bot sebagai admin terlebih dahulu.");

    let users;
    if (m.mentionedJid && m.mentionedJid.length > 0) {
        users = m.mentionedJid;
    } else if (m.quoted) {
        users = [m.quoted.sender];
    } else {
        const number = args.join(' ').replace(/[^0-9]/g, '');
        if (!number) return m.reply("Sebutkan (tag) pengguna atau balas pesan mereka untuk mengeluarkannya.");
        users = [number + "@s.whatsapp.net"];
    }

    const currentParticipantNumbers = participants.map(p => p.id.split('@')[0]);
    const usersToKick = [];
    let adminSkipped = false;
    let nonMemberSkipped = false;

    for (const user of users) {
        const userNumber = user.split('@')[0];

        if (!currentParticipantNumbers.includes(userNumber)) {
            nonMemberSkipped = true;
            continue;
        }

        const userIsAdmin = participants.find(p => p.id.startsWith(userNumber))?.admin !== null;
        if (userIsAdmin) {
            adminSkipped = true;
            continue;
        }

        if (user.startsWith(botNumber.split('@')[0]) || user.startsWith(m.sender.split('@')[0])) {
            continue;
        }

        usersToKick.push(user);
    }

    if (nonMemberSkipped) {
        await m.reply("⚠️ Peringatan: Satu atau lebih target bukan merupakan anggota grup saat ini (kemungkinan Saluran/Channel atau sudah keluar) dan telah dilewati.");
    }
    if (adminSkipped) {
        await m.reply("⚠️ Peringatan: Admin tidak bisa dikeluarkan. Silakan copot jabatan admin mereka terlebih dahulu.");
    }

    if (usersToKick.length === 0) {
        return;
    }

    try {
        const response = await sanhua.groupParticipantsUpdate(m.chat, usersToKick, "remove");

        let kickedUsers = [];
        let failedUsers = [];
        for (const res of response) {
            if (res.status == 200) {
                kickedUsers.push(res.jid.split('@')[0]);
            } else {
                failedUsers.push(res.jid.split('@')[0]);
            }
        }

        let replyText = "";
        if (kickedUsers.length > 0) {
            replyText += `✅ Berhasil mengeluarkan @${kickedUsers.join(", @")}.\n`;
        }
        if (failedUsers.length > 0) {
            replyText += `❌ Gagal mengeluarkan @${failedUsers.join(", @")}. Mungkin karena alasan lain.`;
        }

        if (replyText) {
            await sanhua.sendMessage(m.chat, {
                text: replyText.trim(),
                mentions: usersToKick
            }, {
                quoted: m
            });
        }
    } catch (e) {
        console.error(e);
        m.reply("Terjadi kesalahan tak terduga saat mencoba mengeluarkan anggota.");
    }
}
break;
case 'hidetag':
case 'h':
case 'tag': {
    if (!m.isGroup) return m.reply("Perintah ini hanya bisa digunakan di dalam grup.");
    if (!m.isAdmin && !isOwner) return m.reply('Hanya admin dan owner yang bisa menggunakan perintah ini.');

    if (!text && !m.quoted) return m.reply(`Masukkan teks yang ingin ditag\nContoh: ${prefix}hidetag Hai semua`);
    
    const moment = require('moment-timezone');
    const currentTime = moment().tz('Asia/Jakarta').format('HH:mm:ss • DD/MM/YYYY');
    
    const textToSend = text ? text : (m.quoted ? m.quoted.text : '');
    
    const participants = m.metadata.participants;
    const allParticipantIds = participants.map(a => a.id);
    
    const formattedMessage = 
`*「 PESAN HIDETAG 」*

*Dari*: @${m.sender.split('@')[0]}
*Isi Pesan*: ${textToSend}`;

    await sanhua.sendMessage(m.chat, { 
        text: formattedMessage,
        mentions: allParticipantIds, 
        contextInfo: {
            mentionedJid: allParticipantIds,
            externalAdReply: {
                showAdAttribution: false,
                renderLargerThumbnail: false,
                title: 'HIDETAG NOTIFICATION',
                body: `Waktu: ${currentTime}`,
                thumbnailUrl: 'https://files.catbox.moe/f0fv6j.jpeg',
                mediaType: 1,
                thumbnailWidth: 60,
                thumbnailHeight: 60,
                sourceUrl: ''
            }
        }
    });
}
break;
    case 'play': {
    if (!text) return m.reply('Masukkan judul lagu! Contoh: *play Jakarta Hari Ini*');

    await m.reply('✨ Tunggu sebentar, sedang mencari dan mengunduh lagu...');

    try {
        const res = await fetch(`https://api.nekorinn.my.id/downloader/ytplay?q=${encodeURIComponent(text)}`);
        if (!res.ok) return m.reply('Gagal mengambil data dari server API.');

        const json = await res.json();
        if (!json.status || !json.result?.downloadUrl) {
            return m.reply('🚩 Lagu tidak ditemukan atau link unduhan tidak tersedia.');
        }

        const { title, downloadUrl } = json.result;

        await sanhua.sendMessage(m.chat, {
            audio: { url: downloadUrl },
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`,
            ptt: false
        }, { quoted: m });

    } catch (e) {
        console.error('❌ Error pada fitur play:', e);
        m.reply('❌ Terjadi kesalahan saat memproses permintaanmu.');
    }
}
break;
case 'tiktok':
case 'tt':
case 'ttdl': {
    const axios = require('axios');
    const cheerio = require('cheerio');
    const FormData = require('form-data');
    const moment = require('moment-timezone');

    async function tiktokV1(query) {
        const encodedParams = new URLSearchParams();
        encodedParams.set('url', query);
        encodedParams.set('hd', '1');

        const { data } = await axios.post('https://tikwm.com/api/', encodedParams, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Cookie': 'current_language=en',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36'
            }
        });
        return data;
    }

    async function tiktokV2(query) {
        const form = new FormData();
        form.append('q', query);

        const { data } = await axios.post('https://savetik.co/api/ajaxSearch', form, {
            headers: {
                ...form.getHeaders(),
                'Accept': '*/*',
                'Origin': 'https://savetik.co',
                'Referer': 'https://savetik.co/en2',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        const rawHtml = data.data;
        const $ = cheerio.load(rawHtml);
        const title = $('.thumbnail .content h3').text().trim();
        const thumbnail = $('.thumbnail .image-tik img').attr('src');
        const video_url = $('video#vid').attr('data-src');

        const slide_images = [];
        $('.photo-list .download-box li').each((_, el) => {
            const imgSrc = $(el).find('.download-items__thumb img').attr('src');
            if (imgSrc) slide_images.push(imgSrc);
        });

        return { title, thumbnail, video_url, slide_images };
    }

    if (!text) return m.reply('Masukkan URL TikTok yang valid.\nContoh: .tiktok https://vt.tiktok.com/xxxxxx');

    await m.reply('Mohon tunggu, sedang memproses...');

    try {
        let res;
        let images = [];

        const dataV1 = await tiktokV1(text);
        if (dataV1?.data) {
            const d = dataV1.data;
            if (Array.isArray(d.images) && d.images.length > 0) {
                images = d.images;
            } else if (Array.isArray(d.image_post) && d.image_post.length > 0) {
                images = d.image_post;
            }
            res = {
                title: d.title,
                region: d.region,
                duration: d.duration,
                create_time: d.create_time,
                play_count: d.play_count,
                digg_count: d.digg_count,
                comment_count: d.comment_count,
                share_count: d.share_count,
                download_count: d.download_count,
                author: {
                    unique_id: d.author?.unique_id,
                    nickname: d.author?.nickname
                },
                music_info: {
                    title: d.music_info?.title,
                    author: d.music_info?.author
                },
                cover: d.cover,
                play: d.play,
                hdplay: d.hdplay,
                wmplay: d.wmplay
            };
        }

        const dataV2 = await tiktokV2(text);
        if ((!res?.play && images.length === 0) && dataV2.video_url) {
            res = res || { play: dataV2.video_url, title: dataV2.title };
        }
        if (images.length === 0 && Array.isArray(dataV2.slide_images) && dataV2.slide_images.length > 0) {
            images = dataV2.slide_images;
        }

        if (images.length > 0) {
            await m.reply(`Terdeteksi ${images.length} gambar, sedang mengirim...`);
            for (const img of images) {
                await sanhua.sendMessage(m.chat, {
                    image: { url: img },
                    caption: res.title || ''
                }, { quoted: m });
            }
            return;
        }

        const time = res.create_time ?
            moment.unix(res.create_time).tz('Asia/Jakarta').format('dddd, D MMMM YYYY [pukul] HH:mm:ss') :
            '-';

        const caption = `*Video TikTok Info*
*Judul:* ${res.title || '-'}
*Region:* ${res.region || 'N/A'}
*Durasi:* ${res.duration || '-'} detik
*Waktu Upload:* ${time}

*Statistik*
*Views:* ${res.play_count || 0}
*Likes:* ${res.digg_count || 0}
*Komentar:* ${res.comment_count || 0}
*Share:* ${res.share_count || 0}
*Downloads:* ${res.download_count || 0}

*Author*
*Username:* ${res.author?.unique_id || '-'}
*Nama:* ${res.author?.nickname || '-'}`;

        const videoUrl = res.hdplay || res.play || res.wmplay;
        if (videoUrl) {
            await sanhua.sendMessage(m.chat, { video: { url: videoUrl }, caption: caption }, { quoted: m });
        } else if (res.cover) {
            await m.reply("Gagal mendapatkan link video, mengirimkan cover sebagai gantinya.");
            await sanhua.sendMessage(m.chat, { image: { url: res.cover }, caption: caption }, { quoted: m });
        } else {
            m.reply("Maaf, gagal mengunduh video atau gambar dari URL tersebut.");
        }
    } catch (e) {
        console.error(e);
        m.reply(`Terjadi kesalahan saat memproses permintaan: ${e.message}`);
    }
}
break;
case 'bratvid': {
    await sanhua.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
    
    const text = args.join(' ');
    if (!text) {
        m.reply('Contoh: .bratv halo dunia');
        await sanhua.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return; 
    }

    try {
        const apiUrl = `https://api.ypnk.dpdns.org/api/video/bratv?text=${encodeURIComponent(text)}`;
        
        const response = await axios.get(apiUrl, {
            responseType: 'arraybuffer'
        });
        
        const videoBuffer = Buffer.from(response.data);

        const sticker = new Sticker(videoBuffer, {
            pack: 'BRAT Video',
            author: 'Sanhua Bot',
            type: StickerTypes.CROPPED, 
            quality: 50
        });
        
        await sanhua.sendMessage(m.chat, { 
            sticker: await sticker.toBuffer() 
        }, { quoted: m });

        await sanhua.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Error pada perintah bratv:", e);
        await sanhua.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        m.reply('Gagal membuat stiker video. Kemungkinan API sedang bermasalah.');
    }
}
break;
case 'listjpmgc': {
    if (!isOwner) return m.reply(mess.owner);

    try {
        await sanhua.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

        const getGroups = await sanhua.groupFetchAllParticipating();
        const groups = Object.values(getGroups);

        if (groups.length === 0) {
            return m.reply("Bot tidak tergabung dalam grup manapun.");
        }

        let groupListText = "*DAFTAR GRUP BOT*\n\n";
        groups.forEach((group, index) => {
            groupListText += `${index + 1}. *${group.subject}*\n`;
        });
        
        groupListText += "\nUntuk mengirim pesan, gunakan `.jpm nomor,pesan`";
        await m.reply(groupListText);
        
    } catch (e) {
        console.error("Error pada listjpmgc:", e);
        m.reply("Terjadi kesalahan saat mengambil daftar grup.");
    }
}
break;

case 'jpm': {
    if (!isOwner) return m.reply(mess.owner);

    try {
        const getGroups = await sanhua.groupFetchAllParticipating();
        const allGroupJids = Object.values(getGroups).map(g => g.id);

        if (allGroupJids.length === 0) {
            return m.reply("Bot tidak tergabung dalam grup manapun.");
        }

        const textArgs = args.join(' ');
        const parts = textArgs.split(',');

        if (parts.length < 2) {
            return m.reply("Format salah. Gunakan `.jpm nomor_grup,pesan_anda`\n*Contoh:*\n.jpm 1,3-5,Halo semua, ini info penting.");
        }

        const selectors = [];
        const messageParts = [];
        let messageStarted = false;

        const isSelector = (str) => /^\d+$/.test(str) || /^\d+-\d+$/.test(str);

        for (const part of parts) {
            const trimmedPart = part.trim();
            if (!messageStarted && isSelector(trimmedPart)) {
                selectors.push(trimmedPart);
            } else {
                messageStarted = true;
                messageParts.push(part);
            }
        }

        const messageText = messageParts.join(',').trim();

        if (!messageText) {
            return m.reply("Pesan tidak boleh kosong.");
        }
        
        const selectedJids = [];
        for (const selector of selectors) {
            if (selector.includes('-')) {
                const [start, end] = selector.split('-').map(Number);
                if (!isNaN(start) && !isNaN(end) && start <= end) {
                    for (let i = start; i <= end; i++) {
                        if (allGroupJids[i - 1]) {
                            selectedJids.push(allGroupJids[i - 1]);
                        }
                    }
                }
            } else {
                const index = Number(selector);
                if (!isNaN(index) && allGroupJids[index - 1]) {
                    selectedJids.push(allGroupJids[index - 1]);
                }
            }
        }

        const uniqueJids = [...new Set(selectedJids)];

        if (uniqueJids.length === 0) {
            return m.reply("Tidak ada grup valid yang dipilih. Jalankan `.listjpmgc` untuk melihat nomor yang benar.");
        }

        let sentCount = 0;
        let failedCount = 0;
        
        m.reply(`✅ Pengiriman pesan ke ${uniqueJids.length} grup telah dimulai...`);

        for (const jid of uniqueJids) {
            try {
                await sanhua.sendMessage(jid, { text: messageText });
                sentCount++;
            } catch (e) {
                console.error(`Gagal mengirim ke ${jid}:`, e);
                failedCount++;
            }
            await sleep(15000); 
        }

        await m.reply(`*PENGIRIMAN SELESAI*\n\n- *Berhasil terkirim:* ${sentCount} grup\n- *Gagal terkirim:* ${failedCount} grup`);

    } catch (e) {
        console.error("Error pada fitur jpm:", e);
        m.reply("Terjadi kesalahan sistem saat menjalankan perintah jpm.");
    }
}
break;
case 'smeme': {
    if (!m.quoted) return m.reply(`Balas gambar dengan perintah:\n${prefix + command} <teks>`);
    if (!text) return m.reply(`Teks tidak boleh kosong.\nContoh:\n${prefix}smeme teks atas\n${prefix}smeme teks atas|teks bawah\n${prefix}smeme |teks bawah`);

    const { Sticker } = require('wa-sticker-formatter');
    const FormData = require('form-data');
    const axios = require('axios');
    const fs = require('fs');
    const path = require('path');

    async function uploadImage(filePath) {
        try {
            const form = new FormData();
            form.append('files[]', fs.createReadStream(filePath));
            
            const { data } = await axios.post('https://uguu.se/upload', form, {
                headers: form.getHeaders()
            });
            return data.files[0].url;
        } catch (err) {
            throw new Error(`Gagal mengunggah gambar: ${err.message}`);
        }
    }

    async function createStickerFromUrl(imageUrl) {
        const stickerMetadata = {
            type: "full",
            pack: global.packname || "Seiha Sticker",
            author: global.author || "© SEIHA",
            quality: 100
        };
        return new Sticker(imageUrl, stickerMetadata).toBuffer();
    }

    let [topText, bottomText] = text.split('|');
    let quotedMsg = m.quoted ? m.quoted : m;
    let mime = (quotedMsg.msg || quotedMsg).mimetype || "";

    if (!mime.startsWith('image/')) return m.reply("❌ Perintah ini hanya bisa digunakan untuk membalas gambar!");

    await sanhua.sendMessage(m.chat, { react: { text: '🖼️', key: m.key } });

    let tempFilePath; 

    try {

        let mediaBuffer;
        if (quotedMsg.msg) {
            mediaBuffer = await downloadMediaMessage(quotedMsg, "buffer", {});
        } else {
            mediaBuffer = await sanhua.downloadMediaMessage(quotedMsg);
        }

        let fileExtension = mime.split('/')[1] || "png";
        tempFilePath = path.join(__dirname, `temp_smeme_${Date.now()}.${fileExtension}`); 
        

        fs.writeFileSync(tempFilePath, mediaBuffer);

        let imageUrl = await uploadImage(tempFilePath);
        
        let memeApiUrl = `https://api.memegen.link/images/custom/${encodeURIComponent(topText || " ")}/${encodeURIComponent(bottomText || " ")}.png?background=${imageUrl}`;
        
        let stickerBuffer = await createStickerFromUrl(memeApiUrl);

        await sanhua.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m });
        await sanhua.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

    } catch (err) {
        console.error(err);
        m.reply(`❌ Terjadi kesalahan saat membuat meme: ${err.message}`);
    } finally {

        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
    }
}
break;
case 'upapikey': {
        if (!isCreator) return m.reply("Perintah ini hanya untuk Creator Bot.");
        const text = args.join(" ");
        const parts = text.split(',');
        if (parts.length !== 3) {
          return m.reply("Format salah.\nGunakan: .upapikey domain,ptla,ptlc\n\nContoh:\n.upapikey https://panel.domain.com,ptla_xxx,ptlc_xxx");
        }
        const [newDomain, newPtla, newPtlc] = parts.map(p => p.trim());
        if (!newDomain.startsWith('http')) {
          return m.reply("Peringatan: Format domain tidak valid. Harap gunakan 'http://' atau 'https://'.");
        }
        if (!newPtla.startsWith('ptla_')) {
          return m.reply("Peringatan: API Key (PTLA) tidak valid. Kunci harus diawali dengan 'ptla_'.");
        }
        if (!newPtlc.startsWith('ptlc_')) {
          return m.reply("Peringatan: Client Key (PTLC) tidak valid. Kunci harus diawali dengan 'ptlc_'.");
        }
        global.domain = newDomain;
        global.apikey = newPtla;
        global.capikey = newPtlc;
        const updates = [
          { key: 'domain', value: newDomain },
          { key: 'apikey', value: newPtla },
          { key: 'capikey', value: newPtlc }
        ];
        const success = await updateApiKeys(updates);
        if (success) {
          m.reply("✅ Berhasil memperbarui API Key untuk Server 1.");
        } else {
          m.reply("❌ Gagal memperbarui API Key. Silakan cek konsol untuk error.");
        }
      }
      break;
      case 'upapikey2': {
        if (!isCreator) return m.reply("Perintah ini hanya untuk Creator Bot.");
        const text = args.join(" ");
        const parts = text.split(',');
        if (parts.length !== 3) {
          return m.reply("Format salah.\nGunakan: .upapikey2 domain,ptla,ptlc\n\nContoh:\n.upapikey2 https://panel.domain.com,ptla_xxx,ptlc_xxx");
        }
        const [newDomain, newPtla, newPtlc] = parts.map(p => p.trim());
        if (!newDomain.startsWith('http')) {
          return m.reply("Peringatan: Format domain tidak valid. Harap gunakan 'http://' atau 'https://'.");
        }
        if (!newPtla.startsWith('ptla_')) {
          return m.reply("Peringatan: API Key (PTLA) tidak valid. Kunci harus diawali dengan 'ptla_'.");
        }
        if (!newPtlc.startsWith('ptlc_')) {
          return m.reply("Peringatan: Client Key (PTLC) tidak valid. Kunci harus diawali dengan 'ptlc_'.");
        }
        global.domainv2 = newDomain;
        global.apikeyv2 = newPtla;
        global.capikeyv2 = newPtlc;
        const updates = [
          { key: 'domainv2', value: newDomain },
          { key: 'apikeyv2', value: newPtla },
          { key: 'capikeyv2', value: newPtlc }
        ];
        const success = await updateApiKeys(updates);
        if (success) {
          m.reply("✅ Berhasil memperbarui API Key untuk Server 2.");
        } else {
          m.reply("❌ Gagal memperbarui API Key. Silakan cek konsol untuk error.");
        }
      }
      break;
      case 'delapikey': {
        if (!isCreator) return m.reply("Perintah ini hanya untuk Creator Bot.");

        global.domain = '';
        global.apikey = '';
        global.capikey = '';

        const updates = [
          { key: 'domain', value: '' },
          { key: 'apikey', value: '' },
          { key: 'capikey', value: '' }
        ];

        const success = await updateApiKeys(updates);

        if (success) {
          m.reply("✅ Berhasil menghapus API Key untuk Server 1.");
        } else {
          m.reply("❌ Gagal menghapus API Key. Silakan cek konsol untuk error.");
        }
      }
      break;

      case 'delapikey2': {
        if (!isCreator) return m.reply("Perintah ini hanya untuk Creator Bot.");

        global.domainv2 = '';
        global.apikeyv2 = '';
        global.capikeyv2 = '';

        const updates = [
          { key: 'domainv2', value: '' },
          { key: 'apikeyv2', value: '' },
          { key: 'capikeyv2', value: '' }
        ];

        const success = await updateApiKeys(updates);

        if (success) {
          m.reply("✅ Berhasil menghapus API Key untuk Server 2.");
        } else {
          m.reply("❌ Gagal menghapus API Key. Silakan cek konsol untuk error.");
        }
      }
      break;
default:       
if (budy.startsWith('$')) {
    if (!isOwner) return;
    exec(budy.slice(1), (err, stdout, stderr) => {
        if (err) return m.reply(util.format(err));
        if (stderr) return m.reply(util.format(stderr));
        if (stdout) return m.reply(util.format(stdout));
    });
}

if (budy.startsWith(">") || budy.startsWith("=>")) {
    if (!isOwner) return;
    const command = budy.startsWith("=>") ? budy.slice(2) : budy.slice(1);
    try {
        const evaling = await eval(`;(async () => { ${command} })();`);
        m.reply(util.format(evaling));
    } catch (e) {
        m.reply(util.format(e));
    }
}
break;

}
} catch (e) {
    console.log(e);
    sanhua.sendMessage(`${global.owner}@s.whatsapp.net`, {text: `Terjadi error pada:\n${m.text}\n\n${util.format(e)}`});
}
}

let file = require.resolve(__filename) 
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.cyan("File Update => "), chalk.cyan.bgBlue.bold(`${__filename}`));
    delete require.cache[file];
    require(file);
});