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

const fs = require('fs');
const path = require('path');

const settingsFilePath = path.join(__dirname, '..', 'settings.json');

const defaultSettings = {
    isPublic: true,
    mutedGroups: []
};

const loadSettings = () => {
    try {
        if (fs.existsSync(settingsFilePath)) {
            const data = fs.readFileSync(settingsFilePath, 'utf8');
            return { ...defaultSettings, ...JSON.parse(data) };
        }
    } catch (error) {
        console.error('Gagal memuat settings.json:', error);
    }
    return defaultSettings;
};

const saveSettings = (data) => {
    try {
        fs.writeFileSync(settingsFilePath, JSON.stringify(data, null, 2));
        console.log(chalk.green('Settings saved'));
    } catch (error) {
        console.error(chalk.red('Gagal save settings:'), error);
    }
};

module.exports = { loadSettings, saveSettings };